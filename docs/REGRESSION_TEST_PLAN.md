# Regression Test Plan - Lambda Consolidation (ADR-012)

**Version**: 1.0
**Date**: 2025-12-04
**Tester**: QA Functional Team
**Scope**: Verify all 14 endpoints work correctly after consolidation to 3 Lambda services

---

## Overview

This test plan validates that the Lambda consolidation (14 functions → 3 services) maintains 100% functional compatibility with the original architecture. All 14 API endpoints must continue to work exactly as before.

**Architecture Changes**:
- **Before**: 14 separate Lambda functions (one per endpoint)
- **After**: 3 consolidated Lambda services (auth-service, users-service, classrooms-service)
- **Routing**: API Gateway routes to 3 services, each service uses internal switch/case routing

---

## Test Environment

**Environment**: Dev (`sjc1990app-dev`)
**Region**: us-west-2
**API Gateway URL**: [Deployed after CDK deployment]
**Test Data**: Use test phone numbers (+1555...) and test user accounts

---

## Prerequisites

- [ ] CDK deployment completed successfully (all 5 stacks)
- [ ] JWT secret configured in Secrets Manager
- [ ] Test phone numbers configured (for SMS testing)
- [ ] API Gateway URL obtained from CloudFormation outputs
- [ ] Test user accounts created (or use registration flow)

---

## Test Cases

### 1. Authentication Endpoints (auth-service)

#### 1.1 POST /auth/register

**Purpose**: Register new user with phone number
**Lambda**: `sjc1990app-dev-auth-service`
**Expected Behavior**: Send SMS verification code, store in DynamoDB

**Test Steps**:
1. Send POST request to `/auth/register`
   ```json
   {
     "phoneNumber": "+15551234567",
     "name": "Test User"
   }
   ```
2. Verify response:
   ```json
   {
     "message": "Verification code sent",
     "expiresIn": 300
   }
   ```
3. Verify DynamoDB VerificationCodes table has entry
4. Verify SMS received (if real number) or check CloudWatch logs

**Pass Criteria**:
- ✅ Status code: 200
- ✅ SMS code stored in DynamoDB with 5-minute TTL
- ✅ SMS sent (check logs if using test number)

---

#### 1.2 POST /auth/verify

**Purpose**: Verify SMS code and create user account (pending approval)
**Lambda**: `sjc1990app-dev-auth-service`
**Expected Behavior**: Create user in pending status, return JWT token

**Test Steps**:
1. Use phone number and code from test 1.1
2. Send POST request to `/auth/verify`
   ```json
   {
     "phoneNumber": "+15551234567",
     "code": "123456"
   }
   ```
3. Verify response includes:
   - `userId` (UUID)
   - `status: "pending_approval"`
   - `token` (JWT)
   - `expiresAt` (timestamp)
4. Verify Users table has user with `status: "pending_approval"`
5. Verify PendingApprovals table has entry

**Pass Criteria**:
- ✅ Status code: 200
- ✅ JWT token is valid (can decode with jwt.io)
- ✅ User created in DynamoDB with pending_approval status
- ✅ Approval record created in PendingApprovals table

---

#### 1.3 GET /auth/pending-approvals

**Purpose**: List all users pending approval (admin only)
**Lambda**: `sjc1990app-dev-auth-service`
**Expected Behavior**: Return list of users awaiting approval

**Test Steps**:
1. Create admin user token (or use existing admin)
2. Send GET request to `/auth/pending-approvals`
   - Header: `Authorization: Bearer <admin-token>`
3. Verify response contains array of pending users:
   ```json
   {
     "pendingApprovals": [
       {
         "userId": "...",
         "phoneNumber": "+15551234567",
         "name": "Test User",
         "createdAt": 1234567890
       }
     ]
   }
   ```

**Pass Criteria**:
- ✅ Status code: 200
- ✅ Returns users with pending_approval status
- ✅ Unauthorized without admin token (401)

---

#### 1.4 POST /auth/approve/{userId}

**Purpose**: Approve user registration (admin only)
**Lambda**: `sjc1990app-dev-auth-service`
**Expected Behavior**: Activate user account, send SMS notification

**Test Steps**:
1. Get userId from pending approval list
2. Send POST request to `/auth/approve/{userId}`
   - Header: `Authorization: Bearer <admin-token>`
3. Verify response:
   ```json
   {
     "message": "User approved successfully",
     "userId": "..."
   }
   ```
4. Verify user status changed to `active` in DynamoDB
5. Verify approval SMS sent
6. Verify PendingApprovals record removed

**Pass Criteria**:
- ✅ Status code: 200
- ✅ User status changed to "active"
- ✅ SMS notification sent
- ✅ PendingApprovals record deleted

---

#### 1.5 POST /auth/reject/{userId}

