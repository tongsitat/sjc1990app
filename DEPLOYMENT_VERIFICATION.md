# Backend Deployment Verification Checklist

**Environment**: DEV
**API Gateway URL**: https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev
**Date**: 2025-12-26

---

## 1. API Gateway Verification

### Check API Gateway Console
- [ ] Login to AWS Console: https://console.aws.amazon.com/apigateway
- [ ] Navigate to **APIs** → Find `sjc1990app-dev-api`
- [ ] Check **Stages** → Should see `dev` stage
- [ ] Verify **Invoke URL**: Should match `https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev`

### Test Basic Connectivity
```bash
# Test 1: Health check (if available)
curl https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/health

# Test 2: Register endpoint (should return 400 with validation error)
curl -X POST https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"test": "connectivity"}'

# Expected: Should get HTTP 400 or 422 (validation error), NOT 500 or connection refused
```

**Status**: ⏳ Pending verification

---

## 2. Lambda Functions Verification

### Check Lambda Console
- [ ] Login to AWS Console: https://console.aws.amazon.com/lambda
- [ ] Verify **14 Lambda functions** are deployed:

#### Authentication Service (3 functions)
- [ ] `sjc1990app-dev-auth-register` - POST /auth/register
- [ ] `sjc1990app-dev-auth-verify` - POST /auth/verify-sms
- [ ] `sjc1990app-dev-auth-login` - POST /auth/login

#### Users Service (7 functions)
- [ ] `sjc1990app-dev-users-get-profile` - GET /users/me
- [ ] `sjc1990app-dev-users-update-profile` - PUT /users/me
- [ ] `sjc1990app-dev-users-upload-photo` - POST /users/me/photo-upload-url
- [ ] `sjc1990app-dev-users-update-preferences` - PUT /users/me/preferences
- [ ] `sjc1990app-dev-users-list-classrooms` - GET /users/me/classrooms
- [ ] `sjc1990app-dev-users-update-classrooms` - PUT /users/me/classrooms
- [ ] `sjc1990app-dev-users-approve-pending` - POST /admin/users/{userId}/approve

#### Classrooms Service (4 functions)
- [ ] `sjc1990app-dev-classrooms-list` - GET /classrooms
- [ ] `sjc1990app-dev-classrooms-get` - GET /classrooms/{classroomId}
- [ ] `sjc1990app-dev-classrooms-members` - GET /classrooms/{classroomId}/members
- [ ] `sjc1990app-dev-classrooms-posts` - GET /classrooms/{classroomId}/posts

### Test Lambda Function
Pick one function to test (e.g., `sjc1990app-dev-auth-register`):

