/**
 * GET /users/{userId}/preferences
 *
 * Get user communication preferences
 *
 * Response:
 * {
 *   "userId": "uuid",
 *   "primaryChannel": "app",
 *   "enabledChannels": ["app", "email"],
 *   "smsNotifications": true,
 *   "emailNotifications": true,
 *   ...
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errors } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { verifyToken, extractTokenFromHeader } from '../../shared/utils/jwt';
import { getItem, putItem, TABLE_NAMES } from '../../shared/utils/dynamodb';
import { UserPreferences, CommunicationChannel, DigestFrequency, ProfileVisibility } from '../../shared/models/user';

/**
 * Default preferences for new users
 */
const DEFAULT_PREFERENCES: Omit<UserPreferences, 'userId' | 'updatedAt'> = {
  primaryChannel: CommunicationChannel.APP,
  enabledChannels: [CommunicationChannel.APP],
  smsNotifications: true,
  emailNotifications: true,
  whatsappNotifications: false,
  notifyOnMessages: true,
  notifyOnForumPosts: false,
  notifyOnEvents: true,
  digestFrequency: DigestFrequency.DAILY,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  profileVisibility: ProfileVisibility.CLASSMATES,
  showPhoneNumber: false,
  showEmail: false
};

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Get preferences request received', {
      requestId: event.requestContext.requestId,
      userId
    });

    // Verify JWT token
    const token = extractTokenFromHeader(event.headers.Authorization);
    const payload = await verifyToken(token);

    // Verify user is accessing their own preferences (or is admin)
    if (payload.userId !== userId && payload.role !== 'admin') {
      return errors.forbidden('You can only access your own preferences');
    }

    // Get user preferences
    let preferences = await getItem<UserPreferences>(
      TABLE_NAMES.USER_PREFERENCES,
      { userId }
    );

    // If preferences don't exist, create with defaults
    if (!preferences) {
      preferences = {
        userId,
        ...DEFAULT_PREFERENCES,
        updatedAt: Date.now()
      };

      await putItem(TABLE_NAMES.USER_PREFERENCES, preferences);
      logger.info('Created default preferences for user', { userId });
    }

    return successResponse(preferences);

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return errors.unauthorized(error.message);
    }
    logger.error('Get preferences failed', error as Error);
    return errors.internalError('Failed to retrieve preferences');
  }
}
