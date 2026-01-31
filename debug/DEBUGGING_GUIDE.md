# BookBub Extension Debugging Guide

## Problem
The extension shows "No unpurchased books found" even though books are visible on the page (e.g., "Water").

## Root Cause Analysis

The issue is likely one of these:

1. **Wrong CSS selectors** - BookBub updated their HTML structure
2. **Price filtering too strict** - Free books display prices differently than expected
3. **Missing Amazon links** - Links might be redirects or in different locations
4. **Books marked as purchased** - Chrome storage contains incorrect data

## Debugging Process

### Step 1: Use Enhanced Debug Version

Replace the current content script with the enhanced debug version:

```bash
# Backup current file
copy content\bookbub.js content\bookbub.js.backup

# Copy enhanced version
copy debug\enhanced_bookbub.js content\bookbub.js
```

Then reload the extension in Chrome:
1. Go to `chrome://extensions/`
2. Find "BookBub Auto-Purchase Extension"
3. Click the reload icon
4. Refresh the BookBub page

The enhanced version will output detailed logs in the console.

### Step 2: Run Diagnostic Script

While on the BookBub deals page:

1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Copy the entire contents of `debug/bookbub_selector_diagnostic.js`
4. Paste into console and press Enter
5. Read the output carefully

The diagnostic will tell you:
- Which selectors work for finding deal containers
- How to find book titles, prices, and Amazon links
- The exact DOM structure around the "Water" book

### Step 3: Quick Console Tests

Run these one-liners in the console:

```javascript
// Test 1: Check current selectors
console.log('.deal-tile:', document.querySelectorAll('.deal-tile').length);
console.log('.daily-deal-tile:', document.querySelectorAll('.daily-deal-tile').length);
console.log('[data-deal-id]:', document.querySelectorAll('[data-deal-id]').length);
console.log('.book-deal:', document.querySelectorAll('.book-deal').length);

// Test 2: Find "Water" book
Array.from(document.querySelectorAll('*')).find(el => el.textContent.includes('Water') && el.children.length < 5)

// Test 3: Check Amazon links
console.log('Amazon links:', document.querySelectorAll('a[href*="amazon.com"]').length);

// Test 4: Check purchased books storage
chrome.storage.local.get('purchasedBooks', (r) => console.log('Purchased:', r.purchasedBooks));
```

### Step 4: Analyze Results

Based on the console output, identify which component is failing:

#### If "Found 0 deals using selector:"
**Problem**: Deal container selector is wrong
**Solution**: Use the working selector from diagnostic script

Update in `content/bookbub.js` line 116-121:
```javascript
const dealSelectors = [
  '.NEW-SELECTOR-HERE',  // Add the working selector first
  '.deal-tile',
  '.daily-deal-tile',
  // ... rest
];
```

#### If "No Amazon link found"
**Problem**: Amazon links are structured differently
**Solutions**:
1. Check if links are BookBub redirect links instead
2. Look for `data-` attributes containing Amazon URLs
3. Check if links are in a child/sibling element

Update in `content/bookbub.js` line 160:
```javascript
// Try alternative selectors
const amazonLink = dealElement.querySelector('a[href*="amazon.com"]') ||
                   dealElement.querySelector('a[data-url*="amazon.com"]') ||
                   dealElement.querySelector('[data-amazon-url]');
```

#### If "Skipping non-free book"
**Problem**: Price text format doesn't match expected values
**Solution**: Log actual price text and update the condition

Update in `content/bookbub.js` line 204:
```javascript
// Add more price variations
if (!priceText.includes('$0.00') &&
    !priceText.includes('Free') &&
    !priceText.includes('0.00') &&
    priceText !== '' &&  // Handle empty price (might mean free)
    !priceText.toLowerCase().includes('free')) {
  console.log(`Skipping non-free book: ${title} (${priceText})`);
  return null;
}
```

#### If "Skipping already purchased"
**Problem**: Books incorrectly marked as purchased
**Solution**: Clear storage or check book ID generation

```javascript
// Clear all purchased books (in console)
chrome.storage.local.set({purchasedBooks: []}, () => console.log('Cleared'));

// Or clear specific book
chrome.storage.local.get('purchasedBooks', (result) => {
  const books = result.purchasedBooks || [];
  const filtered = books.filter(id => !id.includes('BOOK_ID_HERE'));
  chrome.storage.local.set({purchasedBooks: filtered});
});
```

