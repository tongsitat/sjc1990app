/**
 * Unit tests for POST /auth/register Lambda function
 */

import { handler } from '../../functions/auth/register';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as dynamodb from '../../shared/utils/dynamodb';
import * as phone from '../../shared/utils/phone';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

// Mock AWS SDK and DynamoDB
jest.mock('@aws-sdk/client-sns');
jest.mock('../../shared/utils/dynamodb');

describe('POST /auth/register', () => {
  const mockEvent = (body: unknown): Partial<APIGatewayProxyEvent> => ({
    body: JSON.stringify(body),
    requestContext: {
      requestId: 'test-request-id'
    } as any
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if phone number is missing', async () => {
    const event = mockEvent({ name: 'John Doe' });
    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toMatchObject({
      error: 'BAD_REQUEST',
      message: 'Phone number and name are required'
    });
  });

  it('should return 400 if name is missing', async () => {
    const event = mockEvent({ phoneNumber: '+85291234567' });
    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toMatchObject({
      error: 'BAD_REQUEST',
      message: 'Phone number and name are required'
    });
  });

  it('should return 400 if phone number format is invalid', async () => {
    const event = mockEvent({
      phoneNumber: '123456',
      name: 'John Doe'
    });
    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body).message).toContain('Invalid phone number format');
  });

  it('should return 409 if phone number already exists', async () => {
    // Mock existing user
    (dynamodb.query as jest.Mock).mockResolvedValue([{ userId: 'existing-user-id' }]);

    const event = mockEvent({
      phoneNumber: '+85291234567',
      name: 'John Doe'
    });
    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(409);
    expect(JSON.parse(result.body)).toMatchObject({
      error: 'CONFLICT',
      message: 'Phone number already registered'
    });
  });

  it('should send SMS and return 200 for valid registration', async () => {
    // Mock no existing user
    (dynamodb.query as jest.Mock).mockResolvedValue([]);
    // Mock DynamoDB putItem
    (dynamodb.putItem as jest.Mock).mockResolvedValue(undefined);
    // Mock SNS send
    (SNSClient.prototype.send as jest.Mock).mockResolvedValue({});

    const event = mockEvent({
      phoneNumber: '+852 9123 4567', // Test normalization
      name: 'John Doe'
    });
    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body).toMatchObject({
      message: 'Verification code sent',
      expiresIn: 300
    });

    // Verify DynamoDB putItem was called with verification code
    expect(dynamodb.putItem).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        phoneNumberHash: expect.any(String),
        phoneNumber: '+85291234567', // Normalized
        code: expect.stringMatching(/^\d{6}$/), // 6-digit code
        expiresAt: expect.any(Number),
        attempts: 0,
        maxAttempts: 3,
        verified: false
      })
    );

    // Verify SNS was called
    expect(SNSClient.prototype.send).toHaveBeenCalledWith(
      expect.any(PublishCommand)
    );
  });

  it('should normalize phone number before processing', async () => {
    (dynamodb.query as jest.Mock).mockResolvedValue([]);
    (dynamodb.putItem as jest.Mock).mockResolvedValue(undefined);
    (SNSClient.prototype.send as jest.Mock).mockResolvedValue({});

    const event = mockEvent({
      phoneNumber: '+852 9123-4567', // With spaces and dashes
      name: 'John Doe'
    });
    const result = await handler(event as APIGatewayProxyEvent);

    expect(result.statusCode).toBe(200);

    // Check that phone was normalized to E.164
    const putItemCall = (dynamodb.putItem as jest.Mock).mock.calls[0];
    expect(putItemCall[1].phoneNumber).toBe('+85291234567');
  });
});

describe('Phone utility functions', () => {
  it('should generate 6-digit verification code', () => {
    const code = phone.generateVerificationCode();
    expect(code).toMatch(/^\d{6}$/);
    expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
    expect(parseInt(code)).toBeLessThanOrEqual(999999);
  });

  it('should validate E.164 phone numbers', () => {
    expect(phone.validatePhoneNumber('+85291234567')).toBe(true);
    expect(phone.validatePhoneNumber('+12125551234')).toBe(true);
    expect(phone.validatePhoneNumber('+441234567890')).toBe(true);

    expect(phone.validatePhoneNumber('123456')).toBe(false);
    expect(phone.validatePhoneNumber('85291234567')).toBe(false); // Missing +
    expect(phone.validatePhoneNumber('+0123456789')).toBe(false); // Starts with 0
  });

  it('should normalize phone numbers', () => {
    expect(phone.normalizePhoneNumber('+852 9123 4567')).toBe('+85291234567');
    expect(phone.normalizePhoneNumber('+852-9123-4567')).toBe('+85291234567');
    expect(phone.normalizePhoneNumber('+852 (9123) 4567')).toBe('+85291234567');
  });

  it('should hash phone numbers consistently', () => {
    const hash1 = phone.hashPhoneNumber('+85291234567');
    const hash2 = phone.hashPhoneNumber('+85291234567');
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex characters
  });
});
