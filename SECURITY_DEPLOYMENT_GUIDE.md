# Security Hardening Deployment Guide

## Overview

This guide covers deploying critical security hardening updates to protect the API Gateway from the traffic spike incident documented in `SECURITY_INCIDENT_2025-12-11.md`.

**Date**: 2025-12-11
**Urgency**: HIGH - Deploy as soon as possible
**Estimated Deployment Time**: 10-15 minutes

---

## What's Being Deployed

### 1. API Gateway Access Logging ✅
**What it does**: Logs every API request with source IP, user agent, endpoint, and response status

**Benefits**:
- Forensic analysis of security incidents
- Identify malicious actors by IP address
- Track API usage patterns
- Investigate unusual traffic spikes

**Log Format** (JSON):
```json
{
  "requestId": "abc123...",
  "sourceIp": "203.0.113.45",
  "requestTime": "11/Dec/2025:19:35:42 +0000",
  "httpMethod": "POST",
  "resourcePath": "/auth/register",
  "status": "401",
  "protocol": "HTTP/1.1",
  "responseLength": "123",
  "userAgent": "Mozilla/5.0...",
  "errorMessage": "Unauthorized",
  "errorType": "Unauthorized"
}
```

**Log Location**: `/aws/apigateway/sjc1990app-dev-access-logs`

### 2. API Gateway Rate Limiting ✅
**What it does**: Limits requests per second to prevent abuse

**Previous Settings** (Too High!):
- Rate: 1,000 requests/second
- Burst: 2,000 requests

**New Settings** (Hardened):
- Rate: 10 requests/second
- Burst: 20 requests

**Why this matters**:
- Prevents DoS attacks
- Protects against credential stuffing
- Limits cost impact of attacks
- Appropriate for small user base (500 users)

### 3. AWS WAF (Web Application Firewall) ✅
**What it does**: Blocks malicious requests before they reach your API

**WAF Rules Deployed**:

#### Rule 1: AWS Managed Core Rule Set
Protects against:
- SQL injection
- Cross-site scripting (XSS)
- Remote code execution
- Local file inclusion
- And 30+ other attack types

#### Rule 2: AWS Managed Known Bad Inputs
Blocks:
- Malformed requests
- Invalid HTTP headers
- Known attack patterns
- Bot signatures

#### Rule 3: IP-based Rate Limiting
- Blocks IPs that exceed 100 requests in 5 minutes
- Automatically unblocks after cool-down period
- Prevents single IP from overwhelming the API

**WAF Cost**: ~$5-10/month (1 WebACL + 3 rules)

---

## Pre-Deployment Checklist

Before deploying, ensure:

- [ ] You have AWS CLI configured (`aws sts get-caller-identity`)
- [ ] You're in the correct region (`us-west-2`)
- [ ] You have CDK bootstrapped (`cdk bootstrap`)
- [ ] You've committed any pending changes to git
- [ ] You have 10-15 minutes for deployment

---

## Deployment Steps

### Step 1: Review Changes

```bash
cd ~/dev/sjc1990app
git status
git diff infrastructure-cdk/lib/stacks/api-stack.ts
```

**Expected changes**:
- Import of `logs` and `wafv2` modules
- CloudWatch log group for access logs
- Access logging configuration
- Reduced rate limits (10 req/sec, 20 burst)
- WAF WebACL with 3 rules
- WAF association with API Gateway

### Step 2: Synthesize CDK (Dry Run)

```bash
cd infrastructure-cdk
cdk synth sjc1990app-dev-api
```

**What to check**:
- CloudFormation template generated successfully
- No errors in output
- Look for `AWS::Logs::LogGroup` (access logs)
- Look for `AWS::WAFv2::WebACL` (WAF)
- Look for `AWS::WAFv2::WebACLAssociation` (WAF ↔ API)

### Step 3: Review Changes (Diff)

```bash
cdk diff sjc1990app-dev-api
```

**Expected changes**:
```
Stack sjc1990app-dev-api
Resources
[+] AWS::Logs::LogGroup ApiAccessLogs
[~] AWS::ApiGateway::Stage Api/DeploymentStage
 └─ [~] AccessLogDestination: (new value)
 └─ [~] AccessLogFormat: (new value)
 └─ [~] ThrottlingRateLimit: 1000 → 10
 └─ [~] ThrottlingBurstLimit: 2000 → 20
[+] AWS::WAFv2::WebACL ApiWebACL
[+] AWS::WAFv2::WebACLAssociation ApiWebACLAssociation

Outputs
[+] AccessLogGroup
[+] RateLimits
[+] WafWebAclArn
```

### Step 4: Deploy to AWS

```bash
cdk deploy sjc1990app-dev-api --require-approval never
```

**Deployment progress**:
1. Creating CloudWatch log group (~30 seconds)
2. Creating WAF WebACL (~1 minute)
3. Updating API Gateway stage (~2 minutes)
4. Associating WAF with API Gateway (~1 minute)
5. Total: ~5-7 minutes

