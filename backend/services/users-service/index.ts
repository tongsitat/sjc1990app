/**
 * Users Service - Consolidated Lambda function for user management endpoints
 *
 * Handles 5 user management endpoints:
 * - PUT /users/{userId}/profile
 * - POST /users/{userId}/profile-photo
 * - PUT /users/{userId}/profile-photo-complete
 * - GET /users/{userId}/preferences
 * - PUT /users/{userId}/preferences
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { errors } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';

// Import individual handlers
import { handler as updateProfileHandler } from './handlers/update-profile';
import { handler as uploadPhotoHandler } from './handlers/upload-photo';
import { handler as completePhotoUploadHandler } from './handlers/complete-photo-upload';
import { handler as getPreferencesHandler } from './handlers/get-preferences';
import { handler as updatePreferencesHandler } from './handlers/update-preferences';

/**
 * Main Lambda handler with API Gateway routing
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const { resource, httpMethod } = event;
    const route = `${httpMethod} ${resource}`;

    logger.info('Users service request', {
      route,
      requestId: event.requestContext.requestId
    });

    // Route to appropriate handler
    switch (route) {
      case 'PUT /users/{userId}/profile':
        return await updateProfileHandler(event);

      case 'POST /users/{userId}/profile-photo':
        return await uploadPhotoHandler(event);

      case 'PUT /users/{userId}/profile-photo-complete':
        return await completePhotoUploadHandler(event);

      case 'GET /users/{userId}/preferences':
        return await getPreferencesHandler(event);

      case 'PUT /users/{userId}/preferences':
        return await updatePreferencesHandler(event);

      default:
        logger.warn('Route not found', { route });
        return errors.notFound(`Route not found: ${route}`);
    }
  } catch (error) {
    logger.error('Users service error', error as Error);
    return errors.internalError('Internal server error');
  }
}
