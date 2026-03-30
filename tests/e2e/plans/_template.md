# Test Plan: [Name]

## Objective

What this test verifies in one sentence.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173`
- API mode set to "api"
- Database seeded with test data
- [Any additional state needed before starting]

## Steps

1. **Navigate** to `http://localhost:5173/[path]`
   - Verify: page loads without errors

2. **Verify** [element] is visible
   - Look for: text "[visible text]" or element with aria-label "[label]"
   - Expected: [what it should look like]

3. **Click** [element description]
   - Target: button with text "[text]" / link with text "[text]" / element matching "[selector]"
   - Expected: [what should happen after the click]

4. **Type** "[text]" into [input description]
   - Target: input with placeholder "[placeholder]" or label "[label]"
   - Expected: [what should happen]

5. **Verify** [expected state after actions]
   - Check: [specific assertion — text content, element presence, count, navigation]
   - Expected: [exact expected value or condition]

6. **Take screenshot** for evidence

## Expected Results

- [Bullet list of what a passing test looks like]
- [Each point should be independently verifiable]

## Failure Criteria

- [What constitutes a test failure]
- [Examples: element not found, wrong text, navigation fails, error displayed, NaN/undefined values]
- [Include timing: "element does not appear within 5 seconds"]
