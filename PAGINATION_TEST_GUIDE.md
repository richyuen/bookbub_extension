# How to Test Automatic Pagination

## Overview

The extension can now automatically move to the next BookBub page if it finds unpurchased books, allowing you to process hundreds of books across multiple pages.

## Enable Auto-Pagination

1. **Reload extension:** `edge://extensions/` → reload button

2. **Open extension popup** (click extension icon in toolbar)

3. **Toggle "Auto-Pagination" setting**
   - In Settings section, flip the toggle switch to ON (green)
   - Button on BookBub page changes to: **"Start Auto-Purchase (Auto-Page ON)"**

4. **Toggle OFF** to disable (for testing)
   - Flip toggle switch to OFF (gray)
   - Button text changes to: **"Start Auto-Purchase"**

## Test Scenario 1: Single Page (Baseline)

**Setup:**
- Ensure auto-pagination is **OFF** (toggle in popup settings if needed)
- Go to a BookBub page with some unpurchased books

**Expected:**
1. Click button
2. Books process
3. Alert: "Processing complete! Done!"
4. **Stays on same page** ✓

## Test Scenario 2: Multiple Pages (Auto-Pagination)

**Setup:**
- Enable auto-pagination (toggle ON in popup settings)
- Go to page 1 of BookBub search results

**Expected:**
1. Click "Start Auto-Purchase (Auto-Page ON)"
2. Page 1 processes (e.g., finds 15 unpurchased books)
3. Alert: "Page 1 complete! Processed: 15... Moving to next page..."
4. **Automatically navigates to page 2** ✓
5. Page 2 loads
6. **Button auto-clicks** (processing continues)
7. Page 2 processes (e.g., finds 8 unpurchased books)
8. Alert: "Page 2 complete! Processed: 8... Moving to next page..."
9. **Navigates to page 3** ✓
10. Page 3 processes (finds 0 unpurchased books - all already owned)
11. Alert: "Processing complete! No more unpurchased books found."
12. **Stops** ✓

## Test Scenario 3: Force Last Book Unpurchased

To specifically test "if last book is unpurchased, go to next page":

**Setup:**
1. Enable auto-pagination
2. Find a BookBub page where you own most books
3. **Clear storage** so the last book on page shows as unpurchased:
   ```javascript
   // In background console:
   chrome.storage.local.clear();
   ```

**Expected:**
- Page processes
- Finds 1+ unpurchased books (including last one)
- **Moves to next page** ✓

## Test Scenario 4: Stop Condition

**Setup:**
- Enable auto-pagination
- Navigate manually to a high page number with all owned books
  - e.g., `?page=50` on your BookBub search

**Expected:**
1. Click button
2. Processes page 50
3. Finds 0 unpurchased books (all owned)
4. Alert: "Processing complete! No more unpurchased books found."
5. **Does NOT go to page 51** ✓

## Test Scenario 5: Disable Mid-Processing

**Setup:**
- Enable auto-pagination
- Start processing

**Test:**
1. While processing page 1, **open popup and toggle auto-pagination OFF**
2. Wait for page 1 to complete

**Expected:**
- Page 1 finishes
- Alert: "Processing complete! Done!"
- **Does NOT navigate to page 2** ✓
- (Next page navigation only happens for pages processed with auto-page ON)

## How It Works

### Logic:
```javascript
if (autoPageEnabled && processedBooks > 0) {
  goToNextPage();
} else {
  stop();
}
```

### Page Detection:
- Reads current page from URL: `?page=14`
- Increments: `page=15`
- Navigates to new URL

### Stop Conditions:
1. **Auto-pagination disabled** (manual stop)
2. **Zero unpurchased books found** (all owned)
3. **Error occurs** (safety)

## UI Indicators

**Button States:**
- `Start Auto-Purchase` → Auto-page OFF
- `Start Auto-Purchase (Auto-Page ON)` → Auto-page ON

**Popup Settings:**
- Toggle switch: Green (ON) / Gray (OFF)
- Setting description: "Automatically move to next page if unpurchased books found"

**Tooltip (hover):**
- When ON: "Click to start processing books. Auto-pagination enabled."
- When OFF: "Click to start processing books. Auto-pagination disabled."

**Alerts:**
- **During pagination:** "Page X complete! ... Moving to next page..."
- **When done:** "Processing complete! Done!" or "No more unpurchased books found."

## Practical Use Case

**Scenario:** You have 300 free books across 15 pages

**Without auto-pagination:**
1. Click button on page 1
2. Wait ~2 minutes (20 books)
3. Manually go to page 2
4. Click button again
5. Wait ~2 minutes
6. Repeat 15 times... (30+ minutes total)

**With auto-pagination:**
1. Enable auto-pagination (toggle ON in popup)
2. Click button on page 1
3. Walk away ☕
4. Come back 30 minutes later
5. All 300 books processed across all 15 pages ✓

## Safety Features

- **Manual trigger:** Must click button to start
- **Clear progress:** Alerts show page number and stats
- **Easy disable:** Toggle OFF in popup any time
- **Stop on empty:** Won't infinitely loop through pages
- **Persistent state:** Auto-page setting survives page reload and browser restart

## Troubleshooting

**Issue:** Auto-pagination not working
- **Solution:** Open popup and verify toggle is ON (green)

**Issue:** Processes but doesn't go to next page
- **Solution:** Check if any unpurchased books were found (needs processed > 0)

**Issue:** Goes to next page but doesn't auto-start
- **Solution:** Extension needs reload after enabling feature

**Issue:** Button doesn't show "(Auto-Page ON)"
- **Solution:** Check popup settings, reload extension, refresh BookBub page

**Issue:** Toggle switch doesn't change button text
- **Solution:** Reload BookBub page to pick up setting change

## Current Limitations

- **No "back" button:** Once it moves to next page, can't go back
- **No pause/resume:** Must process entire page before stopping
- **No max pages:** Will continue until it finds a page with 0 unpurchased books

## Future Enhancements

Possible improvements:
- Add max pages limit (e.g., "process up to 10 pages then stop")
- Add pause/resume capability
- Show progress across pages (e.g., "Page 3 of 15")
- Remember last page processed

---

**Ready to test?** Reload the extension and try Scenario 2!
