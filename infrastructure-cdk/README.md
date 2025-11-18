# sjc1990app Infrastructure (AWS CDK)

AWS CDK infrastructure for the High School Classmates Connection Platform.

## Overview

This project uses **AWS CDK** (TypeScript) to define and deploy all AWS resources for the sjc1990app backend.

### Why CDK over Serverless Framework?

- ✅ **Type-safe infrastructure** - Catch errors at compile time
- ✅ **TypeScript consistency** - Same language as backend
- ✅ **Better IDE support** - IntelliSense, autocomplete
- ✅ **Official AWS tool** - No third-party dependency
- ✅ **Easier complex features** - AppSync, Rekognition, multi-tenant
- ✅ **Auto-generated IAM policies** - `grantReadWriteData()` handles permissions

See [ADR-011](../docs/adr/ADR-011-aws-cdk-vs-serverless-framework.md) for full decision rationale.

## Project Structure

```
infrastructure-cdk/
├── bin/
│   └── infrastructure-cdk.ts    # CDK app entry point
├── lib/
│   └── stacks/
│       ├── database-stack.ts    # 6 DynamoDB tables
│       ├── lambda-stack.ts      # 14 Lambda functions
│       ├── api-stack.ts         # API Gateway REST API
│       └── storage-stack.ts     # S3 bucket for photos
├── test/                        # CDK snapshot tests (TODO)
├── cdk.json                     # CDK configuration
├── tsconfig.json                # TypeScript configuration
└── package.json                 # Dependencies and scripts
```

## Stacks

### 1. Storage Stack (`sjc1990app-{stage}-storage`)
- **S3 Bucket**: Profile and class photos
- **Features**: Encryption, CORS, lifecycle policies, private access

### 2. Database Stack (`sjc1990app-{stage}-database`)
- **6 DynamoDB Tables**:
  - `users` - User accounts (3 GSIs)
  - `verification-codes` - SMS verification (TTL enabled)
  - `pending-approvals` - User approval workflow (1 GSI)
  - `user-preferences` - Communication preferences
  - `classrooms` - Classroom metadata (1 GSI)
  - `user-classrooms` - Many-to-many relationship (1 GSI)
- **Features**: On-demand billing, encryption, point-in-time recovery

### 3. Lambda Stack (`sjc1990app-{stage}-lambda`)
- **14 Lambda Functions**:
  - **Auth**: register, verify, pending-approvals, approve, reject
  - **Profile**: update-profile, upload-photo, complete-photo-upload
  - **Preferences**: get-preferences, update-preferences
  - **Classrooms**: list-classrooms, assign-classrooms, get-user-classrooms, get-classroom-members
- **Features**: Auto-bundling, minification, source maps, IAM permissions

### 4. API Stack (`sjc1990app-{stage}-api`)
- **API Gateway REST API**: 14 endpoints
- **Features**: CORS, throttling, CloudWatch logging, Lambda proxy integration

## Prerequisites

1. **AWS Account** - See [AWS Setup Guide](../docs/guides/AWS_SETUP.md)
2. **AWS CLI** - Configured with credentials
3. **Node.js** - Version 18.x or 20.x
4. **AWS CDK CLI** - Installed globally

### Install AWS CDK CLI

```bash
npm install -g aws-cdk

# Verify installation
cdk --version
```

## Setup

### 1. Install Dependencies

```bash
cd infrastructure-cdk
npm install
```

### 2. Configure JWT Secret

Store JWT secret in AWS Systems Manager Parameter Store:

```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Store in Parameter Store (replace YOUR_SECRET and REGION)
aws ssm put-parameter \
  --name "/sjc1990app/dev/jwt-secret" \
  --value "YOUR_GENERATED_SECRET_HERE" \
  --type "SecureString" \
  --region us-west-2
```

### 3. Bootstrap CDK (One-time per AWS account/region)

```bash
cdk bootstrap aws://ACCOUNT_ID/REGION

# Example:
cdk bootstrap aws://123456789012/us-west-2
```

## Deployment

### Deploy to Dev Environment

```bash
# Build TypeScript
npm run build

# Synthesize CloudFormation templates (dry-run)
npm run synth

# Deploy all stacks
npm run deploy:dev

# Or deploy specific stack
cdk deploy sjc1990app-dev-database --context stage=dev
```

### Deploy to Staging

```bash
# First, create staging JWT secret
aws ssm put-parameter \
  --name "/sjc1990app/staging/jwt-secret" \
  --value "DIFFERENT_SECRET_FOR_STAGING" \
  --type "SecureString" \
  --region us-west-2

# Deploy
npm run deploy:staging
```

### Deploy to Production

```bash
# Create production JWT secret
aws ssm put-parameter \
  --name "/sjc1990app/prod/jwt-secret" \
  --value "DIFFERENT_SECRET_FOR_PROD" \
  --type "SecureString" \
  --region us-west-2

# Deploy with manual approval
npm run deploy:prod
```

## Useful Commands

