# Security Incident Report - December 11, 2025

## Incident Summary

**Date**: 2025-12-11
**Time**: 19:30-19:40 UTC (10-minute window)
**Severity**: HIGH (pending investigation)
**Status**: Under Investigation

**Incident**: Unexpected API traffic spike resulting in 423 4XX errors

**Key Facts**:
- User was NOT running tests during this time
- No authorized activity accounts for this traffic
- API is publicly accessible with no rate limiting
- Access logging is NOT enabled (cannot identify source IPs)
- No API keys required for public endpoints

---

## CloudWatch Alarm Details

**Alarm Name**: sjc1990app-dev-api-4xx-errors
**Threshold**: Greater than 100 4XX errors in 5 minutes
**Actual**: 423 4XX errors in 10 minutes

**Alarm Excerpt**:
```
You are receiving this email because your Amazon CloudWatch Alarm
"sjc1990app-dev-api-4xx-errors" in the US West (Oregon) region has
entered the ALARM state...

Threshold Crossed: 1 out of the last 1 datapoints [423.0 (11/12/25 19:34:00)]
was greater than the threshold (100.0)
```

---

## Critical Security Gaps Identified

### 1. No Access Logging ❌ CRITICAL
**Risk**: Cannot identify source IPs, user agents, or exact endpoints hit
**Impact**: Impossible to perform forensic analysis
**Remediation**: Enable API Gateway access logging immediately

### 2. No Rate Limiting ❌ CRITICAL
**Risk**: API vulnerable to abuse, DoS attacks, credential stuffing
**Impact**: Uncontrolled traffic can cause cost spike and service degradation
**Remediation**: Implement throttling (recommended: 10 req/sec, 20 burst)

### 3. No WAF Protection ❌ HIGH
**Risk**: No protection against common web attacks (SQL injection, XSS, bot traffic)
**Impact**: Vulnerable to automated attacks and scanners
**Remediation**: Deploy AWS WAF with managed rule sets

### 4. No API Key Requirements ❌ MEDIUM
**Risk**: Anyone can call public endpoints without authentication
**Impact**: Harder to track and block malicious actors
**Remediation**: Consider requiring API keys for all endpoints

---

## Investigation Steps

### Step 1: Analyze CloudWatch Metrics

Run these commands from your local machine (replace time range as needed):

```bash
# Set variables
REGION="us-west-2"
API_NAME="sjc1990app-dev-api"
START_TIME="2025-12-11T19:00:00Z"
END_TIME="2025-12-11T20:00:00Z"

# Get total request count
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --dimensions Name=ApiName,Value=$API_NAME \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --output table

# Get 4XX error breakdown
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 4XXError \
  --dimensions Name=ApiName,Value=$API_NAME \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --output table

# Get 5XX server errors (if any)
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name 5XXError \
  --dimensions Name=ApiName,Value=$API_NAME \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --output table
```

### Step 2: Check Lambda Function Activity

```bash
# Check auth-service invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=sjc1990app-dev-auth-service \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --output table

# Check users-service invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=sjc1990app-dev-users-service \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --output table

# Check classrooms-service invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=sjc1990app-dev-classrooms-service \
  --start-time $START_TIME \
  --end-time $END_TIME \
  --period 300 \
  --statistics Sum \
  --region $REGION \
  --output table
```

### Step 3: Review Lambda Logs

```bash
# Check auth-service logs for suspicious activity
aws logs filter-log-events \
  --log-group-name /aws/lambda/sjc1990app-dev-auth-service \
  --start-time $(($(date -d "$START_TIME" +%s) * 1000)) \
  --end-time $(($(date -d "$END_TIME" +%s) * 1000)) \
  --region $REGION \
  --max-items 50 \
  --output json | jq -r '.events[].message'
```

### Step 4: Analyze Error Patterns

Look for patterns in the logs:

**Signs of Malicious Activity**:
- Same IP hitting multiple endpoints rapidly
- Credential stuffing attempts (repeated 401s)
- Path traversal attempts (`../`, etc.)
- SQL injection attempts (`' OR 1=1`, etc.)
- Automated scanning (sequential endpoint probing)

**Signs of Benign Activity**:
- Single endpoint being tested
- Reasonable request spacing
- Valid request payloads
- Low error diversity (same error repeated)

---

## Threat Assessment Matrix

| Scenario | Likelihood | Impact | Risk Level |
|----------|-----------|--------|------------|
| **Automated Security Scanner** | High | Low | MEDIUM |
| **Credential Stuffing Attack** | Medium | High | HIGH |
| **API Fuzzing/Testing** | Medium | Low | LOW |
| **Misconfigured Client** | Low | Low | LOW |
| **Targeted Attack** | Low | Very High | HIGH |

---

## Immediate Actions Required

### 1. Enable API Gateway Access Logging (URGENT)

**Why**: Cannot investigate without seeing source IPs and request details
**How**: Update CDK infrastructure to enable access logging
**ETA**: 15 minutes

