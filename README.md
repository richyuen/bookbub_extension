# BookBub Auto-Purchase Extension

A Microsoft Edge browser extension that automates claiming free books from BookBub deals by purchasing them on Amazon using 1-Click purchasing.

## Features

- **Automated Book Discovery**: Scans BookBub deal pages for free Kindle books
- **Smart Purchasing**: Uses Amazon 1-Click to claim free books automatically
- **Duplicate Prevention**: Tracks purchased books to avoid re-purchasing
- **Safe & Manual**: Requires manual trigger with a button (no automatic background processing)
- **Progress Tracking**: Real-time stats on processed, purchased, and skipped books
- **Library Checking**: Verifies books aren't already in your Amazon library before purchasing

## Prerequisites

Before using this extension, ensure:

1. **Amazon Account**: You must be logged in to Amazon
2. **1-Click Enabled**: Enable 1-Click purchasing in your Amazon account settings
3. **Microsoft Edge**: This extension is built for Edge (Chromium-based)

## Installation

### Load Unpacked Extension

1. Download or clone this repository to your local machine
2. Open Microsoft Edge
3. Navigate to `edge://extensions/`
4. Enable **Developer mode** (toggle in bottom-left corner)
5. Click **Load unpacked**
6. Select the `bookbub_extension` folder
7. The extension should now appear in your extensions list

### Verify Installation

- You should see the BookBub Auto-Purchase icon in your extensions toolbar
- Click the icon to open the popup and verify it displays correctly

## Usage

### Step-by-Step Guide

1. **Prepare Amazon Account**
   - Log in to Amazon.com
   - Go to Account Settings → 1-Click settings
   - Enable 1-Click purchasing and set a default payment method

2. **Visit BookBub Deals Page**
   - Navigate to BookBub (e.g., `https://www.bookbub.com/ebook-deals/free-kindle-books`)
   - Apply any filters you want (genre, ratings, etc.)

3. **Start Auto-Purchase**
   - Look for the green **"Start Auto-Purchase"** button (bottom-right corner)
   - Click the button to begin processing
   - The button will show "Processing..." while working

4. **Monitor Progress**
   - New tabs will open/close automatically for each book
   - Check the extension popup for live statistics
   - Wait for completion alert

5. **Review Results**
   - A summary will show: Processed, Purchased, and Skipped counts
   - Check your Amazon library to verify purchases

## How It Works

### Architecture

The extension consists of three main components:

1. **BookBub Content Script** (`content/bookbub.js`)
   - Injects the "Start Auto-Purchase" button on BookBub pages
   - Scrapes book deals (title, Amazon link, price)
   - Filters out already-purchased books
   - Sends unpurchased books to the background worker

2. **Amazon Content Script** (`content/amazon.js`)
   - Runs on Amazon product pages
   - Verifies the book is free ($0.00)
   - Checks if book is already in your library
   - Clicks the 1-Click purchase button
   - Reports success/failure back to background

3. **Background Service Worker** (`background.js`)
   - Coordinates the entire process
   - Manages the queue of books to process
   - Opens Amazon tabs sequentially with delays
   - Stores purchased book IDs in local storage
   - Provides statistics to the popup

### Safety Features

- **Manual Trigger**: You must click the button to start (no automatic processing)
- **Price Verification**: Only purchases books showing $0.00
- **Library Check**: Skips books already in your Amazon library
- **Duplicate Prevention**: Tracks purchased books to avoid re-purchasing
- **Rate Limiting**: 3-second delay between each book purchase
- **Error Handling**: Gracefully handles page structure changes and network errors

## Popup Interface

Click the extension icon to view:

- **Status**: Shows "Idle" or "Processing..."
- **Current Session Stats**:
  - Processed: Total books examined
  - Purchased: Books successfully purchased
  - Skipped: Books skipped (already owned, not free, etc.)
- **Storage**: Total books tracked in purchase history
- **Clear Purchase History**: Reset all tracked books (use with caution)

## Troubleshooting

### Button Doesn't Appear

- Ensure you're on a BookBub deals page (`/ebook-deals` or `/deals`)
- Check browser console for errors (F12 → Console tab)
- Reload the page

### No Books Found

- BookBub may have changed their page structure
- Check console logs for scraping errors
- Verify there are actually free books on the page

### Purchase Not Working

- **Verify 1-Click is enabled** on Amazon
- **Check you're logged in** to Amazon
- **Look for Amazon login prompts** in opened tabs
- Extension requires 1-Click to be set up with valid payment method

### Books Marked as Purchased But Weren't

- Check Amazon's "Content and Devices" to verify
- Books may have been added but order failed
- Clear purchase history in popup and try again

### Extension Errors

1. Check browser console: `F12` → Console tab
2. Look for red error messages
3. Common issues:
   - Page structure changed (selectors outdated)
   - Network timeout
   - Amazon login required

## Privacy & Data

- **No Data Collection**: This extension does not collect or transmit any personal data
- **Local Storage Only**: Purchase history is stored locally in your browser
- **No External Servers**: All processing happens on your machine
- **Open Source**: Code is fully transparent and auditable

## Limitations

- **Amazon Login Required**: You must be logged in for purchases to work
- **1-Click Only**: Requires 1-Click purchasing to be enabled
- **US Amazon**: Primarily tested with Amazon.com (US)
- **Free Books Only**: Only processes books showing $0.00 price
- **Single Page**: Processes one page at a time (no automatic pagination)

## Future Improvements

Potential enhancements for future versions:

- Configurable delays between purchases
- Automatic pagination through multiple BookBub pages
- Author/publisher whitelist/blacklist
- Export purchase history
- Statistics dashboard
- Notifications when batch completes
- Support for other Amazon marketplaces (UK, CA, etc.)

## Development

### File Structure

```
bookbub_extension/
├── manifest.json           # Extension configuration
├── background.js           # Background service worker
├── content/
│   ├── bookbub.js         # BookBub page scraper
│   └── amazon.js          # Amazon purchase automation
├── popup/
│   ├── popup.html         # Popup UI
│   ├── popup.js           # Popup logic
│   └── popup.css          # Popup styling
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

### Debugging

To debug the extension:

1. **Content Scripts**: Open DevTools on the page (F12), check Console
2. **Background Worker**: Go to `edge://extensions/`, click "Inspect" under the extension
3. **Popup**: Right-click popup → Inspect

### Making Changes

After modifying code:

1. Save your changes
2. Go to `edge://extensions/`
3. Click the refresh icon on the extension card
4. Reload any open BookBub/Amazon tabs

## Warnings

- **Use Responsibly**: This extension makes real purchases on Amazon
- **Free Books Only**: Always verify books are actually free before bulk processing
- **Rate Limiting**: Don't abuse Amazon's systems; use reasonable delays
- **Account Risk**: Excessive automation may violate Amazon's terms of service
- **No Warranty**: Use at your own risk; author not responsible for unintended purchases

## Support

For issues, bugs, or feature requests:

1. Check the Troubleshooting section above
2. Review browser console for error messages
3. Open an issue on the GitHub repository (if applicable)

## License

This project is provided as-is for educational and personal use.

## Disclaimer

This extension is not affiliated with, endorsed by, or officially connected with BookBub or Amazon. Use at your own discretion and ensure compliance with both platforms' terms of service.

---

**Version**: 1.0.0
**Last Updated**: 2026-01-31