**What you'll see**:
```
✨  Synthesis time: 3.45s

sjc1990app-dev-api: deploying... [1/1]
sjc1990app-dev-api: creating CloudFormation changeset...

 ✅  sjc1990app-dev-api

✨  Deployment time: 321.45s

Outputs:
sjc1990app-dev-api.ApiUrl = https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/
sjc1990app-dev-api.AccessLogGroup = /aws/apigateway/sjc1990app-dev-access-logs
sjc1990app-dev-api.RateLimits = 10 req/sec, 20 burst
sjc1990app-dev-api.WafWebAclArn = arn:aws:wafv2:us-west-2:500265069254:regional/webacl/...
```

### Step 5: Verify Deployment

```bash
# Check API Gateway stage settings
aws apigateway get-stage \
  --rest-api-id q30c36qszi \
  --stage-name dev \
  --region us-west-2

# Should show:
# - accessLogSettings.destinationArn (log group ARN)
# - throttleSettings.rateLimit = 10
# - throttleSettings.burstLimit = 20

# Check WAF WebACL
aws wafv2 list-web-acls \
  --scope REGIONAL \
  --region us-west-2 | grep sjc1990app

# Should show: sjc1990app-dev-api-waf

# Check access log group exists
aws logs describe-log-groups \
  --log-group-name-prefix /aws/apigateway/sjc1990app-dev-access-logs \
  --region us-west-2

# Should return the log group with 30-day retention
```

### Step 6: Test Access Logging

Make a test request and verify it's logged:

```bash
# Make a test request (will fail with 401, but should be logged)
curl -X GET https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/auth/pending-approvals

# Check access logs (wait 30-60 seconds for logs to appear)
aws logs tail /aws/apigateway/sjc1990app-dev-access-logs \
  --follow \
  --region us-west-2

# You should see JSON log entry with:
# - Your IP address in "sourceIp"
# - "resourcePath": "/auth/pending-approvals"
# - "status": "401"
# - "userAgent": "curl/..."
```

### Step 7: Test Rate Limiting

```bash
# Send 25 requests rapidly (should be rate limited after 20)
for i in {1..25}; do
  echo "Request $i"
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/auth/pending-approvals
  sleep 0.1
done

# Expected results:
# - First ~20 requests: 401 (Unauthorized - normal)
# - After burst: 429 (Too Many Requests - rate limited!)
```

### Step 8: Test WAF Protection

```bash
# Try a SQL injection attack (WAF should block it)
curl -X POST https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "1234567890", "firstName": "test\" OR 1=1--"}'

# Expected: 403 Forbidden (blocked by WAF)

# Check WAF metrics in CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/WAFV2 \
  --metric-name BlockedRequests \
  --dimensions Name=WebACL,Value=sjc1990app-dev-api-waf Name=Region,Value=us-west-2 Name=Rule,Value=ALL \
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum \
  --region us-west-2
```

---

## Post-Deployment

### Investigate the Original Traffic Spike

Now that access logging is enabled, future incidents will be traceable. For the original incident (2025-12-11 19:30-19:40), you can:

1. **Check CloudWatch metrics** (already available):
```bash
./diagnose-api-traffic.sh
```

2. **Review Lambda logs** for suspicious patterns:
```bash
aws logs filter-log-events \
  --log-group-name /aws/lambda/sjc1990app-dev-auth-service \
  --start-time $(($(date -d "2025-12-11T19:00:00Z" +%s) * 1000)) \
  --end-time $(($(date -d "2025-12-11T20:00:00Z" +%s) * 1000)) \
  --region us-west-2 \
  --max-items 50
```

3. **Document findings** in `SECURITY_INCIDENT_2025-12-11.md`

### Monitor for Future Incidents

**CloudWatch Alarms** (already configured):
- `sjc1990app-dev-api-4xx-errors` - Triggers at >100 4XX in 5 minutes
- 15 other alarms for Lambda errors, throttling, etc.

**New Monitoring**:

```bash
# Set up alarm for WAF blocked requests
aws cloudwatch put-metric-alarm \
  --alarm-name sjc1990app-dev-waf-blocks \
  --alarm-description "Alert when WAF blocks more than 10 requests in 5 minutes" \
  --metric-name BlockedRequests \
  --namespace AWS/WAFV2 \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --dimensions Name=WebACL,Value=sjc1990app-dev-api-waf Name=Region,Value=us-west-2 Name=Rule,Value=ALL \
  --region us-west-2
```

### Review Access Logs Regularly

```bash
# Weekly review: Check for unusual patterns
aws logs filter-log-events \
  --log-group-name /aws/apigateway/sjc1990app-dev-access-logs \
  --start-time $(($(date -d "7 days ago" +%s) * 1000)) \
  --region us-west-2 \
  --filter-pattern '{ $.status = "4*" }' \
  --max-items 100

# Look for:
# - Same IP hitting multiple endpoints
# - Unusual user agents (bots, scanners)
# - High error rates from single IP
# - Geographic anomalies
```

