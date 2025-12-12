#!/bin/bash

# Enhanced Project Cleanup Script - Fix NPM Cache and Docker Issues
# Fixes root-owned npm cache and clears Docker build cache

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║    Enhanced Cleanup - Fix NPM Cache & Docker Issues        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

USER_NAME=$(whoami)
USER_ID=$(id -u)

echo -e "${YELLOW}Current User:${NC} $USER_NAME (UID: $USER_ID)"
echo ""

# Step 1: Fix npm cache ownership
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}1. Fixing npm cache ownership...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check for root-owned npm cache
NPM_CACHE_DIR=$(npm config get cache 2>/dev/null || echo "$HOME/.npm")
echo "   npm cache location: $NPM_CACHE_DIR"

if [ -d "$NPM_CACHE_DIR" ]; then
    ROOT_CACHE_FILES=$(sudo find "$NPM_CACHE_DIR" -user root 2>/dev/null | wc -l)

    if [ "$ROOT_CACHE_FILES" -gt 0 ]; then
        echo -e "${RED}   Found $ROOT_CACHE_FILES root-owned files in npm cache${NC}"
        echo "   Fixing ownership..."
        sudo chown -R $USER_ID:$USER_ID "$NPM_CACHE_DIR"
        echo -e "${GREEN}✓${NC} npm cache ownership fixed"
    else
        echo -e "${GREEN}✓${NC} npm cache ownership is correct"
    fi
else
    echo -e "${GREEN}✓${NC} npm cache directory doesn't exist yet"
fi

# Also fix /.npm if it exists (system-wide npm cache)
if [ -d "/.npm" ]; then
    echo "   Found system npm cache: /.npm"
    SYSTEM_ROOT_FILES=$(sudo find /.npm -user root 2>/dev/null | wc -l)

    if [ "$SYSTEM_ROOT_FILES" -gt 0 ]; then
        echo -e "${RED}   Found $SYSTEM_ROOT_FILES root-owned files in /.npm${NC}"
        echo "   Fixing ownership..."
        sudo chown -R $USER_ID:$USER_ID "/.npm" 2>/dev/null || true
        echo -e "${GREEN}✓${NC} System npm cache ownership fixed"
    fi
fi

echo ""

# Step 2: Clear npm cache completely
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}2. Clearing npm cache...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

npm cache clean --force 2>/dev/null || true
echo -e "${GREEN}✓${NC} npm cache cleared"

echo ""

# Step 3: Clear Docker build cache
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}3. Clearing Docker build cache...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v docker &> /dev/null; then
    # Check if Docker daemon is running
    if docker info &> /dev/null; then
        echo "   Removing CDK-related Docker images..."
        docker images | grep -E 'cdk-|sam/build-nodejs' | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

        echo "   Pruning Docker build cache..."
        docker builder prune -f 2>/dev/null || true

        echo -e "${GREEN}✓${NC} Docker build cache cleared"
    else
        echo -e "${YELLOW}!${NC} Docker daemon not running, skipping Docker cleanup"
    fi
else
    echo -e "${YELLOW}!${NC} Docker not installed, skipping Docker cleanup"
fi

echo ""

# Step 4: Fix project file ownership
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}4. Fixing project file ownership...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

PROJECT_ROOT="$(pwd)"
cd "$PROJECT_ROOT"

ROOT_FILES=$(find . -type f -user root 2>/dev/null | wc -l)
ROOT_DIRS=$(find . -type d -user root 2>/dev/null | wc -l)

if [ "$ROOT_FILES" -gt 0 ] || [ "$ROOT_DIRS" -gt 0 ]; then
    echo -e "${RED}   Found root-owned files/directories in project:${NC}"
    echo "   Files: $ROOT_FILES"
    echo "   Directories: $ROOT_DIRS"
    echo "   Fixing ownership..."
    sudo chown -R $USER_NAME:$USER_NAME .
    echo -e "${GREEN}✓${NC} Project file ownership fixed"
else
    echo -e "${GREEN}✓${NC} No root-owned files in project"
fi

echo ""

# Step 5: Remove CDK build artifacts
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}5. Removing CDK build artifacts...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "infrastructure-cdk/cdk.out" ]; then
    rm -rf infrastructure-cdk/cdk.out
    echo -e "${GREEN}✓${NC} Removed infrastructure-cdk/cdk.out"
fi

if [ -d "infrastructure-cdk/.cdk.staging" ]; then
    rm -rf infrastructure-cdk/.cdk.staging
    echo -e "${GREEN}✓${NC} Removed infrastructure-cdk/.cdk.staging"
fi

echo ""

# Step 6: Remove node_modules
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}6. Removing node_modules...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "infrastructure-cdk/node_modules" ]; then
    rm -rf infrastructure-cdk/node_modules
    echo -e "${GREEN}✓${NC} Removed infrastructure-cdk/node_modules"
fi

if [ -d "backend/node_modules" ]; then
    rm -rf backend/node_modules
    echo -e "${GREEN}✓${NC} Removed backend/node_modules"
fi

echo ""

# Step 7: Remove package-lock files
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}7. Removing package-lock.json files...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

find . -name "package-lock.json" -type f -delete 2>/dev/null || true
echo -e "${GREEN}✓${NC} Removed package-lock.json files"

echo ""

# Step 8: Fix backend/layers ownership (where the error occurs)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}8. Fixing backend/layers ownership...${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ -d "backend/layers" ]; then
    LAYER_ROOT_FILES=$(sudo find backend/layers -user root 2>/dev/null | wc -l)

    if [ "$LAYER_ROOT_FILES" -gt 0 ]; then
        echo -e "${RED}   Found $LAYER_ROOT_FILES root-owned files in backend/layers${NC}"
        sudo chown -R $USER_NAME:$USER_NAME backend/layers
        echo -e "${GREEN}✓${NC} backend/layers ownership fixed"
    else
        echo -e "${GREEN}✓${NC} backend/layers ownership is correct"
    fi

    # Remove node_modules from layers
    if [ -d "backend/layers/aws-sdk-layer/nodejs/node_modules" ]; then
        rm -rf backend/layers/aws-sdk-layer/nodejs/node_modules
        echo -e "${GREEN}✓${NC} Removed backend/layers/aws-sdk-layer/nodejs/node_modules"
    fi
fi

echo ""

# Summary
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              Enhanced Cleanup Complete! ✓                   ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "What was fixed:"
echo "  ✓ npm cache ownership (local and system-wide)"
echo "  ✓ npm cache cleared completely"
echo "  ✓ Docker build cache cleared"
echo "  ✓ Project file ownership fixed"
echo "  ✓ CDK build artifacts removed"
echo "  ✓ All node_modules removed"
echo "  ✓ All package-lock.json removed"
echo "  ✓ backend/layers ownership fixed"
echo ""

echo -e "${BLUE}Next Steps - Clean Rebuild:${NC}"
echo ""
echo "1. Reinstall infrastructure-cdk dependencies:"
echo "   cd infrastructure-cdk"
echo "   npm install"
echo ""
echo "2. Build TypeScript:"
echo "   npm run build"
echo ""
echo "3. Test CDK synth (should work now):"
echo "   cdk synth"
echo ""
echo "4. Deploy security updates:"
echo "   cdk deploy sjc1990app-dev-api --require-approval never"
echo ""
echo -e "${YELLOW}Note:${NC} Docker must be running for deployment to work."
echo -e "${YELLOW}Note:${NC} All caches cleared - first build will take longer but should succeed."
echo ""
