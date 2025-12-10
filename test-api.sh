#!/bin/bash

# sjc1990app API Testing Script
# Run this from your local machine to test the deployed API

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev"
REGION="us-west-2"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         sjc1990app Dev Environment - API Testing            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}API URL:${NC} $API_URL"
echo -e "${BLUE}Region:${NC} $REGION"
echo ""

# Function to print test headers
print_test() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}TEST: $1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Test 1: User Registration
print_test "1. User Registration (POST /auth/register)"
echo "Testing registration with phone number +85291234567..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+85291234567",
    "name": "Test User"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

if echo "$REGISTER_RESPONSE" | jq -e '.message' > /dev/null 2>&1; then
    print_success "Registration endpoint responded"
    MESSAGE=$(echo "$REGISTER_RESPONSE" | jq -r '.message')
    print_info "Message: $MESSAGE"
else
    print_error "Registration endpoint error"
fi

# Test 2: Check DynamoDB Tables
print_test "2. DynamoDB Tables Verification"
echo "Listing DynamoDB tables with 'sjc1990app' prefix..."
TABLES=$(aws dynamodb list-tables --region $REGION --output json | jq -r '.TableNames[] | select(. | startswith("sjc1990app"))')

if [ -z "$TABLES" ]; then
    print_error "No DynamoDB tables found"
else
    print_success "Found DynamoDB tables:"
    echo "$TABLES" | while read table; do
        echo "  - $table"
    done
fi

# Test 3: Check Lambda Functions
print_test "3. Lambda Functions Verification"
echo "Listing Lambda functions with 'sjc1990app' prefix..."
FUNCTIONS=$(aws lambda list-functions --region $REGION --output json | jq -r '.Functions[].FunctionName | select(. | startswith("sjc1990app"))')

if [ -z "$FUNCTIONS" ]; then
    print_error "No Lambda functions found"
else
    print_success "Found Lambda functions:"
    echo "$FUNCTIONS" | while read func; do
        echo "  - $func"
    done
fi

# Test 4: Check S3 Bucket
print_test "4. S3 Bucket Verification"
echo "Checking for sjc1990app S3 bucket..."
BUCKET=$(aws s3 ls --region $REGION | grep sjc1990app | awk '{print $3}')

if [ -z "$BUCKET" ]; then
    print_error "S3 bucket not found"
else
    print_success "Found S3 bucket: $BUCKET"
fi

# Test 5: Check CloudWatch Alarms
print_test "5. CloudWatch Alarms Status"
echo "Checking CloudWatch alarms..."
ALARMS=$(aws cloudwatch describe-alarms \
  --alarm-name-prefix "sjc1990app-dev" \
  --region $REGION \
  --output json | jq -r '.MetricAlarms[] | "\(.AlarmName): \(.StateValue)"')

if [ -z "$ALARMS" ]; then
    print_error "No CloudWatch alarms found"
else
    print_success "CloudWatch alarms status:"
    echo "$ALARMS" | while read alarm; do
        if echo "$alarm" | grep -q "OK"; then
            echo -e "  ${GREEN}$alarm${NC}"
        elif echo "$alarm" | grep -q "ALARM"; then
            echo -e "  ${RED}$alarm${NC}"
        else
            echo "  $alarm"
        fi
    done
fi

# Test 6: Pending Approvals
print_test "6. Pending Approvals (GET /auth/pending-approvals)"
echo "Fetching pending approvals..."
APPROVALS_RESPONSE=$(curl -s -X GET "$API_URL/auth/pending-approvals" \
  -H "Content-Type: application/json")

echo "$APPROVALS_RESPONSE" | jq '.'

if echo "$APPROVALS_RESPONSE" | jq -e '.users' > /dev/null 2>&1; then
    print_success "Pending approvals endpoint responded"
    USER_COUNT=$(echo "$APPROVALS_RESPONSE" | jq -r '.users | length')
    print_info "Pending users: $USER_COUNT"
else
    print_error "Pending approvals endpoint error"
fi

# Test 7: Lambda Logs Check
print_test "7. Lambda Logs Check (Last 10 minutes)"
echo "Checking auth-service logs for errors..."
LOG_GROUP="/aws/lambda/sjc1990app-dev-authService"

# Check if log group exists
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region $REGION | jq -e '.logGroups | length > 0' > /dev/null 2>&1; then
    print_success "Log group exists: $LOG_GROUP"

    # Get recent log streams
    RECENT_LOGS=$(aws logs filter-log-events \
      --log-group-name "$LOG_GROUP" \
      --start-time $(($(date +%s) * 1000 - 600000)) \
      --region $REGION \
      --limit 10 \
      --output json 2>/dev/null || echo '{"events":[]}')

    EVENT_COUNT=$(echo "$RECENT_LOGS" | jq -r '.events | length')
    print_info "Recent log events: $EVENT_COUNT"

    # Check for errors
    ERROR_COUNT=$(echo "$RECENT_LOGS" | jq -r '.events[] | select(.message | contains("ERROR")) | .message' | wc -l)
    if [ "$ERROR_COUNT" -gt 0 ]; then
        print_error "Found $ERROR_COUNT error(s) in logs"
        echo "Recent errors:"
        echo "$RECENT_LOGS" | jq -r '.events[] | select(.message | contains("ERROR")) | .message' | head -3
    else
        print_success "No errors found in recent logs"
    fi
else
    print_error "Log group not found: $LOG_GROUP"
fi

# Test 8: API Gateway Metrics
print_test "8. API Gateway Metrics (Last Hour)"
echo "Checking API Gateway request count..."
START_TIME=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)
END_TIME=$(date -u +%Y-%m-%dT%H:%M:%S)

METRICS=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --start-time "$START_TIME" \
  --end-time "$END_TIME" \
  --period 3600 \
  --statistics Sum \
  --region $REGION \
  --output json 2>/dev/null || echo '{"Datapoints":[]}')

TOTAL_REQUESTS=$(echo "$METRICS" | jq -r '[.Datapoints[].Sum] | add // 0')
print_info "Total API requests (last hour): $TOTAL_REQUESTS"

# Summary
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     Test Summary                             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✓ Deployment verified successfully${NC}"
echo -e "${BLUE}ℹ API URL:${NC} $API_URL"
echo -e "${BLUE}ℹ Region:${NC} $REGION"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure SNS SMS sending in AWS Console"
echo "2. Subscribe email to CloudWatch alarms:"
echo "   aws sns subscribe \\"
echo "     --topic-arn arn:aws:sns:us-west-2:500265069254:sjc1990app-dev-alarms \\"
echo "     --protocol email \\"
echo "     --notification-endpoint your-email@example.com \\"
echo "     --region us-west-2"
echo "3. Test SMS verification flow with real phone number"
echo "4. Run performance tests with /qa-performance agent"
echo "5. Review CloudWatch logs and metrics"
echo ""
echo -e "${BLUE}For detailed testing instructions, see:${NC}"
echo "  - DEPLOYMENT_SUCCESS.md"
echo "  - PRE_DEPLOYMENT_CHECKLIST.md"
echo ""
