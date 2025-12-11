/**
 * GET /classrooms/{classroomId}/members
 *
 * Get all users in a specific classroom (find classmates)
 *
 * Response:
 * {
 *   "members": [
 *     {
 *       "userId": "uuid",
 *       "name": "John Doe",
 *       "profilePhotoUrl": "https://cdn.../profile.jpg",
 *       "addedAt": 1700000000000
 *     }
 *   ],
 *   "count": 42,
 *   "classroom": {
 *     "classroomId": "1985-P4B",
 *     "displayName": "Primary 4B (1985)",
 *     "year": 1985
 *   }
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
    const classroomId = event.pathParameters?.classroomId;
    if (!classroomId) {
      return errors.badRequest('Classroom ID is required');
    }

    logger.info('Get classroom members request received', {
      requestId: event.requestContext.requestId,
      classroomId
    });

    // Verify JWT token (authentication required to view classmates)
    const token = extractTokenFromHeader(event.headers.Authorization);
    verifyToken(token);

    // Verify classroom exists
    const classroom = await getItem<Classroom>(
      TABLE_NAMES.CLASSROOMS,
      { classroomId }
    );

    if (!classroom) {
      return errors.notFound('Classroom not found');
    }

    // Get all users in this classroom using GSI1
    const userClassrooms = await query<UserClassroom>(
      TABLE_NAMES.USER_CLASSROOMS,
      'classroomId = :classroomId',
      { ':classroomId': classroomId },
      'GSI1' // GSI1: classroomId → userId
    );

    // Get user details for each member
    const memberDetailsPromises = userClassrooms.map(async (uc) => {
      const user = await getItem<User>(
        TABLE_NAMES.USERS,
        { userId: uc.userId }
      );

      if (!user) {
        return null;
      }

      return {
        userId: user.userId,
        name: user.name,
        profilePhotoUrl: user.profilePhotoCdnUrl,
        bio: user.bio,
        addedAt: uc.addedAt
      };
    });

    const members = await Promise.all(memberDetailsPromises);

    // Filter out null members (if user was deleted)
    const validMembers = members.filter(m => m !== null);

    // Sort by name
    validMembers.sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));

    logger.info('Classroom members retrieved', {
      classroomId,
      count: validMembers.length
    });

    return successResponse({
      members: validMembers,
      count: validMembers.length,
      classroom: {
        classroomId: classroom.classroomId,
        displayName: classroom.displayName,
        year: classroom.year,
        grade: classroom.grade,
        section: classroom.section
      }
    });

  } catch (error) {
    if (error instanceof Error && (error.message.includes('token') || error.message.includes('Authorization'))) {
      return errors.unauthorized(error.message);
    }
    logger.error('Get classroom members failed', error as Error);
    return errors.internalError('Failed to retrieve classroom members');
  }
}