**Purpose**: Reject user registration (admin only)
**Lambda**: `sjc1990app-dev-auth-service`
**Expected Behavior**: Mark user as rejected, send SMS notification

**Test Steps**:
1. Register another test user (get userId)
2. Send POST request to `/auth/reject/{userId}`
   - Header: `Authorization: Bearer <admin-token>`
   - Body (optional):
     ```json
     {
       "reason": "Test rejection"
     }
     ```
3. Verify response
4. Verify user status changed to `rejected`
5. Verify rejection SMS sent

**Pass Criteria**:
- ✅ Status code: 200
- ✅ User status changed to "rejected"
- ✅ SMS notification sent
- ✅ PendingApprovals record deleted

---

### 2. User Management Endpoints (users-service)

#### 2.1 PUT /users/{userId}/profile

**Purpose**: Update user profile (name, bio)
**Lambda**: `sjc1990app-dev-users-service`
**Expected Behavior**: Update user profile fields

**Test Steps**:
1. Get active user token
2. Send PUT request to `/users/{userId}/profile`
   - Header: `Authorization: Bearer <token>`
   - Body:
     ```json
     {
       "name": "Updated Name",
       "bio": "This is my bio"
     }
     ```
3. Verify response includes updated fields
4. Verify DynamoDB Users table updated

**Pass Criteria**:
- ✅ Status code: 200
- ✅ Profile updated in DynamoDB
- ✅ Cannot update other user's profile (403)

---

#### 2.2 POST /users/{userId}/profile-photo

**Purpose**: Generate S3 pre-signed URL for photo upload
**Lambda**: `sjc1990app-dev-users-service`
**Expected Behavior**: Return pre-signed URL for upload

**Test Steps**:
1. Send POST request to `/users/{userId}/profile-photo`
   - Header: `Authorization: Bearer <token>`
   - Body:
     ```json
     {
       "fileType": "image/jpeg"
     }
     ```
2. Verify response includes:
   - `uploadUrl` (S3 pre-signed URL)
   - `photoKey` (S3 object key)
   - `expiresIn` (300 seconds)
3. Test uploading a file to the URL (using curl or Postman)

**Pass Criteria**:
- ✅ Status code: 200
- ✅ Pre-signed URL is valid
- ✅ Can upload image to S3 using the URL
- ✅ URL expires after 5 minutes

---

#### 2.3 PUT /users/{userId}/profile-photo-complete

**Purpose**: Mark photo upload as complete
**Lambda**: `sjc1990app-dev-users-service`
**Expected Behavior**: Verify S3 upload and update user record

**Test Steps**:
1. Use photoKey from test 2.2
2. Send PUT request to `/users/{userId}/profile-photo-complete`
   - Header: `Authorization: Bearer <token>`
   - Body:
     ```json
     {
       "photoKey": "..."
     }
     ```
3. Verify user.profilePhotoUrl updated in DynamoDB
4. Verify photo accessible via CloudFront CDN

**Pass Criteria**:
- ✅ Status code: 200
- ✅ User profilePhotoUrl updated
- ✅ Photo accessible via CDN URL

---

#### 2.4 GET /users/{userId}/preferences

**Purpose**: Get user communication preferences
**Lambda**: `sjc1990app-dev-users-service`
**Expected Behavior**: Return user preferences with caching

**Test Steps**:
1. Send GET request to `/users/{userId}/preferences`
   - Header: `Authorization: Bearer <token>`
2. Verify response:
   ```json
   {
     "userId": "...",
     "emailNotifications": true,
     "smsNotifications": true,
     "appNotifications": true
   }
   ```
3. Verify API Gateway cache hit on second request (check CloudWatch logs)

**Pass Criteria**:
- ✅ Status code: 200
- ✅ Returns user preferences
- ✅ Cached on subsequent requests (5-minute TTL)

---

#### 2.5 PUT /users/{userId}/preferences

**Purpose**: Update user communication preferences
**Lambda**: `sjc1990app-dev-users-service`
**Expected Behavior**: Update preferences and invalidate cache

**Test Steps**:
1. Send PUT request to `/users/{userId}/preferences`
   - Header: `Authorization: Bearer <token>`
   - Body:
     ```json
     {
       "emailNotifications": false,
       "smsNotifications": true
     }
     ```
2. Verify response with updated preferences
3. Verify UserPreferences table updated
4. Verify cache invalidated (GET request returns new values)

**Pass Criteria**:
- ✅ Status code: 200
- ✅ Preferences updated in DynamoDB
- ✅ Cache invalidated

---

### 3. Classroom Endpoints (classrooms-service)

#### 3.1 GET /classrooms

**Purpose**: List all classrooms (filtered by year)
**Lambda**: `sjc1990app-dev-classrooms-service`
**Expected Behavior**: Return list of classrooms with caching

**Test Steps**:
1. Send GET request to `/classrooms?year=1990`
   - Header: `Authorization: Bearer <token>`
