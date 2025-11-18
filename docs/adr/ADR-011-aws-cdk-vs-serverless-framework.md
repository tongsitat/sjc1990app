# ADR-011: AWS CDK vs Serverless Framework for Infrastructure Deployment

**Date**: 2025-11-18

**Status**: ✅ ACCEPTED

**Decision Makers**: Product Manager, System Architect

**Context**: Infrastructure as Code tooling selection

---

## Context and Problem Statement

The sjc1990app backend requires Infrastructure as Code (IaC) to deploy AWS resources (Lambda, DynamoDB, API Gateway, S3, etc.). Two primary options exist:

1. **Serverless Framework** - Third-party, YAML-based deployment framework
2. **AWS CDK** - Official AWS tool, TypeScript-based IaC

The original implementation used Serverless Framework with `serverless.yml`. Before first deployment, we reconsidered this decision to ensure long-term maintainability and type safety.

## Decision Drivers

1. **Type Safety** - Catch infrastructure errors at compile time, not deploy time
2. **Language Consistency** - Backend is TypeScript, infrastructure should match
3. **IDE Support** - Autocomplete, IntelliSense, refactoring for infrastructure code
4. **Future Complexity** - AppSync, Rekognition, multi-tenant features planned
5. **Official AWS Support** - First-party tool vs third-party dependency
6. **Learning Curve** - Solo developer with limited time
7. **Cost** - Both tools must be free
8. **Deployment Timing** - Pre-deployment vs post-deployment migration cost

## Considered Options

### Option A: Serverless Framework (Original Choice)

**Technology**: YAML-based configuration with plugins

**Pros**:
- ✅ Simpler, higher-level abstraction
- ✅ Less boilerplate code
- ✅ Faster initial development
- ✅ Excellent for Lambda + API Gateway + DynamoDB
- ✅ Strong community ecosystem
- ✅ Already implemented (`serverless.yml` complete)

**Cons**:
- ❌ YAML configuration (no type safety)
- ❌ Third-party tool (not official AWS)
- ❌ Limited control over complex CloudFormation resources
- ❌ Plugin dependency for advanced features
- ❌ Harder to unit test infrastructure
- ❌ No TypeScript integration with backend code

**Cost**: Free (open-source)

**Complexity**: Low (easier learning curve)

**Example**:
```yaml
functions:
  authRegister:
    handler: ../backend/functions/auth/register.handler
    environment:
      TABLE_USERS: ${self:service}-users-${self:provider.stage}
```

---

### Option B: AWS CDK (Selected Choice)

**Technology**: TypeScript-based Infrastructure as Code

**Pros**:
- ✅ **Full TypeScript support** - Infrastructure in same language as backend
- ✅ **Type safety** - Errors caught at compile time (not deploy time)
- ✅ **Official AWS tool** - No third-party dependency
- ✅ **Complete control** - Full CloudFormation capabilities
- ✅ **Better IDE support** - IntelliSense, autocomplete, refactoring
- ✅ **Construct reusability** - DRY principle for infrastructure
- ✅ **Consistent codebase** - Backend TypeScript + Infrastructure TypeScript
- ✅ **Future-proof** - Easy to add AppSync, Rekognition, complex features
- ✅ **Unit testable** - Can test infrastructure code with Jest
- ✅ **Built-in best practices** - L2/L3 constructs follow AWS Well-Architected

**Cons**:
- ❌ Steeper learning curve (more code initially)
- ❌ More boilerplate
- ❌ Migration effort required (rewrite `serverless.yml`)

**Cost**: Free (AWS tool)

**Complexity**: Medium (more code, better structure long-term)

**Example**:
```typescript
const usersTable = new dynamodb.Table(this, 'UsersTable', {
  tableName: `${serviceName}-users-${stage}`,
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
});

const registerFn = new lambda.NodejsFunction(this, 'AuthRegisterFn', {
  entry: '../backend/functions/auth/register.ts',
  environment: {
    TABLE_USERS: usersTable.tableName,  // Type-safe reference!
  },
});

usersTable.grantReadWriteData(registerFn);  // Auto-generates IAM policy
```

---

## Decision Outcome

**Chosen Option**: **Option B - AWS CDK**

### Rationale

1. **Perfect Timing**
   - Phase 1 backend complete but **NOT YET DEPLOYED**
   - Switching now = zero migration risk
   - Pre-deployment is ideal time to change infrastructure tooling

2. **TypeScript Consistency**
   - Backend: Node.js with TypeScript (strict mode)
   - Infrastructure: TypeScript (not YAML)
   - Single language for all backend code = easier maintenance

3. **Type Safety Prevents Errors**
   - **Serverless YAML**: Typos only discovered at deploy time (after 3-5 min wait)
   - **CDK TypeScript**: Typos caught immediately by IDE and compiler

4. **Better for Future Features**
   - Phase 4: Real-time messaging (AppSync or WebSocket)
   - Phase 6: AI features (Rekognition, Bedrock)
   - Phase 6: Multi-tenant support
   - These are **much easier** with CDK L2/L3 constructs

