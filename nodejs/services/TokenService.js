const jwt = require('jsonwebtoken');
const redis = require('redis');
const crypto = require('crypto');

// JWT Secret used to sign tokens. In production, store this securely (secrets manager).
const SECRET = process.env.JWT_SECRET || 'change-me-to-a-secure-secret';

// Time to live for access tokens. Changed to 5 minutes for testing refresh token flow.
const TTL = process.env.JWT_TTL || '5m';

// Redis connection URL from environment or default
const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

// Refresh token expiration: 30 days in seconds
const REFRESH_TOKEN_TTL = 30 * 24 * 60 * 60; // 2,592,000 seconds

// Create Redis client
const redisClient = redis.createClient({
  url: REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('[SERVICES/TOKENSERVICE] Redis reconnect failed after 10 attempts');
        return new Error('Redis reconnect limit reached');
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

// Handle Redis connection
redisClient.on('error', (err) => {
  console.error('[SERVICES/TOKENSERVICE] Redis client error:', err);
});

redisClient.on('connect', () => {
  console.log('[SERVICES/TOKENSERVICE] Redis client connected');
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('[SERVICES/TOKENSERVICE] Failed to connect to Redis:', err);
  }
})();

module.exports = {
  // ==================== JWT Access Token Methods ====================
  
  /**
   * Issue a new JWT access token
   * @param {object} userDetails - User details to encode in token
   * @returns {string} JWT access token
   */
  issue: function (userDetails) {
    const payload = {
      displayName: userDetails.displayName,
      email: userDetails.email,
      isDisable: !!userDetails.isDisable,
      user_id: userDetails.user_id,
      userRole: userDetails.userRole,
    };

    try {
      const token = jwt.sign(payload, SECRET, { expiresIn: TTL });
      console.log(`[SERVICES/TOKENSERVICE] Issued access token for ${payload.email} (role: ${payload.userRole}, ttl: ${TTL})`);
      return token;
    } catch (err) {
      console.error('[SERVICES/TOKENSERVICE] Error issuing access token:', err);
      throw err;
    }
  },

  /**
   * Verify JWT access token
   * @param {string} token - JWT token to verify
   * @returns {object} Verification result with payload or error
   */
  verify: function (token) {
    try {
      const decoded = jwt.verify(token, SECRET);
      console.log(`[SERVICES/TOKENSERVICE] Verified access token for ${decoded.email} (role: ${decoded.userRole})`);
      return { ok: true, payload: decoded };
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        console.warn('[SERVICES/TOKENSERVICE] Verification failed: access token expired');
      } else {
        console.warn('[SERVICES/TOKENSERVICE] Verification failed:', err.message);
      }
      return { ok: false, error: err };
    }
  },

  /**
   * Get access token expiration time in seconds
   * @returns {number} Expiration time in seconds
   */
  getExpiresIn: function () {
    // Convert TTL string to seconds
    const timeValue = parseInt(TTL);
    const timeUnit = TTL.slice(-1);
    
    switch (timeUnit) {
      case 's': return timeValue;
      case 'm': return timeValue * 60;
      case 'h': return timeValue * 60 * 60;
      case 'd': return timeValue * 24 * 60 * 60;
      default: return 300; // Default 5 minutes
    }
  },

  // ==================== Refresh Token Methods ====================

  /**
   * Generate a new refresh token
   * @returns {string} Random refresh token
   */
  generateRefreshToken: function () {
    return crypto.randomBytes(40).toString('hex');
  },

  /**
   * Store refresh token in Redis
   * @param {string} refreshToken - The refresh token
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  storeRefreshToken: async function (refreshToken, userId) {
    try {
      const key = `refresh_token:${refreshToken}`;
      const value = JSON.stringify({
        user_id: userId,
        issued_at: Date.now(),
      });

      await redisClient.setEx(key, REFRESH_TOKEN_TTL, value);
      console.log(`[SERVICES/TOKENSERVICE] Stored refresh token for user_id: ${userId}, expires in ${REFRESH_TOKEN_TTL}s`);
      return true;
    } catch (err) {
      console.error('[SERVICES/TOKENSERVICE] Error storing refresh token:', err);
      return false;
    }
  },

  /**
   * Verify and retrieve refresh token data from Redis
   * @param {string} refreshToken - The refresh token to verify
   * @returns {Promise<object|null>} Token data or null if invalid
   */
  verifyRefreshToken: async function (refreshToken) {
    try {
      const key = `refresh_token:${refreshToken}`;
      const data = await redisClient.get(key);

      if (!data) {
        console.warn('[SERVICES/TOKENSERVICE] Refresh token not found or expired');
        return null;
      }

      const tokenData = JSON.parse(data);
      console.log(`[SERVICES/TOKENSERVICE] Verified refresh token for user_id: ${tokenData.user_id}`);
      return tokenData;
    } catch (err) {
      console.error('[SERVICES/TOKENSERVICE] Error verifying refresh token:', err);
      return null;
    }
  },

  /**
   * Delete refresh token from Redis (logout)
   * @param {string} refreshToken - The refresh token to delete
   * @returns {Promise<boolean>} Success status
   */
  revokeRefreshToken: async function (refreshToken) {
    try {
      const key = `refresh_token:${refreshToken}`;
      const result = await redisClient.del(key);
      
      if (result === 1) {
        console.log('[SERVICES/TOKENSERVICE] Revoked refresh token successfully');
        return true;
      } else {
        console.warn('[SERVICES/TOKENSERVICE] Refresh token not found for revocation');
        return false;
      }
    } catch (err) {
      console.error('[SERVICES/TOKENSERVICE] Error revoking refresh token:', err);
      return false;
    }
  },

  /**
   * Delete all refresh tokens for a user (e.g., password change, account deletion)
   * @param {number} userId - User ID
   * @returns {Promise<number>} Number of tokens deleted
   */
  revokeAllUserTokens: async function (userId) {
    try {
      const pattern = 'refresh_token:*';
      let deletedCount = 0;

      // Scan for all refresh tokens
      for await (const key of redisClient.scanIterator({ MATCH: pattern, COUNT: 100 })) {
        const data = await redisClient.get(key);
        if (data) {
          const tokenData = JSON.parse(data);
          if (tokenData.user_id === userId) {
            await redisClient.del(key);
            deletedCount++;
          }
        }
      }

      console.log(`[SERVICES/TOKENSERVICE] Revoked ${deletedCount} refresh tokens for user_id: ${userId}`);
      return deletedCount;
    } catch (err) {
      console.error('[SERVICES/TOKENSERVICE] Error revoking all user tokens:', err);
      return 0;
    }
  },

  /**
   * Get Redis client (for health checks, etc.)
   * @returns {object} Redis client instance
   */
  getRedisClient: function () {
    return redisClient;
  },
};
