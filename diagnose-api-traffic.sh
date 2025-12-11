#!/bin/bash

# API Security Diagnostic Script
# Investigates unexpected API traffic spike on 2025-12-11 19:30-19:40 UTC

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REGION="us-west-2"
API_NAME="sjc1990app-dev-api"
START_TIME="2025-12-11T19:00:00Z"
END_TIME="2025-12-11T20:00:00Z"

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         API Security Diagnostic - Traffic Spike             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Investigating spike: 423 4XX errors (19:30-19:40 UTC)${NC}"
echo ""

print_section() {
    echo ""
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

check_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

check_critical() {
    echo -e "${RED}✗ $1${NC}"
}

check_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Section 1: API Gateway Request Metrics
print_section "1. Total API Request Volume During Spike"

echo "Checking API Gateway request count..."
REQUEST_DATA=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=$API_NAME \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --output json)

echo "$REQUEST_DATA" | jq -r '.Datapoints | sort_by(.Timestamp) | .[] | "\(.Timestamp | split("T")[1] | split(".")[0]): \(.Sum) requests"'

TOTAL_REQUESTS=$(echo "$REQUEST_DATA" | jq '[.Datapoints[].Sum] | add // 0')
check_info "Total requests during hour: $TOTAL_REQUESTS"

if [ "$TOTAL_REQUESTS" -gt 500 ]; then
    check_critical "High traffic volume (>500 requests/hour)"
elif [ "$TOTAL_REQUESTS" -gt 100 ]; then
    check_warning "Moderate traffic volume (>100 requests/hour)"
else
    check_info "Normal traffic volume (<100 requests/hour)"
fi

# Section 2: 4XX Error Breakdown
print_section "2. 4XX Error Distribution"

echo "Checking 4XX error count by time period..."
ERROR_4XX_DATA=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 4XXError \
  --dimensions Name=ApiName,Value=$API_NAME \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --output json)

echo "$ERROR_4XX_DATA" | jq -r '.Datapoints | sort_by(.Timestamp) | .[] | "\(.Timestamp | split("T")[1] | split(".")[0]): \(.Sum) errors"'

TOTAL_4XX=$(echo "$ERROR_4XX_DATA" | jq '[.Datapoints[].Sum] | add // 0')
check_info "Total 4XX errors: $TOTAL_4XX"

if [ "$TOTAL_REQUESTS" -gt 0 ]; then
    ERROR_RATE=$((TOTAL_4XX * 100 / TOTAL_REQUESTS))
    check_info "Error rate: ${ERROR_RATE}%"

    if [ "$ERROR_RATE" -eq 100 ]; then
        check_critical "100% error rate - ALL requests failed"
    elif [ "$ERROR_RATE" -gt 50 ]; then
        check_critical "High error rate (>${ERROR_RATE}%)"
    elif [ "$ERROR_RATE" -gt 10 ]; then
        check_warning "Elevated error rate (${ERROR_RATE}%)"
    fi
fi

# Section 3: 5XX Error Check
print_section "3. 5XX Server Error Check"

echo "Checking for server errors..."
ERROR_5XX_DATA=$(aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 5XXError \
  --dimensions Name=ApiName,Value=$API_NAME \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --output json)

TOTAL_5XX=$(echo "$ERROR_5XX_DATA" | jq '[.Datapoints[].Sum] | add // 0')

if [ "$TOTAL_5XX" -gt 0 ]; then
    check_critical "Server errors detected: $TOTAL_5XX"
    echo "$ERROR_5XX_DATA" | jq -r '.Datapoints | sort_by(.Timestamp) | .[] | "\(.Timestamp | split("T")[1] | split(".")[0]): \(.Sum) errors"'
else
    check_success "No server errors (5XX) - API functioning correctly"
fi

# Section 4: Lambda Function Invocations
print_section "4. Lambda Function Activity"

