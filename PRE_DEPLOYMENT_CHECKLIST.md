# Pre-Deployment Checklist for sjc1990app

Use this checklist before running `serverless deploy` to ensure everything is configured correctly.

**Estimated Time**: 15-30 minutes (if following AWS_SETUP.md already)

---

## ✅ Quick Verification Checklist

### 1. AWS Account & IAM

- [ ] AWS account created and activated
- [ ] IAM user `sjc1990app-deployer` created (not using root account)
- [ ] IAM user has required permissions (AdministratorAccess or custom policy)
- [ ] Access keys generated and saved securely

**Test**:
```bash
aws sts get-caller-identity
# Should show your IAM user ARN, not root
```

---

### 2. AWS CLI Configured

- [ ] AWS CLI installed (version 2.x)
- [ ] AWS CLI configured with access keys
- [ ] Region set to `ap-southeast-1` (or your chosen region)
- [ ] Output format set to `json`

**Test**:
```bash
aws --version  # Should show: aws-cli/2.x.x
aws configure list  # Should show your credentials (partially masked)
```

---

### 3. Serverless Framework

- [ ] Serverless Framework installed globally
- [ ] Version 3.x or 4.x
- [ ] Backend dependencies installed (`npm install`)
- [ ] TypeScript builds without errors

**Test**:
```bash
serverless --version  # Should show: Framework Core: 3.x.x or 4.x.x

cd ~/sjc1990app/backend
npm run build  # Should complete with no errors
```

---

### 4. AWS Services Enabled

- [ ] **SNS**: SMS enabled, spending limit set
- [ ] **SES**: At least one email verified (for testing)
- [ ] **S3**: No manual setup needed (will be created)
- [ ] **DynamoDB**: No manual setup needed (will be created)
- [ ] **Lambda**: No manual setup needed (will be created)

**Test SNS**:
```bash
# Send test SMS to your phone (optional)
aws sns publish \
  --phone-number "+85291234567" \
  --message "AWS SNS test" \
  --region ap-southeast-1
```

**Test SES**:
```bash
# List verified emails
aws ses list-verified-email-addresses --region ap-southeast-1
# Should show at least one verified email
```

---

### 5. Secrets Management

- [ ] JWT secret generated (32-byte random hex)
- [ ] JWT secret stored in AWS Systems Manager Parameter Store
- [ ] Parameter path: `/sjc1990app/dev/jwt-secret`
- [ ] Parameter type: `SecureString`

**Generate JWT Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy this output!
```

**Store in Parameter Store**:
```bash
aws ssm put-parameter \
  --name "/sjc1990app/dev/jwt-secret" \
  --value "YOUR_GENERATED_SECRET_HERE" \
  --type "SecureString" \
  --region ap-southeast-1
```

**Verify**:
```bash
aws ssm get-parameter \
  --name "/sjc1990app/dev/jwt-secret" \
  --with-decryption \
  --region ap-southeast-1
# Should return your secret (encrypted)
```

---

### 6. Cost Monitoring

- [ ] Billing alerts enabled in AWS Console
- [ ] CloudWatch billing alarm created (e.g., $50 threshold)
- [ ] SNS topic for billing alerts created
- [ ] Email subscription to billing alerts confirmed

**Verify**:
1. Go to [CloudWatch Alarms](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#alarmsV2:)
2. Switch to **us-east-1** region (billing metrics only here)
3. Check for alarm: `sjc1990app-billing-alert-50usd`
4. Status should be **OK** (not alarming)

---

### 7. Code & Configuration

- [ ] All backend code committed to git
- [ ] On correct branch: `claude/claude-md-mi0sf0rqjqh47l0w-01Ju3ppcLRM2eoLh5u7egn1e`
- [ ] `serverless.yml` configured correctly
- [ ] Environment variables set in `serverless.yml`

**Verify serverless.yml**:
```bash
cd ~/sjc1990app/infrastructure

# Check syntax (dry run)
serverless package --stage dev --region ap-southeast-1

# Should output: "Service packaged successfully"
```

---

### 8. Region Configuration

- [ ] Region chosen based on your location/requirements
- [ ] If using `ap-east-1` (Hong Kong), region is enabled in AWS Console
- [ ] Region matches in all commands (`--region ap-southeast-1`)
- [ ] Region set in serverless.yml matches AWS CLI region

**Recommended Regions**:
- `ap-southeast-1` - Singapore (most services, no opt-in)
- `ap-east-1` - Hong Kong (requires opt-in, slightly more expensive)
- `us-east-1` - US East Virginia (cheapest, for global testing)

---

## 🚀 Ready to Deploy?

If all checkboxes are ✅, you're ready to deploy!

### First Deployment (Dev Environment)

```bash
cd ~/sjc1990app/infrastructure