---

## Cost Impact

### Before Security Hardening
- API Gateway: $3.50 per million requests
- Lambda: $0.20 per million invocations
- **No WAF**: $0
- **Total**: ~$3.70 per million requests

### After Security Hardening
- API Gateway: $3.50 per million requests
- Lambda: $0.20 per million invocations
- **WAF**: $5.00/month (1 WebACL) + $1.00/month per rule (3 rules) = **$8/month**
- **CloudWatch Logs**: $0.50/GB ingested + $0.03/GB storage
  - Estimated: ~$1-2/month for access logs
- **Total**: ~$9-10/month + $3.70 per million requests

**For 500 users with 10,000 API calls/month**:
- Previous: ~$0.04/month (requests only)
- New: ~$9-10/month (WAF + logs) + ~$0.04 (requests)
- **Total: ~$10/month**

**Is it worth it?**
- ✅ YES - Security incidents can cost far more
- ✅ Prevents abuse and DoS attacks
- ✅ Compliance and audit requirements
- ✅ Peace of mind

---

## Rollback Plan

If deployment causes issues:

### Quick Rollback (CloudFormation)
```bash
# List stack events to find previous version
aws cloudformation describe-stack-events \
  --stack-name sjc1990app-dev-api \
  --region us-west-2 \
  --max-items 20

# Rollback to previous version
aws cloudformation rollback-stack \
  --stack-name sjc1990app-dev-api \
  --region us-west-2
```

### Manual Rollback (git)
```bash
# Reset to previous commit
git log --oneline infrastructure-cdk/lib/stacks/api-stack.ts
git checkout <previous-commit-hash> -- infrastructure-cdk/lib/stacks/api-stack.ts

# Redeploy
cd infrastructure-cdk
cdk deploy sjc1990app-dev-api
```

---

## Troubleshooting

### Issue: WAF Blocks Legitimate Traffic

**Symptom**: Users getting 403 errors on valid requests

**Solution**:
1. Check WAF logs to see which rule blocked the request
2. Adjust rule to exclude false positives
3. Add rule exception in WebACL

```bash
# View blocked requests
aws wafv2 get-sampled-requests \
  --web-acl-arn <waf-arn> \
  --rule-metric-name AWSManagedRulesCommonRuleSetMetric \
  --scope REGIONAL \
  --time-window StartTime=$(date -u -d '1 hour ago' +%s),EndTime=$(date -u +%s) \
  --max-items 10 \
  --region us-west-2
```

### Issue: Rate Limiting Too Strict

**Symptom**: Users getting 429 errors during normal usage

**Solution**: Increase rate limits in `api-stack.ts`:
```typescript
throttlingRateLimit: 20,  // Increase from 10
throttlingBurstLimit: 50,  // Increase from 20
```

Redeploy:
```bash
cd infrastructure-cdk && cdk deploy sjc1990app-dev-api
```

### Issue: Access Logs Not Appearing

**Symptom**: No logs in CloudWatch after making requests

**Troubleshooting**:
1. Wait 1-2 minutes (logs have slight delay)
2. Check API Gateway has permission to write to CloudWatch
3. Verify log group exists
4. Check log group retention policy

```bash
# Check log group
aws logs describe-log-groups \
  --log-group-name-prefix /aws/apigateway/sjc1990app-dev-access-logs \
  --region us-west-2
```

### Issue: High CloudWatch Costs

**Symptom**: CloudWatch logs costing more than expected

**Solution**: Reduce log retention period
```typescript
retention: logs.RetentionDays.ONE_WEEK,  // Change from ONE_MONTH
```

---

## Next Steps After Deployment

1. ✅ Monitor access logs for the next 24 hours
2. ✅ Review WAF blocked requests
3. ✅ Investigate original traffic spike with new tools
4. ✅ Update `SECURITY_INCIDENT_2025-12-11.md` with findings
5. ✅ Document any lessons learned
6. ✅ Proceed with Flutter frontend development

---

## Summary

**What You Did**:
- ✅ Enabled API Gateway access logging (see source IPs)
- ✅ Reduced rate limits from 1000 → 10 req/sec (prevent abuse)
- ✅ Deployed AWS WAF (block SQL injection, XSS, malicious bots)
- ✅ Added IP-based rate limiting (100 req/5min per IP)

**What This Achieves**:
- 🔒 Protection against common web attacks
- 🔍 Visibility into API traffic (forensics)
- 💰 Cost protection (prevent runaway usage)
- 📊 Better security posture for production

**Cost**: ~$10/month (well worth it for security)

**Time to Deploy**: ~10-15 minutes

---

**Ready to deploy? Follow the steps above!**

Questions or issues? Review:
- `SECURITY_INCIDENT_2025-12-11.md` - Original incident report
- `infrastructure-cdk/lib/stacks/api-stack.ts` - Source code changes
- AWS WAF documentation: https://docs.aws.amazon.com/waf/
- API Gateway logging: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-logging.html