5. **Official AWS Tool**
   - Maintained by AWS (not third-party)
   - Guaranteed to support new AWS services immediately
   - No vendor lock-in concerns

6. **Solo Developer Benefits**
   - IDE IntelliSense reduces cognitive load
   - Autocomplete reduces typos
   - Type checking reduces deployment failures
   - Refactoring tools work across infrastructure + backend

7. **No Cost Difference**
   - Both tools are free
   - Both use CloudFormation under the hood
   - Same deployment time (~3-5 minutes)

### Trade-offs Accepted

1. **Learning Curve** - CDK requires learning new APIs
   - *Mitigation*: Excellent AWS documentation, AI agent support

2. **More Code Initially** - CDK is more verbose than YAML
   - *Mitigation*: Better structure, reusability, type safety long-term

3. **Migration Time** - 1-2 hours to convert serverless.yml
   - *Mitigation*: Acceptable cost pre-deployment (zero migration risk)

---

## Consequences

### Positive

- ✅ **Type-safe infrastructure** - Catch errors before deployment
- ✅ **Better IDE support** - Autocomplete, IntelliSense for all AWS resources
- ✅ **Unified TypeScript codebase** - Backend + infrastructure in same language
- ✅ **Automatic IAM policies** - `grantReadWriteData()` generates least-privilege policies
- ✅ **Easier complex features** - AppSync, multi-tenant, AI services
- ✅ **Unit testable infrastructure** - Can test CDK stacks with Jest
- ✅ **Official AWS support** - No third-party dependency

### Negative

- ❌ **Migration effort** - 1-2 hours to rewrite serverless.yml → CDK stacks
  - *Acceptable*: Pre-deployment, zero migration risk

- ❌ **Learning curve** - Solo developer needs to learn CDK APIs
  - *Acceptable*: Good documentation, AI agent assistance

- ❌ **More verbose code** - CDK requires more lines than YAML
  - *Acceptable*: Better structure, reusability, maintainability

### Neutral

- TypeScript compilation required before deployment (adds 10-30 seconds)
- CDK bootstrap required (one-time setup per AWS account/region)

---

## Implementation Plan

### Phase 1: Setup CDK (30 minutes)
1. Install AWS CDK CLI globally
2. Initialize CDK TypeScript project
3. Install AWS construct libraries

### Phase 2: Create CDK Stacks (1-2 hours)
1. **Database Stack**: 6 DynamoDB tables with GSIs
2. **Lambda Stack**: 14 Lambda functions with NodejsFunction
3. **API Stack**: API Gateway REST API with Lambda integrations
4. **Storage Stack**: S3 bucket for photos
5. **Monitoring Stack**: CloudWatch alarms and dashboards

### Phase 3: Deploy (5 minutes)
1. Run `cdk bootstrap` (one-time)
2. Run `cdk deploy --all`
3. Test deployed API endpoints

### Phase 4: Archive Serverless Framework
1. Move `infrastructure/serverless.yml` to archive
2. Update documentation (CLAUDE.md, AWS_SETUP.md)

---

## Validation

### Success Criteria

- ✅ All 6 DynamoDB tables deployed with correct schemas
- ✅ All 14 Lambda functions deployed and working
- ✅ API Gateway endpoints respond correctly
- ✅ S3 bucket created with proper permissions
- ✅ IAM policies follow least-privilege principle
- ✅ Infrastructure code is type-safe (no `any` types)
- ✅ Deployment time ≤ 5 minutes (same as Serverless Framework)
- ✅ Cost same or lower than Serverless Framework ($0 - both free)

### Testing

- Unit tests for CDK stacks (snapshot tests)
- Integration test: Deploy to dev environment
- API endpoint tests (same as before)
- Cost validation: Monitor CloudWatch billing

---

## References

- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/latest/guide/home.html)
- [AWS CDK TypeScript Reference](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [ADR-003: Node.js (TypeScript) for Backend](ADR-003-nodejs-typescript-backend.md)

---

## Alternatives Considered and Rejected

### Terraform
- ✅ Infrastructure as Code, widely used
- ❌ HCL language (not TypeScript)
- ❌ Third-party tool (not AWS official)
- ❌ Less AWS-specific than CDK

### AWS SAM (Serverless Application Model)
- ✅ AWS official tool
- ❌ YAML-based (no type safety)
- ❌ Less powerful than CDK
- ❌ Limited to Lambda + API Gateway (CDK supports all AWS services)

### CloudFormation (Raw YAML/JSON)
- ✅ AWS official, full control
- ❌ Extremely verbose
- ❌ No abstractions, lots of boilerplate
- ❌ No type safety

---

## Notes

- **Decision made pre-deployment** - Zero migration risk
- **Solo developer context** - IDE support and type safety reduce cognitive load
- **Long-term project** - Better maintainability outweighs initial learning curve
- **Serverless architecture** - CDK excellent for Lambda + API Gateway + DynamoDB patterns

---

**Decision**: Use AWS CDK (TypeScript) for all infrastructure deployment.

**Next ADR**: ADR-012 (Real-time Messaging: AppSync vs API Gateway WebSocket)
