# Git Line Endings - Issue Explained and Fixed

## The Problem

You're seeing `fix-line-endings.sh` and `verify-setup.sh` show up as "changed" in `git status` even when you haven't modified them. This is a classic **git line ending configuration issue** on WSL/Windows.

---

## Why This Happens

### Background: Line Endings

Different operating systems use different line ending characters:

| OS | Line Ending | Representation |
|----|-------------|----------------|
| **Linux/macOS** | LF (Line Feed) | `\n` |
| **Windows** | CRLF (Carriage Return + Line Feed) | `\r\n` |

### The Issue on WSL

When you clone a repo on WSL (Windows Subsystem for Linux), git's default behavior can cause problems:

1. **Git's default on Windows**: `core.autocrlf=true`
   - Converts LF → CRLF on checkout (when pulling from repo)
   - Converts CRLF → LF on commit (when pushing to repo)

2. **What happens**:
   - Repository has files with LF (correct for Linux/Lambda)
   - Git checks them out on your machine with CRLF
   - `.gitattributes` says "files should have LF"
   - Git sees: "Local file has CRLF, repo expects LF" → Shows as "changed"
   - But you didn't actually change the content!

3. **Result**: Files appear modified even though you didn't touch them

---

## The Solution

### Quick Fix (Run Once)

```bash
cd ~/dev/sjc1990app
./fix-git-line-endings-local.sh
```

