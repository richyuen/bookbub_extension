# Installation & Testing Guide

## Quick Start

### 1. Add Placeholder Icons (Required)

Before loading the extension, you need to add icon files. Here's the quickest method:

**Option A: Use an online tool**
1. Visit https://www.favicon-generator.org/
2. Upload any image or create a simple colored square
3. Download the generated icons
4. Rename them to `icon16.png`, `icon48.png`, `icon128.png`
5. Place them in the `icons/` folder

**Option B: Create simple colored squares**
1. Open Paint or any image editor
2. Create three images: 16x16, 48x48, 128x128 pixels
3. Fill with a solid color (e.g., green #4CAF50)
4. Save as PNG files in the `icons/` folder

**Option C: Skip for now**
- The extension will work without icons
- Edge will show a default puzzle piece icon
- You can add icons later

### 2. Load Extension in Edge

1. Open Microsoft Edge
2. Navigate to `edge://extensions/`
3. Toggle **Developer mode** ON (bottom-left corner)
4. Click **Load unpacked** button
5. Browse to and select the `bookbub_extension` folder
6. Click **Select Folder**

The extension should now appear in your extensions list!

### 3. Verify Installation

1. Look for the extension icon in the Edge toolbar (top-right)
2. Click the icon to open the popup
3. Verify the popup displays correctly with:
   - Status: Idle
   - Stats showing 0 for all values
   - Instructions and clear storage button

If you see the popup, installation was successful!

## Pre-Flight Checklist

Before using the extension, ensure:

- [ ] You're logged in to Amazon.com
- [ ] 1-Click purchasing is enabled on Amazon
- [ ] You have a valid payment method set up (even for free books)

### Enable 1-Click on Amazon

1. Go to https://www.amazon.com/
2. Click **Account & Lists** → **Your Account**
3. Under **Ordering and shopping preferences**, click **1-Click settings**
4. Click **Turn on 1-Click**
5. Select a default payment method and address
6. Click **Enable 1-Click**

## Testing the Extension

### Test 1: Button Injection (Easiest Test)

1. Visit a BookBub deals page:
   - Example: https://www.bookbub.com/ebook-deals/free-kindle-books
2. Look for a green **"Start Auto-Purchase"** button in the bottom-right corner
3. If the button appears, the BookBub content script is working!

**Troubleshooting:**
- Button doesn't appear? Open DevTools (F12) → Console tab
- Look for "BookBub content script loaded" message
- Check for any red error messages
- Try refreshing the page

### Test 2: Book Scraping (Console Test)

1. On the BookBub page, open DevTools (F12) → Console
2. Click the **Start Auto-Purchase** button
3. Look for console logs showing:
   - "Scraping books from page..."
   - "Found X deals using selector: ..."
   - Book titles and URLs

**Expected behavior:**
- Console shows scraped book data
- Processing starts (or shows "No unpurchased books found")

### Test 3: Amazon Detection (Manual Test)

1. Find a free Kindle book on Amazon (or use a BookBub link)
2. Open the Amazon product page
3. Open DevTools (F12) → Console
4. Look for:
   - "Amazon content script loaded"
   - Book title, price, and ID being logged
   - "Purchase successful" or skip reason

**Expected behavior:**
- Script detects if book is free
- Script checks if book is in library
- Script attempts purchase or skips with reason

### Test 4: Full End-to-End Test

**WARNING: This will make real purchases on Amazon!**

1. Find a BookBub page with 1-2 free books you don't own
2. Verify books are actually $0.00 on Amazon
3. Click **Start Auto-Purchase** button on BookBub
4. Watch as:
   - Button changes to "Processing..."
   - New Amazon tabs open and close automatically
   - Each book is processed sequentially
5. Wait for completion alert showing stats
6. Check your Amazon library to verify books were added

**What to watch:**
- Tabs should open/close smoothly
- Each tab stays open for ~3-5 seconds
- No error dialogs from Amazon
- Completion alert shows accurate counts

### Test 5: Duplicate Prevention

1. After Test 4, click **Start Auto-Purchase** again on the same page
2. The extension should skip all previously purchased books
3. Check console logs for "Skipping already purchased: [book title]"

**Expected behavior:**
- Books purchased in Test 4 are automatically skipped
- Alert shows "No unpurchased books found on this page"

### Test 6: Popup Statistics

1. Click the extension icon during or after processing
2. Verify stats are accurate:
   - Processed = number of books examined
   - Purchased = books successfully added to library
   - Skipped = books already owned or not free
   - Total Books Tracked = cumulative purchase history

### Test 7: Clear Purchase History

1. Open extension popup
2. Click **Clear Purchase History** button
3. Confirm the dialog
4. Verify "Total Books Tracked" resets to 0
5. Try processing the same BookBub page again
6. Books should be processed again (not skipped)

## Common Issues & Solutions

### Issue: Button doesn't appear on BookBub

**Solutions:**
- Ensure you're on a BookBub deals page (URL contains `/deals` or `/ebook-deals`)
- Refresh the page
- Check console for JavaScript errors
- Verify extension is enabled in `edge://extensions/`

### Issue: No books found when clicking button

**Solutions:**
- BookBub may have changed their page structure
- Check console for scraping errors
- Verify there are actually free books on the page
- Look for "Found 0 deals" in console logs

### Issue: Amazon tabs open but nothing happens

**Solutions:**
- Verify you're logged in to Amazon
- Check that 1-Click is enabled in Amazon settings
- Look at console logs in the Amazon tab (before it closes)
- Increase delay in settings to give pages more time to load

### Issue: Books not purchasing

**Solutions:**
- Verify book is actually $0.00 on Amazon
- Check that book isn't already in your library
- Ensure 1-Click button is visible on the page
- Check for Amazon login prompts
- Verify payment method is set up (required even for free books)

### Issue: Extension seems stuck "Processing"

**Solutions:**
- Wait up to 30 seconds per book (timeout)
- Check background service worker console:
  - Go to `edge://extensions/`
  - Click **Inspect** under the extension
  - Look for errors in console
- Restart the extension or reload BookBub page

### Issue: Multiple purchases of same book

**Solutions:**
- This shouldn't happen due to duplicate prevention
- If it does, check:
  - Storage is working (check popup for tracked books count)
  - Book IDs are being extracted correctly (check console)
  - Clear browser cache and storage if needed

## Advanced Debugging

### Inspect Background Service Worker

1. Go to `edge://extensions/`
2. Find "BookBub Auto-Purchase"
3. Click **Inspect** (under "Inspect views")
4. This opens DevTools for the background script
5. Check Console for:
   - Processing queue logs
   - Purchase completion messages
   - Error messages

### Monitor Content Scripts

**BookBub Page:**
1. Open BookBub deals page
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for "BookBub content script loaded"
5. Click button and watch scraping logs

**Amazon Page:**
1. Open an Amazon book page manually
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for "Amazon content script loaded"
5. Watch for price/library detection logs

### Check Storage Data

1. Open any page
2. Press F12 → Console tab
3. Type: `chrome.storage.local.get(console.log)`
4. Press Enter
5. Expand the logged object to see:
   - `purchasedBooks`: All tracked books
   - `settings`: Extension configuration

### Clear Storage Manually

If the extension popup isn't working:

1. Press F12 → Console
2. Type: `chrome.storage.local.clear()`
3. Press Enter
4. This resets all extension data

## Performance Notes

- **Processing Speed**: ~3-5 seconds per book
- **10 books**: ~30-50 seconds
- **50 books**: ~2.5-4 minutes
- **100 books**: ~5-8 minutes

The delay is intentional to:
- Avoid rate limiting from Amazon
- Give pages time to load
- Prevent triggering anti-bot measures

## Safety Reminders

- Always verify books are FREE before processing
- Don't process hundreds of books at once
- Monitor the first few purchases to ensure everything works
- Keep an eye on your Amazon order history
- Use reasonable delays to avoid account issues

## Next Steps

After successful testing:

1. Try it with a real BookBub filtered search
2. Process 5-10 books to verify reliability
3. Check Amazon library to confirm all books were added
4. Customize settings if needed (edit `background.js` for delay times)
5. Consider contributing improvements back to the project!

## Support

If you encounter issues not covered here:

1. Check the browser console for error messages
2. Review the README.md for additional context
3. Ensure all prerequisites are met
4. Try disabling other extensions to rule out conflicts
5. Restart Edge and try again

Happy reading!
