#!/bin/bash

# Pre-Deployment Checklist Verification Script
# Checks all items in PRE_DEPLOYMENT_CHECKLIST.md

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REGION="us-west-2"
PASSED=0
FAILED=0

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     sjc1990app Pre-Deployment Checklist Verification        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_section() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    PASSED=$((PASSED + 1))
}

check_fail() {
    echo -e "${RED}✗ $1${NC}"
    FAILED=$((FAILED + 1))
}

check_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Section 1: AWS Account & IAM
print_section "1. AWS Account & IAM"

echo "Testing AWS credentials..."
CALLER_IDENTITY=$(aws sts get-caller-identity --output json 2>/dev/null || echo "")

if [ -n "$CALLER_IDENTITY" ]; then
    ACCOUNT_ID=$(echo "$CALLER_IDENTITY" | jq -r '.Account')
    USER_ARN=$(echo "$CALLER_IDENTITY" | jq -r '.Arn')
    USER_ID=$(echo "$CALLER_IDENTITY" | jq -r '.UserId')

    check_pass "AWS credentials are valid"
    check_info "Account ID: $ACCOUNT_ID"
    check_info "User ARN: $USER_ARN"

    # Check if using root account (bad practice)
    if echo "$USER_ARN" | grep -q ":root"; then
        check_fail "Using root account (should use IAM user)"
    else
        check_pass "Using IAM user (not root)"
    fi
else
    check_fail "AWS credentials not configured or invalid"
    echo "Run: aws configure"
fi

# Section 2: AWS CLI
print_section "2. AWS CLI Configuration"

AWS_VERSION=$(aws --version 2>&1 | awk '{print $1}' || echo "not installed")
if echo "$AWS_VERSION" | grep -q "aws-cli/2"; then
    check_pass "AWS CLI v2 installed: $AWS_VERSION"
else
    check_fail "AWS CLI v2 not found. Current: $AWS_VERSION"
fi

AWS_REGION=$(aws configure get region || echo "not set")
if [ "$AWS_REGION" = "$REGION" ]; then
    check_pass "Region configured: $AWS_REGION"
else
    check_fail "Region not set to $REGION (currently: $AWS_REGION)"
    check_info "Run: aws configure set region $REGION"
fi

# Section 3: AWS CDK
print_section "3. AWS CDK Setup"

CDK_VERSION=$(cdk --version 2>&1 || echo "not installed")
if echo "$CDK_VERSION" | grep -q "2\."; then
    check_pass "CDK v2 installed: $CDK_VERSION"
else
    check_fail "CDK v2 not found. Current: $CDK_VERSION"
fi

# Check if CDK is bootstrapped
echo "Checking CDK bootstrap status..."
BOOTSTRAP_STACK=$(aws cloudformation describe-stacks \
    --stack-name CDKToolkit \
    --region $REGION \
    --query 'Stacks[0].StackStatus' \
    --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$BOOTSTRAP_STACK" != "NOT_FOUND" ]; then
    check_pass "CDK bootstrapped in $REGION"
else
    check_fail "CDK not bootstrapped"
    check_info "Run: cdk bootstrap aws://$ACCOUNT_ID/$REGION"
fi

# Check TypeScript compilation
echo "Checking TypeScript builds..."

cd ~/dev/sjc1990app/backend 2>/dev/null || cd /home/user/sjc1990app/backend
if npm run build > /dev/null 2>&1; then
    check_pass "Backend TypeScript builds successfully"
else
    check_fail "Backend TypeScript build errors"
fi

cd ~/dev/sjc1990app/infrastructure-cdk 2>/dev/null || cd /home/user/sjc1990app/infrastructure-cdk
if npm run build > /dev/null 2>&1; then
    check_pass "CDK TypeScript builds successfully"
else
    check_fail "CDK TypeScript build errors"
fi

# Section 4: AWS Services
print_section "4. AWS Services"

# SNS SMS
echo "Testing SNS SMS capability..."
SNS_SMS_TEST=$(aws sns get-sms-attributes --region $REGION 2>/dev/null || echo "")
if [ -n "$SNS_SMS_TEST" ]; then
    check_pass "SNS SMS is accessible"

    MONTHLY_SPEND=$(echo "$SNS_SMS_TEST" | jq -r '.attributes.MonthlySpendLimit // "not set"')
    check_info "SMS Spend Limit: \$$MONTHLY_SPEND"

    if [ "$MONTHLY_SPEND" = "not set" ] || [ "$MONTHLY_SPEND" = "1.00" ]; then
        check_fail "SMS spend limit not configured (default: \$1)"
        check_info "Configure in SNS Console: https://console.aws.amazon.com/sns"
    else
        check_pass "SMS spend limit configured: \$$MONTHLY_SPEND"
    fi
else
    check_fail "Cannot access SNS SMS attributes"
fi

# SES Email
echo "Checking SES verified emails..."
# Use SES v2 API (new console uses this)
SES_EMAILS=$(aws sesv2 list-email-identities --region $REGION --output json 2>/dev/null || echo '{"EmailIdentities":[]}')
EMAIL_COUNT=$(echo "$SES_EMAILS" | jq '.EmailIdentities | length')

if [ "$EMAIL_COUNT" -gt 0 ]; then
    check_pass "SES has $EMAIL_COUNT verified email(s)"
    echo "$SES_EMAILS" | jq -r '.EmailIdentities[].IdentityName' | while read email; do
        check_info "  - $email"
    done
else
    check_fail "No verified emails in SES"
    check_info "Verify email in SES Console: https://console.aws.amazon.com/ses"
fi

# Section 5: Secrets Management
print_section "5. Secrets Management"

echo "Checking JWT secret in Secrets Manager..."
JWT_SECRET=$(aws secretsmanager describe-secret \
    --secret-id "sjc1990app/dev/jwt-secret" \
    --region $REGION \
    --output json 2>/dev/null || echo "")

if [ -n "$JWT_SECRET" ]; then
    SECRET_NAME=$(echo "$JWT_SECRET" | jq -r '.Name')
    SECRET_ARN=$(echo "$JWT_SECRET" | jq -r '.ARN')
    check_pass "JWT secret exists: $SECRET_NAME"
    check_info "ARN: $SECRET_ARN"
else
    check_fail "JWT secret not found in Secrets Manager"
    check_info "Create with: aws secretsmanager create-secret ..."
fi

# Section 6: Cost Monitoring
print_section "6. Cost Monitoring"

echo "Checking CloudWatch billing alarms..."
BILLING_ALARMS=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "sjc1990app" \
    --region us-east-1 \
    --output json 2>/dev/null || echo '{"MetricAlarms":[]}')

