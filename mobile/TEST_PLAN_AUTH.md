# Authentication Flow - Test Plan

**Date**: December 25, 2025
**Sprint**: Day 2 - Authentication Layer
**Assigned to**: /qa-functional
**Status**: 🟡 In Progress

---

## Table of Contents
1. [Test Scope](#test-scope)
2. [Test Environment](#test-environment)
3. [Test Cases - Login Screen](#test-cases---login-screen)
4. [Test Cases - API Integration](#test-cases---api-integration)
5. [Test Cases - State Management](#test-cases---state-management)
6. [Test Cases - Security](#test-cases---security)
7. [Performance Criteria](#performance-criteria)
8. [Known Limitations](#known-limitations)

---

## Test Scope

### In Scope ✅
- Login screen UI/UX
- Form validation
- API service integration
- Authentication state management
- Token storage and retrieval
- Error handling
- Loading states
- Auto-login on app restart

### Out of Scope ❌
- Registration flow (Day 4-6)
- SMS verification (Day 4)
- Backend API testing (separate backend test plan)
- Performance testing (will be done by /qa-performance)

---

## Test Environment

### Prerequisites
- Flutter app installed on device/emulator
- Backend API deployed and accessible
- Test user credentials:
  - Phone: `+852 9123 4567` (or actual test number)
  - Password: `test123` (or actual test password)

### Platforms to Test
- ✅ Android Emulator (API 29+)
- ✅ iOS Simulator (iOS 14+)
- ⏸️ Web (optional for Day 2)

### Build Configuration
- Debug mode
- API_BASE_URL configured in `.env`

---

## Test Cases - Login Screen

### TC-AUTH-001: Login Screen UI Rendering
**Priority**: High
**Type**: Visual

**Steps**:
1. Launch app
2. Verify login screen is displayed

**Expected Result**:
- ✅ SJC1990 logo/icon displayed (People icon)
- ✅ "SJC1990 Classmates" title visible
- ✅ "Welcome back!" subtitle visible
- ✅ Phone number input field with label
- ✅ Password input field with label
- ✅ Password visibility toggle icon
- ✅ Login button enabled
- ✅ "Forgot Password?" link
- ✅ "New User? Register" button
- ✅ Development mode badge at bottom

**Status**: ⏳ Pending

---

### TC-AUTH-002: Phone Number Validation - Empty
**Priority**: High
**Type**: Functional

**Steps**:
1. Launch app
2. Leave phone number field empty
3. Enter valid password: `test123`
4. Tap "Login" button

**Expected Result**:
- ❌ Form validation fails
- ⚠️ Error message: "Please enter your phone number"
- 🚫 Login button remains enabled (no API call made)

**Status**: ⏳ Pending

---

### TC-AUTH-003: Phone Number Validation - Invalid Format
**Priority**: High
**Type**: Functional

**Steps**:
1. Launch app
2. Enter invalid phone: `123` (too short)
3. Enter valid password: `test123`
4. Tap "Login" button

**Expected Result**:
- ❌ Form validation fails
- ⚠️ Error message: "Please enter a valid phone number"

**Status**: ⏳ Pending

---

### TC-AUTH-004: Phone Number Validation - Valid Format
**Priority**: High
**Type**: Functional

**Steps**:
1. Launch app
2. Enter valid phone: `+852 9123 4567`
3. Enter valid password: `test123`
4. Tap "Login" button

**Expected Result**:
- ✅ Form validation passes
- ⏳ Loading indicator appears
- 🌐 API call is made

**Status**: ⏳ Pending

---

### TC-AUTH-005: Password Validation - Empty
**Priority**: High
**Type**: Functional

**Steps**:
1. Launch app
2. Enter valid phone: `+852 9123 4567`
3. Leave password field empty
4. Tap "Login" button

**Expected Result**:
- ❌ Form validation fails
- ⚠️ Error message: "Please enter your password"

**Status**: ⏳ Pending

---

### TC-AUTH-006: Password Validation - Too Short
**Priority**: High
**Type**: Functional

**Steps**:
1. Launch app
2. Enter valid phone: `+852 9123 4567`
3. Enter short password: `12345` (5 characters)
4. Tap "Login" button

**Expected Result**:
- ❌ Form validation fails
- ⚠️ Error message: "Password must be at least 6 characters"

**Status**: ⏳ Pending

---

### TC-AUTH-007: Password Visibility Toggle
**Priority**: Medium
**Type**: Functional

**Steps**:
1. Launch app
2. Enter password: `test123`
3. Verify password is obscured (dots/asterisks)
4. Tap eye icon to show password
5. Verify password is visible
6. Tap eye icon again to hide password

**Expected Result**:
- 👁️ Password toggles between visible and obscured
- 🔄 Icon changes (eye ↔ eye-off)

**Status**: ⏳ Pending

---

### TC-AUTH-008: Loading State During Login
**Priority**: High
**Type**: Functional

**Steps**:
1. Launch app
2. Enter valid credentials
3. Tap "Login" button
4. Observe UI during API call

**Expected Result**:
- ⏳ Login button shows CircularProgressIndicator
- 🚫 Login button disabled during loading
- 🚫 Form fields disabled during loading
- 🚫 Cannot tap button multiple times

**Status**: ⏳ Pending

---

## Test Cases - API Integration

### TC-AUTH-009: Successful Login
**Priority**: Critical
**Type**: Integration

**Precondition**: Backend API is running and accessible

**Steps**:
1. Launch app
2. Enter valid credentials:
   - Phone: `+852 9123 4567`
   - Password: `test123`
3. Tap "Login" button
4. Wait for response

**Expected Result**:
- ✅ Loading indicator appears
- ✅ API call succeeds (200 OK)
- ✅ Success snackbar: "✅ Login successful!"
- ✅ Navigate to Home screen
- ✅ User's name displayed: "Welcome, [Name]!"
- ✅ Logout button visible in app bar

**Status**: ⏳ Pending (requires backend)

---

### TC-AUTH-010: Failed Login - Invalid Credentials
**Priority**: Critical
**Type**: Integration

**Precondition**: Backend API is running

**Steps**:
1. Launch app
2. Enter invalid credentials:
   - Phone: `+852 9999 9999`
   - Password: `wrongpassword`
3. Tap "Login" button
4. Wait for response

**Expected Result**:
- ❌ API call fails (401 Unauthorized)
- ⚠️ Error snackbar displayed with message
- 🔴 Error message in red box on screen
- 📱 User remains on login screen
- 🔄 Form fields re-enabled

**Status**: ⏳ Pending (requires backend)

---

### TC-AUTH-011: Login - Network Error
**Priority**: High
**Type**: Integration

**Precondition**: Simulate no internet connection

**Steps**:
1. Launch app
2. Disable internet connection
3. Enter valid credentials
4. Tap "Login" button

**Expected Result**:
- ❌ API call fails
- ⚠️ Error message: "No internet connection. Please check your network."
- 🔄 Form re-enabled for retry

**Status**: ⏳ Pending

---

### TC-AUTH-012: Login - Timeout
**Priority**: Medium
**Type**: Integration

**Precondition**: Simulate slow network (30+ seconds)

**Steps**:
1. Launch app
2. Enable network throttling to simulate timeout
3. Enter valid credentials
4. Tap "Login" button
5. Wait 30+ seconds

**Expected Result**:
- ⏱️ Request times out after 30 seconds
- ⚠️ Error message: "Connection timeout. Please check your internet connection."

**Status**: ⏳ Pending

---

### TC-AUTH-013: Login - Server Error (500)
**Priority**: Medium
**Type**: Integration

**Precondition**: Backend returns 500 error

**Steps**:
1. Launch app
2. Enter valid credentials
3. Backend configured to return 500
4. Tap "Login" button

**Expected Result**:
- ❌ API call fails
- ⚠️ Error message: "Server error. Please try again later."

**Status**: ⏳ Pending

---

## Test Cases - State Management

### TC-AUTH-014: Auto-Login on App Restart
**Priority**: Critical
**Type**: State Persistence

**Precondition**: User has logged in successfully once

**Steps**:
1. Login successfully (TC-AUTH-009)
2. Close app completely
3. Relaunch app
4. Observe initial screen

**Expected Result**:
- ✅ App shows loading indicator briefly
- ✅ Auto-login succeeds using stored token
- ✅ Home screen displayed immediately
- ✅ User's name shown (from stored user data)
- 🚫 Login screen NOT shown

**Status**: ⏳ Pending

---

### TC-AUTH-015: Logout Functionality
**Priority**: Critical
**Type**: State Management

**Precondition**: User is logged in

**Steps**:
1. Login successfully
2. Navigate to Home screen
3. Tap Logout button (top-right)
4. Observe behavior

**Expected Result**:
- ✅ Tokens cleared from secure storage
- ✅ Auth state reset to unauthenticated
- ✅ Navigated back to Login screen
- ✅ Form fields are empty

**Status**: ⏳ Pending

---

### TC-AUTH-016: Logout Persists After App Restart
**Priority**: High
**Type**: State Persistence

**Precondition**: User has logged out

**Steps**:
1. Login successfully
2. Logout
3. Close app completely
4. Relaunch app

**Expected Result**:
- ✅ Login screen is shown
- 🚫 Auto-login does NOT occur
- ✅ User must login again

**Status**: ⏳ Pending

---

## Test Cases - Security

### TC-AUTH-017: Token Stored Securely
**Priority**: Critical
**Type**: Security

**Precondition**: User logged in

**Steps**:
1. Login successfully
2. Use device inspection tools to check storage

**Expected Result**:
- ✅ Access token stored in flutter_secure_storage (encrypted)
- ✅ Refresh token stored in flutter_secure_storage
- ✅ User data stored in flutter_secure_storage
- 🚫 Tokens NOT in SharedPreferences (unencrypted)
- 🚫 Tokens NOT visible in app logs (redacted)

**Status**: ⏳ Pending

---

### TC-AUTH-018: Password Input Obscured
**Priority**: High
**Type**: Security

**Steps**:
1. Launch app
2. Enter password in password field
3. Observe display

**Expected Result**:
- ✅ Password characters are obscured (dots/asterisks)
- 🚫 Password not visible in plain text by default
- 👁️ Only visible when eye icon tapped

**Status**: ⏳ Pending

---

### TC-AUTH-019: API Token Sent in Headers
**Priority**: Critical
**Type**: Security

**Precondition**: User logged in, network inspector available

**Steps**:
1. Login successfully
2. Inspect network traffic (using proxy or dev tools)
3. Observe API request headers

**Expected Result**:
- ✅ Token sent in `Authorization` header
- ✅ Format: `Bearer <token>`
- 🚫 Token NOT sent in URL query parameters
- 🚫 Token NOT sent in request body

**Status**: ⏳ Pending

---

## Performance Criteria

### Performance Test 1: Login Response Time
**Target**: < 2 seconds from button tap to home screen (on good network)

**Measurement**:
- Start: User taps login button
- End: Home screen fully rendered

**Acceptance**: 95th percentile < 2s

**Status**: ⏳ Pending

---

### Performance Test 2: App Launch Time (Auto-Login)
**Target**: < 3 seconds from app launch to home screen

**Measurement**:
- Start: App icon tapped
- End: Home screen displayed

**Acceptance**: 95th percentile < 3s

**Status**: ⏳ Pending

---

### Performance Test 3: Memory Usage
**Target**: < 100MB RAM during login flow

**Measurement**:
- Monitor memory usage during login

**Acceptance**: No memory leaks

**Status**: ⏳ Pending

---

## Known Limitations

### Day 2 Limitations
1. **Backend API**: Not yet connected - placeholder API URL
   - **Impact**: Integration tests (TC-AUTH-009 to TC-AUTH-013) cannot be fully tested
   - **Workaround**: Can test with mock responses or wait for API URL

2. **Registration Flow**: Not implemented yet
   - **Impact**: Cannot create new test users
   - **Workaround**: Use pre-existing test accounts

3. **Forgot Password**: Placeholder only
   - **Impact**: Cannot test password reset
   - **Workaround**: Manual password reset via backend

4. **User Approval Flow**: Not implemented in UI
   - **Impact**: Cannot test pending approval state UI
   - **Workaround**: Will be tested in Day 6

---

## Test Execution Summary

### Day 2 (Current)
- **Total Test Cases**: 19
- **Executed**: 0
- **Passed**: 0
- **Failed**: 0
- **Blocked**: 5 (waiting for backend API)
- **Pending**: 14

### Coverage
- **UI Components**: 8/8 test cases
- **Form Validation**: 5/5 test cases
- **API Integration**: 5/5 test cases (blocked)
- **State Management**: 3/3 test cases
- **Security**: 3/3 test cases

---

## Test Execution Log

### Day 2 - December 25, 2025

| TC ID | Test Case | Status | Tester | Notes |
|-------|-----------|--------|--------|-------|
| TC-AUTH-001 | Login UI Rendering | ⏳ Pending | - | - |
| TC-AUTH-002 | Phone Validation - Empty | ⏳ Pending | - | - |
| TC-AUTH-003 | Phone Validation - Invalid | ⏳ Pending | - | - |
| TC-AUTH-004 | Phone Validation - Valid | ⏳ Pending | - | - |
| TC-AUTH-005 | Password Validation - Empty | ⏳ Pending | - | - |
| TC-AUTH-006 | Password Validation - Short | ⏳ Pending | - | - |
| TC-AUTH-007 | Password Visibility Toggle | ⏳ Pending | - | - |
| TC-AUTH-008 | Loading State | ⏳ Pending | - | - |
| TC-AUTH-009 | Successful Login | 🚫 Blocked | - | Needs backend API |
| TC-AUTH-010 | Failed Login | 🚫 Blocked | - | Needs backend API |
| TC-AUTH-011 | Network Error | 🚫 Blocked | - | Needs backend API |
| TC-AUTH-012 | Timeout | 🚫 Blocked | - | Needs backend API |
| TC-AUTH-013 | Server Error | 🚫 Blocked | - | Needs backend API |
| TC-AUTH-014 | Auto-Login | ⏳ Pending | - | Needs successful login first |
| TC-AUTH-015 | Logout | ⏳ Pending | - | - |
| TC-AUTH-016 | Logout Persistence | ⏳ Pending | - | - |
| TC-AUTH-017 | Token Security | ⏳ Pending | - | - |
| TC-AUTH-018 | Password Obscured | ⏳ Pending | - | - |
| TC-AUTH-019 | API Token Headers | 🚫 Blocked | - | Needs backend API |

---

## Next Steps for QA

### Immediate Actions (Can Test Now)
1. ✅ Test all UI rendering (TC-AUTH-001)
2. ✅ Test all form validation (TC-AUTH-002 to TC-AUTH-007)
3. ✅ Test loading states (TC-AUTH-008)
4. ✅ Test password visibility toggle (TC-AUTH-007)
5. ✅ Test logout UI (TC-AUTH-015) - can test with mock logged-in state

### Blocked (Waiting for Backend)
1. 🚫 All API integration tests (TC-AUTH-009 to TC-AUTH-013)
2. 🚫 Auto-login tests (TC-AUTH-014)
3. 🚫 Token security validation (TC-AUTH-019)

### Action Required
- **Get Backend API URL**: Update `.env` file with actual API Gateway URL
- **Get Test Credentials**: Obtain valid test user credentials
- **Set Up Network Tools**: Charles Proxy or similar for network inspection

---

## Bug Report Template

```markdown
**Bug ID**: BUG-AUTH-XXX
**Severity**: Critical / High / Medium / Low
**Priority**: P0 / P1 / P2 / P3
**Test Case**: TC-AUTH-XXX
**Platform**: Android / iOS / Web
**OS Version**: [version]
**App Build**: Day 2 - Auth Layer

**Steps to Reproduce**:
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots/Videos**:
[Attach screenshots or screen recordings]

**Logs**:
[Paste relevant console logs]

**Impact**:
[How does this affect users?]

**Workaround**:
[Any temporary workaround?]
```

---

**Document Version**: 1.0
**Last Updated**: December 25, 2025
**Next Review**: December 26, 2025 (after backend integration)
