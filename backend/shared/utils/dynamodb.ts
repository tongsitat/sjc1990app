/**
 * DynamoDB utility functions
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

export const dynamoDb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false
  }
});

// Table names from environment variables
export const TABLE_NAMES = {
  USERS: process.env.TABLE_USERS || 'Users',
  VERIFICATION_CODES: process.env.TABLE_VERIFICATION_CODES || 'VerificationCodes',
  PENDING_APPROVALS: process.env.TABLE_PENDING_APPROVALS || 'PendingApprovals',
  USER_PREFERENCES: process.env.TABLE_USER_PREFERENCES || 'UserPreferences',
  CLASSROOMS: process.env.TABLE_CLASSROOMS || 'Classrooms',
  USER_CLASSROOMS: process.env.TABLE_USER_CLASSROOMS || 'UserClassrooms'
};

/**
 * Put item in DynamoDB table
 */
export async function putItem<T>(tableName: string, item: T): Promise<void> {
  await dynamoDb.send(new PutCommand({
    TableName: tableName,
    Item: item as Record<string, unknown>
  }));
}

/**
 * Get item from DynamoDB table
 */
export async function getItem<T>(
  tableName: string,
  key: Record<string, unknown>
): Promise<T | null> {
  const result = await dynamoDb.send(new GetCommand({
    TableName: tableName,
    Key: key
  }));

  return (result.Item as T) || null;
}

/**
 * Query DynamoDB table
 */
export async function query<T>(
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, unknown>,
  indexName?: string
): Promise<T[]> {
  const result = await dynamoDb.send(new QueryCommand({
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues
  }));

  return (result.Items as T[]) || [];
}

/**
 * Update item in DynamoDB table
 */
export async function updateItem(
  tableName: string,
  key: Record<string, unknown>,
  updateExpression: string,
  expressionAttributeValues: Record<string, unknown>
): Promise<void> {
  await dynamoDb.send(new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues
  }));
}

/**
 * Delete item from DynamoDB table
 */
export async function deleteItem(
  tableName: string,
  key: Record<string, unknown>
): Promise<void> {
  await dynamoDb.send(new DeleteCommand({
    TableName: tableName,
    Key: key
  }));
}
