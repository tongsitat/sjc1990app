#!/bin/bash

# Fix Line Endings - Convert all files to LF
# This script fixes CRLF line endings in the working directory

set -e

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║          Fix Line Endings - Convert CRLF to LF              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Configure git to use LF line endings${NC}"
echo "-------------------------------------------------------------"
git config core.autocrlf false
git config core.eol lf
echo -e "${GREEN}✓ Git configured to use LF${NC}"
echo ""

echo -e "${BLUE}Step 2: Show files with CRLF in working directory${NC}"
echo "-------------------------------------------------------------"
CRLF_FILES=$(git ls-files --eol | grep 'w/crlf' | awk '{print $4}' || true)

if [ -z "$CRLF_FILES" ]; then
    echo -e "${GREEN}✓ No files with CRLF found - all good!${NC}"
    exit 0
fi

echo "Files with CRLF line endings:"
echo "$CRLF_FILES" | while read file; do
    echo "  - $file"
done
echo ""

echo -e "${BLUE}Step 3: Convert all CRLF files to LF${NC}"
echo "-------------------------------------------------------------"

COUNT=0
echo "$CRLF_FILES" | while read file; do
    if [ -f "$file" ]; then
        # Convert CRLF to LF using sed
        sed -i 's/\r$//' "$file"
        COUNT=$((COUNT + 1))
        echo -e "${GREEN}✓${NC} Fixed: $file"
    fi
done

echo ""
echo -e "${GREEN}✓ Converted files to LF${NC}"
echo ""

echo -e "${BLUE}Step 4: Normalize repository (re-checkout all files)${NC}"
echo "-------------------------------------------------------------"
echo "This ensures all files match .gitattributes settings..."

# Save current changes
git add .gitattributes

# Remove everything from the index (but not from working directory)
git rm --cached -r . > /dev/null 2>&1 || true

# Re-add everything (git will normalize based on .gitattributes)
git reset . > /dev/null 2>&1 || true
git add .

echo -e "${GREEN}✓ Repository normalized${NC}"
echo ""

echo -e "${BLUE}Step 5: Verify line endings${NC}"
echo "-------------------------------------------------------------"
REMAINING_CRLF=$(git ls-files --eol | grep 'w/crlf' || true)

if [ -z "$REMAINING_CRLF" ]; then
    echo -e "${GREEN}✓ All files now have LF line endings!${NC}"
else
    echo -e "${RED}✗ Some files still have CRLF:${NC}"
    echo "$REMAINING_CRLF"
fi

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                    Line Endings Fixed                        ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review changes: git status"
echo "2. Commit changes: git commit -m 'fix: Normalize line endings to LF'"
echo "3. Push to remote: git push"
echo ""
echo -e "${BLUE}Note:${NC} All future files will automatically use LF endings"
echo "      thanks to the .gitattributes file."
echo ""
