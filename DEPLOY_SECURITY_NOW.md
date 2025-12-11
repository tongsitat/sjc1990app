# Quick Security Deployment Guide

## Issue
CDK deployment requires Docker to bundle Lambda functions, but Docker is not available in this environment.

## Solution
Run the deployment from your **local machine** (where Docker is installed).

---

## Deployment Steps (Run on Your Local Machine)

### 1. Pull Latest Changes
```bash
cd ~/dev/sjc1990app
git pull origin claude/status-update-014V8MZCDkLKZuP57wNLN2FW
```

### 2. Verify Docker is Running
```bash
docker --version
# Should show: Docker version X.X.X
```

If Docker isn't running:
- **Windows/Mac**: Start Docker Desktop
- **Linux**: `sudo systemctl start docker`

### 3. Deploy Security Updates
```bash
cd infrastructure-cdk
cdk deploy sjc1990app-dev-api --require-approval never
```

**Expected output**:
```
✨  Synthesis time: 3.45s

sjc1990app-dev-api: deploying...
sjc1990app-dev-api: creating CloudFormation changeset...

 ✅  sjc1990app-dev-api

✨  Deployment time: 321.45s

Outputs:
sjc1990app-dev-api.ApiUrl = https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/
sjc1990app-dev-api.AccessLogGroup = /aws/apigateway/sjc1990app-dev-access-logs
sjc1990app-dev-api.RateLimits = 10 req/sec, 20 burst
sjc1990app-dev-api.WafWebAclArn = arn:aws:wafv2:us-west-2:...
```

**Deployment time**: ~5-7 minutes

---

## What Will Be Deployed

### CloudWatch Log Group
- **Name**: `/aws/apigateway/sjc1990app-dev-access-logs`
- **Retention**: 30 days
- **Purpose**: Logs all API requests with source IPs

### API Gateway Updates
- **Access Logging**: Enabled (logs every request)
- **Rate Limit**: 10 requests/second (reduced from 1000)
- **Burst Limit**: 20 requests (reduced from 2000)

### AWS WAF
- **WebACL Name**: `sjc1990app-dev-api-waf`
- **Rules**:
  1. AWS Managed Core Rule Set (SQL injection, XSS)
  2. AWS Managed Known Bad Inputs (malformed requests)
  3. IP-based Rate Limiting (100 req/5min per IP)

**Cost**: +$10/month (WAF + CloudWatch logs)

---

## After Deployment - Testing (5 minutes)

### Test 1: Access Logging
```bash
# Make a test request
curl -X GET https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/auth/pending-approvals

# Wait 30 seconds, then check logs
aws logs tail /aws/apigateway/sjc1990app-dev-access-logs --follow --region us-west-2
```

**Expected**: You should see your request logged with your IP address.

### Test 2: Rate Limiting
```bash
# Send 25 rapid requests
for i in {1..25}; do
  echo "Request $i"
  curl -s -o /dev/null -w "%{http_code}\n" \
    https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/auth/pending-approvals
  sleep 0.1
done
```

**Expected**: First ~20 requests return 401, then you get 429 (Too Many Requests).

### Test 3: WAF Protection
```bash
# Try SQL injection (WAF should block)
curl -X POST https://q30c36qszi.execute-api.us-west-2.amazonaws.com/dev/auth/register \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "1234567890", "firstName": "test\" OR 1=1--"}'
```

**Expected**: 403 Forbidden (blocked by WAF).

---

## Investigate Traffic Spike (10 minutes)

After deployment, run the diagnostic script:

```bash
cd ~/dev/sjc1990app
./diagnose-api-traffic.sh
```

This will analyze CloudWatch metrics to understand what happened during the 423 4XX errors spike.

---

## Troubleshooting

### "Docker: command not found"
**Solution**: Install Docker or start Docker Desktop

### "Unable to locate credentials"
**Solution**: Configure AWS CLI
```bash
aws configure
# Enter your AWS credentials
```

### "Stack update failed"
**Solution**: Check CloudFormation console for error details
```bash
aws cloudformation describe-stack-events \
  --stack-name sjc1990app-dev-api \
  --region us-west-2 \
  --max-items 10
```

---

## Quick Summary

**What to do**:
1. Pull latest code
2. Ensure Docker is running
3. Run: `cd infrastructure-cdk && cdk deploy sjc1990app-dev-api`
4. Test the three security features
5. Run diagnostic script

**Total time**: ~15 minutes

**Result**: API protected with access logging, rate limiting, and WAF

---

**Ready? Run the commands above on your local machine!** 🚀
