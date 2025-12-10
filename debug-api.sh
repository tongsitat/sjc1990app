#!/bin/bash

# sjc1990app API Debugging Script
# Run this to investigate the pending approvals error

set -e

REGION="us-west-2"
API_URL="https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev"

echo "=========================================="
echo "Issue 1: Pending Approvals Error"
echo "=========================================="
echo ""

echo "Step 1: Check actual Lambda log group names"
echo "-------------------------------------------"
aws logs describe-log-groups \
  --log-group-name-prefix "/aws/lambda/sjc1990app-dev" \
  --region $REGION \
  --query 'logGroups[*].logGroupName' \
  --output table

echo ""
echo "Step 2: Check auth-service logs (correct name)"
echo "----------------------------------------------"
LOG_GROUP="/aws/lambda/sjc1990app-dev-auth-service"
echo "Checking log group: $LOG_GROUP"

# Get the latest log stream
LATEST_STREAM=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --region $REGION \
  --query 'logStreams[0].logStreamName' \
  --output text 2>/dev/null || echo "")

if [ -n "$LATEST_STREAM" ]; then
    echo "Latest log stream: $LATEST_STREAM"
    echo ""
    echo "Last 20 log events:"
    aws logs get-log-events \
      --log-group-name "$LOG_GROUP" \
      --log-stream-name "$LATEST_STREAM" \
      --limit 20 \
      --region $REGION \
      --query 'events[*].message' \
      --output text
else
    echo "No log streams found yet"
fi

echo ""
echo "Step 3: Check if verification code was created"
echo "----------------------------------------------"
aws dynamodb scan \
  --table-name sjc1990app-verification-codes-dev \
  --region $REGION \
  --limit 5 \
  --output json | jq '.Items'

echo ""
echo "Step 4: Check pending approvals table"
echo "-------------------------------------"
aws dynamodb scan \
  --table-name sjc1990app-pending-approvals-dev \
  --region $REGION \
  --limit 5 \
  --output json | jq '.Items'

echo ""
echo "Step 5: Test pending approvals endpoint again"
echo "---------------------------------------------"
curl -X GET "$API_URL/auth/pending-approvals" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" | jq '.'

echo ""
echo "Step 6: Check auth-service Lambda function configuration"
echo "-------------------------------------------------------"
aws lambda get-function-configuration \
  --function-name sjc1990app-dev-auth-service \
  --region $REGION \
  --query '{FunctionName:FunctionName,Runtime:Runtime,MemorySize:MemorySize,Timeout:Timeout,Environment:Environment}' \
  --output json | jq '.'

echo ""
echo "Step 7: Check Lambda IAM role permissions"
echo "-----------------------------------------"
ROLE_NAME=$(aws lambda get-function-configuration \
  --function-name sjc1990app-dev-auth-service \
  --region $REGION \
  --query 'Role' \
  --output text | awk -F'/' '{print $NF}')

echo "Role: $ROLE_NAME"
echo ""
echo "Attached policies:"
aws iam list-attached-role-policies \
  --role-name "$ROLE_NAME" \
  --output table

echo ""
echo "Step 8: Test registration again and check logs immediately"
echo "---------------------------------------------------------"
echo "Registering test user..."
curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+85299999999",
    "name": "Debug Test User"
  }' | jq '.'

echo ""
echo "Waiting 3 seconds for logs to propagate..."
sleep 3

echo ""
echo "Checking latest logs:"
LATEST_STREAM=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --max-items 1 \
  --region $REGION \
  --query 'logStreams[0].logStreamName' \
  --output text 2>/dev/null || echo "")

if [ -n "$LATEST_STREAM" ]; then
    aws logs get-log-events \
      --log-group-name "$LOG_GROUP" \
      --log-stream-name "$LATEST_STREAM" \
      --start-time $(($(date +%s) * 1000 - 30000)) \
      --region $REGION \
      --query 'events[*].message' \
      --output text | tail -30
fi

echo ""
echo "=========================================="
echo "Debugging Complete"
echo "=========================================="
echo ""
echo "Summary:"
echo "1. Check if log groups exist with correct names"
echo "2. Look for ERROR messages in Lambda logs"
echo "3. Verify verification codes are being created in DynamoDB"
echo "4. Check if pending approvals table is accessible"
echo "5. Review Lambda IAM permissions"
echo ""
