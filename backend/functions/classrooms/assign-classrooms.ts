/**
 * POST /users/{userId}/classrooms
 *
 * Assign classrooms to user (multi-select)
 *
 * Request:
 * {
 *   "classroomIds": ["1985-P4B", "1988-F3A", "1990-F5C"]
 * }
 *
 * Response:
 * {
 *   "message": "Classrooms assigned successfully",
 *   "count": 3
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { successResponse, errors } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { verifyToken, extractTokenFromHeader } from '../../shared/utils/jwt';
import { getItem, putItem, TABLE_NAMES } from '../../shared/utils/dynamodb';
import { User, UserClassroom, ClassroomRole, Classroom } from '../../shared/models/user';

interface AssignClassroomsRequest {
  classroomIds: string[];
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Assign classrooms request received', {
      requestId: event.requestContext.requestId,
      userId
    });

    // Verify JWT token
    const token = extractTokenFromHeader(event.headers.Authorization);
    const payload = verifyToken(token);

    // Verify user is assigning their own classrooms (or is admin)
    if (payload.userId !== userId && payload.role !== 'admin') {
      return errors.forbidden('You can only assign your own classrooms');
    }

    // Parse request body
    if (!event.body) {
      return errors.badRequest('Request body is required');
    }

    const body: AssignClassroomsRequest = JSON.parse(event.body);
    const { classroomIds } = body;

    if (!classroomIds || !Array.isArray(classroomIds) || classroomIds.length === 0) {
      return errors.badRequest('classroomIds array is required and must not be empty');
    }

    // Limit number of classrooms
    if (classroomIds.length > 20) {
      return errors.badRequest('Maximum 20 classrooms can be assigned');
    }

    // Verify user exists
    const user = await getItem<User>(TABLE_NAMES.USERS, { userId });
    if (!user) {
      return errors.notFound('User not found');
    }

    const now = Date.now();

    // Verify all classrooms exist and assign them
    const assignmentPromises = classroomIds.map(async (classroomId) => {
      // Verify classroom exists
      const classroom = await getItem<Classroom>(
        TABLE_NAMES.CLASSROOMS,
        { classroomId }
      );

      if (!classroom) {
        throw new Error(`Classroom not found: ${classroomId}`);
      }

      // Create UserClassroom record
      const userClassroom: UserClassroom = {
        userId,
        classroomId,
        addedAt: now,
        role: ClassroomRole.STUDENT
      };

      await putItem(TABLE_NAMES.USER_CLASSROOMS, userClassroom);
      return classroomId;
    });

    try {
      await Promise.all(assignmentPromises);
    } catch (error) {
      if (error instanceof Error) {
        return errors.badRequest(error.message);
      }
      throw error;
    }

    logger.info('Classrooms assigned successfully', {
      userId,
      classroomIds,
      count: classroomIds.length
    });

    return successResponse({
      message: 'Classrooms assigned successfully',
      count: classroomIds.length
    }, 201);

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return errors.unauthorized(error.message);
    }
    logger.error('Assign classrooms failed', error as Error);
    return errors.internalError('Failed to assign classrooms');
  }
}
