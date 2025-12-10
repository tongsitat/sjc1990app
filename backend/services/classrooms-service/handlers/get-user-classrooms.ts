/**
 * GET /users/{userId}/classrooms
 *
 * Get all classrooms a user is assigned to
 *
 * Response:
 * {
 *   "classrooms": [
 *     {
 *       "classroomId": "1985-P4B",
 *       "year": 1985,
 *       "grade": "Primary 4",
 *       "section": "B",
 *       "displayName": "Primary 4B (1985)",
 *       "addedAt": 1700000000000,
 *       "role": "student"
 *     }
 *   ],
 *   "count": 3
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errors } from '../../../shared/utils/response';
import { logger } from '../../../shared/utils/logger';
import { verifyToken, extractTokenFromHeader } from '../../../shared/utils/jwt';
import { getItem, query, TABLE_NAMES } from '../../../shared/utils/dynamodb';
import { User, UserClassroom, Classroom } from '../../../shared/models/user';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Get user classrooms request received', {
      requestId: event.requestContext.requestId,
      userId
    });

    // Verify JWT token
    const token = extractTokenFromHeader(event.headers.Authorization);
    const payload = await verifyToken(token);

    // Verify user is accessing their own classrooms (or is admin)
    if (payload.userId !== userId && payload.role !== 'admin') {
      return errors.forbidden('You can only access your own classrooms');
    }

    // Verify user exists
    const user = await getItem<User>(TABLE_NAMES.USERS, { userId });
    if (!user) {
      return errors.notFound('User not found');
    }

    // Get user's classroom assignments
    const userClassrooms = await query<UserClassroom>(
      TABLE_NAMES.USER_CLASSROOMS,
      'userId = :userId',
      { ':userId': userId }
    );

    // Get classroom details for each assignment
    const classroomDetailsPromises = userClassrooms.map(async (uc) => {
      const classroom = await getItem<Classroom>(
        TABLE_NAMES.CLASSROOMS,
        { classroomId: uc.classroomId }
      );

      return {
        ...classroom,
        addedAt: uc.addedAt,
        role: uc.role
      };
    });

    const classrooms = await Promise.all(classroomDetailsPromises);

    // Filter out any null classrooms (if classroom was deleted)
    const validClassrooms = classrooms.filter(c => c.classroomId);

    // Sort by year (handle undefined years by putting them at the end)
    validClassrooms.sort((a, b) => (a.year || 9999) - (b.year || 9999));

    logger.info('User classrooms retrieved', {
      userId,
      count: validClassrooms.length
    });

    return successResponse({
      classrooms: validClassrooms,
      count: validClassrooms.length
    });

  } catch (error) {
    if (error instanceof Error && (error.message.includes('token') || error.message.includes('Authorization'))) {
      return errors.unauthorized(error.message);
    }
    logger.error('Get user classrooms failed', error as Error);
    return errors.internalError('Failed to retrieve user classrooms');
  }
}
