/**
 * Phone number utility functions
 */

import crypto from 'crypto';

/**
 * Hash phone number using SHA-256
 * Used for lookups while maintaining privacy
 */
export function hashPhoneNumber(phoneNumber: string): string {
  return crypto
    .createHash('sha256')
    .update(phoneNumber)
    .digest('hex');
}

/**
 * Validate phone number format (E.164)
 * Example: +85291234567
 */
export function validatePhoneNumber(phoneNumber: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
}

/**
 * Normalize phone number to E.164 format
 * Removes spaces, dashes, parentheses
 */
export function normalizePhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters except leading +
  return phoneNumber.replace(/[^\d+]/g, '');
}

/**
 * Generate 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
