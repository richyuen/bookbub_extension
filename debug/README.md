# BookBub Extension Debug Tools

This folder contains diagnostic and debugging tools to fix the "No unpurchased books found" issue.

## The Problem

The BookBub extension shows "No unpurchased books found" even when free books are visible on the page. This is typically caused by BookBub updating their HTML structure, causing the CSS selectors in the extension to no longer match the page elements.

## Quick Start (5 Minutes)

### Option 1: Auto-Fix Generator (Recommended)

1. Go to the BookBub deals page in Chrome where books are visible
2. Open Console (F12 → Console tab)
3. Copy the entire contents of `auto_fix_generator.js`
4. Paste into console and press Enter
5. Copy the generated code and apply to `content/bookbub.js`
6. Reload extension in `chrome://extensions/`

**This will automatically:**
- Detect the correct CSS selectors
- Identify how Amazon links are structured
- Determine price formatting
- Generate the exact code changes needed

### Option 2: Use Enhanced Debug Version

Replace the current content script with the debug version:

1. Copy `enhanced_bookbub.js` to `content/bookbub.js`
2. Reload extension in `chrome://extensions/`
3. Open Console (F12) on BookBub page
4. Click "Start Auto-Purchase" button
5. Read the detailed console logs to identify the issue

The enhanced version:
- Tries 11 different selector patterns (vs 4 in original)
- Logs exactly why each book is skipped
- Shows detailed statistics about what was found
- Includes automatic fallback logic

## Files in This Folder

### Diagnostic Scripts

- **`auto_fix_generator.js`** - Smart diagnostic that generates exact code fixes
  - Run in console to get copy-paste ready solutions
  - Best for quick fixes

- **`bookbub_selector_diagnostic.js`** - Comprehensive diagnostic script
  - Analyzes entire page structure
  - Searches for specific books (like "Water")
  - Walks up DOM tree to find containers
  - Shows all data attributes

### Enhanced Code

- **`enhanced_bookbub.js`** - Drop-in replacement for `content/bookbub.js`
  - More selectors and better fallback logic
  - Extensive console logging
  - Detailed statistics on what's being skipped
  - Easier to debug issues

### Documentation

- **`NEXT_STEPS.md`** - Start here! Step-by-step guide to fix the issue
  - Exactly what to do in order
  - Quick copy-paste diagnostics
  - Common scenarios and fixes

- **`DEBUGGING_GUIDE.md`** - Comprehensive debugging reference
  - Root cause analysis
  - All possible fixes
  - Testing procedures
  - Rollback instructions

- **`quick_diagnostic.md`** - Quick reference guide
  - One-liner console commands
  - Common issues and solutions
  - Testing checklist

## Typical Debug Flow

```
1. Run auto_fix_generator.js in console
   ↓
2. Copy generated code fixes
   ↓
3. Update content/bookbub.js
   ↓
4. Reload extension
   ↓
5. Test on BookBub page
   ↓
6. If still broken: use enhanced_bookbub.js for detailed logs
   ↓
7. Check console output to identify specific issue
   ↓
8. Apply targeted fix from DEBUGGING_GUIDE.md
```

## Common Issues and Solutions

### Issue 1: No deal containers found

**Symptom:** Console shows "Found 0 deals using selector: ..."

**Fix:** Run `auto_fix_generator.js` to find the new selector. BookBub likely changed from `.deal-tile` to something like `.book-card` or `[data-book-id]`.

### Issue 2: Books found but all skipped

**Possible causes:**
- **No Amazon links** - Links might be BookBub redirects instead of direct Amazon links
- **Price format changed** - Free books might show empty price instead of "$0.00"
- **Already purchased** - Chrome storage has books marked as purchased incorrectly

**Fix:** Use `enhanced_bookbub.js` to see exact skip reasons in console logs.

### Issue 3: "Water" book visible but not detected

**Symptom:** Book is on page but extension doesn't find it

**Fix:** Run `bookbub_selector_diagnostic.js` and look at the "Walking up from Water" section to see the exact element structure around that book.

### Issue 4: Price filtering too strict

**Symptom:** Console shows "Skipping non-free book" for books that are actually free

**Fix:** Update price check in `content/bookbub.js` line 204 to handle empty prices or different formats like "Free" vs "$0.00".

## Testing Your Fixes

After making changes:

1. Go to `chrome://extensions/`
2. Find "BookBub Auto-Purchase Extension"
3. Click the reload icon (or click remove/load unpacked)
4. Refresh the BookBub page
5. Open Console (F12)
6. Click "Start Auto-Purchase"
7. Check console logs

**Success looks like:**
```
Found 24 deals using selector: .deal-tile
Deal #1:
  Amazon URL: https://www.amazon.com/dp/...
  Title found (h3): "Water"
  Price (.price): "$0.00"
  Book ID: B0ABCD1234
  ✓ Added to list: "Water"
```

**Failure looks like:**
```
No deal elements found. Page structure may have changed.
```

## Need More Help?

If the auto-fix generator doesn't work:

1. Run `bookbub_selector_diagnostic.js` for full analysis
2. Check `DEBUGGING_GUIDE.md` for all possible fixes
3. Take screenshots of:
   - Console output
   - BookBub page showing books
   - DevTools Elements tab showing a book element
4. Check if books are loading dynamically after page load

## File Quick Reference

| Need to... | Use this file |
|------------|---------------|
| Get exact code fixes fast | `auto_fix_generator.js` |
| See detailed debug logs | `enhanced_bookbub.js` |
| Understand the problem | `NEXT_STEPS.md` |
| Deep dive debugging | `DEBUGGING_GUIDE.md` |
| Quick console commands | `quick_diagnostic.md` |
| Analyze page structure | `bookbub_selector_diagnostic.js` |

## Rollback

If changes break something:

```bash
# Restore original (if you made a backup)
copy content\bookbub.js.backup content\bookbub.js
```

Or restore from git if this is a repository:

```bash
git checkout content/bookbub.js
```

## Contributing Fixes

After you fix the issue, consider:

1. Documenting which selector worked for you
2. Noting the date (BookBub may change structure again)
3. Updating the main `content/bookbub.js` with the new selector as the first option

Example:
```javascript
const dealSelectors = [
  '.book-card',        // Working as of 2024-01-31
  '.deal-tile',        // Worked until 2024-01-15
  '.daily-deal-tile',
  // ...
];
```
