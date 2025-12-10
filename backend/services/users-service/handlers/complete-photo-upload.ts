/**
 * PUT /users/{userId}/profile-photo-complete
 *
 * Complete profile photo upload (update user record with photo URL)
 *
 * Request:
 * {
 *   "photoKey": "profiles/uuid-timestamp.jpg"
 * }
 *
 * Response:
 * {
 *   "message": "Profile photo updated successfully",
 *   "photoUrl": "https://cdn.../profiles/uuid-timestamp.jpg"
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { successResponse, errors } from '../../../shared/utils/response';
import { logger } from '../../../shared/utils/logger';
import { verifyToken, extractTokenFromHeader } from '../../../shared/utils/jwt';
import { getItem, updateItem, TABLE_NAMES } from '../../../shared/utils/dynamodb';
import { User } from '../../../shared/models/user';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_PHOTOS_BUCKET || 'sjc1990app-dev-photos';
const CDN_BASE_URL = process.env.CDN_BASE_URL || `https://${BUCKET_NAME}.s3.amazonaws.com`;

interface CompletePhotoUploadRequest {
  photoKey: string;
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Complete photo upload request received', {
      requestId: event.requestContext.requestId,
      userId
    });

    // Verify JWT token
    const token = extractTokenFromHeader(event.headers.Authorization);
    const payload = await verifyToken(token);

    // Verify user is updating their own photo (or is admin)
    if (payload.userId !== userId && payload.role !== 'admin') {
      return errors.forbidden('You can only update your own profile photo');
    }

    // Parse request body
    if (!event.body) {
      return errors.badRequest('Request body is required');
    }

    const body: CompletePhotoUploadRequest = JSON.parse(event.body);
    const { photoKey } = body;

    if (!photoKey) {
      return errors.badRequest('Photo key is required');
    }

    // Verify user exists
    const user = await getItem<User>(TABLE_NAMES.USERS, { userId });
    if (!user) {
      return errors.notFound('User not found');
    }

    // Verify photo was uploaded to S3
    try {
      await s3Client.send(new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: photoKey
      }));
    } catch (error) {
      logger.warn('Photo not found in S3', { photoKey });
      return errors.notFound('Photo not found. Please upload again.');
    }

    // Generate CDN URL
    const photoUrl = `${CDN_BASE_URL}/${photoKey}`;

    const now = Date.now();

    // Update user record with photo URL
    await updateItem(
      TABLE_NAMES.USERS,
      { userId },
      'SET profilePhotoS3Key = :s3Key, profilePhotoCdnUrl = :cdnUrl, updatedAt = :updatedAt',
      {
        ':s3Key': photoKey,
        ':cdnUrl': photoUrl,
        ':updatedAt': now
      }
    );

    logger.info('Profile photo updated successfully', {
      userId,
      photoKey,
      photoUrl
    });

    return successResponse({
      message: 'Profile photo updated successfully',
      photoUrl
    });

  } catch (error) {
    if (error instanceof Error && (error.message.includes('token') || error.message.includes('Authorization'))) {
      return errors.unauthorized(error.message);
    }
    logger.error('Complete photo upload failed', error as Error);
    return errors.internalError('Failed to update profile photo');
  }
}
