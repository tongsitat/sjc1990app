#!/bin/bash

# Project Cleanup Script - Fix Ownership and Remove Build Artifacts
# Fixes root-owned files and cleans all build artifacts for fresh rebuild

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Project Cleanup - Fix Ownership & Artifacts        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

PROJECT_ROOT="$(pwd)"
USER_NAME=$(whoami)

echo -e "${YELLOW}Project Root:${NC} $PROJECT_ROOT"
echo -e "${YELLOW}Current User:${NC} $USER_NAME"
echo ""

# Step 1: Check for root-owned files
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}1. Checking for root-owned files...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ROOT_FILES=$(find . -type f -user root 2>/dev/null | wc -l)
ROOT_DIRS=$(find . -type d -user root 2>/dev/null | wc -l)

if [ "$ROOT_FILES" -gt 0 ] || [ "$ROOT_DIRS" -gt 0 ]; then
    echo -e "${RED}Found root-owned files/directories:${NC}"
    echo "  Files: $ROOT_FILES"
    echo "  Directories: $ROOT_DIRS"
    echo ""
    echo -e "${YELLOW}Sample root-owned items:${NC}"
    find . -user root 2>/dev/null | head -10
    echo ""

    # Fix ownership
    echo -e "${YELLOW}Fixing ownership (requires sudo)...${NC}"
    sudo chown -R $USER_NAME:$USER_NAME .
    echo -e "${GREEN}✓${NC} Ownership fixed"
else
    echo -e "${GREEN}✓${NC} No root-owned files found"
fi

echo ""

# Step 2: Remove obsolete infrastructure folder
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}2. Removing obsolete infrastructure folder...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "infrastructure" ]; then
    echo "Found: infrastructure/ (contains old serverless.yml.archive)"
    rm -rf infrastructure
    echo -e "${GREEN}✓${NC} Removed infrastructure/ folder"
else
    echo -e "${GREEN}✓${NC} No infrastructure/ folder found (already removed)"
fi

echo ""

# Step 3: Remove node_modules
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}3. Removing node_modules directories...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

NODE_MODULES_DIRS=$(find . -name "node_modules" -type d 2>/dev/null)

if [ -n "$NODE_MODULES_DIRS" ]; then
    echo "Found node_modules directories:"
    echo "$NODE_MODULES_DIRS" | sed 's/^/  /'
    echo ""

    # Remove all node_modules
    find . -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Removed all node_modules directories"
else
    echo -e "${GREEN}✓${NC} No node_modules directories found"
fi

echo ""

# Step 4: Remove CDK build artifacts
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}4. Removing CDK build artifacts...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

CDK_ARTIFACTS=0

# Remove cdk.out
if [ -d "infrastructure-cdk/cdk.out" ]; then
    rm -rf infrastructure-cdk/cdk.out
    echo -e "${GREEN}✓${NC} Removed infrastructure-cdk/cdk.out"
    ((CDK_ARTIFACTS++))
fi

# Remove .cdk.staging
if [ -d "infrastructure-cdk/.cdk.staging" ]; then
    rm -rf infrastructure-cdk/.cdk.staging
    echo -e "${GREEN}✓${NC} Removed infrastructure-cdk/.cdk.staging"
    ((CDK_ARTIFACTS++))
fi

if [ $CDK_ARTIFACTS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No CDK build artifacts found"
fi

echo ""

# Step 5: Remove TypeScript build artifacts
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}5. Removing TypeScript build artifacts...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

TS_ARTIFACTS=0

# Remove backend build artifacts
if [ -d "backend/dist" ]; then
    rm -rf backend/dist
    echo -e "${GREEN}✓${NC} Removed backend/dist"
    ((TS_ARTIFACTS++))
fi

# Remove infrastructure-cdk build artifacts
if [ -d "infrastructure-cdk/dist" ]; then
    rm -rf infrastructure-cdk/dist
    echo -e "${GREEN}✓${NC} Removed infrastructure-cdk/dist"
    ((TS_ARTIFACTS++))
fi