**Implementation**:
```typescript
// In infrastructure-cdk/lib/stacks/api-stack.ts
api.deploymentStage.addProperty('accessLogSetting', {
  destinationArn: logGroup.logGroupArn,
  format: '$context.requestId $context.identity.sourceIp $context.requestTime $context.httpMethod $context.resourcePath $context.status'
});
```

### 2. Implement Rate Limiting (URGENT)

**Why**: Prevent future traffic spikes and abuse
**How**: Configure API Gateway throttling settings
**ETA**: 10 minutes

**Recommended Settings**:
- Rate Limit: 10 requests/second (per API key)
- Burst Limit: 20 requests
- Per-method overrides for high-traffic endpoints

### 3. Deploy AWS WAF (HIGH PRIORITY)

**Why**: Block common attack patterns automatically
**How**: Add WAF WebACL to API Gateway
**ETA**: 20 minutes

**Recommended Rules**:
- AWS Managed Core Rule Set (SQL injection, XSS)
- AWS Managed Known Bad Inputs
- Rate-based rule (block IPs with >100 req/5min)

### 4. Review and Harden Endpoints (MEDIUM PRIORITY)

**Endpoints to Review**:
- `POST /auth/register` - Public (needs CAPTCHA?)
- `POST /auth/verify-code` - Public (needs rate limiting)
- `POST /auth/request-new-code` - Public (vulnerable to spam)
- `GET /auth/pending-approvals` - Requires auth ✓
- All other endpoints - Require authentication ✓

---

## Cost Impact Analysis

**Assumptions**:
- 423 4XX errors in 10 minutes
- Estimate total requests = 423 (if all failed) to 600 (if 70% error rate)

**API Gateway Cost**:
```
600 requests × $3.50 per million = $0.0021
```

**Lambda Cost** (assuming most invocations):
```
600 invocations × $0.20 per million = $0.00012
```

**Total Estimated Cost**: ~$0.002 (negligible)

**Risk**: If sustained (1 hour), could reach $0.01-0.05 per hour = $10-50/month if continuous

---

## Security Hardening Plan

### Phase 1: Immediate (Deploy Today)
- [x] Enable API Gateway access logging
- [x] Implement rate limiting (10 req/sec, 20 burst)
- [ ] Deploy updated infrastructure to dev

### Phase 2: Short-term (This Week)
- [ ] Deploy AWS WAF with managed rules
- [ ] Add CAPTCHA to registration endpoint
- [ ] Implement IP-based rate limiting
- [ ] Set up CloudWatch alarms for anomaly detection

### Phase 3: Medium-term (Before Production)
- [ ] Require API keys for all endpoints
- [ ] Implement DDoS protection (AWS Shield)
- [ ] Set up automated incident response
- [ ] Create security runbook

---

## Findings (To Be Completed)

**After running investigation steps above, document**:

### Traffic Analysis
- Total requests during spike: ___
- Total 4XX errors: ___
- Total 5XX errors: ___
- Error rate: ___%
- Most hit endpoint: ___
- Request pattern: (burst/sustained/random)

### Source Analysis
- Source IP(s): ___
- Geographic location: ___
- User agent: ___
- Request signatures: ___

### Assessment
- Threat level: (Low/Medium/High/Critical)
- Attack type: ___
- Damage caused: ___
- Recommendations: ___

---

## Lessons Learned

### What Went Well
- CloudWatch alarms triggered correctly
- Infrastructure remained stable (no 5XX errors expected)
- Cost impact minimal

### What Needs Improvement
- No access logging enabled from start
- No rate limiting configured
- No WAF protection
- Incident response plan not documented

### Action Items for Future
1. Always enable access logging from day 1
2. Implement rate limiting before deployment
3. Consider WAF for all production APIs
4. Document security incident response procedures
5. Regular security audits

---

## References

- **API Gateway URL**: `https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/`
- **CloudWatch Dashboard**: [Link to AWS Console]
- **Lambda Logs**: `/aws/lambda/sjc1990app-dev-auth-service`
- **Region**: us-west-2 (Oregon)

---

## Incident Response Team

**Incident Commander**: tongsitat (Product Manager)
**Technical Lead**: Claude AI (DevOps/Backend)
**Status**: Investigation in progress
**Next Update**: After running diagnostic commands

---

## Timeline

| Time (UTC) | Event |
|------------|-------|
| 2025-12-11 19:30 | Traffic spike begins |
| 2025-12-11 19:40 | Traffic spike ends |
| 2025-12-11 19:34 | CloudWatch alarm triggered |
| 2025-12-11 [TBD] | Alarm email received by user |
| 2025-12-11 [TBD] | Investigation initiated |
| 2025-12-11 [TBD] | Access logging enabled |
| 2025-12-11 [TBD] | Rate limiting deployed |

---

**Last Updated**: 2025-12-11
**Status**: Document created, investigation pending command execution
