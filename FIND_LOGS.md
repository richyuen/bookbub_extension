# How to Find Extension Console Logs

## The Problem
Content script logs appear in the PAGE console, but might be filtered out by default.

## Solution: Check Console Filters

### Step 1: Open Console with Correct Settings

1. **On BookBub page, press F12**
2. **Go to Console tab**
3. **Look at the filter bar** (top of console)
4. **Make sure these are selected:**
   - [ ] Verbose
   - [ ] Info
   - [ ] Warnings
   - [ ] Errors
5. **Clear any filter text** in the search box
6. **Refresh the page** (Ctrl+R or F5)

### Step 2: Look for These Messages

After refreshing, you should see:
```
BookBub content script loaded
Initializing BookBub content script
Auto-purchase button injected
```

### Step 3: Click the Green Button

1. Click "Start Auto-Purchase" button
2. You should see:
```
Scraping books from page...
Found 109 deals using selector: [data-testid*="book"]
Scraped X unique unpurchased books (from 109 containers)
Processing book: Rise of the Sparrows (ID: bb_177380)
```

### Step 4: Check Background Worker Console

The background script has its OWN console:

1. **Go to `edge://extensions/`**
2. **Find "BookBub Auto-Purchase"**
3. **Click "Inspect" or "background page"** link
   - (Look under "Inspect views")
4. **New DevTools window opens**
5. **Go to Console tab**
6. You should see messages like:
   ```
   Processing book: Rise of the Sparrows (ID: bb_177380)
   Sent original book ID to tab 123
   ```

### Step 5: Check Amazon Tab Console (When It Opens)

When an Amazon tab opens:
1. **Click on that tab quickly**
2. **Press F12**
3. You should see:
   ```
   Amazon content script loaded
   Received original book ID: bb_177380
   Using original BookBub ID: bb_177380
   ```

## Quick Test

On BookBub page console, type:
```javascript
console.info('TEST - Info level');
console.log('TEST - Log level');
console.warn('TEST - Warning level');
```

If you don't see ALL three messages, your console has filters enabled.

## Common Issues

### Issue: No logs appear
**Solution:** Check console level filter (top of console) - enable all levels

### Issue: Only errors appear
**Solution:** Console is filtering by level - click "Default levels" dropdown and select all

### Issue: Says "0 messages hidden"
**Solution:** Click to show hidden messages

### Issue: Logs appear then disappear
**Solution:** Turn OFF "Preserve log" to see live logs

## What to Share

After checking the console settings:
1. Do you see "BookBub content script loaded" after refresh?
2. What happens when you click the button?
3. Any errors (red messages)?