1. Open function in AWS Console
2. Click **Test** tab
3. Create test event with sample payload:
```json
{
  "body": "{\"phoneNumber\": \"+1234567890\", \"fullName\": \"Test User\"}",
  "headers": {
    "Content-Type": "application/json"
  }
}
```
4. Click **Test**
5. **Expected**: Should execute without crashing (may return validation error, that's OK)

**Status**: ⏳ Pending verification

---

## 3. DynamoDB Tables Verification

### Check DynamoDB Console
- [ ] Login to AWS Console: https://console.aws.amazon.com/dynamodb
- [ ] Navigate to **Tables**
- [ ] Verify **6 tables** exist:

#### Core Tables
- [ ] `sjc1990app-dev-Users`
  - Partition Key: `userId` (String)
  - GSI: `PhoneNumberIndex` (phoneNumber)
  - GSI: `StatusIndex` (status)

- [ ] `sjc1990app-dev-VerificationCodes`
  - Partition Key: `phoneNumber` (String)
  - TTL: `expiresAt`

- [ ] `sjc1990app-dev-Classrooms`
  - Partition Key: `classroomId` (String)
  - GSI: `YearIndex` (year)

- [ ] `sjc1990app-dev-Messages`
  - Partition Key: `conversationId` (String)
  - Sort Key: `timestamp` (Number)

- [ ] `sjc1990app-dev-Forums`
  - Partition Key: `forumId` (String)

- [ ] `sjc1990app-dev-Photos`
  - Partition Key: `photoId` (String)

### Check Table Status
- [ ] All tables should be in **ACTIVE** status
- [ ] Billing mode: **PAY_PER_REQUEST** (on-demand)

**Status**: ⏳ Pending verification

---

## 4. S3 Buckets Verification

### Check S3 Console
- [ ] Login to AWS Console: https://s3.console.aws.amazon.com
- [ ] Verify bucket exists: `sjc1990app-dev-photos-*` (or similar name)
- [ ] Check bucket properties:
  - [ ] Versioning: Enabled
  - [ ] Encryption: AES-256
  - [ ] Public access: Blocked

**Status**: ⏳ Pending verification

---

## 5. IAM Roles & Permissions

### Lambda Execution Roles
- [ ] Check IAM Console: https://console.aws.amazon.com/iam/home#/roles
- [ ] Verify roles exist:
  - [ ] `sjc1990app-dev-auth-lambda-role`
  - [ ] `sjc1990app-dev-users-lambda-role`
  - [ ] `sjc1990app-dev-classrooms-lambda-role`

### Verify Permissions
Each role should have:
- [ ] **DynamoDB**: Read/Write access to relevant tables
- [ ] **S3**: PutObject/GetObject for photos bucket
- [ ] **SNS**: Publish for SMS sending (auth service only)
- [ ] **CloudWatch Logs**: CreateLogGroup, CreateLogStream, PutLogEvents

**Status**: ⏳ Pending verification

---

## 6. AWS SNS (SMS) Verification

### Check SNS Console
- [ ] Login to AWS Console: https://console.aws.amazon.com/sns
- [ ] Region: **us-west-2** (or your deployed region)
- [ ] Check **Text messaging (SMS)** → **Sandbox destinations**
- [ ] If in sandbox: Add your test phone number to verified destinations
- [ ] Test SMS sending:
  ```bash
  aws sns publish \
    --phone-number "+1234567890" \
    --message "SJC1990 Test SMS" \
    --region us-west-2
  ```

**Status**: ⏳ Pending verification

---

## 7. CloudWatch Logs Verification

### Check CloudWatch Console
- [ ] Login to AWS Console: https://console.aws.amazon.com/cloudwatch
- [ ] Navigate to **Logs** → **Log groups**
- [ ] Verify log groups exist:
  - [ ] `/aws/lambda/sjc1990app-dev-auth-register`
  - [ ] `/aws/lambda/sjc1990app-dev-users-get-profile`
  - [ ] `/aws/apigateway/sjc1990app-dev-access-logs`

### Test Logging
1. Trigger a Lambda function (via API Gateway or Test button)
2. Check log group for new log stream
3. Verify logs are being written

**Status**: ⏳ Pending verification

---

## 8. API Endpoint Testing (Manual)

Use **Postman** or **curl** to test each endpoint:

### Test 1: Register User
```bash
curl -X POST https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "fullName": "Test User"
  }'
```
**Expected**:
- HTTP 200: SMS sent successfully
- HTTP 400/422: Validation error (check error message)
- HTTP 500: Server error (check CloudWatch logs)

### Test 2: Verify SMS
```bash
curl -X POST https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/auth/verify-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "code": "123456"
  }'
```
**Expected**: HTTP 200 with JWT token OR HTTP 400 (invalid code)

### Test 3: Login
```bash
curl -X POST https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+1234567890",
    "password": "testpass123"
  }'
```
**Expected**: HTTP 200 with JWT token OR HTTP 401 (invalid credentials)

**Status**: ⏳ Pending verification

---

## 9. Security Verification

### API Gateway Rate Limiting
- [ ] Check API Gateway **Stages** → **dev** → **Settings**
- [ ] Verify throttling:
  - Rate limit: **10 requests/second**
  - Burst limit: **20 requests**
- [ ] These are reduced limits for security (per SECURITY_INCIDENT_2025-12-11.md)

### CORS Configuration
- [ ] Check API Gateway **Resources** → **Actions** → **Enable CORS**
- [ ] Verify CORS headers are configured for mobile app

**Status**: ⏳ Pending verification

---

## 10. Cost Monitoring

### Set Up Billing Alerts
- [ ] AWS Console → **Billing** → **Budgets**
- [ ] Create budget: **$50/month** for dev environment
- [ ] Alert threshold: **80%** ($40)
- [ ] Alert email: Your email

### Current Costs
- [ ] Check **Cost Explorer** for current month spend
- [ ] Expected dev costs: **$20-45/month** (per AWS_COST_ANALYSIS.md)

**Status**: ⏳ Pending verification

---

## Summary Checklist

- [ ] **API Gateway**: Deployed and accessible
- [ ] **14 Lambda Functions**: All deployed and healthy
- [ ] **6 DynamoDB Tables**: All created and active
- [ ] **S3 Bucket**: Created with proper permissions
- [ ] **IAM Roles**: All roles have correct permissions
- [ ] **SNS SMS**: SMS sending configured (sandbox or production)
- [ ] **CloudWatch Logs**: Logging is working
- [ ] **API Endpoints**: At least 3 endpoints tested successfully
- [ ] **Security**: Rate limiting and CORS configured
- [ ] **Cost Monitoring**: Billing alerts set up

---

## Status Report

**Overall Deployment Status**: ⏳ **PENDING VERIFICATION**

**Verified Items**: 0/10

**Blockers**:
- Unable to test API endpoints from dev environment (AWS CLI proxy error)
- Need Product Manager to verify deployment in AWS Console

**Next Steps**:
1. Product Manager verifies deployment in AWS Console
2. Product Manager tests API endpoints with Postman/curl
3. If all healthy → Proceed with mobile app integration testing
4. If issues found → Debug and redeploy

---

## Notes

- This checklist should be completed **before** starting mobile app integration testing
- Any failures should be documented and escalated to `/devops` for resolution
- Once verified, update status from ⏳ to ✅ for each section

**Last Updated**: 2025-12-26
**Updated By**: Project Manager (PM Agent)