## Common Fixes

### Fix 1: Update Deal Container Selectors

Based on 2024 BookBub updates, try these modern selectors:

```javascript
const dealSelectors = [
  '[data-book-id]',           // New data attribute
  '[data-testid*="book"]',    // React Testing Library convention
  '.deal-card',               // Modern naming
  '.book-card',
  'article[class*="book"]',   // Semantic HTML
  '.deal-tile',               // Legacy
  '.daily-deal-tile',
  '[data-deal-id]',
  '.book-deal'
];
```

### Fix 2: Better Title Extraction

```javascript
const titleSelectors = [
  '[data-book-title]',
  '[aria-label]',             // Accessibility attributes often have titles
  '.book-title',
  '.deal-title',
  'h1', 'h2', 'h3', 'h4',
  '[data-title]',
  '[class*="title"]'
];

// Also try getting title from aria-label
if (!title) {
  const ariaLabel = dealElement.getAttribute('aria-label');
  if (ariaLabel) {
    title = ariaLabel;
  }
}
```

### Fix 3: Handle Redirect Links

BookBub might use redirect links instead of direct Amazon links:

```javascript
// Check for redirect links
let amazonUrl = null;
const directLink = dealElement.querySelector('a[href*="amazon.com"]');
const redirectLink = dealElement.querySelector('a[href*="/books/"]') ||
                     dealElement.querySelector('a[href*="/deals/"]');

if (directLink) {
  amazonUrl = directLink.href;
} else if (redirectLink) {
  // Extract Amazon URL from data attribute
  amazonUrl = redirectLink.getAttribute('data-amazon-url') ||
              redirectLink.getAttribute('data-url') ||
              redirectLink.href; // Might need to follow redirect
}
```

### Fix 4: Relax Price Filtering

```javascript
// More flexible price checking
const isFree = !priceText ||
               priceText === '' ||
               priceText.includes('$0.00') ||
               priceText.includes('$0.99') ||  // Include very cheap books
               priceText.includes('Free') ||
               priceText.includes('0.00') ||
               priceText.toLowerCase().includes('free');

if (!isFree) {
  console.log(`Skipping non-free book: ${title} (${priceText})`);
  return null;
}
```

## Testing Your Fixes

After making changes:

1. Reload extension in `chrome://extensions/`
2. Refresh BookBub page
3. Open Console (F12)
4. Click "Start Auto-Purchase" button
5. Watch console logs for:
   - "Found X deals using selector: Y"
   - Individual book processing logs
   - Final summary

Expected output:
```
=== STARTING BOOK SCRAPING ===
Testing deal selectors...
  Selector ".deal-tile": found 24 elements
  ✓ Using ".deal-tile" (24 elements)

=== PROCESSING 24 DEAL ELEMENTS ===

Deal #1:
  Amazon URL: https://www.amazon.com/dp/...
  Title found (h3): "Water"
  Price (.price): "$0.00"
  Book ID: B0ABCD1234
  ✓ Added to list: "Water"

...

=== SCRAPING SUMMARY ===
Total elements processed: 24
Books found to purchase: 12
Skipped (no Amazon link): 0
Skipped (not free): 8
Skipped (no title): 0
Skipped (already purchased): 4
Working selector: .deal-tile
```

## Still Not Working?

If you've tried everything and it's still not working:

1. **Capture the HTML structure**:
   ```javascript
   // In console, find a book element and copy its HTML
   const bookEl = Array.from(document.querySelectorAll('*'))
     .find(el => el.textContent.includes('Water') && el.querySelector('a[href*="amazon"]'));
   console.log(bookEl.outerHTML);
   ```

2. **Take screenshots**:
   - Console output with errors
   - The BookBub page showing books
   - Chrome DevTools Elements tab showing a book element

3. **Check for dynamic loading**:
   ```javascript
   // Books might load after page load
   setTimeout(() => {
     console.log('Delayed check:');
     console.log('.deal-tile:', document.querySelectorAll('.deal-tile').length);
   }, 3000);
   ```

4. **Verify extension permissions**:
   - Check `manifest.json` has correct permissions
   - Check content script is injected: `chrome.tabs.executeScript`

## Rollback

If the enhanced version causes issues, restore the original:

```bash
copy content\bookbub.js.backup content\bookbub.js
```

Then reload the extension.
