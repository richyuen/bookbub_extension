# Quick BookBub Selector Diagnostic

## Problem
The extension is saying "No unpurchased books found" even though books like "Water" are visible on the page.

## Current Selectors (in content/bookbub.js)
- **Deal containers**: `.deal-tile`, `.daily-deal-tile`, `[data-deal-id]`, `.book-deal`
- **Titles**: `.book-title`, `.deal-title`, `h3`, `h2`, `[data-title]`
- **Amazon links**: `a[href*="amazon.com"]`
- **Prices**: `.price`, `.deal-price`, `[class*="price"]`

## Debugging Steps

### Step 1: Run Quick Console Commands

Open the BookBub page in Chrome, open the console (F12), and run these commands one by one:

```javascript
// 1. Check if any deal containers are found
console.log('.deal-tile:', document.querySelectorAll('.deal-tile').length);
console.log('.daily-deal-tile:', document.querySelectorAll('.daily-deal-tile').length);
console.log('[data-deal-id]:', document.querySelectorAll('[data-deal-id]').length);
console.log('.book-deal:', document.querySelectorAll('.book-deal').length);
```

**Expected**: At least one of these should return a number > 0

### Step 2: Find the "Water" Book

```javascript
// 2. Find elements containing "Water" text
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
const waterNodes = [];
let node;
while (node = walker.nextNode()) {
  if (node.textContent.trim() === 'Water') {
    waterNodes.push(node);
  }
}
console.log('Found "Water" in', waterNodes.length, 'nodes');
if (waterNodes.length > 0) {
  console.log('First Water element:', waterNodes[0].parentElement);
}
```

### Step 3: Inspect the Water Container

```javascript
// 3. Walk up from Water to find the deal container
if (waterNodes.length > 0) {
  let current = waterNodes[0].parentElement;
  let depth = 0;
  while (current && depth < 15) {
    console.log(`Level ${depth}:`, current.tagName, current.className,
                'Has Amazon link:', !!current.querySelector('a[href*="amazon.com"]'));
    current = current.parentElement;
    depth++;
  }
}
```

### Step 4: Find All Possible Container Classes

```javascript
// 4. Find repeating elements (likely book cards)
const allDivs = document.querySelectorAll('div[class]');
const classCount = {};
allDivs.forEach(div => {
  const classes = div.className.split(' ').filter(c => c.length > 0);
  classes.forEach(cls => {
    classCount[cls] = (classCount[cls] || 0) + 1;
  });
});

console.log('Most common classes:');
Object.entries(classCount)
  .filter(([cls, count]) => count > 5 && count < 50)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15)
  .forEach(([cls, count]) => {
    console.log(`  ${cls}: ${count} instances`);
  });
```

### Step 5: Full Diagnostic Script

Copy and paste the entire contents of `debug/bookbub_selector_diagnostic.js` into the console for a comprehensive analysis.

## Common Issues

### Issue 1: Wrong Container Selector
**Symptom**: `dealElements.length === 0` in console logs
**Solution**: BookBub may have updated their HTML structure. The diagnostic will find the new selector.

### Issue 2: No Amazon Links
**Symptom**: Books found but all filtered out
**Possible causes**:
- Links might be to a different domain (e.g., bookbub.com redirect links)
- Links might be dynamically loaded
- Links might be in a different element structure

### Issue 3: Price Filter Too Strict
**Symptom**: Books found but `priceText` doesn't match `$0.00` or `Free`
**Possible values to check**:
- `$0.00`
- `Free`
- `0.00`
- Empty string (price not shown for free books)

### Issue 4: Already Purchased Check
**Symptom**: Books found but marked as purchased
**Debug**: Check Chrome storage:
```javascript
chrome.storage.local.get('purchasedBooks', (result) => {
  console.log('Purchased books:', result.purchasedBooks);
});
```

## Manual Testing Checklist

1. [ ] Run Step 1 commands - at least one selector should find elements
2. [ ] Run Step 2 - "Water" should be found
3. [ ] Run Step 3 - note which parent element has an Amazon link
4. [ ] Run Step 4 - identify repeating class names
5. [ ] Compare findings with current selectors in bookbub.js
6. [ ] Update selectors if they don't match

## Reporting Results

After running the diagnostics, report:
1. Which container selector(s) returned results
2. The class/tag name of the element containing "Water" that also has an Amazon link
3. How prices are displayed (class name and text format)
4. Whether Amazon links are direct or redirects
