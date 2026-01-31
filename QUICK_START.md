# Quick Start Guide

## 5-Minute Setup

### 1. Add Icons (2 minutes)
Create three simple PNG files in the `icons/` folder:
- `icon16.png` (16×16 pixels)
- `icon48.png` (48×48 pixels)
- `icon128.png` (128×128 pixels)

**Quick option**: Use https://www.favicon-generator.org/ or just create colored squares in Paint.

### 2. Load Extension (1 minute)
1. Open Edge → `edge://extensions/`
2. Enable **Developer mode** (bottom-left)
3. Click **Load unpacked**
4. Select the `bookbub_extension` folder

### 3. Enable 1-Click on Amazon (2 minutes)
1. Go to Amazon.com → Account & Lists → Your Account
2. Find **1-Click settings** under ordering preferences
3. Turn on 1-Click and select default payment method

## How to Use

1. **Visit BookBub**: Go to https://www.bookbub.com/ebook-deals/free-kindle-books
2. **Click Button**: Look for green "Start Auto-Purchase" button (bottom-right)
3. **Wait**: Extension processes books automatically
4. **Done**: Check completion alert and your Amazon library

## What It Does

- ✓ Scrapes free Kindle books from BookBub
- ✓ Opens each book's Amazon page
- ✓ Verifies price is $0.00
- ✓ Checks if you already own it
- ✓ Clicks 1-Click purchase button
- ✓ Tracks purchased books to avoid duplicates
- ✓ Shows statistics in popup

## Safety Features

- Manual trigger only (no auto-start)
- Verifies books are free
- Checks library before purchasing
- 3-second delays between purchases
- Duplicate prevention

## View Stats

Click the extension icon to see:
- Current status (Idle/Processing)
- Processed/Purchased/Skipped counts
- Total books tracked
- Clear history button

## Troubleshooting

**Button not appearing?**
- Ensure you're on a BookBub deals page
- Refresh the page
- Check `edge://extensions/` that extension is enabled

**Not purchasing?**
- Verify you're logged in to Amazon
- Confirm 1-Click is enabled
- Check book is actually $0.00

**Stuck processing?**
- Wait 30 seconds (timeout per book)
- Check browser console (F12) for errors
- Reload page and try again

## Files Overview

```
bookbub_extension/
├── manifest.json          # Extension config
├── background.js          # Coordination logic
├── content/
│   ├── bookbub.js        # Scrapes BookBub pages
│   └── amazon.js         # Automates Amazon purchases
├── popup/                # Stats interface
└── icons/                # Extension icons (add these!)
```

## Support Documents

- **README.md**: Full documentation
- **INSTALLATION.md**: Detailed setup and testing guide
- **This file**: Quick reference

---

**Ready?** Add icons → Load extension → Visit BookBub → Click button!
