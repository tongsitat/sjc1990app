/**
 * POST /users/{userId}/profile-photo
 *
 * Get pre-signed URL for uploading profile photo to S3
 *
 * Request:
 * {
 *   "contentType": "image/jpeg",
 *   "fileSize": 1024000
 * }
 *
 * Response:
 * {
 *   "uploadUrl": "https://s3-presigned-url...",
 *   "photoKey": "profiles/uuid-timestamp.jpg",
 *   "expiresIn": 300
 * }
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errors } from '../../shared/utils/response';
import { logger } from '../../shared/utils/logger';
import { verifyToken, extractTokenFromHeader } from '../../shared/utils/jwt';
import { getItem, TABLE_NAMES } from '../../shared/utils/dynamodb';
import { User } from '../../shared/models/user';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const BUCKET_NAME = process.env.S3_PHOTOS_BUCKET || 'sjc1990app-dev-photos';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PRESIGNED_URL_EXPIRES = 300; // 5 minutes

interface UploadPhotoRequest {
  contentType: string;
  fileSize: number;
}

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    const userId = event.pathParameters?.userId;
    if (!userId) {
      return errors.badRequest('User ID is required');
    }

    logger.info('Upload photo request received', {
      requestId: event.requestContext.requestId,
      userId
    });

    // Verify JWT token
    const token = extractTokenFromHeader(event.headers.Authorization);
    const payload = verifyToken(token);

    // Verify user is uploading their own photo (or is admin)
    if (payload.userId !== userId && payload.role !== 'admin') {
      return errors.forbidden('You can only upload your own profile photo');
    }

    // Parse request body
    if (!event.body) {
      return errors.badRequest('Request body is required');
    }

    const body: UploadPhotoRequest = JSON.parse(event.body);
    const { contentType, fileSize } = body;

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return errors.badRequest(
        `Invalid content type. Allowed types: ${ALLOWED_CONTENT_TYPES.join(', ')}`
      );
    }

    // Validate file size
    if (fileSize > MAX_FILE_SIZE) {
      return errors.badRequest(
        `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024} MB)`
      );
    }

    // Verify user exists
    const user = await getItem<User>(TABLE_NAMES.USERS, { userId });
    if (!user) {
      return errors.notFound('User not found');
    }

    // Generate unique photo key
    const timestamp = Date.now();
    const extension = contentType.split('/')[1];
    const photoKey = `profiles/${userId}-${timestamp}.${extension}`;

    // Generate pre-signed URL for upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: photoKey,
      ContentType: contentType,
      ContentLength: fileSize,
      Metadata: {
        userId,
        uploadedAt: timestamp.toString()
      }
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES
    });

    logger.info('Pre-signed URL generated', {
      userId,
      photoKey,
      contentType,
      fileSize
    });

    return successResponse({
      uploadUrl,
      photoKey,
      expiresIn: PRESIGNED_URL_EXPIRES
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('token')) {
      return errors.unauthorized(error.message);
    }
    logger.error('Upload photo failed', error as Error);
    return errors.internalError('Failed to generate upload URL');
  }
}
