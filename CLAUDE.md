# CLAUDE.md - AI Assistant Guide for sjc1990app

## Repository Overview

**Repository**: tongsitat/sjc1990app
**Status**: Initial setup / Early development
**Last Updated**: 2025-11-15

This document serves as a comprehensive guide for AI assistants (like Claude) working with this codebase. It contains essential information about the project structure, development workflows, coding conventions, and best practices.

---

## Table of Contents

1. [Project Status](#project-status)
2. [Codebase Structure](#codebase-structure)
3. [Development Workflows](#development-workflows)
4. [Coding Conventions](#coding-conventions)
5. [AI Assistant Guidelines](#ai-assistant-guidelines)
6. [Common Tasks](#common-tasks)
7. [Testing Strategy](#testing-strategy)
8. [Deployment](#deployment)

---

## Project Status

### Current State

This repository is currently in its initial setup phase. As the codebase evolves, this section should be updated to reflect:

- **Project Type**: [Web app / Mobile app / API / Library / etc.]
- **Tech Stack**: [Languages, frameworks, libraries]
- **Development Stage**: [Planning / MVP / Production / etc.]
- **Team Size**: [Solo / Small team / Large team]

### Key Milestones

- [ ] Repository initialized
- [ ] Project structure defined
- [ ] Core dependencies configured
- [ ] CI/CD pipeline setup
- [ ] First release

---

## Codebase Structure

### Directory Layout

```
sjc1990app/
├── src/              # Source code
├── tests/            # Test files
├── docs/             # Documentation
├── config/           # Configuration files
├── scripts/          # Build and utility scripts
├── .github/          # GitHub workflows and templates
└── CLAUDE.md         # This file
```

**Note**: Update this structure as the project evolves.

### Key Directories

#### `/src`
- **Purpose**: All production source code
- **Conventions**: [To be defined based on project type]

#### `/tests`
- **Purpose**: All test files (unit, integration, e2e)
- **Conventions**: Mirror source directory structure

#### `/docs`
- **Purpose**: Project documentation, ADRs, guides
- **Conventions**: Use Markdown format

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

**To be updated as project develops:**

- **Frontend**: [Framework/library]
- **Backend**: [Language/framework]
- **Database**: [Database type]
- **Infrastructure**: [Cloud provider, services]
- **CI/CD**: [GitHub Actions, Jenkins, etc.]

### Key Dependencies

List critical dependencies and their purposes:

1. **[Dependency Name]**: [Purpose]
2. **[Dependency Name]**: [Purpose]

### Known Issues and Limitations

Track known issues that AI assistants should be aware of:

- [Issue description and workaround]

### Architecture Decisions

**Architecture Decision Records (ADRs)** should be stored in `/docs/adr/`:

- ADR-001: [Title]
- ADR-002: [Title]

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

- **Date**: 2025-11-15
- **Updated By**: Claude (AI Assistant)
- **Changes**: Initial creation

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
