/**
 * JWT utility functions
 */

import jwt from 'jsonwebtoken';
import { UserStatus } from '../models/user';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_EXPIRES_IN = '24h'; // 24 hours

export interface JwtPayload {
  userId: string;
  phoneNumber: string;
  status: UserStatus;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Extract token from Authorization header
 * Format: "Bearer <token>"
 */
export function extractTokenFromHeader(authHeader?: string): string {
  if (!authHeader) {
    throw new Error('Missing Authorization header');
  }

  const [bearer, token] = authHeader.split(' ');

  if (bearer !== 'Bearer' || !token) {
    throw new Error('Invalid Authorization header format');
  }

  return token;
}