ALARM_COUNT=$(echo "$BILLING_ALARMS" | jq '[.MetricAlarms[] | select(.Namespace == "AWS/Billing")] | length')

if [ "$ALARM_COUNT" -gt 0 ]; then
    check_pass "Billing alarms configured ($ALARM_COUNT alarms)"
else
    check_fail "No billing alarms found"
    check_info "Set up in CloudWatch Console (us-east-1 region)"
fi

# Section 7: Deployed Resources
print_section "7. Deployed Resources"

echo "Checking deployed stacks..."

# DynamoDB Tables
TABLES=$(aws dynamodb list-tables --region $REGION --output json | jq -r '.TableNames[] | select(startswith("sjc1990app"))' | wc -l)
if [ "$TABLES" -eq 6 ]; then
    check_pass "All 6 DynamoDB tables deployed"
elif [ "$TABLES" -gt 0 ]; then
    check_fail "Only $TABLES/6 DynamoDB tables deployed"
else
    check_fail "No DynamoDB tables deployed"
fi

# Lambda Functions
FUNCTIONS=$(aws lambda list-functions --region $REGION --output json | jq -r '.Functions[].FunctionName | select(startswith("sjc1990app"))' | wc -l)
if [ "$FUNCTIONS" -ge 3 ]; then
    check_pass "Lambda functions deployed ($FUNCTIONS functions)"
elif [ "$FUNCTIONS" -gt 0 ]; then
    check_fail "Only $FUNCTIONS Lambda functions deployed"
else
    check_fail "No Lambda functions deployed"
fi

# S3 Bucket
BUCKETS=$(aws s3 ls --region $REGION | grep sjc1990app | wc -l)
if [ "$BUCKETS" -ge 1 ]; then
    check_pass "S3 bucket(s) deployed ($BUCKETS buckets)"
else
    check_fail "No S3 buckets deployed"
fi

# API Gateway
APIS=$(aws apigateway get-rest-apis --region $REGION --output json 2>/dev/null | jq -r '.items[] | select(.name | startswith("sjc1990app")) | .name' | wc -l)
if [ "$APIS" -ge 1 ]; then
    check_pass "API Gateway deployed"
else
    check_fail "No API Gateway found"
fi

# CloudWatch Alarms
ALARMS=$(aws cloudwatch describe-alarms \
    --alarm-name-prefix "sjc1990app-dev" \
    --region $REGION \
    --output json | jq '.MetricAlarms | length')

if [ "$ALARMS" -gt 0 ]; then
    check_pass "CloudWatch alarms configured ($ALARMS alarms)"
else
    check_fail "No CloudWatch alarms found"
fi

# Section 8: Summary
print_section "SUMMARY"

TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))

echo ""
echo -e "${GREEN}✓ Passed: $PASSED${NC}"
echo -e "${RED}✗ Failed: $FAILED${NC}"
echo -e "${BLUE}Total:   $TOTAL${NC}"
echo ""

if [ "$PERCENTAGE" -ge 90 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ READY FOR PRODUCTION DEPLOYMENT ($PERCENTAGE% complete)         ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
elif [ "$PERCENTAGE" -ge 70 ]; then
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║  ⚠ MOSTLY READY - Address failures above ($PERCENTAGE% complete)    ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
else
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ NOT READY - Complete setup steps ($PERCENTAGE% complete)         ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
fi

echo ""
echo "For detailed setup instructions, see:"
echo "  - PRE_DEPLOYMENT_CHECKLIST.md"
echo "  - docs/guides/AWS_SETUP.md"
echo ""
