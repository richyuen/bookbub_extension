# Debug Steps - Extension Not Working

## Step 1: Check for JavaScript Errors

1. **Open BookBub page**
2. **Press F12** to open DevTools
3. **Go to Console tab**
4. **Look for RED error messages**
5. **Take a screenshot and share any errors you see**

Common errors to look for:
- `SyntaxError`
- `Uncaught ReferenceError`
- `Uncaught TypeError`

## Step 2: Verify Extension is Loaded

1. Go to `edge://extensions/`
2. Find "BookBub Auto-Purchase"
3. Check:
   - [ ] Extension is **Enabled** (toggle is ON)
   - [ ] No errors shown under the extension name
4. Click **Reload** button (circular arrow icon)
5. Refresh the BookBub page

## Step 3: Check if Content Script is Running

1. On BookBub page, press F12
2. In Console, type this and press Enter:
   ```javascript
   console.log('Test console is working');
   ```
3. You should see the message appear
4. Now type this and press Enter:
   ```javascript
   document.getElementById('bookbub-auto-purchase-btn')
   ```
5. **Expected result:** Should show the button element OR null
6. **Share what you see**

## Step 4: Manually Test Button Injection

1. On BookBub page, open Console (F12)
2. Paste this code and press Enter:
   ```javascript
   // Manually test if script can run
   console.log('Manual test starting...');
   const testButton = document.createElement('button');
   testButton.textContent = 'TEST BUTTON';
   testButton.style.cssText = 'position:fixed; bottom:100px; right:20px; z-index:99999; padding:20px; background:red; color:white; font-size:20px;';
   document.body.appendChild(testButton);
   console.log('Test button added');
   ```
3. **Expected:** A red TEST BUTTON should appear on the page
4. **If it appears:** JavaScript is working
5. **If not:** There's a fundamental issue

## Step 5: Check Background Script

1. Go to `edge://extensions/`
2. Find "BookBub Auto-Purchase"
3. Under the extension, look for **"Inspect views: background page"** or similar
4. Click **"Inspect"** or **"background page"**
5. This opens DevTools for the background script
6. Check Console for errors
7. Type this and press Enter:
   ```javascript
   chrome.storage.local.get(['purchasedBooks'], (result) => {
     console.log('Purchased books:', result.purchasedBooks);
   });
   ```
8. **Share what appears**

## Step 6: Check Storage Permissions

In the background script console (from Step 5), type:
```javascript
chrome.storage.local.set({test: 'hello'}, () => {
  console.log('Storage set worked');
  chrome.storage.local.get(['test'], (result) => {
    console.log('Storage get result:', result);
  });
});
```

Expected output:
```
Storage set worked
Storage get result: {test: 'hello'}
```

## Step 7: Verify File Contents

1. Open File Explorer
2. Navigate to: `C:\Git\bookbub_extension\content\bookbub.js`
3. Open in Notepad
4. Check line 1-5 - should start with:
   ```javascript
   // Content script for BookBub pages

   console.log('BookBub content script loaded');
   ```
5. **If different, the file might be corrupted**

## Step 8: Check Manifest

1. Open: `C:\Git\bookbub_extension\manifest.json`
2. Verify it contains:
   ```json
   "content_scripts": [
     {
       "matches": ["*://www.bookbub.com/*"],
       "js": ["content/bookbub.js"],
   ```

## What to Report Back

Please run through these steps and tell me:

1. **Any RED errors in console?** (screenshot helpful)
2. **Does the green button appear at all?**
3. **Does the TEST BUTTON appear in Step 4?**
4. **What does Step 5 show for purchased books?**
5. **What does Step 6 show for storage test?**

This will help me identify exactly where the problem is!
