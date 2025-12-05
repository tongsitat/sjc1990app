/**
 * Auth Service - Consolidated Lambda function for authentication endpoints
 *
 * Handles 5 authentication endpoints:
 * - POST /auth/register
 * - POST /auth/verify
 * - GET /auth/pending-approvals
 * - POST /auth/approve/{userId}
 * - POST /auth/reject/{userId}
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { errors } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';

// Import individual handlers (will be created next)
import { handler as registerHandler } from './handlers/register';
import { handler as verifyHandler } from './handlers/verify';
import { handler as pendingApprovalsHandler } from './handlers/pending-approvals';
import { handler as approveHandler } from './handlers/approve';
import { handler as rejectHandler } from './handlers/reject';

/**
 * Main Lambda handler with API Gateway routing
 *
 * API Gateway defines routes, Lambda does internal routing based on
 * event.resource and event.httpMethod
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const { resource, httpMethod } = event;
    const route = `${httpMethod} ${resource}`;

    logger.info('Auth service request', {
      route,
      requestId: event.requestContext.requestId
    });

    // Route to appropriate handler based on HTTP method and resource path
    switch (route) {
      case 'POST /auth/register':
        return await registerHandler(event);

      case 'POST /auth/verify':
        return await verifyHandler(event);

      case 'GET /auth/pending-approvals':
        return await pendingApprovalsHandler(event);

      case 'POST /auth/approve/{userId}':
        return await approveHandler(event);

      case 'POST /auth/reject/{userId}':
        return await rejectHandler(event);

      default:
        logger.warn('Route not found', { route });
        return errors.notFound(`Route not found: ${route}`);
    }
  } catch (error) {
    logger.error('Auth service error', error as Error);
    return errors.internalError('Internal server error');
  }
}