for FUNCTION in "sjc1990app-dev-auth-service" "sjc1990app-dev-users-service" "sjc1990app-dev-classrooms-service"; do
    echo ""
    echo "Checking: $FUNCTION"

    LAMBDA_DATA=$(aws cloudwatch get-metric-statistics \
      --namespace AWS/Lambda \
      --metric-name Invocations \
      --dimensions Name=FunctionName,Value=$FUNCTION \
      --start-time $START_TIME \
      --end-time $END_TIME \
      --period 300 \
      --statistics Sum \
      --region $REGION \
      --output json 2>/dev/null || echo '{"Datapoints":[]}')

    INVOCATIONS=$(echo "$LAMBDA_DATA" | jq '[.Datapoints[].Sum] | add // 0')

    if [ "$INVOCATIONS" -gt 0 ]; then
        check_info "  Invocations: $INVOCATIONS"
        echo "$LAMBDA_DATA" | jq -r '.Datapoints | sort_by(.Timestamp) | .[] | "    \(.Timestamp | split("T")[1] | split(".")[0]): \(.Sum) invocations"'
    else
        echo "  No invocations"
    fi
done

# Section 5: Lambda Errors
print_section "5. Lambda Error Analysis"

for FUNCTION in "sjc1990app-dev-auth-service" "sjc1990app-dev-users-service" "sjc1990app-dev-classrooms-service"; do
    echo ""
    echo "Checking errors: $FUNCTION"

    ERROR_DATA=$(aws cloudwatch get-metric-statistics \
      --namespace AWS/Lambda \
      --metric-name Errors \
      --dimensions Name=FunctionName,Value=$FUNCTION \
      --start-time $START_TIME \
      --end-time $END_TIME \
      --period 300 \
      --statistics Sum \
      --region $REGION \
      --output json 2>/dev/null || echo '{"Datapoints":[]}')

    ERRORS=$(echo "$ERROR_DATA" | jq '[.Datapoints[].Sum] | add // 0')

    if [ "$ERRORS" -gt 0 ]; then
        check_warning "  Errors: $ERRORS"
    else
        check_success "  No Lambda errors"
    fi
done

# Section 6: Lambda Logs Analysis
print_section "6. Lambda CloudWatch Logs"

echo "Checking auth-service logs for request patterns..."
LOG_GROUP="/aws/lambda/sjc1990app-dev-auth-service"

# Check if logs exist
LOG_STREAMS=$(aws logs describe-log-streams \
  --log-group-name "$LOG_GROUP" \
  --order-by LastEventTime \
  --descending \
  --max-items 5 \
  --region $REGION \
  --output json 2>/dev/null || echo '{"logStreams":[]}')

STREAM_COUNT=$(echo "$LOG_STREAMS" | jq '.logStreams | length')

if [ "$STREAM_COUNT" -gt 0 ]; then
    check_info "Found $STREAM_COUNT recent log streams"

    # Get recent events
    RECENT_EVENTS=$(aws logs filter-log-events \
      --log-group-name "$LOG_GROUP" \
      --start-time $(($(date -d "$START_TIME" +%s) * 1000)) \
      --end-time $(($(date -d "$END_TIME" +%s) * 1000)) \
      --region $REGION \
      --max-items 20 \
      --output json 2>/dev/null || echo '{"events":[]}')

    EVENT_COUNT=$(echo "$RECENT_EVENTS" | jq '.events | length')
    check_info "Log events during spike: $EVENT_COUNT"

    if [ "$EVENT_COUNT" -gt 0 ]; then
        echo ""
        echo "Sample log entries (first 10):"
        echo "$RECENT_EVENTS" | jq -r '.events[0:10][] | "\(.timestamp | todate): \(.message)"' | head -20
    fi
else
    check_warning "No log streams found"
fi

# Section 7: API Gateway Configuration Check
print_section "7. API Gateway Configuration"

echo "Checking API Gateway settings..."

# Get API ID
API_ID=$(aws apigateway get-rest-apis \
  --region $REGION \
  --output json | jq -r ".items[] | select(.name == \"$API_NAME\") | .id")

