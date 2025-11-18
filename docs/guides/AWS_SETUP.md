# AWS Account Setup Guide for sjc1990app

This guide walks you through setting up your AWS account for the sjc1990app serverless backend deployment.

**Estimated Time**: 1-2 hours
**Cost**: Most services stay within AWS Free Tier for development

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Account Setup](#aws-account-setup)
3. [IAM User Creation](#iam-user-creation)
4. [AWS CLI Installation & Configuration](#aws-cli-installation--configuration)
5. [AWS CDK Setup](#aws-cdk-setup)
6. [AWS Services Configuration](#aws-services-configuration)
7. [Secrets Management](#secrets-management)
8. [Cost Monitoring Setup](#cost-monitoring-setup)
9. [Verification & Testing](#verification--testing)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: Version 18.x or 20.x ([Download](https://nodejs.org/))
- **npm**: Comes with Node.js
- **Git**: Already installed (you're using it!)
- **AWS CLI**: Will install in this guide

### Verify Prerequisites

```bash
node --version   # Should show v18.x or v20.x
npm --version    # Should show 9.x or 10.x
git --version    # Already working
```

---

## AWS Account Setup

### Step 1: Create AWS Account (if you don't have one)

1. Go to [https://aws.amazon.com/](https://aws.amazon.com/)
2. Click **"Create an AWS Account"**
3. Enter:
   - Email address
   - Account name (e.g., "sjc1990app-dev")
   - Password
4. Choose **"Personal"** account type
5. Enter contact information
6. Enter payment information (credit card required, but we'll stay in Free Tier)
7. Verify phone number
8. Choose **"Basic Support (Free)"** plan
9. Complete signup

**Note**: You may need to wait 5-15 minutes for account activation.

### Step 2: AWS Free Tier Benefits

Your account includes 12 months of Free Tier:
- **Lambda**: 1M free requests/month, 400,000 GB-seconds compute
- **DynamoDB**: 25 GB storage, 25 read/write capacity units
- **S3**: 5 GB storage, 20,000 GET requests, 2,000 PUT requests
- **SNS**: 1,000 email notifications, 100 SMS messages (US only)
- **API Gateway**: 1M API calls/month

**Our estimated dev usage**: ~$5-20/month (mostly within Free Tier)

### Step 3: Apply for AWS Activate Credits (Optional)

If you're a startup or student:
1. Go to [AWS Activate](https://aws.amazon.com/activate/)
2. Apply for up to $1,000 in credits (covers 10-12 months!)
3. Submit application with project description
4. Wait 1-2 weeks for approval

---

## IAM User Creation

**IMPORTANT**: Never use your root AWS account for deployments! Create an IAM user.

### Step 1: Access IAM Console

1. Sign in to [AWS Console](https://console.aws.amazon.com/)
2. Search for "IAM" in the top search bar
3. Click **"Identity and Access Management (IAM)"**

### Step 2: Create IAM User

1. Click **"Users"** in left sidebar
2. Click **"Create user"** button
3. Enter username: `sjc1990app-deployer`
4. Check **"Provide user access to the AWS Management Console"** (optional, for manual testing)
5. Click **"Next"**

### Step 3: Set Permissions

**Option A: Administrator Access (Easiest for Development)**

1. Select **"Attach policies directly"**
2. Search for `AdministratorAccess`
3. Check the box next to `AdministratorAccess`
4. Click **"Next"**

**Option B: Least Privilege (Recommended for Production)**

Create a custom policy with only required permissions:

1. Select **"Attach policies directly"**
2. Click **"Create policy"**
3. Click **"JSON"** tab
4. Paste the policy below:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "lambda:*",
        "apigateway:*",
        "dynamodb:*",
        "s3:*",
        "sns:*",
        "ses:*",
        "cloudformation:*",
        "cloudwatch:*",
        "logs:*",
        "iam:GetRole",
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:PassRole",
        "ssm:GetParameter",
        "ssm:PutParameter",
        "ssm:DeleteParameter",
        "secretsmanager:*"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Click **"Next"**
6. Name: `sjc1990app-deployment-policy`
7. Click **"Create policy"**
8. Go back to user creation, search for `sjc1990app-deployment-policy`
9. Check the box and click **"Next"**

### Step 4: Review and Create

1. Review user details
2. Click **"Create user"**
3. **IMPORTANT**: Download or copy the access credentials

### Step 5: Generate Access Keys

1. Click on the created user `sjc1990app-deployer`
2. Go to **"Security credentials"** tab
3. Scroll to **"Access keys"** section
4. Click **"Create access key"**
5. Select use case: **"Command Line Interface (CLI)"**
6. Check the confirmation box
7. Click **"Next"**
8. Add description: `Serverless Framework deployment`
9. Click **"Create access key"**
10. **CRITICAL**: Copy both:
    - **Access Key ID** (e.g., `AKIAIOSFODNN7EXAMPLE`)
    - **Secret Access Key** (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)

**⚠️ WARNING**: The Secret Access Key is shown only once! Save it securely.

**Store credentials securely**:
```bash
# DO NOT commit this file to git!
# Store in a password manager or secure notes
Access Key ID: AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Region: ap-southeast-1  # Hong Kong users: use ap-east-1
```

---

## AWS CLI Installation & Configuration

### Step 1: Install AWS CLI

**macOS**:
```bash
# Using Homebrew
brew install awscli

# Or download installer
curl "https://awscli.amazonaws.com/AWSCLIV2.pkg" -o "AWSCLIV2.pkg"
sudo installer -pkg AWSCLIV2.pkg -target /
```

**Windows**:
```powershell
# Download and run installer
# https://awscli.amazonaws.com/AWSCLIV2.msi
```

**Linux**:
```bash
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```

### Step 2: Verify Installation

```bash
aws --version
# Should show: aws-cli/2.x.x ...
```

### Step 3: Configure AWS CLI

```bash
aws configure
```

Enter the following when prompted:
```
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE  # Your Access Key
AWS Secret Access Key [None]: wJalrXUtnFEMI/...  # Your Secret Key
Default region name [None]: ap-southeast-1       # See region table below
Default output format [None]: json
```

### Choosing Your AWS Region

**Recommended regions for Hong Kong/Asia**:
- `ap-east-1` - Hong Kong (lowest latency, but requires opt-in)
- `ap-southeast-1` - Singapore (most services, no opt-in needed)
- `ap-northeast-1` - Tokyo
- `us-east-1` - US East (Virginia) - cheapest, global testing

**For Hong Kong Region (ap-east-1)**:
1. Go to AWS Console → Account Settings
2. Scroll to "AWS Regions"
3. Find "Asia Pacific (Hong Kong) ap-east-1"
4. Click **"Enable"**
5. Wait 5-10 minutes for activation

**Cost Note**: Hong Kong region is ~10-15% more expensive than Singapore.

### Step 4: Test AWS CLI Configuration

```bash
# Test authentication
aws sts get-caller-identity

# Should output:
{
    "UserId": "AIDAJEXAMPLEUSERID",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/sjc1990app-deployer"
}
```

If successful, you're authenticated! ✅

---

## AWS CDK Setup

### Step 1: Install AWS CDK CLI

```bash
# Install globally
npm install -g aws-cdk

# Verify installation
cdk --version
# Should show: 2.x.x
```

### Step 2: Install CDK Project Dependencies

```bash
# Install infrastructure dependencies
cd ~/sjc1990app/infrastructure-cdk
npm install

# This installs:
# - aws-cdk-lib (CDK framework)
# - constructs (CDK constructs library)
# - TypeScript dependencies
```

### Step 3: Install Backend Dependencies

```bash
# Install Lambda function dependencies
cd ~/sjc1990app/backend
npm install

# This installs all backend dependencies:
# - AWS SDK v3
# - TypeScript
# - Jest (testing)
# - All Lambda dependencies
```

### Step 4: Build TypeScript

```bash
# Build backend Lambda functions
cd ~/sjc1990app/backend
npm run build

# Build CDK infrastructure
cd ~/sjc1990app/infrastructure-cdk
npm run build

# Both should compile successfully with no errors
```

### Step 5: Bootstrap CDK (One-time per AWS Account/Region)

```bash
# Replace ACCOUNT_ID with your AWS account ID
# Get your account ID with: aws sts get-caller-identity --query Account --output text

cdk bootstrap aws://ACCOUNT_ID/ap-southeast-1

# Example:
# cdk bootstrap aws://123456789012/ap-southeast-1

# This creates a staging S3 bucket and IAM roles for CDK deployments
# Only needs to be done once per AWS account/region combination
```

---

## AWS Services Configuration

### 1. Amazon SNS (SMS Messaging)

**Enable SNS for SMS**:

1. Go to [SNS Console](https://console.aws.amazon.com/sns/)
2. Click **"Text messaging (SMS)"** in left sidebar
3. Click **"Set up SMS preferences"**
4. Configure:
   - **Default message type**: Transactional (higher priority)
   - **Account spend limit**: $5.00 (prevents accidental overspending)
   - **Default sender ID**: `SJC1990` (if supported in your country)
5. Click **"Save changes"**

**Request SMS Spending Limit Increase** (if needed):

1. Go to [AWS Support Center](https://console.aws.amazon.com/support/)
2. Click **"Create case"**
3. Select **"Service limit increase"**
4. Service: **Simple Notification Service (SNS)**
5. Limit type: **SMS**
6. Request: Increase spending limit to $50/month
7. Use case: "User authentication via SMS verification codes"
8. Submit case (approval takes 24-48 hours)

**Test SNS SMS** (Optional):
```bash
# Send test SMS (replace with your phone number in E.164 format)
aws sns publish \
  --phone-number "+85291234567" \
  --message "Test from sjc1990app" \
  --region ap-southeast-1
```

**Cost**: ~$0.008-0.04 per SMS (varies by country)

### 2. Amazon SES (Email)

**Enable SES**:

1. Go to [SES Console](https://console.aws.amazon.com/ses/)
2. Click **"Get started"** (if first time)
3. Click **"Verify a new email address"**
4. Enter your email (for sending notifications): `your-email@example.com`
5. Check email and click verification link
6. **Sandbox Mode**: Initially, you can only send to verified emails

**Move Out of Sandbox** (Required for Production):

1. Go to SES Console → **"Account dashboard"**
2. Click **"Request production access"**
3. Fill out form:
   - **Use case**: Transactional notifications
   - **Description**: "Sending registration and notification emails to high school classmates"
   - **Process**: Opt-out managed manually, compliance guaranteed
4. Submit request (approval takes 24-48 hours)

**Test SES Email** (Optional):
```bash
# Send test email (from and to must be verified emails in sandbox)
aws ses send-email \
  --from "your-email@example.com" \
  --destination "ToAddresses=your-email@example.com" \
  --message "Subject={Data='Test',Charset=utf8},Body={Text={Data='Test from sjc1990app',Charset=utf8}}" \
  --region ap-southeast-1
```

**Cost**: $0.10 per 1,000 emails

### 3. Amazon S3 (Photo Storage)

**No manual setup required!** The S3 bucket will be created automatically during CDK deployment.

**Note**: The CDK infrastructure already includes lifecycle policies that automatically:
- Archive photos to **Glacier Instant Retrieval** after 90 days
- Archive photos to **Glacier Deep Archive** after 365 days (saves 95% on storage costs!)
- Cleanup incomplete multipart uploads after 7 days

No additional configuration needed! 🎉

**Cost**: $0.023 per GB/month (first 50 TB)

### 4. Amazon DynamoDB

**No manual setup required!** All 6 tables will be created automatically during CDK deployment.

The CDK infrastructure includes:
- **6 DynamoDB tables** with proper schemas and GSIs
- **On-demand billing** (pay-per-request)
- **Encryption at rest** (AWS managed)
- **Point-in-time recovery** for critical tables

**Cost**: ~$1.85/month for 500 users

### 5. AWS Lambda

**No manual setup required!** All 14 Lambda functions will be deployed via AWS CDK.

The CDK infrastructure includes:
- **Auto-bundling** of TypeScript functions
- **Minification** and source maps
- **Auto-generated IAM policies** (least privilege)
- **Environment variables** from tables and secrets

**Cost**: 1M requests/month free, then $0.20 per 1M requests

---

## Secrets Management

### Step 1: Generate JWT Secret

```bash
# Generate a secure random secret (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example: 5f8d3a9b2c1e4f7a6b9d8c3e5f7a2b4c6d8e9f1a3b5c7d9e2f4a6b8c1d3e5f7a9
```

**Save this output!** You'll need it in the next step.

### Step 2: Store JWT Secret in AWS Systems Manager Parameter Store

```bash
# Replace YOUR_REGION and YOUR_SECRET with actual values
aws ssm put-parameter \
  --name "/sjc1990app/dev/jwt-secret" \
  --value "5f8d3a9b2c1e4f7a6b9d8c3e5f7a2b4c6d8e9f1a3b5c7d9e2f4a6b8c1d3e5f7a9" \
  --type "SecureString" \
  --description "JWT secret for sjc1990app dev environment" \
  --region ap-southeast-1
```

**Verify it's stored**:
```bash
aws ssm get-parameter \
  --name "/sjc1990app/dev/jwt-secret" \
  --with-decryption \
  --region ap-southeast-1
```

**For staging and production environments**, repeat with different secrets:
```bash
# Staging
aws ssm put-parameter \
  --name "/sjc1990app/staging/jwt-secret" \
  --value "$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  --type "SecureString" \
  --region ap-southeast-1

# Production
aws ssm put-parameter \
  --name "/sjc1990app/prod/jwt-secret" \
  --value "$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  --type "SecureString" \
  --region ap-southeast-1
```

**Cost**: First 10,000 parameters free, then $0.05 per parameter/month

---

## Cost Monitoring Setup

**CRITICAL**: Set up billing alerts to avoid unexpected charges!

### Step 1: Enable Billing Alerts

1. Go to [Billing Console](https://console.aws.amazon.com/billing/)
2. Click **"Billing preferences"** in left sidebar
3. Check these boxes:
   - ✅ **"Receive Free Tier Usage Alerts"**
   - ✅ **"Receive Billing Alerts"**
4. Enter your email address
5. Click **"Save preferences"**

### Step 2: Create CloudWatch Billing Alarm

1. **IMPORTANT**: Switch to **us-east-1** region (billing metrics only available here)
   - Top-right corner → Select **"US East (N. Virginia)"**

2. Go to [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/)

3. Click **"Alarms"** in left sidebar → **"Create alarm"**

4. Click **"Select metric"**

5. Click **"Billing"** → **"Total Estimated Charge"**

6. Select **"USD"** → Click **"Select metric"**

7. Configure alarm:
   - **Threshold type**: Static
   - **Whenever EstimatedCharges is...**: Greater than
   - **than...**: `50` (or your comfort level)
   - Click **"Next"**

8. Configure notification:
   - **Alarm state trigger**: In alarm
   - **Select an SNS topic**: Create new topic
   - **Topic name**: `sjc1990app-billing-alerts`
   - **Email**: your-email@example.com
   - Click **"Create topic"**
   - Click **"Next"**

9. Name alarm:
   - **Name**: `sjc1990app-billing-alert-50usd`
   - Click **"Next"**

10. Review and **"Create alarm"**

11. **CHECK YOUR EMAIL** and confirm SNS subscription!

### Step 3: Set Up Cost Explorer (Optional)

1. Go to [Cost Explorer](https://console.aws.amazon.com/cost-management/home#/cost-explorer)
2. Click **"Enable Cost Explorer"**
3. Wait 24 hours for initial data
4. View costs by:
   - Service (Lambda, DynamoDB, S3, etc.)
   - Region
   - Tag (if you add tags to resources)

### Step 4: Monthly Cost Review Reminder

**Set a calendar reminder**: First Monday of each month
- Review AWS billing dashboard
- Check cost trends
- Adjust alarms if needed
- Optimize resources if costs are high

---

## Verification & Testing

### Step 1: Verify All Prerequisites

Run this checklist:

```bash
# 1. Node.js installed
node --version  # ✓ v18.x or v20.x

# 2. AWS CLI installed and configured
aws --version   # ✓ aws-cli/2.x.x
aws sts get-caller-identity  # ✓ Shows your IAM user

# 3. AWS CDK installed
cdk --version  # ✓ 2.x.x

# 4. CDK dependencies installed
cd ~/sjc1990app/infrastructure-cdk
ls node_modules  # ✓ Should show aws-cdk-lib, constructs, etc.

# 5. Backend dependencies installed
cd ~/sjc1990app/backend
ls node_modules  # ✓ Should show many packages

# 6. TypeScript compiles (both backend and CDK)
cd ~/sjc1990app/backend && npm run build  # ✓ No errors
cd ~/sjc1990app/infrastructure-cdk && npm run build  # ✓ No errors

# 7. JWT secret stored in Parameter Store
aws ssm get-parameter --name "/sjc1990app/dev/jwt-secret" --with-decryption --region ap-southeast-1  # ✓ Shows encrypted value

# 8. SNS is accessible
aws sns list-topics --region ap-southeast-1  # ✓ Returns (may be empty)

# 9. SES is accessible
aws ses list-verified-email-addresses --region ap-southeast-1  # ✓ Shows your verified email
```

### Step 2: Test CDK Deployment (Dry Run)

```bash
cd ~/sjc1990app/infrastructure-cdk

# Synthesize CloudFormation templates (validates CDK code without deploying)
cdk synth --context stage=dev

# Should output:
# ✓ CloudFormation templates generated successfully
# Creates cdk.out/ folder with CloudFormation templates

# View what will be deployed (diff against current state)
cdk diff --context stage=dev

# Should show all resources to be created (first time deployment)
```

**If successful**, you're ready to deploy! 🎉

### Step 3: Deploy to AWS (Dev Environment)

**This is the real deployment! It will create all resources.**

```bash
cd ~/sjc1990app/infrastructure-cdk

# Deploy all CDK stacks to dev environment
cdk deploy --all --context stage=dev --region ap-southeast-1

# Expected output:
# ✔ sjc1990app-dev-storage (creating S3 bucket)
# ✔ sjc1990app-dev-database (creating 6 DynamoDB tables)
# ✔ sjc1990app-dev-lambda (creating 14 Lambda functions)
# ✔ sjc1990app-dev-api (creating API Gateway)
#
# Estimated time: 3-5 minutes
```

**Save the output!** It will show:
- **ApiUrl** = `https://abc123.execute-api.ap-southeast-1.amazonaws.com/dev/` (API Gateway endpoint)
- **Stack ARNs** for all 4 stacks
- **Outputs** for table names, bucket names, function names

### Step 4: Test a Lambda Function

**Test the health check endpoint** (we should add one!):

For now, test user registration:

```bash
# Get the API Gateway URL from deployment output
API_URL="https://abc123.execute-api.ap-southeast-1.amazonaws.com/dev"

# Test registration endpoint
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

**Check your phone for SMS!** (If SNS is configured correctly)

### Step 5: Verify AWS Resources Created

**Check DynamoDB Tables**:
```bash
aws dynamodb list-tables --region ap-southeast-1

# Should show 6 tables:
# - sjc1990app-users-dev
# - sjc1990app-verification-codes-dev
# - sjc1990app-pending-approvals-dev
# - sjc1990app-user-preferences-dev
# - sjc1990app-classrooms-dev
# - sjc1990app-user-classrooms-dev
```

**Check Lambda Functions**:
```bash
aws lambda list-functions --region ap-southeast-1 | grep sjc1990app

# Should show 14 functions
```

**Check S3 Bucket**:
```bash
aws s3 ls | grep sjc1990app

# Should show: sjc1990app-dev-photos
```

**Check CloudWatch Logs**:
1. Go to [CloudWatch Logs Console](https://console.aws.amazon.com/cloudwatch/home#logsV2:log-groups)
2. Find log groups: `/aws/lambda/sjc1990app-dev-*`
3. Click on `/aws/lambda/sjc1990app-dev-authRegister`
4. You should see logs from your test request!

---

## Troubleshooting

### Issue: AWS CLI not authenticated

**Error**: `Unable to locate credentials`

**Solution**:
```bash
# Re-configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/..."
export AWS_DEFAULT_REGION="ap-southeast-1"
```

### Issue: CDK deployment fails with "Access Denied"

**Error**: `User: arn:aws:iam::xxx:user/xxx is not authorized to perform: cloudformation:CreateStack`

**Solution**:
- Your IAM user needs more permissions
- Add `AdministratorAccess` policy (for dev) or the custom policy above
- Wait 1-2 minutes for IAM changes to propagate

### Issue: CDK bootstrap fails

**Error**: `❌ sjc1990app-dev-database failed: Error: Need to perform AWS calls for account 123456789012, but no credentials have been configured`

**Solution**:
- Run `cdk bootstrap` first (one-time setup)
- Ensure AWS CLI is configured correctly (`aws sts get-caller-identity`)

### Issue: SNS SMS not sending

**Error**: No SMS received after registration

**Checklist**:
1. Check phone number format: Must be E.164 (`+85291234567`)
2. Check SNS spending limit: May be $1/month by default
3. Check SNS region: Must match your deployment region
4. Check CloudWatch logs for errors:
   ```bash
   aws logs tail /aws/lambda/sjc1990app-dev-authRegister --follow
   ```
5. Test SNS directly:
   ```bash
   aws sns publish --phone-number "+85291234567" --message "Test" --region ap-southeast-1
   ```

### Issue: JWT secret not found during Lambda execution

**Error**: Lambda logs show "JWT secret not configured"

**Solution**:
```bash
# Verify secret exists
aws ssm get-parameter --name "/sjc1990app/dev/jwt-secret" --region ap-southeast-1

# If not found, create it:
aws ssm put-parameter \
  --name "/sjc1990app/dev/jwt-secret" \
  --value "$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  --type "SecureString" \
  --region ap-southeast-1

# Redeploy Lambda functions
cd ~/sjc1990app/infrastructure
serverless deploy function -f authRegister --stage dev --region ap-southeast-1
```

### Issue: DynamoDB table not found

**Error**: `Requested resource not found: Table: sjc1990app-users-dev not found`

**Solution**:
```bash
# Check if tables exist
aws dynamodb list-tables --region ap-southeast-1

# If missing, redeploy
cd ~/sjc1990app/infrastructure
serverless deploy --stage dev --region ap-southeast-1
```

### Issue: Lambda cold start timeout

**Error**: Lambda times out on first request

**Solution**:
- Lambda cold starts take 1-3 seconds (normal)
- Retry the request (second request will be fast)
- For production, enable **Provisioned Concurrency** (costs extra)

### Issue: High AWS costs

**Checklist**:
1. Check Cost Explorer for top services
2. Common culprits:
   - **DynamoDB**: Switch to on-demand if using provisioned capacity
   - **Lambda**: Check for infinite loops in logs
   - **S3**: Check for excessive uploads
   - **SNS**: Check SMS sending (most expensive)
3. Set up CloudWatch alarms (see Cost Monitoring section above)

### Issue: SES emails not sending

**Error**: `Email address is not verified`

**Solution**:
- You're in SES Sandbox mode
- Verify recipient email addresses, OR
- Request production access (see SES section above)

---

## Next Steps

Once setup is complete, proceed to deployment:

```bash
# Recommended workflow
/devops "Deploy Phase 1 backend to AWS dev environment.
         All services are configured and ready.
         Use AWS CDK to deploy infrastructure."
```

Or manual deployment:
```bash
cd ~/sjc1990app/infrastructure-cdk
cdk deploy --all --context stage=dev --region ap-southeast-1
```

---

## Quick Reference

### Essential AWS CLI Commands

```bash
# Check authenticated user
aws sts get-caller-identity

# List all regions
aws ec2 describe-regions --output table

# Check current AWS configuration
aws configure list

# List all DynamoDB tables
aws dynamodb list-tables --region ap-southeast-1

# List all Lambda functions
aws lambda list-functions --region ap-southeast-1 --query 'Functions[*].[FunctionName]' --output table

# List all S3 buckets
aws s3 ls

# Tail Lambda logs
aws logs tail /aws/lambda/sjc1990app-dev-authRegister --follow --region ap-southeast-1

# Get latest CloudWatch logs
aws logs describe-log-groups --region ap-southeast-1 | grep sjc1990app
```

### Essential CDK Commands

```bash
# Synthesize CloudFormation templates (dry-run)
cdk synth --context stage=dev

# View changes before deploying (diff)
cdk diff --context stage=dev

# Deploy all stacks
cdk deploy --all --context stage=dev --region ap-southeast-1

# Deploy specific stack
cdk deploy sjc1990app-dev-lambda --context stage=dev

# View deployed stack info
aws cloudformation describe-stacks --stack-name sjc1990app-dev-api --region ap-southeast-1

# View Lambda logs
aws logs tail /aws/lambda/sjc1990app-dev-authRegister --follow --region ap-southeast-1

# Destroy all stacks (DELETE ALL RESOURCES!)
cdk destroy --all --context stage=dev --region ap-southeast-1
```

---

## Security Best Practices

1. ✅ **Never commit AWS credentials to git**
   - Add `.aws/` to `.gitignore`
   - Use AWS CLI configuration or environment variables

2. ✅ **Rotate IAM access keys every 90 days**
   - Set calendar reminder
   - Generate new keys, update AWS CLI config, delete old keys

3. ✅ **Use least-privilege IAM policies**
   - Start with Administrator for dev, restrict for production
   - Never use root account credentials

4. ✅ **Enable MFA on AWS root account**
   - Go to IAM → Root user → Enable MFA
   - Use authenticator app (Google Authenticator, Authy)

5. ✅ **Monitor costs daily during development**
   - Check AWS Billing Dashboard
   - Set up billing alarms (see Cost Monitoring section)

6. ✅ **Use different AWS accounts for dev/staging/prod** (Future)
   - Isolates environments
   - Prevents accidental production changes

---

## Cost Summary

**Development Environment** (500 test users, 50 requests/day):
- Lambda: ~$0.50/month (within Free Tier)
- DynamoDB: ~$1.85/month
- S3: ~$0.50/month (50 photos)
- SNS (SMS): ~$5-15/month (verification codes)
- SES: ~$0.10/month (within Free Tier)
- API Gateway: Free (within 1M requests)
- **Total**: ~$8-20/month

**With AWS Activate Credits**: Effectively free for 10-12 months!

---

**Need Help?**
- AWS Support: [https://console.aws.amazon.com/support/](https://console.aws.amazon.com/support/)
- AWS Documentation: [https://docs.aws.amazon.com/](https://docs.aws.amazon.com/)
- AWS CDK Documentation: [https://docs.aws.amazon.com/cdk/](https://docs.aws.amazon.com/cdk/)
- CDK Workshop: [https://cdkworkshop.com/](https://cdkworkshop.com/)
- Infrastructure CDK README: [../infrastructure-cdk/README.md](../../infrastructure-cdk/README.md)
- Project Issues: Ask me (Claude) or create GitHub issue

**Ready to deploy?** See you in the next step! 🚀
