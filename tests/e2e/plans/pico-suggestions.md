# Test Plan: Pico Prompt Suggestions

## Objective

Verify that prompt suggestion buttons appear after Pico responses, clicking a suggestion sends it as the next message, and suggestions clear when the user starts a new message.

## Prerequisites

- Backend running on `:3001`, frontend on `:5173` or `:5174`
- Database seeded with at least one project
- chrome-devtools MCP connected
- Pico chat functional (requires Anthropic API key configured)

**Note:** Prompt suggestions require the SDK to generate them (`promptSuggestions: true`). If the API key is not configured or Pico is unavailable, suggestion-related steps will be SKIP. The suggestion buttons only appear after Pico completes a response — they are SSE events from the backend.

## Steps

> **Visual inspection protocol:** After each major navigation or UI interaction step, take a screenshot using `take_screenshot`. Examine the screenshot visually using the `Read` tool. Note any visual issues in the results alongside the functional pass/fail.

### Part 1: Suggestion Button Visibility (4 steps)

1. **Open Pico chat** by clicking the chat bubble (bottom-right)
   - Verify: Pico chat panel opens
   - **Screenshot checkpoint:** Take screenshot

2. **Send a message** to Pico (type "What can you help me with?" and press Cmd+Enter)
   - Wait for Pico to respond
   - Expected: after response completes, 1-3 suggestion buttons appear between messages and input area
   - **Screenshot checkpoint:** Take screenshot (SKIP if API key not configured)

3. **Verify suggestion button styling**
   - Look for: rounded pill buttons (`rounded-full`) with primary color border and text
   - Expected: text truncated at 200px max width, text-xs size
   - **Screenshot checkpoint:** Take screenshot (SKIP if no suggestions)

4. **Verify suggestions hidden during streaming**
   - While Pico is generating a response, suggestions should NOT be visible
   - Expected: `suggestions.length > 0 && !isStreaming` condition prevents display during streaming
   - (SKIP if can't observe streaming state)

### Part 2: Click Interaction (3 steps)

5. **Click a suggestion button**
   - Expected: the suggestion text is sent as the next user message
   - User bubble appears with the suggestion text
   - Pico starts responding to it
   - **Screenshot checkpoint:** Take screenshot (SKIP if no suggestions)

6. **Verify suggestions clear after sending**
   - After clicking a suggestion, the old suggestion buttons should disappear
   - Expected: `setSuggestions([])` called on send
   - New suggestions may appear after the new response

7. **Verify max 3 suggestions**
   - Expected: at most 3 suggestion buttons shown (`.slice(-3)` in hook)
   - (SKIP if fewer than 3 suggestions appear)

### Part 3: Visual Quality (2 steps)

8. **Take screenshot** of Pico panel with suggestion buttons visible
   - Verify: buttons positioned between ScrollArea and input, properly spaced
   - Check: border-t separator visible, buttons don't overflow panel width

9. **Verify dark mode** appearance
   - Check: primary color text readable, border visible, buttons have hover state
   - Expected: `border-primary/30`, `text-primary`, `hover:bg-primary/10`

## Expected Results

- 1-3 suggestion buttons appear after each Pico response
- Buttons are rounded pills with primary color styling
- Clicking sends the suggestion as a message
- Suggestions clear when a new message is sent
- Suggestions hidden during streaming
- Max 3 suggestions shown

### Visual Quality

- Buttons positioned between messages and input with border-t separator
- Text truncated at 200px, text-xs size
- Primary color border and text, hover background
- Buttons wrap if multiple on same row
- Dark mode: readable text and border

## Failure Criteria

- Suggestions appear during streaming (should be hidden)
- Clicking doesn't send the suggestion text
- Suggestions don't clear after sending
- More than 3 suggestions shown
- Suggestion buttons overlap with input area

### Visual Failure Criteria

- Buttons overflow panel width
- Text invisible or wrong color
- No border-t separator between messages and suggestions
- Buttons too large or misaligned
