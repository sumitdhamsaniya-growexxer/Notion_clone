
### `AI_LOG.md`

```markdown
# AI Log

## 2024-01-15

**Tool:** Claude

**What I asked for:**
How to implement Enter mid-block split in a contenteditable editor without losing text.

**What it generated:**
Initial approach using `document.execCommand('insertParagraph')` and reading innerHTML.

**What was wrong or missing:**
`execCommand` is deprecated and produced inconsistent results across browsers.
innerHTML reading included HTML tags which corrupted plain text content.

**What I changed and why:**
Switched to `window.getSelection().getRangeAt(0)` to get exact cursor character offset,
then used `innerText.slice(0, cursorOffset)` and `innerText.slice(cursorOffset)` to split
cleanly. This preserves exact text with zero loss or duplication.

---

## 2024-01-16

**Tool:** Claude

**What I asked for:**
Database schema for block ordering — how to store order of blocks.

**What it generated:**
Initial schema used `order_index INTEGER` with gap of 1000 between blocks.

**What was wrong or missing:**
The spec explicitly requires FLOAT/DECIMAL for order_index so midpoint insertion
works. INTEGER midpoint between 1000 and 1001 is impossible. AI used INTEGER first.

**What I changed and why:**
Changed to `DECIMAL(20,10)` in PostgreSQL schema. Updated all inserts and updates
to use `parseFloat()`. Added renormalization trigger when gap < 0.001.

---

## 2024-01-17

**Tool:** Claude

**What I asked for:**
How to protect against cross-account document access.

**What it generated:**
Suggested adding `WHERE id = $1 AND user_id = $2` to all document queries.

**What was wrong or missing:**
This approach is correct but AI initially put the check only in GET, missing PATCH and DELETE.
Also the error returned was 404 (hiding existence) — spec says 403.

**What I changed and why:**
Added a `verifyOwnership` helper that always returns 403 (not 404) when ownership fails,
applied to GET, PATCH, DELETE, and share endpoints consistently.

---

## 2024-01-17

**Tool:** None (written manually)

**What I wrote manually:**
The `useAutoSave` hook with AbortController logic.

**Why I chose not to use AI:**
The race condition logic (cancel in-flight request when user types again + server version
check) required precise understanding of how React state closures interact with async
requests. AI-generated versions kept closing over stale `blocks` state. I wrote it
manually to ensure the AbortController ref and version ref were handled correctly.

---

## 2024-01-18

**Tool:** Claude

**What I asked for:**
Slash command menu — how to prevent typed characters from appearing in block content.

**What it generated:**
Suggested intercepting keydown and preventing default on '/'.

**What was wrong or missing:**
Preventing the '/' default meant the character never appeared, but the filter
wouldn't work (user types /heading but we need to track "heading" as filter).
The menu needs the '/' to appear first, then track subsequent characters as filter.

**What I changed and why:**
Let the '/' render normally (don't preventDefault), then open the menu on the NEXT
tick via setTimeout. On type selection, explicitly set block content to `{text:''}` 
and clear the DOM element's innerText. On Escape, slice from last '/' position in 
the text to clean up. This ensures zero bleed in all cases.

---

## 2024-01-19

**Tool:** Claude

**What I asked for:**
Backspace behavior when the previous block is a non-editable type (divider, image).

**What it generated:**
Suggested focusing the divider element and letting the user press Backspace again.

**What was wrong or missing:**
Divider/image blocks have no contenteditable so cursor cannot enter them.
"Focus then Backspace again" creates a confusing UX loop.

**What I changed and why:**
When Backspace is pressed at the start of a block and the previous block is a
NON_EDITABLE_TYPE (divider, image), immediately delete the previous block and
keep cursor in the current block at position 0. Clean, predictable, no confusion.
