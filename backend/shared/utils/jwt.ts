/**
 * JWT utility functions
 */

import jwt from 'jsonwebtoken';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { UserStatus } from '../models/user';

const JWT_EXPIRES_IN = '24h'; // 24 hours

// Cache the JWT secret to avoid fetching from Secrets Manager on every invocation
let cachedJwtSecret: string | null = null;

/**
 * Fetch JWT secret from AWS Secrets Manager
 * Caches the secret for the lifetime of the Lambda execution environment
 */
async function getJwtSecret(): Promise<string> {
  // Return cached secret if available
  if (cachedJwtSecret) {
    return cachedJwtSecret;
  }

  // Development fallback (when JWT_SECRET_NAME is not set)
  if (!process.env.JWT_SECRET_NAME) {
    console.warn('JWT_SECRET_NAME not set, using development fallback');
    cachedJwtSecret = 'development-secret-change-in-production';
    return cachedJwtSecret;
  }

  // Fetch from Secrets Manager
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-west-2' });
  const command = new GetSecretValueCommand({
    SecretId: process.env.JWT_SECRET_NAME,
  });

  try {
    const response = await client.send(command);
    if (!response.SecretString) {
      throw new Error('Secret value is empty');
    }
    cachedJwtSecret = response.SecretString;
    return cachedJwtSecret;
  } catch (error) {
    console.error('Failed to fetch JWT secret from Secrets Manager:', error);
    throw new Error('Failed to retrieve JWT secret');
  }
}

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
export async function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const secret = await getJwtSecret();
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRES_IN
  });
}

/**
 * Verify and decode JWT token
 */
export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    const secret = await getJwtSecret();
    return jwt.verify(token, secret) as JwtPayload;
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