This script will:
1. Set `core.autocrlf=input` (don't convert LF → CRLF on checkout)
2. Set `core.eol=lf` (use LF for all text files)
3. Re-normalize your working directory to match `.gitattributes`
4. Verify shell scripts have LF line endings

**Time**: ~5 seconds

---

## What Each Git Config Does

### `core.autocrlf`

| Value | What It Does | When to Use |
|-------|--------------|-------------|
| `true` | LF → CRLF on checkout<br>CRLF → LF on commit | **Windows only** (if you need CRLF locally) |
| `input` | No conversion on checkout<br>CRLF → LF on commit | **WSL, Linux, macOS** ✅ (our setting) |
| `false` | No conversion at all | **If you want full manual control** |

**Our choice**: `input` - Respects `.gitattributes` and ensures LF everywhere.

### `core.eol`

| Value | What It Does |
|-------|--------------|
| `lf` | Use LF for new files ✅ (our setting) |
| `crlf` | Use CRLF for new files |
| `native` | Use OS default (LF on Linux, CRLF on Windows) |

**Our choice**: `lf` - Required for AWS Lambda (Linux environment).

---

## How .gitattributes Protects Us

Our `.gitattributes` file enforces LF line endings for all text files:

```gitattributes
# sjc1990app - Git Line Ending Configuration
# This project targets Linux (AWS Lambda) - enforce LF everywhere

# Auto detect text files and normalize to LF
* text=auto eol=lf

# Explicitly declare text files
*.ts text eol=lf
*.js text eol=lf
*.sh text eol=lf
*.md text eol=lf
# ... and all other text files
```

**What this does**:
- All text files are stored in the repository with LF
- All developers get LF when they check out files (if `core.autocrlf=input`)
- Shell scripts (`*.sh`) are **always** LF (required for bash)

---

## Why This Matters for This Project

### 1. AWS Lambda Runs on Linux
- Lambda functions execute in a Linux environment
- Linux requires LF line endings for shell scripts
- CRLF in shell scripts causes: `bash: ./script.sh: /bin/bash^M: bad interpreter`

### 2. Consistency Across Team
- Developer on Windows gets LF (with correct git config)
- Developer on macOS gets LF
- Developer on Linux gets LF
- **Everyone has identical files** → No "works on my machine" issues

### 3. CI/CD Pipelines
- GitHub Actions runs on Linux
- If files have CRLF, CI/CD scripts fail
- LF ensures scripts work everywhere

---

## How to Verify It's Fixed

### Check Git Status
```bash
git status
```

**Expected**: `fix-line-endings.sh` and `verify-setup.sh` should **NOT** appear.

**If they still appear**:
- Run: `git diff fix-line-endings.sh` to see actual changes
- If you see only `^M` or line ending changes: Re-run `./fix-git-line-endings-local.sh`
- If you see actual content changes: You actually modified the file (commit it)

### Check Git Config
```bash
git config --get core.autocrlf  # Should be: input
git config --get core.eol       # Should be: lf
```

### Check File Line Endings
```bash
file fix-line-endings.sh
# Expected: "... text executable" (no mention of CRLF)

grep -c $'\r' fix-line-endings.sh
# Expected: 0 (no carriage returns found)
```

---

## Common Scenarios

### Scenario 1: "I just cloned the repo and files show as changed"

**Cause**: Your git `core.autocrlf` is set to `true` (Windows default)

**Fix**: Run `./fix-git-line-endings-local.sh`

---

### Scenario 2: "Files were fine, now they show as changed after I edited on Windows"

**Cause**: Your text editor (Notepad, VS Code with wrong settings) saved files with CRLF

**Fix**:
1. Configure your editor to use LF:
   - **VS Code**: Set `"files.eol": "\n"` in settings.json
   - **IntelliJ/WebStorm**: File → Line Separators → LF
   - **Notepad++**: Edit → EOL Conversion → Unix (LF)

2. Re-save the file with LF
3. Or run: `sed -i 's/\r$//' filename.sh`

---

### Scenario 3: "I'm getting 'bad interpreter' errors when running shell scripts"

**Cause**: Shell scripts have CRLF line endings (Windows format)

**Symptoms**:
```bash
bash: ./script.sh: /bin/bash^M: bad interpreter: No such file or directory
```

**Fix**:
```bash
sed -i 's/\r$//' script.sh  # Convert CRLF → LF
chmod +x script.sh          # Make executable
./script.sh                 # Run again
```

Or run: `./fix-git-line-endings-local.sh` to fix all scripts

---

## Git Line Ending Best Practices

### ✅ DO

1. **Set git config correctly**:
   ```bash
   git config --global core.autocrlf input  # WSL, Linux, macOS
   git config --global core.eol lf
   ```

2. **Use `.gitattributes`** (we have this):
   ```gitattributes
   * text=auto eol=lf
   *.sh text eol=lf
   ```

3. **Configure your editor** to use LF for text files

4. **Verify before committing**:
   ```bash
   git diff --check  # Shows line ending issues
   ```

### ❌ DON'T

1. Don't use `core.autocrlf=true` on WSL/Linux
2. Don't mix line endings in the same file
3. Don't edit files with Notepad (uses CRLF)
4. Don't commit files without checking `git diff`

---

## Troubleshooting

### "I ran the fix script but files still show as changed"

**Check 1**: Do you have actual content changes?
```bash
git diff fix-line-endings.sh
```

If you see actual code changes (not just `^M`), you modified the file.

**Check 2**: Is git config correct?
```bash
git config --get core.autocrlf  # Must be "input"
git config --get core.eol       # Must be "lf"
```

**Check 3**: Re-run the fix script
```bash
./fix-git-line-endings-local.sh
```

---

### "How do I reset everything to match the repository?"

**Nuclear option** (discards all local changes):
```bash
git reset --hard HEAD
git clean -fd
./fix-git-line-endings-local.sh
```

**⚠️ Warning**: This will delete all uncommitted changes!

---

## Reference Commands

### Check Line Endings

```bash
# Check file type (should not say CRLF)
file filename.sh

# Count carriage returns (should be 0)
grep -c $'\r' filename.sh

# Show line endings visually
cat -A filename.sh | head
# LF shows as: $
# CRLF shows as: ^M$
```

### Convert Line Endings

```bash
# CRLF → LF (single file)
sed -i 's/\r$//' filename.sh

# CRLF → LF (all shell scripts)
find . -name "*.sh" -type f -exec sed -i 's/\r$//' {} \;

# LF → CRLF (if you really need Windows format)
sed -i 's/$/\r/' filename.txt
```

### Git Operations

```bash
# Show files with line ending issues
git diff --check

# Re-normalize all files based on .gitattributes
git rm --cached -r .
git reset --hard HEAD

# Check specific file's line ending in git
git show HEAD:filename.sh | file -
```

---

## Summary

**Problem**: WSL git converts LF → CRLF on checkout, files appear as changed

**Root Cause**: `core.autocrlf=true` (Windows default) conflicts with `.gitattributes`

**Solution**: Set `core.autocrlf=input` and `core.eol=lf`

**How to Fix**: Run `./fix-git-line-endings-local.sh`

**Prevention**: Configure your editor to use LF, always check `git diff` before committing

---

## Further Reading

- [Git Documentation - gitattributes](https://git-scm.com/docs/gitattributes)
- [GitHub: Configuring Git to handle line endings](https://docs.github.com/en/get-started/getting-started-with-git/configuring-git-to-handle-line-endings)
- [Stack Overflow: Git line endings on Windows](https://stackoverflow.com/questions/3206843/how-line-ending-conversions-work-with-git-core-autocrlf-between-different-operat)

---

**Last Updated**: 2025-12-11
**Status**: Line ending issues resolved, git config optimized for WSL
**Action Required**: Run `./fix-git-line-endings-local.sh` once on your local machine
