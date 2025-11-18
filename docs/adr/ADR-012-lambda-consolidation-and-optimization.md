# ADR-012: Lambda Function Consolidation and Architecture Optimization

**Status**: Accepted
**Date**: 2025-11-18
**Decision Makers**: System Architect, Product Manager
**Supersedes**: Initial 14-function architecture from Phase 1

---

## Context

After successful Phase 1 deployment with 14 separate Lambda functions, architecture review identified significant over-engineering for project scale:

**Current State** (Over-engineered):
- 14 separate Lambda functions (one per endpoint)
- Each function: separate IAM role, separate CloudFormation resource
- Duplicate dependencies bundled 14 times (~500KB × 14 = 7MB total)
- Higher cold start probability (14 functions can go cold independently)
- Complex deployment and maintenance

**Project Scale**:
- 500 users initially, 5,000 eventually
- Sporadic usage pattern (reunion planning, not daily-use app)
- Budget: <$200/month production
- Solo developer with AI assistance

**Problem**:
- **Cost**: Unnecessary overhead (~$10-15/month wasted)
- **Performance**: More cold starts = slower responses
- **Complexity**: 14 functions harder to maintain than 3-4
- **Development velocity**: Changes require updating multiple functions

---

## Decision

**Consolidate 14 Lambda functions → 3 domain-based services:**

1. **auth-service** (5 endpoints)
   - POST /auth/register
   - POST /auth/verify
   - GET /auth/pending-approvals
   - POST /auth/approve/{userId}
   - POST /auth/reject/{userId}

2. **users-service** (5 endpoints)
   - PUT /users/{userId}/profile
   - POST /users/{userId}/profile-photo
   - PUT /users/{userId}/profile-photo-complete
   - GET /users/{userId}/preferences
   - PUT /users/{userId}/preferences

3. **classrooms-service** (4 endpoints)
   - GET /classrooms
   - POST /users/{userId}/classrooms
   - GET /users/{userId}/classrooms
   - GET /classrooms/{classroomId}/members

**Additional Optimizations**:
- Lambda Layers for shared dependencies (AWS SDK, utilities, node_modules)
- API Gateway caching for GET endpoints (5-minute TTL)
- CloudFront CDN for S3 photos
- CloudWatch alarms for cost and error monitoring

---

## Alternatives Considered

### Alternative 1: Keep 14 Separate Functions
**Pros**:
- Granular scaling per endpoint
- Simpler debugging (one function per endpoint)
- Already deployed and working

**Cons**:
- Over-engineered for scale (500-5000 users)
- Higher costs (~$10-15/month wasted)
- More cold starts
- Complex maintenance

**Decision**: Rejected - unnecessary complexity for project scale

---

### Alternative 2: Single Monolithic Lambda
**Pros**:
- Simplest deployment (one function)
- Lowest cold start probability
- Easiest to maintain

**Cons**:
- No domain separation
- All endpoints scale together (inefficient)
- Larger bundle size (~2-3MB)
- Violates single responsibility principle

**Decision**: Rejected - too monolithic, loses domain benefits

---

### Alternative 3: 3 Domain Services (CHOSEN)
**Pros**:
- ✅ Right-sized for scale (500-5000 users)
- ✅ Domain separation (auth, users, classrooms)
- ✅ 70% fewer cold starts (3 vs 14 functions)
- ✅ Simpler deployment (3 CloudFormation resources)
- ✅ Better code reuse (shared utilities per domain)
- ✅ Cost savings (~$10-15/month)
- ✅ 60% smaller bundles with Lambda Layers

**Cons**:
- One-time migration effort (~17 hours backend work)
- Less granular scaling (acceptable trade-off)
- All domain endpoints share same cold start

**Decision**: **ACCEPTED** - Best balance of simplicity, cost, performance

---

### Alternative 4: Use Express.js for Routing
**Pros**:
- Familiar Node.js pattern
- Standard middleware support

**Cons**:
- +50-100KB bundle size (Express + serverless-http)
- Slower cold starts (Express app initialization)
- Third-party dependency
- Not AWS-native

**Decision**: Rejected - API Gateway already does routing, Express adds unnecessary overhead

---

## Routing Strategy

**Use API Gateway Native Routing (Not Express.js)**

API Gateway defines routes, Lambda does internal routing based on `event.resource` and `event.httpMethod`:

```typescript
export async function handler(event: APIGatewayProxyEvent) {
  const route = `${event.httpMethod} ${event.resource}`;

  switch (route) {
    case 'POST /auth/register':
      return await registerHandler(event);
    case 'POST /auth/verify':
      return await verifyHandler(event);
    // etc.
  }
}
```

**Benefits**:
- No Express.js dependency (0KB overhead)
- Faster cold starts (no app initialization)
- AWS-native pattern
- CloudWatch logs show exact routes

