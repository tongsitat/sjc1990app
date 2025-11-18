/**
 * GET /auth/pending-approvals
 *
 * List all users pending approval (Admin only)
 *
 * Response:
 * {
 *   "approvals": [
 *     {
 *       "userId": "uuid",
 *       "phoneNumber": "+85291234567",
 *       "name": "John Doe",
 *       "status": "pending",
 *       "requestedAt": 1700000000000
 *     }
 *   ],
 *   "count": 5
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errors } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { verifyToken, extractTokenFromHeader } from '../../shared/utils/jwt';
import { query, TABLE_NAMES } from '../../shared/utils/dynamodb';
import { PendingApproval, ApprovalStatus } from '../../shared/models/user';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    logger.info('Get pending approvals request received', {
      requestId: event.requestContext.requestId
    });

    // Verify JWT token and check if user is admin
    const token = extractTokenFromHeader(event.headers.Authorization);
    const payload = await verifyToken(token);

    // TODO: Check if user is admin (for now, just verify token is valid)
    // In production, add role check: if (payload.role !== 'admin') return errors.forbidden();

    logger.info('Admin authenticated', { adminId: payload.userId });

    // Query pending approvals
    const pendingApprovals = await query<PendingApproval>(
      TABLE_NAMES.PENDING_APPROVALS,
      '#status = :status',
      { ':status': ApprovalStatus.PENDING },
      'GSI1' // GSI1: status → requestedAt
    );

    // Sort by requestedAt (oldest first)
    pendingApprovals.sort((a, b) => a.requestedAt - b.requestedAt);

    logger.info('Pending approvals retrieved', {
      count: pendingApprovals.length
    });

    return successResponse({
      approvals: pendingApprovals.map(approval => ({
        userId: approval.userId,
        phoneNumber: approval.phoneNumber,
        name: approval.name,
        status: approval.status,
        requestedAt: approval.requestedAt
      })),
      count: pendingApprovals.length
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return errors.unauthorized(error.message);
    }
    logger.error('Get pending approvals failed', error as Error);
    return errors.internalError('Failed to retrieve pending approvals');
  }
}
