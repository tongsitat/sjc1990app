# ⚠️ DEPRECATED - Legacy Infrastructure

**This directory is archived and no longer used.**

## Migration Notice

The sjc1990app infrastructure has been **migrated from Serverless Framework to AWS CDK**.

**Old approach**: Serverless Framework with YAML configuration
**New approach**: AWS CDK with TypeScript

## Why the Change?

See [ADR-011](../docs/adr/ADR-011-aws-cdk-vs-serverless-framework.md) for the full decision rationale.

**Key reasons**:
- ✅ Type-safe infrastructure (TypeScript)
- ✅ Better IDE support (IntelliSense, autocomplete)
- ✅ Official AWS tool (no third-party dependency)
- ✅ Auto-generated IAM policies
- ✅ Easier to handle complex features (AppSync, Rekognition, multi-tenant)

## Where to Find Active Infrastructure

**Active infrastructure is now in**: `/infrastructure-cdk/`

```bash
cd infrastructure-cdk/
npm install
cdk deploy --all --context stage=dev
```

See [infrastructure-cdk/README.md](../infrastructure-cdk/README.md) for deployment instructions.

## Archived Files

- `serverless.yml.archive` - Original Serverless Framework configuration (archived November 18, 2025)

**DO NOT use this file for deployment!** It is kept for reference only.

## Migration Date

**Migrated**: November 18, 2025
**Migration Author**: System Architect (AI Agent)
**Status**: ✅ Complete - All resources migrated to CDK

---

**For deployment, use `/infrastructure-cdk/` instead of this directory.**
