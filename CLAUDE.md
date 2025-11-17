# CLAUDE.md - AI Assistant Guide for sjc1990app

## Repository Overview

**Repository**: tongsitat/sjc1990app
**Status**: Initial setup / Early development
**Last Updated**: 2025-11-17

This document serves as a comprehensive guide for AI assistants (like Claude) working with this codebase. It contains essential information about the project structure, development workflows, coding conventions, and best practices.

---

## Table of Contents

1. [Project Status](#project-status)
2. [Codebase Structure](#codebase-structure)
3. [AI Team Structure](#ai-team-structure) **(NEW!)**
4. [Development Workflows](#development-workflows)
5. [Coding Conventions](#coding-conventions)
6. [AI Assistant Guidelines](#ai-assistant-guidelines)
7. [Common Tasks](#common-tasks)
8. [Testing Strategy](#testing-strategy)
9. [Deployment](#deployment)

---

## Project Status

### Current State

**Project Name**: High School Classmates Connection Platform

**Project Type**: Multi-platform communication application (Mobile + Web + Backend)

**Tech Stack**:
- **Frontend**: Flutter (iOS, Android, Web)
- **Backend**: Node.js (TypeScript) with AWS Lambda (Serverless)
- **Database**: Amazon DynamoDB (NoSQL, serverless)
- **Communication**: SMS (AWS SNS), Email (AWS SES), WhatsApp API
- **Infrastructure**: AWS (Serverless - Lambda, API Gateway, DynamoDB)

**Development Stage**: Planning / Initial Architecture

**Team Size**: Solo developer with 35 years of reunion organizing experience

**Project Purpose**:
A trusted, unified communication platform for high school classmates that bridges multiple communication channels (app, SMS, email, WhatsApp) based on individual preferences. Built to serve classmates who use different platforms while maintaining trust through personal ownership and operation.

### Key Milestones

**Phase 1: Foundation**
- [x] Repository initialized
- [x] Project architecture documented
- [x] Technology stack finalized (Node.js, DynamoDB, AWS Lambda)
- [ ] Development environment setup
- [ ] DynamoDB schema designed
- [ ] AWS account and services configured

**Phase 2: Authentication & User Management**
- [ ] SMS verification system implemented (AWS SNS)
- [ ] User registration workflow (4-step process with photo tagging)
- [ ] Peer approval system
- [ ] User preference management
- [ ] Classroom identification system (multi-classroom tracking)
- [ ] Profile photo upload

**Phase 3: Photo Management & Recognition**
- [ ] Old class photo upload system (admin)
- [ ] Photo tagging interface (users tag themselves)
- [ ] Photo gallery and browsing
- [ ] Shared classroom discovery (who was in same class)
- [ ] Profile linking (old photos to current profile)

**Phase 4: Core Communication**
- [ ] 1:1 messaging within app
- [ ] Main forum implementation
- [ ] Interest-based sub-forums
- [ ] Forum permissions and moderation
- [ ] Real-time messaging (WebSocket or AppSync)

**Phase 5: Cross-Channel Bridge (Priority)**
- [ ] Email integration (send/receive via SES)
- [ ] SMS integration (send/receive via SNS)
- [ ] WhatsApp integration (send/receive)
- [ ] Message routing engine (Lambda-based)
- [ ] Channel preference handler
- [ ] Identity mapping across channels

**Phase 6: Advanced Features**
- [ ] AI-powered photo face recognition (AWS Rekognition)
- [ ] Notification preferences and digests
- [ ] Media sharing across channels
- [ ] Event planning and RSVP
- [ ] Reunion organizing tools
- [ ] Multi-tenant support (other graduating classes)

---

## Codebase Structure

### Directory Layout

```
sjc1990app/
├── mobile/                    # Flutter mobile/web app
│   ├── lib/
│   │   ├── models/           # Data models
│   │   ├── screens/          # UI screens
│   │   ├── widgets/          # Reusable widgets
│   │   ├── services/         # API and business logic
│   │   └── utils/            # Helper functions
│   ├── test/                 # Flutter tests
│   └── pubspec.yaml          # Flutter dependencies
│
├── backend/                   # Serverless backend (Lambda functions)
│   ├── functions/            # Lambda function handlers
│   │   ├── auth/            # Authentication functions
│   │   ├── users/           # User management functions
│   │   ├── messages/        # Messaging functions
│   │   ├── forums/          # Forum functions
│   │   ├── photos/          # Photo management functions
│   │   └── routing/         # Cross-channel routing functions
│   ├── layers/               # Lambda layers (shared dependencies)
│   ├── integrations/         # External service integrations
│   │   ├── sns/             # AWS SNS for SMS
│   │   ├── ses/             # AWS SES for email
│   │   └── whatsapp/        # WhatsApp Business API
│   ├── shared/               # Shared utilities and models
│   │   ├── models/          # DynamoDB data models
│   │   ├── utils/           # Helper functions
│   │   └── middleware/      # Lambda middleware
│   └── tests/                # Backend tests
│
├── infrastructure/            # Infrastructure as Code
│   ├── serverless.yml        # Serverless Framework config
│   ├── cloudformation/       # CloudFormation templates (optional)
│   └── scripts/              # Deployment scripts
│
├── docs/                      # Documentation
│   ├── architecture/         # System design diagrams
│   ├── adr/                  # Architecture Decision Records
│   ├── api/                  # API documentation
│   └── guides/               # Development guides
│
├── scripts/                   # Build and utility scripts
├── .github/                   # GitHub workflows and templates
├── CLAUDE.md                  # AI assistant guide (this file)
├── PROJECT_OVERVIEW.md        # Detailed project requirements
├── ARCHITECTURE.md            # Technical architecture
├── ROADMAP.md                 # Development roadmap
└── AWS_COST_ANALYSIS.md       # AWS cost breakdown and estimates
```

### Key Directories

#### `/mobile`
- **Purpose**: Flutter cross-platform application (iOS, Android, Web)
- **Conventions**: Follow Flutter/Dart style guide, feature-based organization
- **Key Features**: User registration, photo tagging, messaging, forum participation, preference management

#### `/backend`
- **Purpose**: Serverless backend using AWS Lambda functions
- **Conventions**: Node.js (TypeScript), function-per-endpoint pattern, shared layers
- **Key Components**:
  - Lambda functions for all API endpoints
  - DynamoDB for data persistence
  - API Gateway for RESTful API
  - AppSync or API Gateway WebSocket for real-time

#### `/backend/functions`
- **Purpose**: Individual Lambda function handlers
- **Organization**: Grouped by domain (auth, users, messages, forums, photos, routing)
- **Each function**: Single responsibility, minimal dependencies, fast cold start

#### `/backend/integrations`
- **Purpose**: External service integrations for cross-channel communication
- **Critical Services**:
  - SMS (AWS SNS - cost-effective for international)
  - Email (AWS SES - integrated with AWS)
  - WhatsApp (Business API via Twilio or direct)
- **Security**: All API keys in AWS Secrets Manager or environment variables

#### `/infrastructure`
- **Purpose**: Infrastructure as Code using Serverless Framework
- **Key Files**:
  - `serverless.yml`: Main configuration for Lambda, API Gateway, DynamoDB
  - CloudFormation templates for complex resources
  - Deployment scripts

#### `/docs`
- **Purpose**: Comprehensive project documentation
- **Conventions**: Markdown format, keep updated with code changes
- **Includes**: Architecture diagrams, API specs, user guides, ADRs, cost analysis

---

## AI Team Structure

### Overview

This project uses a **multi-agent AI team approach** where specialized AI agents handle different aspects of development. As the Product Manager, you orchestrate these agents to build the platform efficiently.

**Team Model**: 1 Product Manager (Human) + 7 AI Agents (Claude Code)

### The AI Team

| Role | Slash Command | Expertise | Primary Responsibilities |
|------|---------------|-----------|--------------------------|
| **Frontend Developer** | `/frontend-dev` | Flutter, Dart, Riverpod | Build screens, widgets, state management, API integration |
| **Backend Developer** | `/backend-dev` | Node.js, TypeScript, Lambda, DynamoDB | Build Lambda functions, DynamoDB operations, AWS integrations |
| **System Architect** | `/architect` | System design, data modeling, AWS architecture | Make architecture decisions, design schemas, write ADRs |
| **DevOps Engineer** | `/devops` | CI/CD, deployments, infrastructure | Set up pipelines, deploy to AWS, monitor infrastructure |
| **Functional QA** | `/qa-functional` | Testing, bug reporting | Test features, report bugs, verify user flows |
| **Performance QA** | `/qa-performance` | Performance testing, cost optimization | Profile Lambdas, optimize costs, load testing |
| **Project Manager** | `/pm` | Task coordination, progress tracking | Break down tasks, assign work, track progress |

### How It Works

1. **You (Product Manager)** define requirements and make final decisions
2. **Project Manager Agent** (`/pm`) breaks down work into tasks
3. **Specialized Agents** execute tasks in their domain
4. **QA Agents** verify quality before deployment
5. **DevOps Agent** deploys to AWS

### Usage Examples

#### Starting a New Feature

```bash
# As Product Manager, delegate to PM agent
/pm "Plan the user registration feature for Phase 1.
     Break down into tasks and assign to appropriate agents."

# PM agent will then delegate to:
# - /architect for schema design
# - /backend-dev for Lambda functions
# - /frontend-dev for UI screens
# - /qa-functional for testing
# - /devops for deployment
```

#### Direct Task Assignment

```bash
# Directly assign to specific agent
/backend-dev "Implement POST /messages Lambda function.
              Store messages in DynamoDB Messages table."

/frontend-dev "Build the chat screen with message bubbles,
               text input, and send button."

/architect "Design the DynamoDB schema for photo tagging.
            Users should be able to tag themselves and view tagged photos."
```

#### Quality Assurance

```bash
# Before committing code
/qa-functional "Test the SMS verification flow.
                Verify all edge cases."

/qa-performance "Profile the POST /messages Lambda.
                 Target: <300ms response time."
```

#### Infrastructure & Deployment

```bash
/devops "Set up GitHub Actions CI/CD pipeline.
         Deploy to dev on merge to develop branch."

/devops "Deploy the latest changes to staging environment."
```

### Agent Communication Flow

```
Product Manager (You)
        ↓
   Project Manager (/pm)
        ↓
   ┌────┴────┬─────────┬──────────┬──────────┐
   ↓         ↓         ↓          ↓          ↓
Architect  Backend  Frontend  DevOps     QA Agents
        ↘      ↓         ↓          ↓      ↙
              Code Review & Testing
                      ↓
              Production Deployment
```

### Agent Coordination Patterns

#### Pattern 1: Full Feature Development

```bash
1. /pm "Plan user registration feature"
   → Creates task breakdown

2. /architect "Design Users DynamoDB schema"
   → Updates ARCHITECTURE.md

3. /backend-dev "Implement registration Lambda"
   → Builds backend API

4. /frontend-dev "Build registration screen"
   → Builds UI

5. /qa-functional "Test registration flow"
   → Verifies functionality

6. /qa-performance "Check Lambda performance"
   → Optimizes if needed

7. /devops "Deploy to dev environment"
   → Deploys and monitors
```

#### Pattern 2: Architecture Decision

```bash
1. /architect "Should we use AppSync or API Gateway WebSocket
               for real-time messaging?"
   → Analyzes options, documents ADR

2. Product Manager decides based on recommendation

3. /architect "Update ARCHITECTURE.md with WebSocket decision"
   → Documents final decision
```

#### Pattern 3: Bug Fix

```bash
1. /qa-functional "Reports: SMS verification code not working"

2. /backend-dev "Debug SMS verification Lambda"
   → Identifies and fixes bug

3. /qa-functional "Verify SMS verification fix"
   → Regression testing

4. /devops "Deploy bug fix to production"
   → Hot fix deployment
```

### Best Practices

#### For Product Manager (You)

✅ **DO**:
- Start features with `/pm` for planning
- Review agent recommendations before approval
- Make final product decisions yourself
- Escalate technical vs product trade-offs to appropriate agent

❌ **DON'T**:
- Micromanage implementation details (trust the agents)
- Skip QA before deployment
- Make architecture decisions without `/architect` input

#### Agent Handoffs

- **Architect → Backend**: Schema design → implementation
- **Backend → Frontend**: API complete → UI integration
- **Development → QA**: Code complete → testing
- **QA → DevOps**: Tests pass → deployment

### Documentation

For detailed instructions on using each agent, see:
- **Quick Start**: `/docs/AI_TEAM_GUIDE.md`
- **Agent Definitions**: `/.claude/commands/*.md`

Each agent's slash command file (`.claude/commands/`) contains:
- Role definition and expertise
- Responsibilities and constraints
- Quality standards
- Escalation guidelines
- Example tasks

### Productivity Benefits

**Traditional Solo Development**:
- 1 person switches between all roles
- Context switching overhead
- Harder to maintain quality standards

**With AI Agent Team**:
- Specialized focus per agent
- Parallel task execution possible
- Consistent quality standards per domain
- Built-in code review (architecture, QA perspectives)
- Automated task tracking (TodoWrite tool)

### Next Steps

1. Read `/docs/AI_TEAM_GUIDE.md` for detailed usage guide
2. Try `/pm` to plan your first feature
3. Use `/architect` to review architecture decisions
4. Delegate implementation to `/backend-dev` and `/frontend-dev`
5. Quality-check with `/qa-functional` and `/qa-performance`
6. Deploy with `/devops`

---

## Development Workflows

### Branch Strategy

**Main Branch**: `main` (or `master`)
- Protected branch
- Requires PR reviews
- Always deployable

**Feature Branches**:
- Format: `claude/claude-md-{session-id}` for AI-driven changes
- Format: `feature/{feature-name}` for human-driven features
- Format: `fix/{bug-description}` for bug fixes
- Format: `docs/{description}` for documentation updates

### Git Workflow

1. **Starting New Work**
   ```bash
   git checkout -b feature/my-feature
   # Make changes
   git add .
   git commit -m "feat: descriptive message"
   git push -u origin feature/my-feature
   ```

2. **Commit Message Format**
   Follow Conventional Commits:
   - `feat:` New features
   - `fix:` Bug fixes
   - `docs:` Documentation changes
   - `test:` Test additions/updates
   - `refactor:` Code refactoring
   - `style:` Formatting changes
   - `chore:` Build/config updates

3. **Pull Request Process**
   - Create PR with descriptive title and body
   - Include summary of changes
   - Reference related issues
   - Ensure CI passes
   - Request reviews if applicable

### Code Review Guidelines

- Review for correctness, security, performance
- Check test coverage
- Verify documentation updates
- Ensure conventions are followed

---

## Coding Conventions

### General Principles

1. **Clarity over Cleverness**: Write code that's easy to understand
2. **DRY (Don't Repeat Yourself)**: Extract reusable logic
3. **SOLID Principles**: Follow object-oriented design principles
4. **Security First**: Never commit secrets, validate inputs, sanitize outputs

### Language-Specific Conventions

#### JavaScript/TypeScript
```javascript
// Use meaningful variable names
const userData = fetchUser(userId);

// Prefer const/let over var
const MAX_RETRIES = 3;
let currentAttempt = 0;

// Use async/await over callbacks
async function fetchData() {
  const response = await fetch(url);
  return response.json();
}

// Document complex functions
/**
 * Calculates user engagement score based on activity metrics
 * @param {Object} metrics - User activity metrics
 * @returns {number} Engagement score (0-100)
 */
function calculateEngagement(metrics) {
  // Implementation
}
```

#### Python
```python
# Follow PEP 8
# Use type hints
def process_data(items: list[str]) -> dict[str, int]:
    """Process items and return frequency count."""
    return {item: items.count(item) for item in set(items)}

# Use context managers
with open('file.txt') as f:
    content = f.read()
```

### File Naming Conventions

- Use lowercase with hyphens for files: `user-service.js`
- Use PascalCase for class files: `UserService.js`
- Use kebab-case for directories: `user-management/`

### Code Organization

- One class/component per file (when reasonable)
- Group related functionality into modules
- Keep files under 300 lines when possible
- Extract complex logic into helper functions

---

## AI Assistant Guidelines

### When Working on This Codebase

#### DO:
- ✅ Read existing code before making changes
- ✅ Follow established patterns and conventions
- ✅ Write tests for new functionality
- ✅ Update documentation alongside code changes
- ✅ Use TodoWrite tool to track multi-step tasks
- ✅ Check for security vulnerabilities (XSS, SQL injection, etc.)
- ✅ Verify changes don't break existing functionality
- ✅ Use descriptive commit messages
- ✅ Ask for clarification when requirements are ambiguous

#### DON'T:
- ❌ Make assumptions about undefined requirements
- ❌ Skip writing tests
- ❌ Commit commented-out code
- ❌ Introduce breaking changes without discussion
- ❌ Hardcode sensitive values
- ❌ Use deprecated APIs or libraries
- ❌ Create files unnecessarily (prefer editing existing)
- ❌ Push directly to main/master branch

### Security Best Practices

1. **Input Validation**: Always validate and sanitize user input
2. **Authentication**: Follow established auth patterns
3. **Secrets Management**: Use environment variables, never commit secrets
4. **Dependencies**: Keep dependencies updated, check for vulnerabilities
5. **Error Handling**: Don't expose sensitive info in error messages

### Performance Considerations

- Profile before optimizing
- Consider algorithmic complexity (O(n) vs O(n²))
- Use caching appropriately
- Optimize database queries
- Lazy load resources when possible

### Code Quality Checklist

Before completing any task:
- [ ] Code follows project conventions
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No security vulnerabilities introduced
- [ ] Error handling is comprehensive
- [ ] Code is DRY and maintainable
- [ ] Commit messages are descriptive
- [ ] Changes are pushed to correct branch

---

## Common Tasks

### Adding a New Feature

1. **Plan the Implementation**
   - Use TodoWrite to break down tasks
   - Identify affected files/modules
   - Consider edge cases and error handling

2. **Implementation**
   - Write tests first (TDD) or alongside code
   - Follow existing patterns
   - Keep changes focused and atomic

3. **Testing**
   - Unit tests for individual functions
   - Integration tests for module interactions
   - E2E tests for critical user flows

4. **Documentation**
   - Update README if user-facing
   - Add code comments for complex logic
   - Update API docs if applicable

### Fixing a Bug

1. **Reproduce the Issue**
   - Write a failing test that demonstrates the bug
   - Understand the root cause

2. **Fix**
   - Make minimal changes to fix the issue
   - Ensure the test now passes
   - Verify no regressions

3. **Document**
   - Add comment explaining the fix if not obvious
   - Update changelog/release notes

### Refactoring

1. **Ensure Test Coverage**
   - Write tests for existing behavior first
   - Tests should pass before refactoring

2. **Refactor**
   - Make incremental changes
   - Keep tests passing at each step
   - Improve code quality without changing behavior

3. **Verify**
   - All tests still pass
   - No performance degradation
   - Code is more maintainable

---

## Testing Strategy

### Test Levels

**Unit Tests**
- Test individual functions/methods in isolation
- Fast execution
- High coverage (aim for >80%)

**Integration Tests**
- Test module interactions
- Verify data flows correctly
- Test API endpoints

**End-to-End Tests**
- Test critical user journeys
- Simulate real user behavior
- Run before releases

### Testing Best Practices

- Write tests before or alongside code
- Keep tests independent and isolated
- Use descriptive test names: `should_return_error_when_user_not_found`
- Mock external dependencies
- Test edge cases and error conditions

### Running Tests

```bash
# Run all tests
npm test  # or pytest, cargo test, etc.

# Run specific test file
npm test path/to/test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## Deployment

### Environments

**Development**
- Local development environment
- Feature branches
- Frequent deployments

**Staging**
- Pre-production environment
- Mirrors production setup
- Final testing before release

**Production**
- Live environment
- Requires approval
- Monitored and backed up

### Deployment Checklist

- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Database migrations tested
- [ ] Environment variables configured
- [ ] Monitoring and logging configured
- [ ] Rollback plan prepared

### CI/CD Pipeline

**On Pull Request**:
- Run linters
- Run tests
- Check code coverage
- Build project

**On Merge to Main**:
- Run full test suite
- Build production artifacts
- Deploy to staging
- Run smoke tests

**On Release Tag**:
- Deploy to production
- Send notifications
- Update changelog

---

## Project-Specific Notes

### Technology Stack

**Frontend - Flutter Application**:
- **Framework**: Flutter 3.x+ (Dart)
- **State Management**: Riverpod (compile-safe, modern)
- **UI Components**: Material Design 3 / Custom widgets
- **Platforms**: iOS, Android, Web (single codebase)

**Backend - Serverless (AWS Lambda)**:
- **Language**: Node.js 20.x with TypeScript
- **API**: RESTful API via AWS API Gateway
- **Real-time**: AWS AppSync (GraphQL + WebSocket) or API Gateway WebSocket
- **Authentication**: AWS Cognito + JWT + SMS verification (SNS)
- **Functions**: Individual Lambda functions per endpoint

**Database - Amazon DynamoDB**:
- **Type**: NoSQL, serverless, fully managed
- **Pricing**: On-demand (pay-per-request) - cost-effective for sporadic usage
- **Tables**: Users, Classrooms, Messages, Forums, Photos, PhotoTags
- **Why DynamoDB**: ~9x cheaper than RDS for low-traffic apps, true serverless

**Storage & CDN**:
- **Object Storage**: Amazon S3 (class photos, profile pictures, attachments)
- **CDN**: Amazon CloudFront (global content delivery)
- **Image Processing**: AWS Lambda with Sharp library

**External Integrations**:
- **SMS**: AWS SNS (50-80% cheaper than Twilio for international)
- **Email**: AWS SES ($0.10 per 1,000 emails)
- **WhatsApp**: WhatsApp Business API (via Twilio or direct integration)
- **AI/ML**: AWS Rekognition (photo face detection), AWS Comprehend (optional)

**Infrastructure**:
- **Cloud Provider**: AWS (100% serverless architecture)
- **Deployment**: Serverless Framework or AWS SAM
- **IaC**: serverless.yml + CloudFormation
- **Monitoring**: CloudWatch Logs, CloudWatch Metrics, X-Ray
- **Secrets**: AWS Secrets Manager

**CI/CD**:
- **Version Control**: GitHub
- **CI/CD**: GitHub Actions
- **Testing**: Jest (backend), Flutter test framework (frontend)
- **Deployment**: Automated deployment to dev/staging/prod environments
- **Rollback**: CloudFormation stack rollback

**Cost Optimization**:
- **Development**: ~$20-45/month (within AWS free tier mostly)
- **Production (500 users)**: ~$110-335/month
- **AWS Startup Credits**: $1,000 covers 10-12 months of operation

### Key Dependencies

**Mobile (Flutter)**:
1. **dio**: HTTP client for API communication
2. **riverpod**: State management (compile-safe, modern)
3. **flutter_secure_storage**: Secure token storage
4. **cached_network_image**: Efficient image loading and caching
5. **image_picker**: Photo upload (profile, tagging)
6. **amplify_flutter**: AWS integration (Cognito, S3, AppSync)
7. **intl**: Internationalization

**Backend (Node.js/TypeScript)**:
1. **AWS SDK v3**: AWS service integrations (SNS, SES, S3, DynamoDB)
2. **@aws-sdk/client-dynamodb**: DynamoDB client
3. **@aws-sdk/lib-dynamodb**: DynamoDB document client (easier API)
4. **jsonwebtoken**: JWT token generation and validation
5. **twilio**: WhatsApp Business API integration
6. **sharp**: Image processing (resize, optimize)
7. **@middy/core**: Lambda middleware framework
8. **@aws-lambda-powertools/logger**: Structured logging

**Infrastructure**:
1. **Serverless Framework**: Lambda deployment and management
2. **serverless-offline**: Local Lambda development
3. **serverless-plugin-typescript**: TypeScript support
4. **aws-sdk-mock**: Testing AWS services locally

### Known Issues and Limitations

**Current Limitations** (to be resolved as project develops):
- WhatsApp Business API requires approval and has rate limits
- Lambda cold starts (1-2 seconds) - mitigated with provisioned concurrency for critical functions
- DynamoDB requires careful data modeling (no joins) - use single-table design patterns
- Cross-channel identity mapping complexity
- Real-time message synchronization across channels

**Technical Considerations**:
- SMS costs: AWS SNS charges ~$0.008-0.04 per international SMS
- WhatsApp Business API has strict templates for initial contact (24-hour session window)
- Lambda concurrent execution limits (1,000 default, can request increase)
- API Gateway timeout: 29 seconds max (Lambda max 15 minutes)
- DynamoDB item size limit: 400KB max
- S3 eventual consistency for new objects
- Need to handle message delivery failures gracefully with retry logic

**Cost Management**:
- Monitor DynamoDB capacity units closely (can spike with traffic)
- Use S3 lifecycle policies to archive old photos to Glacier
- Implement CloudWatch alarms for unexpected cost increases
- Consider Reserved Capacity for DynamoDB if usage becomes predictable

### Project-Specific Security Requirements

**Critical Security Measures**:
1. **Phone Number Verification**: Mandatory SMS verification for all users
2. **Peer Approval**: New users require approval from existing members
3. **PII Protection**: Real names and phone numbers must be encrypted at rest
4. **Channel Security**:
   - End-to-end encryption for in-app messages
   - Secure storage of API credentials
   - Token rotation for external services
5. **Privacy Controls**: Users control who sees their contact info
6. **Audit Logging**: Track all cross-channel message routing
7. **Rate Limiting**: Prevent spam and abuse
8. **GDPR Compliance**: User data export and deletion capabilities

**Never Commit**:
- AWS Access Keys and Secret Keys
- AWS Secrets Manager secret values
- Twilio API keys (for WhatsApp)
- JWT secret keys
- Any user data, phone numbers, or email addresses
- `.env` files with sensitive values
- CloudFormation stack outputs with sensitive data

**Use AWS Secrets Manager for**:
- JWT signing secrets
- WhatsApp API credentials
- Third-party API keys
- Database connection strings (if any)

### Architecture Decisions

**Architecture Decision Records (ADRs)** should be stored in `/docs/adr/`:

- ADR-001: Cross-platform mobile framework selection (Flutter) - ✅ Decided
- ADR-002: Serverless architecture vs containers (Serverless) - ✅ Decided
- ADR-003: Backend language selection (Node.js/TypeScript) - ✅ Decided
- ADR-004: Database choice (DynamoDB over PostgreSQL) - ✅ Decided
  - **Rationale**: Cost savings (9x cheaper), true serverless, perfect for sporadic usage
- ADR-005: SMS provider (AWS SNS over Twilio) - ✅ Decided
  - **Rationale**: 50-80% cheaper for international SMS (Hong Kong + worldwide)
- ADR-006: Multi-channel messaging architecture
- ADR-007: User verification and peer approval workflow
- ADR-008: Photo tagging and recognition system
- ADR-009: Multi-classroom tracking data model
- ADR-010: Real-time messaging (AppSync vs WebSocket)

---

## Resources and References

### Documentation Links

- Project README: `/README.md`
- API Documentation: [Link or path]
- Architecture Diagrams: `/docs/architecture/`

### External Resources

- [Framework Documentation]
- [Style Guide]
- [Design System]

### Contacts and Support

- **Repository Owner**: tongsitat
- **Issue Tracker**: [GitHub Issues URL]
- **Discussions**: [GitHub Discussions or other platform]

---

## Updating This Document

This document should be treated as living documentation:

1. **Update Regularly**: After significant changes or new patterns emerge
2. **Keep It Relevant**: Remove outdated information
3. **Be Specific**: Add concrete examples and real file paths
4. **Get Feedback**: Improve based on team/user feedback

### Last Updated By

- **Date**: 2025-11-16
- **Updated By**: Claude (AI Assistant)
- **Changes**:
  - Finalized tech stack: Node.js (TypeScript), AWS Lambda, DynamoDB, AWS SNS/SES
  - Updated architecture to serverless (Lambda functions instead of containers)
  - Added photo tagging and recognition as Phase 3
  - Added multi-classroom tracking (500 users across multiple classrooms)
  - Updated cost analysis (DynamoDB 9x cheaper than PostgreSQL)
  - Reorganized phases to include photo management
  - Updated directory structure for serverless backend
  - Added AWS-specific security and cost optimization notes

---

## Quick Reference

### Essential Commands

```bash
# Setup
git clone [repository-url]
cd sjc1990app
# [Install dependencies - update when known]

# Development
# [Start dev server - update when known]
# [Run tests - update when known]
# [Build project - update when known]

# Git
git status
git add .
git commit -m "type: message"
git push -u origin branch-name

# Create PR (if gh CLI available)
gh pr create --title "Title" --body "Description"
```

### File Paths Quick Reference

- Configuration: `/config/` or root-level config files
- Source code: `/src/`
- Tests: `/tests/` or `/__tests__/` or alongside source files
- Documentation: `/docs/`
- Build output: `/dist/` or `/build/` (git-ignored)

---

## Notes for AI Assistants

### Context Gathering

Before making changes:
1. Read related files to understand context
2. Check for existing tests
3. Look for similar patterns in the codebase
4. Review recent commits for context

### Problem-Solving Approach

1. **Understand**: Clarify requirements and constraints
2. **Plan**: Break down into manageable tasks (use TodoWrite)
3. **Implement**: Write clean, tested code
4. **Verify**: Ensure tests pass and no regressions
5. **Document**: Update relevant documentation
6. **Commit**: Use clear commit messages
7. **Push**: To the correct branch

### When Uncertain

- Ask the user for clarification
- Check existing code for established patterns
- Prefer conservative changes over risky ones
- Document assumptions made

---

**Remember**: This document is here to help you work effectively with this codebase. Keep it updated as the project evolves, and don't hesitate to improve it based on your experience working with the code.