2. Verify response:
   ```json
   {
     "classrooms": [
       {
         "classroomId": "...",
         "year": 1990,
         "className": "6A",
         "teacherName": "Mrs. Smith"
       }
     ]
   }
   ```
3. Test without year param (returns all)
4. Verify API Gateway cache hit on second request

**Pass Criteria**:
- ✅ Status code: 200
- ✅ Returns classrooms filtered by year
- ✅ Cached on subsequent requests

---

#### 3.2 POST /users/{userId}/classrooms

**Purpose**: Assign multiple classrooms to user
**Lambda**: `sjc1990app-dev-classrooms-service`
**Expected Behavior**: Create UserClassrooms records

**Test Steps**:
1. Send POST request to `/users/{userId}/classrooms`
   - Header: `Authorization: Bearer <token>`
   - Body:
     ```json
     {
       "classroomIds": ["classroom-1", "classroom-2"]
     }
     ```
2. Verify response confirms assignments
3. Verify UserClassrooms table has entries

**Pass Criteria**:
- ✅ Status code: 200
- ✅ UserClassrooms records created
- ✅ Cannot assign to other users (403)

---

#### 3.3 GET /users/{userId}/classrooms

**Purpose**: Get user's classroom history
**Lambda**: `sjc1990app-dev-classrooms-service`
**Expected Behavior**: Return user's classrooms with caching

**Test Steps**:
1. Send GET request to `/users/{userId}/classrooms`
   - Header: `Authorization: Bearer <token>`
2. Verify response includes assigned classrooms
3. Verify cache hit on second request

**Pass Criteria**:
- ✅ Status code: 200
- ✅ Returns user's classrooms
- ✅ Cached on subsequent requests

---

#### 3.4 GET /classrooms/{classroomId}/members

**Purpose**: Get all members of a classroom
**Lambda**: `sjc1990app-dev-classrooms-service`
**Expected Behavior**: Return list of users in classroom with caching

**Test Steps**:
1. Send GET request to `/classrooms/{classroomId}/members`
   - Header: `Authorization: Bearer <token>`
2. Verify response:
   ```json
   {
     "classroomId": "...",
     "members": [
       {
         "userId": "...",
         "name": "...",
         "profilePhotoUrl": "..."
       }
     ]
   }
   ```
3. Verify cache hit on second request

**Pass Criteria**:
- ✅ Status code: 200
- ✅ Returns classroom members
- ✅ Cached on subsequent requests

---

## Error Handling Tests

Test that error handling still works correctly:

1. **401 Unauthorized**: Try endpoints without Authorization header
2. **403 Forbidden**: Try to access other users' resources
3. **404 Not Found**: Try non-existent routes
4. **400 Bad Request**: Send invalid JSON or missing required fields
5. **500 Internal Server Error**: Verify proper error responses (check CloudWatch logs)

---

## Performance Tests

1. **Cold Start**: First invocation of each service (should be < 2 seconds)
2. **Warm Response**: Subsequent invocations (should be < 300ms)
3. **Cache Hit Rate**: GET endpoints should show cache hits in CloudWatch
4. **Concurrent Requests**: Test 10 concurrent requests to each endpoint

---

## Rollback Criteria

If any of the following occur, ROLLBACK to previous 14-function architecture:

- ❌ Any endpoint returns incorrect data
- ❌ More than 2 endpoints fail tests
- ❌ Cold start > 5 seconds
- ❌ Error rate > 5% during testing
- ❌ API Gateway cache not working

---

## Test Execution Checklist

- [ ] All 14 endpoints tested individually
- [ ] Error handling validated
- [ ] Performance metrics within acceptable range
- [ ] API Gateway caching verified
- [ ] CloudWatch alarms configured and working
- [ ] CloudFront CDN serving photos correctly
- [ ] No regressions from previous behavior
- [ ] All tests documented with screenshots/logs

---

## Sign-off

**QA Lead**: ________________  Date: ______
**Product Manager**: ________________  Date: ______
**DevOps**: ________________  Date: ______

---

## Appendix A: Test Data

```json
{
  "testUsers": [
    {
      "phoneNumber": "+15551111111",
      "name": "Test User 1",
      "role": "user"
    },
    {
      "phoneNumber": "+15552222222",
      "name": "Admin User",
      "role": "admin"
    }
  ],
  "testClassrooms": [
    {
      "year": 1990,
      "className": "6A",
      "teacherName": "Mrs. Smith"
    }
  ]
}
```

## Appendix B: CloudWatch Metrics to Monitor

- Lambda Invocations (all 3 functions)
- Lambda Errors (should be 0)
- Lambda Duration (p50, p95, p99)
- API Gateway 4XX errors
- API Gateway 5XX errors
- API Gateway Latency
- API Gateway Cache Hit Count