# Remove .js files in infrastructure-cdk (compiled TS)
JS_FILES=$(find infrastructure-cdk -name "*.js" -not -path "*/node_modules/*" 2>/dev/null | wc -l)
if [ "$JS_FILES" -gt 0 ]; then
    find infrastructure-cdk -name "*.js" -not -path "*/node_modules/*" -delete
    find infrastructure-cdk -name "*.d.ts" -not -path "*/node_modules/*" -delete
    echo -e "${GREEN}✓${NC} Removed compiled .js and .d.ts files ($JS_FILES files)"
    ((TS_ARTIFACTS++))
fi

if [ $TS_ARTIFACTS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No TypeScript build artifacts found"
fi

echo ""

# Step 6: Remove package-lock files (optional - will be regenerated)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}6. Removing package-lock.json files (will be regenerated)...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

LOCK_FILES=$(find . -name "package-lock.json" -type f 2>/dev/null)

if [ -n "$LOCK_FILES" ]; then
    echo "Found package-lock.json files:"
    echo "$LOCK_FILES" | sed 's/^/  /'
    echo ""

    find . -name "package-lock.json" -type f -delete
    echo -e "${GREEN}✓${NC} Removed package-lock.json files"
else
    echo -e "${GREEN}✓${NC} No package-lock.json files found"
fi

echo ""

# Step 7: Remove other common build artifacts
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}7. Removing other build artifacts...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

OTHER_ARTIFACTS=0

# Remove .DS_Store (macOS)
DS_STORE_FILES=$(find . -name ".DS_Store" -type f 2>/dev/null | wc -l)
if [ "$DS_STORE_FILES" -gt 0 ]; then
    find . -name ".DS_Store" -type f -delete
    echo -e "${GREEN}✓${NC} Removed .DS_Store files ($DS_STORE_FILES files)"
    ((OTHER_ARTIFACTS++))
fi

# Remove Thumbs.db (Windows)
THUMBS_FILES=$(find . -name "Thumbs.db" -type f 2>/dev/null | wc -l)
if [ "$THUMBS_FILES" -gt 0 ]; then
    find . -name "Thumbs.db" -type f -delete
    echo -e "${GREEN}✓${NC} Removed Thumbs.db files ($THUMBS_FILES files)"
    ((OTHER_ARTIFACTS++))
fi

# Remove npm debug logs
NPM_LOGS=$(find . -name "npm-debug.log*" -type f 2>/dev/null | wc -l)
if [ "$NPM_LOGS" -gt 0 ]; then
    find . -name "npm-debug.log*" -type f -delete
    echo -e "${GREEN}✓${NC} Removed npm debug logs ($NPM_LOGS files)"
    ((OTHER_ARTIFACTS++))
fi

if [ $OTHER_ARTIFACTS -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No other build artifacts found"
fi

echo ""

# Summary
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Cleanup Complete! ✓                      ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "What was cleaned:"
echo "  ✓ Fixed file ownership (if root-owned files existed)"
echo "  ✓ Removed obsolete infrastructure/ folder"
echo "  ✓ Removed all node_modules directories"
echo "  ✓ Removed CDK build artifacts (cdk.out, .cdk.staging)"
echo "  ✓ Removed TypeScript compiled files (.js, .d.ts)"
echo "  ✓ Removed package-lock.json files"
echo "  ✓ Removed OS-specific files (.DS_Store, Thumbs.db)"
echo ""

echo -e "${BLUE}Next Steps - Clean Rebuild:${NC}"
echo ""
echo "1. Install infrastructure-cdk dependencies:"
echo "   cd infrastructure-cdk"
echo "   npm install"
echo ""
echo "2. Build TypeScript:"
echo "   npm run build"
echo ""
echo "3. Verify CDK synth works:"
echo "   cdk synth"
echo ""
echo "4. Deploy security updates:"
echo "   cdk deploy sjc1990app-dev-api --require-approval never"
echo ""
echo -e "${YELLOW}Note:${NC} All build artifacts will be regenerated with correct ownership."
echo -e "${YELLOW}Note:${NC} Make sure Docker is running before CDK deploy."
echo ""
