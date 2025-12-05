/**
 * Classrooms Service - Consolidated Lambda function for classroom management endpoints
 *
 * Handles 4 classroom endpoints:
 * - GET /classrooms
 * - POST /users/{userId}/classrooms
 * - GET /users/{userId}/classrooms
 * - GET /classrooms/{classroomId}/members
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { errors } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';

// Import individual handlers
import { handler as listClassroomsHandler } from './handlers/list-classrooms';
import { handler as assignClassroomsHandler } from './handlers/assign-classrooms';
import { handler as getUserClassroomsHandler } from './handlers/get-user-classrooms';
import { handler as getClassroomMembersHandler } from './handlers/get-classroom-members';

/**
 * Main Lambda handler with API Gateway routing
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const { resource, httpMethod } = event;
    const route = `${httpMethod} ${resource}`;

    logger.info('Classrooms service request', {
      route,
      requestId: event.requestContext.requestId
    });

    // Route to appropriate handler
    switch (route) {
      case 'GET /classrooms':
        return await listClassroomsHandler(event);

      case 'POST /users/{userId}/classrooms':
        return await assignClassroomsHandler(event);

      case 'GET /users/{userId}/classrooms':
        return await getUserClassroomsHandler(event);

      case 'GET /classrooms/{classroomId}/members':
        return await getClassroomMembersHandler(event);

      default:
        logger.warn('Route not found', { route });
        return errors.notFound(`Route not found: ${route}`);
    }
  } catch (error) {
    logger.error('Classrooms service error', error as Error);
    return errors.internalError('Internal server error');
  }
}
