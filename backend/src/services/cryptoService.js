const crypto = require('crypto');
const env = require('../config/env');

// AES-256-GCM: authenticated, so a tampered ciphertext fails to decrypt rather
// than silently yielding garbage.
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;

function getKey() {
  if (!env.encryptionKey) {
    throw new Error('ENCRYPTION_KEY is not set — cannot encrypt OAuth tokens.');
  }
  const key = Buffer.from(env.encryptionKey, 'hex');
  if (key.length !== 32) {
    throw new Error(
      `ENCRYPTION_KEY must be 32 bytes as 64 hex characters (got ${key.length} bytes). Generate one with: openssl rand -hex 32`
    );
  }
  return key;
}

/** Returns `iv:authTag:ciphertext`, all hex. */
function encrypt(plainText) {
  if (plainText == null) return null;
  const iv = crypto.randomBytes(IV_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(String(plainText), 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decrypt(payload) {
  if (!payload) return null;
  const [ivHex, tagHex, dataHex] = String(payload).split(':');
  if (!ivHex || !tagHex || !dataHex) {
    throw new Error('Malformed encrypted payload');
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]).toString('utf8');
}

/** `sk-ant-abc...xyz` — safe to send to the browser. */
function mask(secret) {
  if (!secret) return null;
  const s = String(secret);
  if (s.length <= 8) return '••••';
  return `${s.slice(0, 4)}••••${s.slice(-4)}`;
}

module.exports = { encrypt, decrypt, mask };
