---
name: testing
description: Auto-generate tests, check functionality, prevent regressions. Use when adding new features, fixing bugs, or before committing changes.
---

## Testing Skill

When invoked, follow this testing workflow:

### 1. Analyze What to Test
- Identify the function/component/module being added or changed
- Determine critical paths: happy path, edge cases, error states
- For UI components: test rendering, user interactions, state changes
- For utilities: test input/output combinations, boundary values

### 2. Test Generation Strategy

#### For Vanilla JS Projects (like this project):
- Create test files in a `tests/` directory
- Use a simple test framework or write manual test runners
- Test DOM manipulations by setting up minimal HTML fixtures
- Test utility functions with various inputs
- Test event handlers with simulated events

#### Test Template:
```javascript
// tests/module-name.test.js
describe('ModuleName', () => {
  // Setup
  beforeEach(() => {
    // Initialize test fixtures
  });

  // Happy path
  test('should handle normal input correctly', () => {
    // Arrange - set up test data
    // Act - call the function
    // Assert - verify the result
  });

  // Edge cases
  test('should handle empty input', () => { /* ... */ });
  test('should handle null/undefined', () => { /* ... */ });
  test('should handle extreme values', () => { /* ... */ });

  // Error states
  test('should throw on invalid input', () => { /* ... */ });
});
```

### 3. Test Types to Generate
- **Unit Tests**: Individual functions, pure logic
- **Integration Tests**: Multiple modules working together
- **UI Tests**: DOM interactions, event handling
- **Regression Tests**: Specific bugs that were fixed

### 4. Run and Validate
- Execute all tests after writing them
- Ensure new tests pass
- Ensure existing tests still pass (no regressions)
- If test framework not available, suggest setting one up (e.g., Vitest, Jest)

### 5. Continuous Testing
- Recommend running tests after each significant change
- For this project, suggest: use Playwright MCP for E2E browser testing
- Add test scripts to package.json when available

### Testing Checklist
- [ ] Happy path covered
- [ ] Edge cases covered
- [ ] Error handling tested
- [ ] All tests pass
- [ ] Existing tests not broken
- [ ] Test names are descriptive