if [ -n "$API_ID" ]; then
    check_success "API ID: $API_ID"

    # Check if access logging is enabled
    STAGE_INFO=$(aws apigateway get-stage \
      --rest-api-id "$API_ID" \
      --stage-name dev \
      --region $REGION \
      --output json 2>/dev/null || echo '{}')

    ACCESS_LOG_ARN=$(echo "$STAGE_INFO" | jq -r '.accessLogSettings.destinationArn // "NOT_CONFIGURED"')

    if [ "$ACCESS_LOG_ARN" = "NOT_CONFIGURED" ]; then
        check_critical "Access logging NOT enabled - cannot see source IPs"
        echo ""
        echo -e "${YELLOW}RECOMMENDATION: Enable API Gateway access logs immediately${NC}"
    else
        check_success "Access logging enabled: $ACCESS_LOG_ARN"
    fi

    # Check throttling settings
    THROTTLE_RATE=$(echo "$STAGE_INFO" | jq -r '.throttleSettings.rateLimit // "NOT_SET"')
    THROTTLE_BURST=$(echo "$STAGE_INFO" | jq -r '.throttleSettings.burstLimit // "NOT_SET"')

    if [ "$THROTTLE_RATE" = "NOT_SET" ]; then
        check_warning "Rate limiting NOT configured"
        echo ""
        echo -e "${YELLOW}RECOMMENDATION: Enable rate limiting (10 req/sec, 20 burst)${NC}"
    else
        check_success "Rate limit: $THROTTLE_RATE req/sec, burst: $THROTTLE_BURST"
    fi
fi

# Section 8: Cost Impact
print_section "8. Cost Impact Analysis"

echo "Estimating cost of traffic spike..."

# API Gateway: $3.50 per million requests
API_COST=$(echo "scale=4; $TOTAL_REQUESTS * 3.50 / 1000000" | bc)

# Lambda invocations (estimate based on total requests)
LAMBDA_INVOCATIONS=$TOTAL_REQUESTS
LAMBDA_COST=$(echo "scale=4; $LAMBDA_INVOCATIONS * 0.20 / 1000000" | bc)

TOTAL_COST=$(echo "scale=4; $API_COST + $LAMBDA_COST" | bc)

check_info "API Gateway cost: \$$API_COST"
check_info "Lambda cost (estimate): \$$LAMBDA_COST"
check_info "Total estimated cost: \$$TOTAL_COST"

if (( $(echo "$TOTAL_COST < 0.01" | bc -l) )); then
    check_success "Negligible cost impact (<$0.01)"
else
    check_warning "Cost impact: \$$TOTAL_COST"
fi

# Summary
print_section "SUMMARY & RECOMMENDATIONS"

echo ""
echo -e "${BLUE}Traffic Analysis:${NC}"
echo "  • Total requests: $TOTAL_REQUESTS"
echo "  • 4XX errors: $TOTAL_4XX"
echo "  • 5XX errors: $TOTAL_5XX"
if [ "$TOTAL_REQUESTS" -gt 0 ]; then
    echo "  • Error rate: ${ERROR_RATE}%"
fi
echo "  • Cost impact: \$$TOTAL_COST"

echo ""
echo -e "${YELLOW}Security Assessment:${NC}"

if [ "$TOTAL_5XX" -eq 0 ]; then
    echo "  ✓ No server crashes (API stable)"
else
    echo "  ✗ Server errors occurred (investigate)"
fi

if [ "$ACCESS_LOG_ARN" = "NOT_CONFIGURED" ]; then
    echo "  ✗ No access logs (cannot identify source)"
else
    echo "  ✓ Access logs enabled"
fi

if [ "$THROTTLE_RATE" = "NOT_SET" ]; then
    echo "  ✗ No rate limiting (vulnerable to abuse)"
else
    echo "  ✓ Rate limiting configured"
fi

echo ""
echo -e "${GREEN}NEXT ACTIONS:${NC}"
echo ""

if [ "$ACCESS_LOG_ARN" = "NOT_CONFIGURED" ]; then
    echo "1. ${YELLOW}URGENT${NC}: Enable API Gateway access logs"
    echo "   - See source IPs, user agents, exact endpoints"
    echo "   - Required for forensics"
fi

if [ "$THROTTLE_RATE" = "NOT_SET" ]; then
    echo "2. ${YELLOW}IMPORTANT${NC}: Enable rate limiting"
    echo "   - Prevent future abuse"
    echo "   - Recommend: 10 req/sec, 20 burst"
fi

echo "3. Review findings above and determine:"
echo "   - Was traffic malicious or benign?"
echo "   - Should we add WAF rules?"
echo "   - Should we require API keys?"

echo ""
echo "Diagnostic complete. Review findings above."
echo ""
