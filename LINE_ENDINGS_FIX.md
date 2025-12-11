# Line Endings Fix - CRLF to LF

## 🔴 Problem Detected

Files in the working directory have **CRLF (Windows-style)** line endings instead of **LF (Unix-style)**.

### Why This Matters

This project targets **AWS Lambda (Linux)**, so CRLF line endings cause:

1. ❌ **Shell scripts fail**
   ```bash
   ./test-api.sh: line 2: $'\r': command not found
   ```

2. ❌ **Lambda deployment issues** - AWS Lambda runs on Linux and expects LF

3. ❌ **Git diff pollution** - spurious changes across environments

4. ❌ **Inconsistent development** - different behavior on Windows/WSL vs macOS/Linux

### Current State

```bash
$ git ls-files --eol | grep crlf
i/lf    w/crlf  attr/   backend/services/auth-service/handlers/approve.ts
i/lf    w/crlf  attr/   backend/services/auth-service/handlers/pending-approvals.ts
# ... (11 files total)
```

**Meaning:**
- `i/lf` - Files **stored correctly** in git with LF endings ✓
- `w/crlf` - Working directory has CRLF endings ✗ (due to git `core.autocrlf` setting)

## ✅ Solution

I've created two files to fix this:

### 1. `.gitattributes` (Permanent Fix)

Enforces LF line endings for all text files project-wide:

```gitattributes
* text=auto eol=lf
*.ts text eol=lf
*.js text eol=lf
*.sh text eol=lf
# ... (all text file types)
```

**Benefits:**
- ✅ All developers get consistent line endings
- ✅ Works on Windows, macOS, Linux, WSL
- ✅ Prevents CRLF from being committed
- ✅ Shell scripts always executable

### 2. `fix-line-endings.sh` (One-Time Fix)

Automated script to normalize all existing files.

## 🚀 How to Fix (Run on Your Local Machine)

### Step 1: Pull Latest Changes

```bash
cd ~/dev/sjc1990app
git pull origin claude/status-update-014V8MZCDkLKZuP57wNLN2FW
```

### Step 2: Run the Fix Script

```bash
./fix-line-endings.sh
```

**What it does:**
1. Configures git: `core.autocrlf=false`, `core.eol=lf`
2. Converts all CRLF files to LF in working directory
3. Normalizes repository based on `.gitattributes`
4. Verifies all files have LF endings

### Step 3: Review and Commit

```bash
# Check what changed
git status
git diff

# Commit the normalized files
git add .
git commit -m "fix: Normalize all files to LF line endings"

# Push changes
git push origin claude/status-update-014V8MZCDkLKZuP57wNLN2FW
```

## 🔍 Manual Fix (Alternative)

If you prefer to fix manually:

```bash
# Configure git
git config core.autocrlf false
git config core.eol lf

# Convert files (method 1: using dos2unix)
sudo apt-get install dos2unix
find . -type f -name "*.ts" -exec dos2unix {} \;
find . -type f -name "*.js" -exec dos2unix {} \;
find . -type f -name "*.sh" -exec dos2unix {} \;

# Convert files (method 2: using sed)
find . -type f -name "*.ts" -exec sed -i 's/\r$//' {} \;
find . -type f -name "*.js" -exec sed -i 's/\r$//' {} \;
find . -type f -name "*.sh" -exec sed -i 's/\r$//' {} \;

# Normalize repository
git add --renormalize .
```

## 📋 Verification

After running the fix, verify line endings:

```bash
# Should show no CRLF files
git ls-files --eol | grep crlf

# If empty output = all files are LF ✓
```

## 🎯 Best Practices Going Forward

### For This Project

The `.gitattributes` file ensures:
- ✅ All new files automatically get LF endings
- ✅ Works regardless of developer's OS or git settings
- ✅ Consistent across entire team

### For Your WSL Environment

**Recommended git config:**

```bash
# Global settings (affects all repos)
git config --global core.autocrlf false
git config --global core.eol lf

# Verify settings
git config --global --list | grep -E "(autocrlf|eol)"
```

**Why:**
- `core.autocrlf false` - Don't auto-convert line endings
- `core.eol lf` - Use LF for new files
- `.gitattributes` overrides these per-project

### For Windows Developers

If you use native Windows (not WSL):
```bash
# Use input mode (convert CRLF to LF on commit)
git config --global core.autocrlf input
```

## 🐛 Troubleshooting

### Script Still Fails After Fix

```bash
# Re-apply LF conversion
sed -i 's/\r$//' script-name.sh

# Make executable
chmod +x script-name.sh
```

### Files Showing as Modified After Pull

This is normal during the transition. The files are being normalized to LF.

```bash
# Reset to correct line endings
git add --renormalize .
git status
```

### Git Keeps Converting to CRLF

Check your git config:
```bash
git config core.autocrlf
# Should be: false (or input)

git config core.eol
# Should be: lf
```

## 📚 Background

### What Are Line Endings?

- **LF (Line Feed)** - `\n` - Unix/Linux/macOS standard
- **CRLF (Carriage Return + Line Feed)** - `\r\n` - Windows standard

### Why Git `autocrlf` Exists

Git's `core.autocrlf` was designed to help Windows developers:
- `true` - Convert LF to CRLF on checkout, CRLF to LF on commit
- `input` - Convert CRLF to LF on commit, leave LF as-is on checkout
- `false` - Don't convert anything

**Problem:** In WSL (Linux environment on Windows), `autocrlf=true` causes issues because:
1. WSL is Linux (expects LF)
2. But git thinks you're on Windows (converts to CRLF)
3. Result: Working directory has CRLF, causing shell script failures

**Solution:** Use `.gitattributes` to enforce LF project-wide, regardless of developer settings.

## ✅ After Fix Checklist

- [ ] Ran `./fix-line-endings.sh` successfully
- [ ] Verified `git ls-files --eol | grep crlf` is empty
- [ ] All shell scripts execute without `$'\r'` errors
- [ ] Committed and pushed normalized files
- [ ] Configured `core.autocrlf=false` and `core.eol=lf`
- [ ] Team members notified about `.gitattributes`

## 🎓 Learning Resources

- [Git Documentation: gitattributes](https://git-scm.com/docs/gitattributes)
- [GitHub: Dealing with line endings](https://docs.github.com/en/get-started/getting-started-with-git/configuring-git-to-handle-line-endings)
- [EditorConfig](https://editorconfig.org/) - Consistent editor settings across IDEs

---

**Summary:** Run `./fix-line-endings.sh` once, commit changes, and `.gitattributes` prevents this issue forever.
