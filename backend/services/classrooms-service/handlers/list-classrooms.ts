/**
 * GET /classrooms
 *
 * List all classrooms, optionally filtered by year
 *
 * Query Parameters:
 * - year: Filter by graduation year (optional)
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
 *       "studentCount": 42
 *     }
 *   ],
 *   "count": 10
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { successResponse, errors } from '../../../shared/utils/response';
import { logger } from '../../../shared/utils/logger';
import { query, TABLE_NAMES } from '../../../shared/utils/dynamodb';
import { Classroom } from '../../../shared/models/user';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDb = DynamoDBDocumentClient.from(client);

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    logger.info('List classrooms request received', {
      requestId: event.requestContext.requestId
    });

    const year = event.queryStringParameters?.year;

    let classrooms: Classroom[];

    if (year) {
      // Query by year using GSI1
      const yearNum = parseInt(year);
      if (isNaN(yearNum)) {
        return errors.badRequest('Invalid year parameter');
      }

      classrooms = await query<Classroom>(
        TABLE_NAMES.CLASSROOMS,
        '#year = :year',
        { ':year': yearNum },
        'GSI1' // GSI1: year → displayName
      );

      logger.info('Classrooms queried by year', { year: yearNum, count: classrooms.length });
    } else {
      // Get all classrooms (scan)
      const result = await dynamoDb.send(new ScanCommand({
        TableName: TABLE_NAMES.CLASSROOMS
      }));

      classrooms = (result.Items as Classroom[]) || [];
      logger.info('All classrooms retrieved', { count: classrooms.length });
    }

    // Sort by year and displayName
    classrooms.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.displayName.localeCompare(b.displayName);
    });

    return successResponse({
      classrooms,
      count: classrooms.length
    });

  } catch (error) {
    logger.error('List classrooms failed', error as Error);
    return errors.internalError('Failed to retrieve classrooms');
  }
}
