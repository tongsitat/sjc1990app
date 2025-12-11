/**
 * POST /auth/approve/{userId}
 *
 * Approve a pending user (Admin only)
 *
 * Request:
 * {
 *   "adminId": "admin-uuid"
 * }
 *
 * Response:
 * {
 *   "message": "User approved successfully",
 *   "userId": "uuid"
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { successResponse, errors } from '../../../shared/utils/response';
import { logger } from '../../../shared/utils/logger';
import { verifyToken, extractTokenFromHeader } from '../../../shared/utils/jwt';
import { getItem, updateItem, TABLE_NAMES } from '../../../shared/utils/dynamodb';
import { User, UserStatus, ApprovalStatus } from '../../../shared/models/user';

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Approve user request received', {
      requestId: event.requestContext.requestId,
      userId
    });

    // Verify JWT token and check if user is admin
    const token = extractTokenFromHeader(event.headers.Authorization);
    const payload = await verifyToken(token);

    // TODO: Check if user is admin
    // if (payload.role !== 'admin') return errors.forbidden();

    const adminId = payload.userId;
    logger.info('Admin authenticated', { adminId });

    // Get user to approve
    const user = await getItem<User>(TABLE_NAMES.USERS, { userId });
    if (!user) {
      return errors.notFound('User not found');
    }

    // Check if user is pending approval
    if (user.status !== UserStatus.PENDING_APPROVAL) {
      return errors.badRequest(`User is not pending approval (status: ${user.status})`);
    }

    const now = Date.now();

    // Update user status to active
    await updateItem(
      TABLE_NAMES.USERS,
      { userId },
      'SET #status = :status, approvedBy = :approvedBy, approvedAt = :approvedAt, updatedAt = :updatedAt',
      {
        ':status': UserStatus.ACTIVE,
        ':approvedBy': adminId,
        ':approvedAt': now,
        ':updatedAt': now
      }
    );

    logger.info('User status updated to active', { userId, adminId });

    // Update pending approval record
    await updateItem(
      TABLE_NAMES.PENDING_APPROVALS,
      { userId },
      'SET #status = :status, reviewedBy = :reviewedBy, reviewedAt = :reviewedAt',
      {
        ':status': ApprovalStatus.APPROVED,
        ':reviewedBy': adminId,
        ':reviewedAt': now
      }
    );

    // Send SMS notification to user
    if (user.phoneNumberPlain) {
      await sendApprovalSMS(user.phoneNumberPlain, user.name || 'User');
      logger.info('Approval SMS sent', { userId });
    }

    return successResponse({
      message: 'User approved successfully',
      userId
    });

  } catch (error) {
    if (error instanceof Error && (error.message.includes('token') || error.message.includes('Authorization'))) {
      return errors.unauthorized(error.message);
    }
    logger.error('Approve user failed', error as Error);
    return errors.internalError('Failed to approve user');
  }
}

/**
 * Send approval SMS notification
 */
async function sendApprovalSMS(phoneNumber: string, name: string): Promise<void> {
  const message = `Hi ${name}, your sjc1990app registration has been approved! You can now complete your profile and start connecting with classmates.`;

  const command = new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: message,
    MessageAttributes: {
      'AWS.SNS.SMS.SMSType': {
        DataType: 'String',
        StringValue: 'Transactional'
      }
    }
  });

  await snsClient.send(command);
}
