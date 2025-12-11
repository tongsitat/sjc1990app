#!/bin/bash

# Fix Git Line Endings - Local Machine Configuration
# Run this once to permanently fix line ending issues on your WSL/Windows machine

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Git Line Endings Fix - Local Configuration         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check current git autocrlf setting
echo -e "${YELLOW}1. Checking current git configuration...${NC}"
CURRENT_AUTOCRLF=$(git config --get core.autocrlf || echo "not set")
echo "   Current core.autocrlf: $CURRENT_AUTOCRLF"
echo ""

# Fix: Set autocrlf to input (convert CRLF → LF on commit, but don't convert on checkout)
echo -e "${YELLOW}2. Configuring git to respect .gitattributes...${NC}"
git config core.autocrlf input
echo -e "   ${GREEN}✓${NC} Set core.autocrlf=input"
echo ""

# Also ensure eol setting respects .gitattributes
git config core.eol lf
echo -e "   ${GREEN}✓${NC} Set core.eol=lf"
echo ""

# Show new settings
echo -e "${YELLOW}3. New git configuration:${NC}"
echo "   core.autocrlf: $(git config --get core.autocrlf)"
echo "   core.eol: $(git config --get core.eol)"
echo ""

# Re-normalize the working directory
echo -e "${YELLOW}4. Re-normalizing all files in working directory...${NC}"
echo "   This will update files to use LF line endings as specified in .gitattributes"
echo ""

# Save any uncommitted changes first
if ! git diff-index --quiet HEAD --; then
    echo -e "${RED}WARNING: You have uncommitted changes!${NC}"
    echo "Please commit or stash your changes first, then run this script again."
    exit 1
fi

# Remove all files from git's index
echo "   Removing files from git index..."
git rm --cached -r . >/dev/null 2>&1

# Reset the index (this will re-add files with correct line endings based on .gitattributes)
echo "   Re-adding files with correct line endings..."
git reset --hard HEAD >/dev/null 2>&1

echo -e "   ${GREEN}✓${NC} Files normalized"
echo ""

# Verify the problematic files
echo -e "${YELLOW}5. Verifying fix-line-endings.sh and verify-setup.sh...${NC}"

# Check if they still show as changed
CHANGED_FILES=$(git status --porcelain fix-line-endings.sh verify-setup.sh 2>/dev/null || echo "")

if [ -z "$CHANGED_FILES" ]; then
    echo -e "   ${GREEN}✓${NC} fix-line-endings.sh - Clean (no changes)"
    echo -e "   ${GREEN}✓${NC} verify-setup.sh - Clean (no changes)"
else
    echo -e "   ${RED}✗${NC} Files still showing as changed:"
    echo "$CHANGED_FILES"
    echo ""
    echo "   This might happen if there are actual content changes."
    echo "   Check with: git diff fix-line-endings.sh verify-setup.sh"
fi

echo ""

# Final verification
echo -e "${YELLOW}6. Final verification...${NC}"
echo "   Checking for CRLF in shell scripts..."

CRLF_COUNT=$(find . -name "*.sh" -type f -exec grep -l $'\r' {} \; 2>/dev/null | wc -l)

if [ "$CRLF_COUNT" -eq 0 ]; then
    echo -e "   ${GREEN}✓${NC} No CRLF found in shell scripts"
else
    echo -e "   ${YELLOW}!${NC} Found $CRLF_COUNT shell script(s) with CRLF"
    echo "   Converting them to LF..."
    find . -name "*.sh" -type f -exec sed -i 's/\r$//' {} \;
    echo -e "   ${GREEN}✓${NC} Converted to LF"
fi

echo ""

# Summary
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Fix Complete! ✓                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "What was fixed:"
echo "  ✓ Set core.autocrlf=input (don't convert LF to CRLF on checkout)"
echo "  ✓ Set core.eol=lf (use LF for new files)"
echo "  ✓ Re-normalized all files based on .gitattributes"
echo "  ✓ Verified shell scripts have LF line endings"
echo ""
echo "Your git configuration now respects .gitattributes, which enforces LF"
echo "line endings for all text files (required for AWS Lambda deployment)."
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Check git status: git status"
echo "  2. fix-line-endings.sh and verify-setup.sh should NOT show as changed"
echo "  3. If they still show up, run: git diff <filename> to see actual changes"
echo ""
echo "If you see them as changed in the future, it means you actually modified them."
echo ""
