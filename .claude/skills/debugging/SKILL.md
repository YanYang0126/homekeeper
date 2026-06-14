---
name: debugging
description: Auto-analyze errors, fix runtime failures, debug frontend/backend issues. Use when encountering errors, bugs, or unexpected behavior in the project.
---

## Debugging Skill

When invoked, follow this systematic debugging workflow:

### 1. Gather Error Context
- Read the full error message and stack trace
- Identify the file and line number where the error occurred
- Check if this is a runtime error, build error, or logical bug
- Look for recent changes that might have introduced the issue (use `git log --oneline -5`)

### 2. Reproduce the Issue
- Understand the conditions that trigger the bug
- Check browser console errors (for frontend): look for `console.error` calls
- Check network requests (for API issues): examine fetch/XHR calls
- Verify the expected behavior vs actual behavior

### 3. Root Cause Analysis
- Trace the code path from entry point to error location
- Check variable values and state at the point of failure
- Look for common patterns:
  - null/undefined references
  - async/await issues (missing await, promise handling)
  - event handler binding problems
  - CSS layout/selectivity issues
  - state management bugs
  - API response handling errors

### 4. Fix Implementation
- Apply the minimal fix needed to resolve the issue
- Explain the root cause and why the fix works
- Ensure the fix doesn't introduce side effects
- Add error handling to prevent similar issues

### 5. Verification
- After fixing, verify the fix by reviewing the code path
- Check if similar patterns exist elsewhere in the codebase that should also be fixed
- For browser issues, suggest using Playwright MCP to verify the fix visually

### Debugging Checklist
- [ ] Error message understood
- [ ] Root cause identified
- [ ] Fix is minimal and targeted
- [ ] No side effects introduced
- [ ] Similar issues checked across codebase
- [ ] Error handling added for edge cases
