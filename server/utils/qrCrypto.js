import crypto from 'crypto';

const QR_SECRET = process.env.QR_SIGNING_SECRET || 'saarthi_qr_session_signing_secret_98741';
const TOKEN_TTL_SECONDS = 15; // 15-second rotation window

export function generateSignedQRToken(sessionId, subjectId) {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(4).toString('hex');
  const payload = `${sessionId}:${subjectId}:${timestamp}:${nonce}`;
  const signature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 16); // 16-character compact HMAC signature

  const token = `${payload}:${signature}`;
  const expiresAt = new Date((timestamp + TOKEN_TTL_SECONDS) * 1000);

  return {
    token,
    expiresAt,
    ttlSeconds: TOKEN_TTL_SECONDS,
  };
}

export function verifySignedQRToken(token) {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Malformed token payload' };
  }

  const parts = token.split(':');
  if (parts.length !== 5) {
    return { valid: false, error: 'Invalid token structure' };
  }

  const [sessionId, subjectId, timestampStr, nonce, signature] = parts;
  const payload = `${sessionId}:${subjectId}:${timestampStr}:${nonce}`;
  const expectedSignature = crypto
    .createHmac('sha256', QR_SECRET)
    .update(payload)
    .digest('hex')
    .slice(0, 16);

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Cryptographic signature mismatch: Untrusted QR code' };
  }

  const tokenTimestamp = parseInt(timestampStr, 10);
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Allow up to 30 seconds drift (current window + previous window)
  if (currentTimestamp - tokenTimestamp > 30) {
    return { valid: false, error: 'QR Token has expired. Please scan the current live screen token.' };
  }

  if (tokenTimestamp - currentTimestamp > 10) {
    return { valid: false, error: 'Invalid token timestamp from future' };
  }

  return {
    valid: true,
    sessionId,
    subjectId,
  };
}
