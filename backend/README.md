# sjc1990app Backend

Serverless backend for the High School Classmates Connection Platform, built with AWS Lambda, DynamoDB, and TypeScript.

## Tech Stack

- **Runtime**: Node.js 20.x
- **Language**: TypeScript (strict mode)
- **Compute**: AWS Lambda (serverless)
- **Database**: Amazon DynamoDB (NoSQL, on-demand billing)
- **API**: AWS API Gateway (RESTful)
- **SMS**: AWS SNS
- **Storage**: AWS S3 + CloudFront
- **Framework**: Serverless Framework
- **Testing**: Jest

## Project Structure

```
backend/
├── functions/              # Lambda function handlers
│   ├── auth/              # Authentication functions
│   │   ├── register.ts    # POST /auth/register
│   │   └── verify.ts      # POST /auth/verify
│   ├── users/             # User management functions
│   ├── messages/          # Messaging functions
│   ├── forums/            # Forum functions
│   ├── photos/            # Photo management functions
│   └── routing/           # Cross-channel routing functions
├── shared/                # Shared utilities and models
│   ├── models/            # TypeScript interfaces for DynamoDB
│   │   └── user.ts        # User, VerificationCode, etc.
│   ├── utils/             # Helper functions
│   │   ├── dynamodb.ts    # DynamoDB operations
│   │   ├── phone.ts       # Phone number utilities
│   │   ├── jwt.ts         # JWT token utilities
│   │   ├── response.ts    # API response helpers
│   │   └── logger.ts      # Structured logging
│   └── middleware/        # Lambda middleware (future)
├── tests/                 # Unit tests
│   └── auth/
│       └── register.test.ts
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── jest.config.js         # Jest config
└── .eslintrc.json         # ESLint config
```

## Prerequisites

- Node.js 20.x or later
- AWS CLI configured with credentials
- Serverless Framework CLI: `npm install -g serverless`

## Installation

```bash
cd backend
npm install
```

## Development

### Run Tests

```bash
npm test                # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

### Lint Code

```bash
npm run lint
```

### Build TypeScript

```bash
npm run build
```

### Local Development (Serverless Offline)

```bash
npm run offline
```

This starts a local API Gateway and Lambda environment for testing.

## Deployment

### Deploy to Dev Environment

```bash
npm run deploy:dev
```

### Deploy to Staging Environment

```bash
npm run deploy:staging
```

### Deploy to Production Environment

```bash
npm run deploy:prod
```

## Environment Variables

Set these in AWS Systems Manager Parameter Store:

- `/sjc1990app/dev/jwt-secret` - JWT signing secret
- `/sjc1990app/staging/jwt-secret` - JWT signing secret (staging)
- `/sjc1990app/prod/jwt-secret` - JWT signing secret (production)

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user and send SMS verification code.

**Request**:
```json
{
  "phoneNumber": "+85291234567",
  "name": "John Doe"
}
```

**Response** (200):
```json
{
  "message": "Verification code sent",
  "expiresIn": 300
}
```

#### POST /auth/verify
Verify SMS code and create user account.

**Request**:
```json
{
  "phoneNumber": "+85291234567",
  "code": "123456"
}
```

**Response** (201):
```json
{
  "userId": "uuid-v4",
  "status": "pending_approval",
  "token": "jwt-token",
  "expiresAt": 1700086400000
}
```

## DynamoDB Tables

- **Users**: User accounts and profiles
- **VerificationCodes**: SMS verification codes (auto-expires after 5 min)
- **PendingApprovals**: Approval workflow tracking
- **UserPreferences**: Communication preferences
- **Classrooms**: Classroom information
- **UserClassrooms**: Many-to-many user-classroom relationships

## Testing

### Unit Test Example

```typescript
import { handler } from '../../functions/auth/register';

it('should return 400 if phone number is missing', async () => {
  const event = mockEvent({ name: 'John Doe' });
  const result = await handler(event as APIGatewayProxyEvent);

  expect(result.statusCode).toBe(400);
  expect(JSON.parse(result.body).error).toBe('BAD_REQUEST');
});
```

Run tests:
```bash
npm test
```

## Code Quality

### TypeScript Strict Mode
All code uses TypeScript strict mode with no `any` types allowed.

### ESLint
Code is linted with `@typescript-eslint` plugin.

### Test Coverage
Minimum 70% coverage required for branches, functions, lines, and statements.

## Security

- Phone numbers hashed (SHA-256) for lookups
- PII encrypted at rest (DynamoDB encryption)
- JWT tokens with 24-hour expiration
- Input validation on all endpoints
- Structured logging (no sensitive data logged)
- AWS Secrets Manager for secrets

## Cost Optimization

- DynamoDB on-demand billing (pay per request)
- Lambda optimized for fast execution (<300ms target)
- CloudWatch log retention set to 7 days
- S3 lifecycle policies for old data

## Monitoring

- CloudWatch Logs (structured JSON format)
- CloudWatch Metrics (Lambda invocations, errors, duration)
- AWS X-Ray (distributed tracing)

## Next Steps

1. Implement approval system Lambdas (`/auth/approve`, `/auth/reject`)
2. Implement profile management Lambdas (`PUT /users/{userId}/profile`)
3. Implement preferences Lambdas (`GET/PUT /users/{userId}/preferences`)
4. Implement classroom Lambdas (`GET /classrooms`, `POST /users/{userId}/classrooms`)
5. Add integration tests
6. Set up CI/CD pipeline (GitHub Actions)

## Contributing

1. Write unit tests for all new functions
2. Follow TypeScript strict mode
3. Use structured logging
4. Document all endpoints
5. Run `npm run lint` before committing

## Support

For issues, see `/docs/AI_TEAM_GUIDE.md` for agent contacts.
