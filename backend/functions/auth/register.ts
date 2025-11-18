/**
 * POST /auth/register
 *
 * Register a new user with phone number and send SMS verification code
 *
 * Request:
 * {
 *   "phoneNumber": "+85291234567",
 *   "name": "John Doe"
 * }
 *
 * Response:
 * {
 *   "message": "Verification code sent",
 *   "expiresIn": 300
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { successResponse, errors } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import {
  validatePhoneNumber,
  normalizePhoneNumber,
  hashPhoneNumber,
  generateVerificationCode
} from '../../shared/utils/phone';
import { putItem, query, TABLE_NAMES } from '../../shared/utils/dynamodb';
import { VerificationCode } from '../../shared/models/user';

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const VERIFICATION_CODE_TTL_SECONDS = 300; // 5 minutes

interface RegisterRequest {
  phoneNumber: string;
  name: string;
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    logger.info('Register request received', {
      requestId: event.requestContext.requestId
    });

    // Parse and validate request body
    if (!event.body) {
      return errors.badRequest('Request body is required');
    }

    const body: RegisterRequest = JSON.parse(event.body);
    const { phoneNumber, name } = body;

    // Validate required fields
    if (!phoneNumber || !name) {
      return errors.badRequest('Phone number and name are required');
    }

    // Normalize and validate phone number
    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!validatePhoneNumber(normalizedPhone)) {
      return errors.badRequest('Invalid phone number format. Use E.164 format (e.g., +85291234567)');
    }

    logger.info('Phone number validated', {
      phoneHash: hashPhoneNumber(normalizedPhone).substring(0, 8)
    });

    // Check if user already exists
    const phoneHash = hashPhoneNumber(normalizedPhone);
    const existingUsers = await query(
      TABLE_NAMES.USERS,
      'phoneNumberHash = :phoneHash',
      { ':phoneHash': phoneHash },
      'GSI1' // GSI1: phoneNumberHash → userId
    );

    if (existingUsers.length > 0) {
      logger.warn('User already exists', { phoneHash: phoneHash.substring(0, 8) });
      return errors.conflict('Phone number already registered');
    }

    // Generate verification code
    const code = generateVerificationCode();
    const now = Date.now();
    const expiresAt = now + (VERIFICATION_CODE_TTL_SECONDS * 1000);

    // Store verification code in DynamoDB
    const verificationCode: VerificationCode = {
      phoneNumberHash: phoneHash,
      phoneNumber: normalizedPhone,
      code,
      createdAt: now,
      expiresAt,
      attempts: 0,
      maxAttempts: 3,
      verified: false
    };

    await putItem(TABLE_NAMES.VERIFICATION_CODES, verificationCode);
    logger.info('Verification code stored', {
      phoneHash: phoneHash.substring(0, 8),
      expiresAt
    });

    // Send SMS via AWS SNS
    await sendSMS(normalizedPhone, code);
    logger.info('SMS sent successfully', {
      phoneHash: phoneHash.substring(0, 8)
    });

    return successResponse({
      message: 'Verification code sent',
      expiresIn: VERIFICATION_CODE_TTL_SECONDS
    });

  } catch (error) {
    logger.error('Registration failed', error as Error);
    return errors.internalError('Registration failed. Please try again.');
  }
}

/**
 * Send SMS verification code using AWS SNS
 */
async function sendSMS(phoneNumber: string, code: string): Promise<void> {
  const message = `Your sjc1990app verification code is: ${code}. Valid for 5 minutes.`;

  const command = new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: message,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional' // Higher delivery priority
      }
    }
  });

  await snsClient.send(command);
}
