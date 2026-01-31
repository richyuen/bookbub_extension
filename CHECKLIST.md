# BookBub Extension Setup Checklist

## Pre-Installation (5 minutes)

### 1. Create Icon Files
- [ ] Open an image editor or use https://www.favicon-generator.org/
- [ ] Create three PNG files:
  - [ ] `icons/icon16.png` (16×16 pixels)
  - [ ] `icons/icon48.png` (48×48 pixels)
  - [ ] `icons/icon128.png` (128×128 pixels)
- [ ] Tip: Simple colored squares work fine for testing

### 2. Prepare Amazon Account
- [ ] Go to Amazon.com
- [ ] Log in to your account
- [ ] Navigate to Account & Lists → 1-Click settings
- [ ] Enable 1-Click purchasing
- [ ] Set a default payment method
- [ ] Set a default shipping address

## Installation (2 minutes)

### 3. Load Extension
- [ ] Open Microsoft Edge
- [ ] Go to `edge://extensions/`
- [ ] Enable **Developer mode** (toggle in bottom-left)
- [ ] Click **Load unpacked**
- [ ] Browse to `bookbub_extension` folder
- [ ] Click **Select Folder**
- [ ] Verify extension appears in the list

### 4. Verify Installation
- [ ] Look for extension icon in Edge toolbar
- [ ] Click the icon
- [ ] Popup should open showing:
  - [ ] Status: Idle
  - [ ] All stats at 0
  - [ ] Clear history button
  - [ ] Instructions

## First Test (5 minutes)

### 5. Test Button Injection
- [ ] Visit https://www.bookbub.com/ebook-deals/free-kindle-books
- [ ] Wait for page to load
- [ ] Look for green "Start Auto-Purchase" button (bottom-right)
- [ ] If no button, press F12 → Console and check for errors

### 6. Test Book Scraping
- [ ] Press F12 to open DevTools
- [ ] Go to Console tab
- [ ] Click the "Start Auto-Purchase" button
- [ ] Check console for:
  - [ ] "Scraping books from page..."
  - [ ] "Found X deals using selector: ..."
  - [ ] Book titles being logged

### 7. Test with 1-2 Books
⚠️ **WARNING: This makes real purchases!**

- [ ] Find a BookBub page with only 1-2 free books you don't own
- [ ] Manually verify books are $0.00 on Amazon first
- [ ] Click "Start Auto-Purchase"
- [ ] Watch for:
  - [ ] Button changes to "Processing..."
  - [ ] Amazon tabs open and close
  - [ ] Completion alert appears
- [ ] Check alert shows:
  - [ ] Processed: 2 (or however many books)
  - [ ] Purchased: X
  - [ ] Skipped: X

### 8. Verify Purchases
- [ ] Go to Amazon.com
- [ ] Click Account & Lists → Content & Devices
- [ ] Go to Books tab
- [ ] Verify test books appear in your library

## Production Use (Ongoing)

### 9. Regular Usage
- [ ] Visit BookBub deals page with your filters
- [ ] Review the books on the page
- [ ] Click "Start Auto-Purchase"
- [ ] Wait for completion (3-5 seconds per book)
- [ ] Check statistics in extension popup
- [ ] Verify books in Amazon library

### 10. Maintenance
- [ ] Periodically check console for errors
- [ ] Clear purchase history if needed (via popup)
- [ ] Monitor Amazon for any account warnings
- [ ] Keep delays reasonable (don't modify to be too fast)

## Troubleshooting Checklist

### Button Not Appearing
- [ ] Confirm you're on a BookBub deals page
- [ ] Refresh the page
- [ ] Check browser console for errors
- [ ] Verify extension is enabled in `edge://extensions/`
- [ ] Try disabling other extensions

### Purchases Not Working
- [ ] Verify you're logged in to Amazon
- [ ] Confirm 1-Click is enabled
- [ ] Check book is actually $0.00
- [ ] Ensure payment method is set up
- [ ] Look for Amazon login prompts in tabs

### Extension Seems Stuck
- [ ] Wait 30 seconds (timeout per book)
- [ ] Check background worker console:
  - [ ] Go to `edge://extensions/`
  - [ ] Click **Inspect** under extension
  - [ ] Look for errors
- [ ] Refresh BookBub page
- [ ] Reload extension

### Duplicate Purchases
- [ ] This shouldn't happen (duplicate prevention)
- [ ] If it does:
  - [ ] Check storage in DevTools console
  - [ ] Clear purchase history
  - [ ] Reload extension

## Safety Checklist

### Before Each Use
- [ ] Verified you're on BookBub (not a malicious site)
- [ ] Reviewed books on page manually
- [ ] Confirmed books are free
- [ ] Ready to claim these specific books

### Best Practices
- [ ] Start with small batches (5-10 books)
- [ ] Don't process hundreds at once
- [ ] Monitor first few purchases each session
- [ ] Keep default 3-second delays
- [ ] Check Amazon library regularly

## Documentation Reference

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **QUICK_START.md** | Fast setup | First time setup |
| **INSTALLATION.md** | Detailed setup | Troubleshooting issues |
| **README.md** | User manual | General reference |
| **ARCHITECTURE.md** | Technical docs | Development/debugging |
| **IMPLEMENTATION_SUMMARY.md** | Overview | Understanding what's built |
| **This file (CHECKLIST.md)** | Step tracker | Following setup process |

## Support

If you encounter issues:

1. [ ] Check browser console (F12 → Console)
2. [ ] Review INSTALLATION.md troubleshooting section
3. [ ] Verify all checklist items above
4. [ ] Check that prerequisites are met
5. [ ] Try with a fresh browser profile

## Success Criteria

You'll know it's working when:

✅ Green button appears on BookBub pages
✅ Clicking button processes books
✅ Amazon tabs open and close automatically
✅ Books appear in your Amazon library
✅ Extension popup shows accurate statistics
✅ Duplicate prevention works (same books skipped second time)

---

**Ready to start?** Work through this checklist from top to bottom!

**Estimated total time:** 12-15 minutes for complete setup and testing
