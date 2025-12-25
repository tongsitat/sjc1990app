# Project Cleanup Guide - Fix Root Ownership Issues

## The Problem

You ran Docker or npm commands with `sudo` at some point, which caused `node_modules`, `cdk.out`, and other build artifacts to be owned by `root` instead of your user account.

**Symptoms**:
- Permission denied errors when running `npm install` or `cdk deploy`
- Cannot delete `node_modules` or `cdk.out` folders
- Files show as owned by `root` when running `ls -la`
- Docker build failures or strange errors

**Why this happens**:
- Running `sudo npm install` or `sudo cdk deploy` creates files as root user
- Docker runs containers as root by default (on some systems)
- Once files are owned by root, normal user can't modify or delete them

---

## The Solution

I've created `cleanup-project.sh` to fix everything automatically.

### Quick Cleanup (Run This Now)

```bash
cd ~/dev/sjc1990app
./cleanup-project.sh
```

**What the script does**:
1. ✅ Finds and fixes root-owned files (using `sudo chown`)
2. ✅ Removes obsolete `infrastructure/` folder (old Serverless Framework)
3. ✅ Removes all `node_modules` directories
4. ✅ Removes CDK build artifacts (`cdk.out`, `.cdk.staging`)
5. ✅ Removes TypeScript compiled files (`.js`, `.d.ts`)
6. ✅ Removes `package-lock.json` files (will be regenerated)
7. ✅ Removes OS-specific junk (`.DS_Store`, `Thumbs.db`, npm logs)

**Time**: ~10 seconds

**Safe to run**: Yes - only removes build artifacts that will be regenerated

---

## After Cleanup - Clean Rebuild

### Step 1: Install Dependencies
```bash
cd infrastructure-cdk
npm install
```

**Expected output**:
```
added 523 packages in 12s
```

### Step 2: Build TypeScript
```bash
npm run build
```

**Expected output**:
```
> sjc1990app-infrastructure@1.0.0 build
> tsc

(no errors)
```

### Step 3: Verify CDK Synth
```bash
cdk synth sjc1990app-dev-api
```

**Expected output**:
```
Successfully synthesized to /home/user/sjc1990app/infrastructure-cdk/cdk.out
```

### Step 4: Deploy Security Updates
```bash
# Make sure Docker is running first!
docker --version

# Deploy
cdk deploy sjc1990app-dev-api --require-approval never
```

**Expected output**:
```
✅  sjc1990app-dev-api

Outputs:
sjc1990app-dev-api.AccessLogGroup = /aws/apigateway/sjc1990app-dev-access-logs
sjc1990app-dev-api.RateLimits = 10 req/sec, 20 burst
sjc1990app-dev-api.WafWebAclArn = arn:aws:wafv2:...
```

---

## How to Avoid This in the Future

### ❌ NEVER Do This:

```bash
# DON'T run npm with sudo
sudo npm install

# DON'T run cdk with sudo
sudo cdk deploy

# DON'T run Docker commands with sudo (unless necessary)
sudo docker build .
```

### ✅ ALWAYS Do This Instead:

```bash
# Run npm as normal user
npm install

# Run cdk as normal user
cdk deploy

# Run Docker as normal user (add yourself to docker group)
docker build .
```

---

## Fix Docker Permissions (One-Time Setup)

If you keep having to use `sudo` for Docker commands, fix it permanently:

### On Linux/WSL:

```bash
# Add yourself to docker group
sudo usermod -aG docker $USER

# Apply changes (logout/login or run this)
newgrp docker

# Verify you can run docker without sudo
docker ps
```

**After this**: You'll never need `sudo docker` again ✓

### On macOS:

Docker Desktop handles this automatically - no setup needed.

### On Windows (WSL):

Make sure Docker Desktop is set to use WSL 2 backend:
- Docker Desktop → Settings → Resources → WSL Integration
- Enable integration with your WSL distro

---

## What Got Removed (Obsolete Folder)

### `infrastructure/` Folder

This folder contained the old **Serverless Framework** configuration (`serverless.yml.archive`), which we migrated to **AWS CDK** (in `infrastructure-cdk/`).

**Why removed**:
- No longer needed (migrated to CDK per ADR-011)
- Causes confusion (two infrastructure directories)
- CDK is the official AWS deployment tool

