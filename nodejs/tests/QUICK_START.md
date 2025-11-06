# 🚀 Quick Start - Running Tests (For Beginners)

**Total Time: 2 minutes** ⏱️

---

## Step-by-Step Guide

### 1️⃣ Open Terminal/Command Prompt

**Windows**:
- Press `Win + R`
- Type `cmd` or `powershell`
- Press Enter

**macOS/Linux**:
- Press `Cmd + Space` (Mac) or `Ctrl + Alt + T` (Linux)
- Type `terminal`
- Press Enter

---

### 2️⃣ Navigate to Backend Folder

**Windows (PowerShell/CMD)**:
```bash
cd RentWise_Backend\nodejs
```

**macOS/Linux**:
```bash
cd RentWise_Backend/nodejs
```

**Note**: Make sure you're in the project root directory first. If you cloned the repo to a different location, navigate there first.

---

### 3️⃣ Install Dependencies (First Time Only)

Copy and paste this command:

```bash
npm install
```

**What this does**: Downloads all required testing tools (Jest, Supertest, etc.)

**Expected output**: You'll see installation progress. Wait until you see "added XXX packages".

⏱️ **Time**: ~30 seconds to 2 minutes (depending on internet speed)

---

### 4️⃣ Run All Tests (White Box + Black Box)

Copy and paste this command:

```bash
npm test
```

**What you'll see**:
```
✅ PASS  tests/unit/controllers/authController.test.js
✅ PASS  tests/unit/controllers/listingController.test.js
🟡 PARTIAL PASS  tests/integration/auth.integration.test.js

Test Suites: 1 failed, 2 passed, 3 total
Tests:       6 failed, 30 passed, 36 total
Time:        0.942s
```

**Understanding the results**:
- ✅ **30 passed** = Tests that successfully verified code works correctly
- ❌ **6 failed** = Tests that need database setup (normal for first run)
- ⏱️ **0.942s** = How fast the tests ran (less than 1 second!)

---

### 5️⃣ View the HTML Report

**Windows**:
```bash
start tests\coverage\lcov-report\index.html
```

**macOS**:
```bash
open tests/coverage/lcov-report/index.html
```

**Linux**:
```bash
xdg-open tests/coverage/lcov-report/index.html
```

**What you'll see**: 
- A webpage opens in your browser
- Shows which code has been tested (green = tested ✅, red = not tested ❌)
- Coverage percentages for each file

---

## 🎯 Quick Commands Reference

| Command | What it does | When to use |
|---------|--------------|-------------|
| `npm test` | Run all tests | Before committing code |
| `npm run test:unit` | Run only fast tests (no database) | Quick check during development |
| `npm run test:integration` | Run only API tests | Test complete workflows |
| `npm run test:coverage` | Same as `npm test` + detailed report | See exactly what's tested |
| `npm run test:watch` | Auto-rerun tests when you edit code | While coding |

---

## ❓ Common Questions

### Q: Why do 6 tests fail?
**A**: Those tests need a database connection. The other 30 tests work perfectly! The failing tests are expected and documented.

### Q: How do I know if my code is well-tested?
**A**: Look at the HTML report (Step 5). Green lines = tested, Red lines = not tested. Aim for mostly green!

### Q: How long does it take to run tests?
**A**: Less than 1 second! Super fast for quick validation.

### Q: Can I run just one test file?
**A**: Yes! Use: `npm test -- authController.test.js`

### Q: What does 100% coverage mean?
**A**: Every line and decision in your code has been tested. That's excellent!

---

## 🎓 What You Just Did

Congratulations! You just:
1. ✅ Installed testing tools
2. ✅ Ran 36 automated tests
3. ✅ Generated a coverage report
4. ✅ Verified code quality

**Next steps**: 
- Read `README.md` in this folder for more details
- Check `../../Testing.md` for complete test documentation
- Try running `npm run test:watch` while editing code

---

## 🆘 Troubleshooting

### "npm: command not found"
**Solution**: Install Node.js from https://nodejs.org/ (download LTS version)

### "Cannot find module"
**Solution**: Run `npm install` again

### Tests take too long
**Solution**: Run `npm run test:unit` instead (skips database tests)

### "Port already in use"
**Solution**: Close other terminal windows and try again

---

## 📞 Need Help?

- 📖 Detailed guide: Check `README.md` in this folder
- 📄 Full documentation: See `../../Testing.md`
- 🐛 Found a bug: Check the HTML report to see which code isn't tested
- 💬 Questions: Ask your team lead or check test files for examples

---

**Last Updated**: November 6, 2025
**Framework**: Jest 29.x
**Status**: ✅ Beginner-Friendly Guide Complete