# Deploy to dev environment
serverless deploy --stage dev --region ap-southeast-1 --verbose

# Deployment takes ~3-5 minutes
# Watch for any errors during deployment
```

### Expected Deployment Output

```
✔ Service deployed to stack sjc1990app-dev

endpoints:
  POST - https://abc123def.execute-api.ap-southeast-1.amazonaws.com/dev/auth/register
  POST - https://abc123def.execute-api.ap-southeast-1.amazonaws.com/dev/auth/verify
  ... (12 more endpoints)

functions:
  authRegister: sjc1990app-dev-authRegister
  authVerify: sjc1990app-dev-authVerify
  ... (12 more functions)

Stack Outputs:
  ServerlessDeploymentBucketName: sjc1990app-dev-serverlessdeploymentbucket-xyz
```

**SAVE THIS OUTPUT!** You'll need the API Gateway URL for testing.

---

## 🧪 Post-Deployment Verification

After successful deployment, verify everything works:

### 1. Check DynamoDB Tables Created

```bash
aws dynamodb list-tables --region ap-southeast-1

# Should show 6 tables:
# - sjc1990app-users-dev
# - sjc1990app-verification-codes-dev
# - sjc1990app-pending-approvals-dev
# - sjc1990app-user-preferences-dev
# - sjc1990app-classrooms-dev
# - sjc1990app-user-classrooms-dev
```

### 2. Check Lambda Functions Created

```bash
aws lambda list-functions --region ap-southeast-1 | grep sjc1990app

# Should show 14 functions
```

### 3. Check S3 Bucket Created

```bash
aws s3 ls | grep sjc1990app

# Should show: sjc1990app-dev-photos
```

### 4. Test API Endpoint

```bash
# Replace with your actual API Gateway URL from deployment output
API_URL="https://abc123def.execute-api.ap-southeast-1.amazonaws.com/dev"

# Test user registration
curl -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+85291234567",
    "name": "Test User"
  }'

# Expected response:
# {
#   "message": "Verification code sent",
#   "expiresIn": 300
# }
```

**If you receive SMS**, everything is working! 🎉

### 5. Check CloudWatch Logs

```bash
# Tail logs for registration function
serverless logs -f authRegister --stage dev --tail

# Or use AWS CLI
aws logs tail /aws/lambda/sjc1990app-dev-authRegister --follow --region ap-southeast-1
```

---

## ❌ Common Deployment Issues

### Issue: "Access Denied" during deployment

**Solution**: IAM user needs more permissions
```bash
# Add AdministratorAccess policy to your IAM user in AWS Console
# OR attach the custom deployment policy from AWS_SETUP.md
```

### Issue: "JWT secret not found" in Lambda logs

**Solution**: Secret not in Parameter Store
```bash
# Create the secret
aws ssm put-parameter \
  --name "/sjc1990app/dev/jwt-secret" \
  --value "$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")" \
  --type "SecureString" \
  --region ap-southeast-1

# Redeploy Lambda function
serverless deploy function -f authRegister --stage dev
```

### Issue: TypeScript build fails

**Solution**: Fix TypeScript errors before deployment
```bash
cd ~/sjc1990app/backend
npm run build

# Fix any errors shown, then redeploy
```

### Issue: DynamoDB table already exists

**Solution**: Remove old stack first
```bash
serverless remove --stage dev --region ap-southeast-1

# Then redeploy
serverless deploy --stage dev --region ap-southeast-1
```

---

## 📊 Monitoring Costs After Deployment

**First Week**: Check daily
**After First Week**: Check weekly

```bash
# View current month costs (takes 24 hours to populate)
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --region us-east-1
```

Or use [Cost Explorer](https://console.aws.amazon.com/cost-management/home#/cost-explorer) in AWS Console.

---

## 🎯 Next Steps After Deployment

Once deployment is successful:

1. **Test all endpoints** using `/qa-functional` agent
2. **Load test** using `/qa-performance` agent
3. **Start frontend development** using `/frontend-dev` agent
4. **Set up CI/CD** using `/devops` agent

---

## 📞 Need Help?

If you encounter issues:

1. Check [AWS_SETUP.md](docs/guides/AWS_SETUP.md) troubleshooting section
2. Check CloudWatch Logs for errors
3. Ask me (Claude) for help with specific error messages
4. Post issue to GitHub repository

---

**Ready?** Let's deploy! 🚀

```bash
cd ~/sjc1990app/infrastructure
serverless deploy --stage dev --region ap-southeast-1 --verbose
```