**Migration documented in**: `/docs/adr/ADR-011-infrastructure-deployment-tool.md`

---

## Verification Checklist

After cleanup and rebuild, verify:

- [ ] `ls -la infrastructure-cdk/node_modules` shows your username (not root)
- [ ] `ls -la infrastructure-cdk/cdk.out` shows your username (not root)
- [ ] `npm install` works without sudo
- [ ] `npm run build` completes without errors
- [ ] `cdk synth` generates CloudFormation templates
- [ ] No `infrastructure/` folder exists (removed)
- [ ] Docker works without sudo (after adding user to docker group)

---

## Troubleshooting

### "Permission denied" when running cleanup script

**Cause**: Script needs sudo to fix root-owned files

**Solution**: The script will prompt for sudo password when needed:
```bash
./cleanup-project.sh
# Enter your password when prompted for sudo chown
```

---

### "Cannot remove 'node_modules': Permission denied"

**Cause**: Files still owned by root

**Solution**: Run cleanup script, which uses sudo to fix ownership:
```bash
./cleanup-project.sh
```

---

### "Docker: command not found" during cdk deploy

**Cause**: Docker not installed or not running

**Solution**:
- **Linux**: `sudo systemctl start docker`
- **macOS/Windows**: Start Docker Desktop

---

### Still getting permission errors after cleanup

**Cause**: New root-owned files created

**Solution**:
1. Stop using `sudo` for npm/cdk/docker commands
2. Add yourself to docker group (see above)
3. Re-run cleanup script if needed

---

## File Ownership Explained

### Good (Your User)
```bash
$ ls -la infrastructure-cdk/node_modules
drwxr-xr-x  523 youruser youruser  16736 Dec 11 10:00 .
```

### Bad (Root User)
```bash
$ ls -la infrastructure-cdk/node_modules
drwxr-xr-x  523 root     root      16736 Dec 11 10:00 .
```

**How to check ownership**:
```bash
# Check who owns a file/folder
ls -l infrastructure-cdk/node_modules

# Find all root-owned files (before cleanup)
find . -user root

# After cleanup, this should return nothing
find . -user root
```

---

## Why This Matters for CDK

CDK uses Docker to:
1. **Bundle Lambda functions** - Packages TypeScript → JavaScript
2. **Install dependencies** - npm install in Docker container
3. **Build Lambda layers** - Creates AWS SDK layer

If files are owned by root:
- Docker can't write to `cdk.out` (owned by your user)
- npm can't update `node_modules` (owned by root)
- Build fails with permission errors

**Solution**: All files must be owned by your user (not root).

---

## Project Structure After Cleanup

```
sjc1990app/
├── backend/                    # Lambda function source code
│   └── (no build artifacts)    # dist/ removed
│
├── infrastructure-cdk/         # AWS CDK infrastructure
│   ├── lib/
│   ├── bin/
│   ├── cdk.json
│   └── (no node_modules yet)   # Will be installed fresh
│
├── infrastructure/             # ❌ REMOVED (obsolete Serverless Framework)
│
├── docs/                       # Documentation
├── scripts/                    # Utility scripts
└── cleanup-project.sh          # This cleanup script
```

**Clean slate**: All build artifacts removed, ready for fresh rebuild ✓

---

## Summary

**Problem**: Root-owned files from `sudo npm`/`sudo docker` commands

**Solution**: Run `./cleanup-project.sh` to fix ownership and remove build artifacts

**Prevention**: Never use `sudo` for npm/cdk/docker commands, add user to docker group

**Next**: Clean rebuild with `npm install && npm run build && cdk deploy`

**Time**: ~5 minutes total (cleanup + rebuild + deploy)

---

## Quick Reference Commands

```bash
# 1. Clean up (removes all build artifacts, fixes ownership)
./cleanup-project.sh

# 2. Reinstall dependencies
cd infrastructure-cdk && npm install

# 3. Rebuild TypeScript
npm run build

# 4. Deploy (requires Docker)
cdk deploy sjc1990app-dev-api

# 5. Verify no root-owned files remain
find . -user root
# (should return nothing)
```

---

**Last Updated**: 2025-12-11
**Status**: Cleanup script ready, awaiting execution
**Next**: Run `./cleanup-project.sh` on local machine
