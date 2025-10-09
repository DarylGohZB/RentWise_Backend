const { createClient } = require('redis');
const crypto = require('crypto');

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

let client;
async function getClient() {
  if (!client) {
    console.log('[SERVICES/OTPSERVICE] Connecting to Redis at', REDIS_URL);
    client = createClient({ url: REDIS_URL });

    client.on('error', (err) => console.error('[SERVICES/OTPSERVICE] Redis Client Error:', err));

    await client.connect();
    console.log('[SERVICES/OTPSERVICE] Redis client connected');
  }
  return client;
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
  // Start registration by storing hashed OTP in Redis
  startRegistration: async function (email, payload, ttlSeconds = 600) {
    const c = await getClient();
    const otp = generateOTP();
    const key = `pending:registration:${email}`;

    const data = {
      payload,
      otpHash: crypto.createHash('sha256').update(otp).digest('hex'),
    };

    await c.set(key, JSON.stringify(data), { EX: ttlSeconds });

    console.log(`[SERVICES/OTPSERVICE] Stored OTP for ${email} with TTL ${ttlSeconds}s`);
    return { otp, key, ttl: ttlSeconds };
  },

  // Verify OTP against stored Redis record
  verifyRegistration: async function (email, otp) {
    const c = await getClient();
    const key = `pending:registration:${email}`;
    const raw = await c.get(key);

    if (!raw) {
      console.warn(`[SERVICES/OTPSERVICE] No OTP found or expired for ${email}`);
      return { ok: false, reason: 'not_found_or_expired' };
    }

    const obj = JSON.parse(raw);
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (otpHash !== obj.otpHash) {
      console.warn(`[SERVICES/OTPSERVICE] Invalid OTP attempt for ${email}`);
      return { ok: false, reason: 'invalid_otp' };
    }

    await c.del(key);
    console.log(`[SERVICES/OTPSERVICE] OTP verified and key deleted for ${email}`);

    return { ok: true, payload: obj.payload };
  },
};