```bash
# Build TypeScript
npm run build

# Watch mode (auto-compile on file changes)
npm run watch

# Synthesize CloudFormation templates
npm run synth

# Show diff between deployed and local
npm run diff

# Deploy all stacks (auto-approve)
npm run deploy

# Deploy to specific environment
npm run deploy:dev
npm run deploy:staging
npm run deploy:prod

# Destroy all stacks (DELETE ALL RESOURCES!)
npm run destroy
```

## Deployment Output

After successful deployment, you'll see:

```
Outputs:
sjc1990app-dev-api.ApiUrl = https://abc123.execute-api.us-west-2.amazonaws.com/dev/
sjc1990app-dev-database.UsersTableName = sjc1990app-users-dev
sjc1990app-dev-storage.PhotosBucketName = sjc1990app-dev-photos
...

Stack ARN:
arn:aws:cloudformation:us-west-2:123456789012:stack/sjc1990app-dev-api/...
```

**Save the API URL!** You'll need it for frontend integration and testing.

## Testing

### Test API Endpoints

```bash
# Get API URL from deployment output
API_URL="https://abc123.execute-api.us-west-2.amazonaws.com/dev"

# Test user registration
curl -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+85291234567",
    "name": "Test User"
  }'

# Expected response:
# {
#   "message": "Verification code sent",
#   "expiresIn": 300
# }
```

### View CloudWatch Logs

```bash
# Tail Lambda function logs
aws logs tail /aws/lambda/sjc1990app-dev-authRegister --follow --region us-west-2

# Or use CDK helper (if available)
cdk logs sjc1990app-dev-authRegister --follow
```

### Check DynamoDB Tables

```bash
# List all tables
aws dynamodb list-tables --region us-west-2

# Describe Users table
aws dynamodb describe-table \
  --table-name sjc1990app-users-dev \
  --region us-west-2
```

## Cost Monitoring

Monitor costs in AWS Console:
- [Cost Explorer](https://console.aws.amazon.com/cost-management/home#/cost-explorer)
- [CloudWatch Billing Alarms](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:)

**Estimated monthly costs (dev environment)**:
- Lambda: ~$0.50 (mostly Free Tier)
- DynamoDB: ~$1.85 (500 users)
- S3: ~$0.50 (50 photos)
- SNS (SMS): ~$5-15 (verification codes)
- API Gateway: Free (within 1M requests)
- **Total: ~$8-20/month**

## Destroying Infrastructure

**⚠️ WARNING**: This deletes ALL resources (DynamoDB tables, S3 bucket, Lambda functions, etc.)

```bash
# Destroy all stacks (requires confirmation)
npm run destroy

# Or destroy specific stack
cdk destroy sjc1990app-dev-lambda --context stage=dev
```

**Note**: Tables and S3 bucket have `RETAIN` removal policy, so they won't be deleted automatically (safety measure).

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to AWS

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd infrastructure-cdk
          npm install

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-west-2

      - name: Deploy CDK stacks
        run: |
          cd infrastructure-cdk
          npm run deploy:staging
```

## Troubleshooting

### Issue: `cdk bootstrap` fails with access denied

**Solution**: Your IAM user needs CloudFormation permissions.
```bash
# Add Administrator policy (dev environment)
# OR attach the custom deployment policy from AWS_SETUP.md
```

### Issue: Lambda function can't read DynamoDB table

**Solution**: Check IAM permissions. CDK should auto-generate with `grantReadWriteData()`, but verify:
```bash
aws lambda get-policy \
  --function-name sjc1990app-dev-authRegister \
  --region us-west-2
```

### Issue: API returns 502 Bad Gateway

**Solution**: Lambda function error. Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/sjc1990app-dev-authRegister --follow
```

### Issue: JWT secret not found

**Solution**: Create secret in Parameter Store:
```bash
aws ssm put-parameter \
  --name "/sjc1990app/dev/jwt-secret" \
  --value "YOUR_SECRET" \
  --type "SecureString" \
  --region us-west-2
```

### Issue: S3 bucket name already taken

**Solution**: S3 bucket names are globally unique. Change bucket name in `storage-stack.ts`:
```typescript
bucketName: `${serviceName}-${stage}-photos-${randomSuffix}`,
```

## Migration from Serverless Framework

The original `infrastructure/serverless.yml` has been archived to `infrastructure/serverless.yml.archive`.

All resources are **identical** between Serverless Framework and CDK:
- Same DynamoDB tables, schemas, and GSIs
- Same Lambda functions (same code, just different deployment)
- Same API Gateway endpoints
- Same S3 bucket configuration
- Same IAM permissions

**No code changes needed in Lambda functions!**

## References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [AWS CDK API Reference](https://docs.aws.amazon.com/cdk/api/v2/)
- [CDK Workshop](https://cdkworkshop.com/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Project Architecture](../ARCHITECTURE.md)
- [AWS Setup Guide](../docs/guides/AWS_SETUP.md)

## Support

- Check [Troubleshooting section](#troubleshooting)
- Review [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home#logsV2:log-groups)
- Create GitHub issue
- Ask Product Manager or AI agents (via `/architect` or `/devops`)

---

**Happy deploying!** 🚀
