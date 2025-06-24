import crypto from 'crypto';

/**
 * Generates a random salt for hashing.
 * @param length The length of the salt in bytes.
 * @returns A hex-encoded salt string.
 */
export function generateSalt(length = 16): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hashes a plain-text OTP with a given salt using SHA-512.
 * We use SHA-512 for stronger security.
 * @param otp The plain-text OTP from the user.
 * @param salt The salt associated with this OTP.
 * @returns A hex-encoded hash string.
 */
export function hashOtp(otp: string, salt: string): string {
  // The secret key should ideally be from an environment variable for HMAC
  const secret = process.env.OTP_SECRET || 'a-secure-default-secret';
  const hmac = crypto.createHmac('sha512', secret);
  hmac.update(otp + salt); // Combine OTP and salt for hashing
  return hmac.digest('hex');
}

/**
 * Verifies if a plain-text OTP matches its stored hash.
 * @param plainOtp The plain-text OTP provided by the user.
 * @param hashedOtp The stored hash from the database.
 * @param salt The salt used to create the original hash.
 * @returns True if the OTP is valid, false otherwise.
 */
export function verifyOtp(plainOtp: string, hashedOtp: string, salt: string): boolean {
  const newHash = hashOtp(plainOtp, salt);
  
  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(newHash, 'hex'), Buffer.from(hashedOtp, 'hex'));
  } catch {
    // This can fail if buffer lengths are different.
    return false;
  }
} 