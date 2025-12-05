/**
 * PUT /users/{userId}/profile
 *
 * Update user profile (name, bio)
 *
 * Request:
 * {
 *   "name": "John Doe",
 *   "bio": "Class of 1990, Form 7A. Looking forward to reconnecting!"
 * }
 *
 * Response:
 * {
 *   "message": "Profile updated successfully",
 *   "userId": "uuid"
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errors } from '../../../shared/utils/response';
import { logger } from '../../../shared/utils/logger';
import { verifyToken, extractTokenFromHeader } from '../../../shared/utils/jwt';
import { getItem, updateItem, TABLE_NAMES } from '../../../shared/utils/dynamodb';
import { User } from '../../../shared/models/user';

interface UpdateProfileRequest {
  name?: string;
  bio?: string;
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Update profile request received', {
      requestId: event.requestContext.requestId,
      userId
    });

    // Verify JWT token
    const token = extractTokenFromHeader(event.headers.Authorization);
    const payload = await verifyToken(token);

    // Verify user is updating their own profile (or is admin)
    if (payload.userId !== userId && payload.role !== 'admin') {
      return errors.forbidden('You can only update your own profile');
    }

    // Parse request body
    if (!event.body) {
      return errors.badRequest('Request body is required');
    }

    const body: UpdateProfileRequest = JSON.parse(event.body);
    const { name, bio } = body;

    // Validate at least one field is provided
    if (!name && !bio) {
      return errors.badRequest('At least one field (name or bio) is required');
    }

    // Verify user exists
    const user = await getItem<User>(TABLE_NAMES.USERS, { userId });
    if (!user) {
      return errors.notFound('User not found');
    }

    const now = Date.now();

    // Build update expression dynamically
    const updateExpressions: string[] = [];
    const expressionAttributeValues: Record<string, unknown> = {
      ':updatedAt': now
    };

    if (name) {
      updateExpressions.push('name = :name');
      expressionAttributeValues[':name'] = name.trim();
    }

    if (bio) {
      updateExpressions.push('bio = :bio');
      expressionAttributeValues[':bio'] = bio.trim();
    }

    updateExpressions.push('updatedAt = :updatedAt');

    const updateExpression = 'SET ' + updateExpressions.join(', ');

    // Update user profile
    await updateItem(
      TABLE_NAMES.USERS,
      { userId },
      updateExpression,
      expressionAttributeValues
    );

    logger.info('Profile updated successfully', { userId, fields: Object.keys(body) });

    return successResponse({
      message: 'Profile updated successfully',
      userId
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return errors.unauthorized(error.message);
    }
    logger.error('Update profile failed', error as Error);
    return errors.internalError('Failed to update profile');
  }
}