---

## Lambda Layers Strategy

**Create 3 Lambda Layers**:

1. **aws-sdk-layer** (~200KB)
   - @aws-sdk/client-dynamodb
   - @aws-sdk/client-sns
   - @aws-sdk/client-ses
   - @aws-sdk/client-s3
   - @aws-sdk/client-secretsmanager

2. **shared-utils-layer** (~100KB)
   - Shared utilities (response, logger, DynamoDB, JWT, phone, validation)
   - Shared models (user, classroom, etc.)

3. **node-modules-layer** (~150KB)
   - jsonwebtoken
   - uuid
   - Other third-party dependencies

**Benefits**:
- Function bundle size: 500KB → 50KB (-90%)
- Cold start time: ~3-4s → ~1-2s (-50%)
- Deploy layers once, reuse across functions
- Faster deployments (deploy 50KB function, not 500KB)

---

## Migration Strategy

**Phase 1: Preparation** (Day 1)
- Create backend/services/ directory structure
- Create Lambda Layers (3 layers)
- Update CDK lambda-stack.ts and api-stack.ts

**Phase 2: Migration** (Days 2-3)
- Copy existing handler files to services/*/handlers/
- Create index.ts routers for each service
- Update CDK to deploy 3 functions
- Keep old functions deployed (parallel deployment)

**Phase 3: Testing** (Day 4)
- Regression test all 14 endpoints
- Performance test cold starts
- Validate API Gateway cache

**Phase 4: Cutover** (Day 5)
- Switch API Gateway routes to new functions
- Monitor for 24 hours
- Delete old 14 functions (rollback available)

**Rollback Plan**: Keep old functions for 1 week, can revert routing instantly

---

## Performance Impact

**Cold Start**:
- Before: 14 functions × 30% cold start probability = 4.2 cold starts per day
- After: 3 functions × 30% cold start probability = 0.9 cold starts per day
- **Improvement**: -78% cold starts

**Response Time**:
- Cached GET requests: ~10ms (API Gateway cache)
- Uncached requests: Same as before (~200-300ms)
- Cold start: 3-4s → 1-2s (-50%)

**Bundle Size**:
- Before: 500KB per function × 14 = 7MB total
- After: 50KB per function × 3 = 150KB + 450KB layers = 600KB total
- **Improvement**: -91% total bundle size

---

## Cost Impact

**Lambda Invocations**:
- Before: 14 functions, ~10K requests/month = 10K invocations
- After (with API Gateway cache): 3 functions, ~5K requests/month = 5K invocations
- **Savings**: ~$0.50/month on invocations

**Lambda Compute**:
- Before: 14 functions × 200ms avg × 256MB = higher GB-seconds
- After: 3 functions × 200ms avg × 256MB + layer overhead = lower GB-seconds
- **Savings**: ~$2-3/month on compute

**API Gateway Cache**:
- Cost: $14/month (0.5GB cache)
- Savings: ~$20-30/month (fewer Lambda invocations)
- **Net Savings**: ~$6-16/month

**Total Monthly Savings**:
- Dev: ~$10/month (from $20-45 to $10-35)
- Production: ~$20-30/month (from $110-335 to $90-305)

---

## Risks and Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Migration breaks endpoints | Medium | High | Comprehensive regression testing, parallel deployment |
| Cold starts still slow | Low | Medium | Lambda Layers reduce bundle size by 90% |
| Domain coupling | Low | Low | Clear domain boundaries, future split if needed |
| API Gateway cache issues | Low | Medium | Test cache invalidation, monitor hit rates |

---

## Monitoring and Success Criteria

**Performance Metrics**:
- ✅ Cold start time: <2 seconds (down from 3-4 seconds)
- ✅ API response (cached): <10ms
- ✅ API response (uncached): <300ms
- ✅ Bundle size: <100KB per function (down from 500KB)

**Cost Metrics**:
- ✅ Dev environment: <$15/month (down from $20-45)
- ✅ Production: <$120/month (down from $110-335)

**Quality Metrics**:
- ✅ Zero regressions (all endpoints work)
- ✅ Test coverage: >80%
- ✅ CloudWatch errors: <1% of requests

---

## References

- AWS Lambda Best Practices: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
- Lambda Layers: https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html
- API Gateway Caching: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-caching.html
- Serverless Architecture Patterns: https://aws.amazon.com/serverless/patterns/

---

## Approval

**Approved By**: Product Manager
**Date**: 2025-11-18
**Implementation Start**: 2025-11-18
**Expected Completion**: 2025-11-22 (5 days)

**Next Steps**:
1. Backend-dev: Begin migration (17 hours)
2. DevOps: Update CDK infrastructure (8 hours)
3. QA: Regression testing (8 hours)
4. Deploy to dev, monitor for 24 hours
