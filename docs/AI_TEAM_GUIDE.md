# AI Team Guide: How to Work with Your Virtual Development Team

## Introduction

Welcome to your AI-powered development team! This guide will help you (the Product Manager) effectively work with 7 specialized AI agents to build the High School Classmates Connection Platform.

**Your Role**: Product Manager - Define requirements, make product decisions, approve deliverables

**AI Team**: 7 specialized agents that handle development, testing, and deployment

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [The AI Team](#the-ai-team)
3. [Common Workflows](#common-workflows)
4. [Best Practices](#best-practices)
5. [Troubleshooting](#troubleshooting)
6. [Examples](#examples)

---

## Quick Start

### Step 1: Understand Your Team

You have 7 AI agents available via slash commands:

- `/pm` - Project Manager (task planning and coordination)
- `/architect` - System Architect (architecture decisions)
- `/backend-dev` - Backend Developer (Lambda, DynamoDB)
- `/frontend-dev` - Frontend Developer (Flutter, UI/UX)
- `/devops` - DevOps Engineer (deployment, CI/CD)
- `/qa-functional` - Functional QA (feature testing)
- `/qa-performance` - Performance QA (optimization, costs)

### Step 2: Start with the PM Agent

For any new feature or task, start with `/pm`:

```bash
/pm "I want to implement user registration for Phase 1.
     Target: 2 weeks. Please plan and assign tasks."
```

The PM agent will:
1. Break down the feature into tasks
2. Estimate effort
3. Assign tasks to appropriate agents
4. Create a sprint plan
5. Track progress

### Step 3: Review and Approve

The PM agent will present a plan. Review it and approve or adjust:

```
@PM: Looks good! Proceed with the plan.
```

Or make adjustments:

```
@PM: Let's prioritize backend first before frontend.
Start with /architect and /backend-dev tasks this week.
```

### Step 4: Monitor Progress

Check progress regularly:

```bash
/pm "Daily standup: What's our status?"
```

The PM will provide:
- Completed tasks
- In-progress tasks
- Blockers (if any)
- Next steps

---

## The AI Team

### Product Manager (You - Human)

**Your Responsibilities**:
- Define product requirements
- Make final product decisions
- Approve architecture and design choices
- Set priorities and deadlines
- Accept or reject deliverables

**What You DON'T Do**:
- Write code (delegate to developers)
- Design schemas (delegate to architect)
- Write tests (delegate to QA)
- Deploy (delegate to DevOps)

### Project Manager Agent (`/pm`)

**Use When**:
- Starting a new feature
- Planning a sprint
- Tracking progress
- Coordinating multiple tasks
- Need daily standup update

**Example Tasks**:
```bash
/pm "Plan Phase 1: User Registration feature"
/pm "Daily standup - what's our progress?"
/pm "What are our blockers?"
```

**Outputs**:
- Sprint plans with task breakdown
- Progress reports
- Risk assessments
- Next steps recommendations

### System Architect Agent (`/architect`)

**Use When**:
- Making architecture decisions
- Designing DynamoDB schemas
- Defining API contracts
- Need Architecture Decision Record (ADR)
- Evaluating technology options

**Example Tasks**:
```bash
/architect "Design DynamoDB schema for photo tagging feature"
/architect "Should we use AppSync or API Gateway WebSocket?"
/architect "Create ADR for real-time messaging decision"
```

**Outputs**:
- DynamoDB schemas (in ARCHITECTURE.md)
- API specifications
- Architecture Decision Records (ADRs)
- Technology recommendations with trade-offs

### Backend Developer Agent (`/backend-dev`)

**Use When**:
- Building Lambda functions
- Implementing DynamoDB operations
- Integrating AWS services (SNS, SES, S3)
- Creating API endpoints
- Writing backend tests

**Example Tasks**:
```bash
/backend-dev "Implement POST /auth/register Lambda function"
/backend-dev "Create SMS sending service using AWS SNS"
/backend-dev "Add unit tests for auth Lambda functions"
```

**Outputs**:
- Lambda function code (TypeScript)
- DynamoDB operations
- AWS SDK integrations
- Unit tests (Jest)

### Frontend Developer Agent (`/frontend-dev`)

**Use When**:
- Building Flutter screens/widgets
- Implementing state management (Riverpod)
- Integrating with backend APIs
- Creating UI components
- Writing widget tests

**Example Tasks**:
```bash
/frontend-dev "Build login screen with phone number input"
/frontend-dev "Implement auth state management with Riverpod"
/frontend-dev "Create widget tests for registration flow"
```

**Outputs**:
- Flutter widgets and screens (Dart)
- Riverpod state management
- API integration code
- Widget tests

### DevOps Engineer Agent (`/devops`)

**Use When**:
- Setting up CI/CD pipelines
- Deploying to AWS
- Configuring infrastructure (serverless.yml)
- Setting up monitoring (CloudWatch)
- Managing environments (dev, staging, prod)

**Example Tasks**:
```bash
/devops "Set up GitHub Actions for CI/CD"
/devops "Deploy to dev environment"
/devops "Configure CloudWatch alarms for Lambda errors"
```

**Outputs**:
- GitHub Actions workflows
- serverless.yml configuration
- CloudWatch dashboards
- Deployment logs

### Functional QA Agent (`/qa-functional`)

**Use When**:
- Testing new features
- Verifying user flows
- Reporting bugs
- Regression testing
- Before deployment

**Example Tasks**:
```bash
/qa-functional "Test user registration flow end-to-end"
/qa-functional "Verify SMS verification edge cases"
/qa-functional "Regression test after bug fix"
```

**Outputs**:
- Test results (pass/fail)
- Bug reports (with reproduction steps)
- Test coverage reports

### Performance QA Agent (`/qa-performance`)

**Use When**:
- Optimizing Lambda functions
- Checking AWS costs
- Load testing
- Profiling performance
- Before production deployment

**Example Tasks**:
```bash
/qa-performance "Profile POST /messages Lambda function"
/qa-performance "Check AWS costs - are we within budget?"
/qa-performance "Load test with 100 concurrent users"
```

**Outputs**:
- Performance metrics (latency, throughput)
- Cost analysis and optimization recommendations
- Load test results

---

## Common Workflows

### Workflow 1: Building a New Feature

**Goal**: Implement user registration (Phase 1)

**Steps**:

1. **Product Manager (You)** defines requirements:
   ```
   I want to implement 4-step user registration:
   1. Phone number entry
   2. SMS verification
   3. Peer approval
   4. Profile setup

   Target: 2 weeks
   ```

2. **/pm** creates sprint plan:
   ```bash
   /pm "Plan user registration feature. 4-step flow, 2 weeks."
   ```

3. **/architect** designs schema:
   ```bash
   /architect "Design Users and VerificationCodes DynamoDB schemas"
   ```

4. **/backend-dev** builds APIs:
   ```bash
   /backend-dev "Implement POST /auth/register and /auth/verify Lambdas"
   ```

5. **/frontend-dev** builds UI:
   ```bash
   /frontend-dev "Build 4-step registration screens in Flutter"
   ```

6. **/qa-functional** tests:
   ```bash
   /qa-functional "Test complete registration flow with edge cases"
   ```

7. **/qa-performance** optimizes:
   ```bash
   /qa-performance "Profile Lambda execution times, optimize if needed"
   ```

8. **/devops** deploys:
   ```bash
   /devops "Deploy to dev environment and run smoke tests"
   ```

9. **Product Manager (You)** accepts or requests changes:
   ```
   Tested the feature - works great! Deploy to staging.
   ```

### Workflow 2: Making an Architecture Decision

**Goal**: Decide between AppSync vs API Gateway WebSocket for real-time messaging

**Steps**:

1. **Product Manager (You)** raises the question:
   ```
   We need real-time messaging. What's the best approach?
   ```

2. **/architect** analyzes options:
   ```bash
   /architect "Compare AppSync vs API Gateway WebSocket for real-time messaging.
               Consider cost, complexity, and scalability.
               Create an ADR with recommendation."
   ```

3. **/architect** presents analysis:
   ```markdown
   ## ADR-010: Real-time Messaging

   **Options**:
   A) AppSync (GraphQL + managed WebSocket)
      - Pros: Fully managed, built-in subscriptions, less code
      - Cons: More expensive (~$10-20/month), less control
      - Cost: $15/month for 500 users

   B) API Gateway WebSocket + Lambda
      - Pros: More control, potentially cheaper
      - Cons: More code to maintain, custom implementation
      - Cost: $8-12/month for 500 users

   **Recommendation**: Option A (AppSync)
   - Faster time to market (less code)
   - Managed service (less maintenance)
   - Cost difference minimal ($3-8/month)
   ```

4. **Product Manager (You)** decides:
   ```
   Approved. Let's go with AppSync (Option A).
   Time to market is more important than small cost difference.
   ```

5. **/architect** documents:
   ```bash
   /architect "Update ARCHITECTURE.md with AppSync decision and create ADR-010"
   ```

### Workflow 3: Bug Fix

**Goal**: Fix "SMS verification code not received" bug

**Steps**:

1. **/qa-functional** reports bug:
   ```markdown
   **Bug Report**

   **Severity**: High (P1)

   **Steps to Reproduce**:
   1. Enter phone number +852 9123 4567
   2. Click "Send Code"
   3. Wait 5 minutes
   4. No SMS received

   **Expected**: SMS delivered within 30 seconds

   **Actual**: No SMS received
   ```

2. **/backend-dev** investigates:
   ```bash
   /backend-dev "Debug SMS verification Lambda. Check CloudWatch logs
                 for errors when sending to +852 9123 4567."
   ```

3. **/backend-dev** finds root cause:
   ```markdown
   Root cause: AWS SNS requires phone numbers in E.164 format.
   Phone number "+852 9123 4567" has spaces - should be "+85291234567"

   Fix: Strip spaces before sending to SNS
   ```

4. **/backend-dev** implements fix:
   ```bash
   /backend-dev "Fix SMS bug: normalize phone numbers to E.164 format
                 before sending to AWS SNS."
   ```

5. **/qa-functional** verifies fix:
   ```bash
   /qa-functional "Verify SMS verification bug fix.
                   Test with various phone number formats."
   ```

6. **/devops** deploys:
   ```bash
   /devops "Deploy SMS bug fix to production (hot fix)"
   ```

### Workflow 4: Sprint Planning

**Goal**: Plan 2-week sprint for Phase 1

**Steps**:

1. **Product Manager (You)** reviews roadmap:
   ```
   Looking at ROADMAP.md, we're in Phase 1: Authentication & User Management.
   Let's plan the next 2-week sprint.
   ```

2. **/pm** creates sprint plan:
   ```bash
   /pm "Plan 2-week sprint for Phase 1. Focus on SMS verification,
        peer approval, and profile setup. Review ROADMAP.md for tasks."
   ```

3. **/pm** presents sprint plan:
   ```markdown
   ## Sprint 1: Phase 1 Authentication (Week 1-2)

   **Goal**: Complete SMS verification and peer approval

   **Tasks**:

   **Week 1**:
   1. [/architect] Design Users, VerificationCodes, PendingApprovals schemas (4h)
   2. [/backend-dev] Implement POST /auth/register Lambda (8h)
   3. [/backend-dev] Implement POST /auth/verify Lambda (8h)
   4. [/backend-dev] Implement peer approval Lambdas (4h)
   5. [/devops] Set up DynamoDB tables in dev (2h)

   **Week 2**:
   6. [/frontend-dev] Build registration screens (8h)
   7. [/frontend-dev] Build approval waiting screen (4h)
   8. [/frontend-dev] Implement auth state management (4h)
   9. [/qa-functional] Test registration + approval flow (4h)
   10. [/devops] Deploy to dev and staging (2h)

   **Total**: 48 hours (~2 weeks)

   **Risks**:
   - AWS SNS setup may take longer (first time)
   - Need real phone numbers for testing
   ```

4. **Product Manager (You)** approves:
   ```
   Sprint plan approved. Let's start with architecture and backend first.
   Begin Week 1 tasks.
   ```

5. **/pm** starts execution:
   ```bash
   /pm "Create TodoWrite list for Sprint 1 and assign first task to /architect"
   ```

---

## Best Practices

### 1. Start with Planning

❌ **Don't**:
```bash
/backend-dev "Build user registration"
```
(Too vague, no schema, no plan)

✅ **Do**:
```bash
/pm "Plan user registration feature"
```
(Proper planning with task breakdown)

### 2. Let Agents Specialize

❌ **Don't**:
```bash
/backend-dev "Build registration Lambda and Flutter screen"
```
(Mixing backend and frontend)

✅ **Do**:
```bash
/backend-dev "Build registration Lambda"
/frontend-dev "Build registration screen"
```
(Each agent focuses on their domain)

### 3. Always Test Before Deploy

❌ **Don't**:
```bash
/devops "Deploy to production"
```
(No testing!)

✅ **Do**:
```bash
/qa-functional "Test feature X"
/qa-performance "Check performance"
/devops "Deploy to dev first, then staging, then production"
```

### 4. Track Progress

❌ **Don't**:
Let tasks run without tracking

✅ **Do**:
```bash
/pm "Daily standup - update status"
```
(Regular check-ins)

### 5. Escalate Blockers

❌ **Don't**:
Let blockers linger for days

✅ **Do**:
```bash
/pm "We're blocked on AWS account approval. ETA?"
```
(Escalate immediately)

---

## Troubleshooting

### Issue: Agent Doesn't Have Enough Context

**Symptom**: Agent asks for requirements or seems confused

**Solution**: Provide more context from documentation

```bash
# Instead of:
/backend-dev "Build messages Lambda"

# Do this:
/backend-dev "Build messages Lambda. See ARCHITECTURE.md for Messages table schema.
              API should accept recipientId, content, messageType. Return messageId and timestamp."
```

### Issue: Unclear Which Agent to Use

**Symptom**: Not sure which slash command to use

**Solution**: Use `/pm` to delegate

```bash
/pm "I need to optimize DynamoDB query performance. Which agent should handle this
     and what should they do?"
```

### Issue: Tasks Taking Too Long

**Symptom**: Sprint running behind schedule

**Solution**: Check with PM, adjust scope

```bash
/pm "We're in Week 2 but only 40% complete. Should we descope or extend sprint?"
```

### Issue: Quality Issues (Too Many Bugs)

**Symptom**: QA finding lots of bugs

**Solution**: Slow down, add more testing

```bash
/pm "Pause new development. Focus on fixing bugs and improving test coverage."
/qa-functional "Run full regression test suite"
```

### Issue: AWS Costs Too High

**Symptom**: Costs exceeding budget

**Solution**: Escalate to Performance QA

```bash
/qa-performance "AWS costs are $150/month, target is $100. Investigate and optimize."
```

---

## Examples

### Example 1: First Day Setup

```bash
# Day 1: Set up development environment
/pm "Today is Day 1. Review Phase 0 in ROADMAP.md and create a plan
     for setting up the development environment."

# PM creates plan, you approve

# Execute tasks
/devops "Set up GitHub Actions for CI/CD pipeline"
/architect "Review and finalize DynamoDB schema for Phase 1"
/devops "Configure AWS account and create DynamoDB tables for dev environment"
```

### Example 2: Weekly Sprint Review

```bash
# End of Week 1
/pm "Sprint review: What did we accomplish this week?
     What's incomplete? What should we prioritize next week?"

# PM provides summary
# You decide priorities for next week
```

### Example 3: Architecture Review

```bash
# Before starting Phase 2B (Photo Tagging)
/architect "Review the photo tagging feature requirements from PROJECT_OVERVIEW.md.
            Design the DynamoDB schema for Photos and PhotoTags tables.
            Document access patterns and GSI strategy."

# Architect provides schema
# You review and approve
```

---

## Next Steps

1. ✅ Read this guide
2. Try your first command:
   ```bash
   /pm "Review ROADMAP.md Phase 0 and create a plan for this week"
   ```
3. Start building!

---

**Remember**: You're the Product Manager. The AI team executes your vision. Define requirements clearly, delegate appropriately, and let each agent focus on what they do best. You focus on product decisions and strategic direction.

**For Help**: See individual agent documentation in `/.claude/commands/*.md` or ask:
```bash
/pm "I need help understanding how to use the AI team effectively"
```

Happy building! 🚀
