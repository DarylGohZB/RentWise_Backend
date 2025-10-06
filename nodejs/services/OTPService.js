const { createClient } = require('redis');
const crypto = require('crypto');

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

let client;
async function getClient() {
  if (!client) {
    client = createClient({ url: REDIS_URL });
    client.on('error', (err) => console.error('Redis Client Error', err));
    await client.connect();
  }
  return client;
}

function generateOTP() {
  // numeric 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

module.exports = {
  startRegistration: async function (email, payload, ttlSeconds = 600) {
    const c = await getClient();
    const otp = generateOTP();
    const key = `pending:registration:${email}`;
    const data = { payload, otpHash: crypto.createHash('sha256').update(otp).digest('hex') };
    await c.set(key, JSON.stringify(data), { EX: ttlSeconds });
    return { otp, key, ttl: ttlSeconds };
  },

  verifyRegistration: async function (email, otp) {
    const c = await getClient();
    const key = `pending:registration:${email}`;
    const raw = await c.get(key);
    if (!raw) return { ok: false, reason: 'not_found_or_expired' };
    const obj = JSON.parse(raw);
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== obj.otpHash) return { ok: false, reason: 'invalid_otp' };
    await c.del(key);
    return { ok: true, payload: obj.payload };
  }
};
