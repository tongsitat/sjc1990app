/**
 * API response utility functions
 */

import { APIGatewayProxyResult } from 'aws-lambda';

export interface ApiResponse<T = unknown> {
  statusCode: number;
  body: T;
}

export interface ErrorResponse {
  error: string;
  message: string;
  details?: unknown;
}

/**
 * Create success response
 */
export function successResponse<T>(data: T, statusCode = 200): APIGatewayProxyResult {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(data)
  };
}

/**
 * Create error response
 */
export function errorResponse(
  error: string,
  message: string,
  statusCode = 400,
  details?: unknown
): APIGatewayProxyResult {
  const response: ErrorResponse = {
    error,
    message,
    ...(details && { details })
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(response)
  };
}

/**
 * Common error responses
 */
export const errors = {
  badRequest: (message: string, details?: unknown) =>
    errorResponse('BAD_REQUEST', message, 400, details),

  unauthorized: (message = 'Unauthorized') =>
    errorResponse('UNAUTHORIZED', message, 401),

  forbidden: (message = 'Forbidden') =>
    errorResponse('FORBIDDEN', message, 403),

  notFound: (message = 'Resource not found') =>
    errorResponse('NOT_FOUND', message, 404),

  conflict: (message: string) =>
    errorResponse('CONFLICT', message, 409),

  internalError: (message = 'Internal server error') =>
    errorResponse('INTERNAL_ERROR', message, 500)
};
