/**
 * PUT /users/{userId}/preferences
 *
 * Update user communication preferences
 *
 * Request:
 * {
 *   "primaryChannel": "app",
 *   "enabledChannels": ["app", "email"],
 *   "smsNotifications": true,
 *   "emailNotifications": true,
 *   "digestFrequency": "daily",
 *   ...
 * }
 *
 * Response:
 * {
 *   "message": "Preferences updated successfully"
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errors } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { verifyToken, extractTokenFromHeader } from '../../shared/utils/jwt';
import { getItem, putItem, TABLE_NAMES } from '../../shared/utils/dynamodb';
import {
  UserPreferences,
  CommunicationChannel,
  DigestFrequency,
  ProfileVisibility
} from '../../shared/models/user';

type UpdatePreferencesRequest = Partial<Omit<UserPreferences, 'userId' | 'updatedAt'>>;

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Update preferences request received', {
      requestId: event.requestContext.requestId,
      userId
    });

    // Verify JWT token
    const token = extractTokenFromHeader(event.headers.Authorization);
    const payload = await verifyToken(token);

    // Verify user is updating their own preferences (or is admin)
    if (payload.userId !== userId && payload.role !== 'admin') {
      return errors.forbidden('You can only update your own preferences');
    }

    // Parse request body
    if (!event.body) {
      return errors.badRequest('Request body is required');
    }

    const updates: UpdatePreferencesRequest = JSON.parse(event.body);

    // Validate enum values if provided
    if (updates.primaryChannel && !Object.values(CommunicationChannel).includes(updates.primaryChannel)) {
      return errors.badRequest('Invalid primary channel');
    }

    if (updates.digestFrequency && !Object.values(DigestFrequency).includes(updates.digestFrequency)) {
      return errors.badRequest('Invalid digest frequency');
    }

    if (updates.profileVisibility && !Object.values(ProfileVisibility).includes(updates.profileVisibility)) {
      return errors.badRequest('Invalid profile visibility');
    }

    // Get existing preferences
    const existingPreferences = await getItem<UserPreferences>(
      TABLE_NAMES.USER_PREFERENCES,
      { userId }
    );

    if (!existingPreferences) {
      return errors.notFound('Preferences not found. Please get preferences first to initialize.');
    }

    // Merge updates with existing preferences
    const updatedPreferences: UserPreferences = {
      ...existingPreferences,
      ...updates,
      userId, // Ensure userId is not overwritten
      updatedAt: Date.now()
    };

    // Save updated preferences
    await putItem(TABLE_NAMES.USER_PREFERENCES, updatedPreferences);

    logger.info('Preferences updated successfully', {
      userId,
      updatedFields: Object.keys(updates)
    });

    return successResponse({
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return errors.unauthorized(error.message);
    }
    logger.error('Update preferences failed', error as Error);
    return errors.internalError('Failed to update preferences');
  }
}
