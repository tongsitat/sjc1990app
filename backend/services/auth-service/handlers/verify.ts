/**
 * POST /auth/verify
 *
 * Verify SMS code and create user account (pending approval)
 *
 * Request:
 * {
 *   "phoneNumber": "+85291234567",
 *   "code": "123456"
 * }
 *
 * Response:
 * {
 *   "userId": "uuid",
 *   "status": "pending_approval",
 *   "token": "jwt-token",
 *   "expiresAt": 1700086400000
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errors } from '../../../shared/utils/response';
import { logger } from '../../../shared/utils/logger';
import {
  validatePhoneNumber,
  normalizePhoneNumber,
  hashPhoneNumber
} from '../../../shared/utils/phone';
import { generateToken } from '../../../shared/utils/jwt';
import { getItem, putItem, updateItem, TABLE_NAMES } from '../../../shared/utils/dynamodb';
import { User, UserStatus, VerificationCode, PendingApproval, ApprovalStatus } from '../../../shared/models/user';

interface VerifyRequest {
  phoneNumber: string;
  code: string;
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    logger.info('Verify request received', {
      requestId: event.requestContext.requestId
    });

    // Parse and validate request body
    if (!event.body) {
      return errors.badRequest('Request body is required');
    }

    const body: VerifyRequest = JSON.parse(event.body);
    const { phoneNumber, code } = body;

    // Validate required fields
    if (!phoneNumber || !code) {
      return errors.badRequest('Phone number and code are required');
    }

    // Normalize and validate phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!validatePhoneNumber(normalizedPhone)) {
      return errors.badRequest('Invalid phone number format');
    }

    const phoneHash = hashPhoneNumber(normalizedPhone);

    // Get verification code from DynamoDB
    const verificationCode = await getItem<VerificationCode>(
      TABLE_NAMES.VERIFICATION_CODES,
      { phoneNumberHash: phoneHash }
    );

    if (!verificationCode) {
      logger.warn('Verification code not found', {
        phoneHash: phoneHash.substring(0, 8)
      });
      return errors.badRequest('Verification code not found or expired');
    }

    // Check if code is expired
    const now = Date.now();
    if (now > verificationCode.expiresAt) {
      logger.warn('Verification code expired', {
        phoneHash: phoneHash.substring(0, 8),
        expiresAt: verificationCode.expiresAt
      });
      return errors.badRequest('Verification code expired. Please request a new one.');
    }

    // Check if code is already verified
    if (verificationCode.verified) {
      logger.warn('Verification code already used', {
        phoneHash: phoneHash.substring(0, 8)
      });
      return errors.badRequest('Verification code already used');
    }

    // Check max attempts
    if (verificationCode.attempts >= verificationCode.maxAttempts) {
      logger.warn('Max verification attempts exceeded', {
        phoneHash: phoneHash.substring(0, 8),
        attempts: verificationCode.attempts
      });
      return errors.badRequest('Maximum verification attempts exceeded. Please request a new code.');
    }

    // Validate verification code
    if (code !== verificationCode.code) {
      // Increment attempts
      await updateItem(
        TABLE_NAMES.VERIFICATION_CODES,
        { phoneNumberHash: phoneHash },
        'SET attempts = attempts + :inc',
        { ':inc': 1 }
      );

      logger.warn('Invalid verification code', {
        phoneHash: phoneHash.substring(0, 8),
        attempts: verificationCode.attempts + 1
      });
      return errors.badRequest('Invalid verification code');
    }

    logger.info('Verification code validated', {
      phoneHash: phoneHash.substring(0, 8)
    });

    // Mark verification code as used
    await updateItem(
      TABLE_NAMES.VERIFICATION_CODES,
      { phoneNumberHash: phoneHash },
      'SET verified = :verified',
      { ':verified': true }
    );

    // Create user record
    const userId = uuidv4();
    const user: User = {
      userId,
      phoneNumber: phoneHash,
      phoneNumberPlain: normalizedPhone,
      name: '', // Will be set in profile setup step
      status: UserStatus.PENDING_APPROVAL,
      createdAt: now,
      updatedAt: now
    };

    await putItem(TABLE_NAMES.USERS, user);
    logger.info('User created', { userId });

    // Create pending approval record
    const pendingApproval: PendingApproval = {
      userId,
      phoneNumber: normalizedPhone,
      name: '', // Will be updated in profile setup
      status: ApprovalStatus.PENDING,
      requestedAt: now,
      notificationSent: false
    };

    await putItem(TABLE_NAMES.PENDING_APPROVALS, pendingApproval);
    logger.info('Pending approval created', { userId });

    // Generate JWT token
    const token = await generateToken({
      userId,
      phoneNumber: normalizedPhone,
      status: UserStatus.PENDING_APPROVAL,
      role: 'user'
    });

    const tokenPayload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64').toString()
    );

    return successResponse({
      userId,
      status: UserStatus.PENDING_APPROVAL,
      token,
      expiresAt: tokenPayload.exp * 1000
    }, 201);

  } catch (error) {
    logger.error('Verification failed', error as Error);
    return errors.internalError('Verification failed. Please try again.');
  }
}
