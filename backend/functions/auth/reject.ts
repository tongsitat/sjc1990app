/**
 * POST /auth/reject/{userId}
 *
 * Reject a pending user (Admin only)
 *
 * Request:
 * {
 *   "adminId": "admin-uuid",
 *   "reason": "Duplicate account"
 * }
 *
 * Response:
 * {
 *   "message": "User rejected",
 *   "userId": "uuid"
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { successResponse, errors } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { verifyToken, extractTokenFromHeader } from '../../shared/utils/jwt';
import { getItem, updateItem, TABLE_NAMES } from '../../shared/utils/dynamodb';
import { User, UserStatus, ApprovalStatus } from '../../shared/models/user';

const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

interface RejectRequest {
  adminId: string;
  reason?: string;
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Reject user request received', {
      requestId: event.requestContext.requestId,
      userId
    });

    // Verify JWT token and check if user is admin
    const token = extractTokenFromHeader(event.headers.Authorization);
    const payload = await verifyToken(token);

    // TODO: Check if user is admin
    // if (payload.role !== 'admin') return errors.forbidden();

    const adminId = payload.userId;

    // Parse request body
    if (!event.body) {
      return errors.badRequest('Request body is required');
    }

    const body: RejectRequest = JSON.parse(event.body);
    const { reason } = body;

    // Get user to reject
    const user = await getItem<User>(TABLE_NAMES.USERS, { userId });
    if (!user) {
      return errors.notFound('User not found');
    }

    // Check if user is pending approval
    if (user.status !== UserStatus.PENDING_APPROVAL) {
      return errors.badRequest(`User is not pending approval (status: ${user.status})`);
    }

    const now = Date.now();

    // Update user status to rejected
    await updateItem(
      TABLE_NAMES.USERS,
      { userId },
      'SET #status = :status, updatedAt = :updatedAt',
      {
        ':status': UserStatus.REJECTED,
        ':updatedAt': now
      }
    );

    logger.info('User status updated to rejected', { userId, adminId });

    // Update pending approval record
    await updateItem(
      TABLE_NAMES.PENDING_APPROVALS,
      { userId },
      'SET #status = :status, reviewedBy = :reviewedBy, reviewedAt = :reviewedAt, rejectionReason = :reason',
      {
        ':status': ApprovalStatus.REJECTED,
        ':reviewedBy': adminId,
        ':reviewedAt': now,
        ':reason': reason || 'No reason provided'
      }
    );

    // Send SMS notification to user
    if (user.phoneNumberPlain) {
      await sendRejectionSMS(user.phoneNumberPlain, reason);
      logger.info('Rejection SMS sent', { userId });
    }

    return successResponse({
      message: 'User rejected',
      userId,
      reason: reason || 'No reason provided'
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return errors.unauthorized(error.message);
    }
    logger.error('Reject user failed', error as Error);
    return errors.internalError('Failed to reject user');
  }
}

/**
 * Send rejection SMS notification
 */
async function sendRejectionSMS(phoneNumber: string, reason?: string): Promise<void> {
  const message = reason
    ? `Your sjc1990app registration was not approved. Reason: ${reason}. Please contact support if you believe this is an error.`
    : `Your sjc1990app registration was not approved. Please contact support if you believe this is an error.`;

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
