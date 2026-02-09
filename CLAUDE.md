# CLAUDE.md - BookBub Auto-Purchase Extension

## Project Overview

Chrome/Edge extension (Manifest V3) that automates claiming free Kindle books from BookBub deals using Amazon 1-Click purchasing. Pure vanilla JavaScript, no build tools or dependencies.

## Architecture

Three execution contexts communicate via `chrome.runtime.sendMessage`:

- **`background.js`** - Service worker. Manages the book processing queue, opens/closes Amazon tabs sequentially, persists purchased book IDs to `chrome.storage.local`, tracks session stats.
- **`content/bookbub.js`** - Content script injected on `bookbub.com`. Injects a floating "Start Auto-Purchase" button, scrapes deal elements for free books, filters already-purchased books, sends queue to background. Handles auto-pagination (navigates to next page if last book was purchased).
- **`content/amazon.js`** - Content script injected on `amazon.com`. Validates Kindle book page, checks price is $0.00, checks library ownership, clicks 1-Click purchase button, reports result back to background.
- **`popup/`** - Extension popup UI (`popup.html`, `popup.js`, `popup.css`). Shows session stats, auto-pagination toggle, clear history button.

## Message Flow

```
BookBub (START_PROCESSING) -> Background -> opens Amazon tab
Amazon (REQUEST_BOOK_ID) -> Background -> returns current book info
Amazon (PURCHASE_COMPLETE | PURCHASE_SKIPPED) -> Background -> updates stats/storage
Background (PROCESSING_COMPLETE) -> BookBub -> shows results or paginates
Popup (GET_CURRENT_STATS) -> Background -> returns stats
```

## Key Files

```
manifest.json              # Extension config, permissions, content script registration
background.js              # Service worker - queue management, tab orchestration, storage
content/bookbub.js         # BookBub scraper + UI button injection + pagination
content/amazon.js          # Amazon purchase automation + library detection
popup/popup.html           # Popup UI markup
popup/popup.js             # Popup logic - stats display, settings management
popup/popup.css            # Popup styles
find_amazon_link.js        # Standalone utility script (not part of extension)
debug/                     # Diagnostic/debugging utilities (not part of extension)
```

## Storage Schema

```javascript
// chrome.storage.local
{
  purchasedBooks: {            // Book IDs (ASINs or BookBub promotion IDs) -> metadata
    "B0XXXXXX": { title, timestamp, source: "extension" }
  },
  settings: {
    delayBetweenBooks: 1000,   // ms between processing books
    autoNextPage: true         // auto-paginate through BookBub pages
  },
  autoStartPagination: bool    // transient flag for cross-page auto-start
}
```

## DOM Selector Strategy

Both content scripts use multiple fallback selectors to be resilient to page changes:
- BookBub deals: `[data-testid*="book"]`, `.deal-tile`, `.daily-deal-tile`, `[data-deal-id]`
- Amazon 1-Click: `#one-click-button`, `#buyOneClick`, `input[name="submit.buy-now"]`
- Prices (specific, unscoped): `#kindle-price`, `#price`
- Prices (generic, scoped to buy box): `.a-price .a-offscreen`, `.a-color-price`, `[data-a-color="price"]`

## Development Workflow

1. Make changes to source files
2. Go to `edge://extensions/` and click refresh on the extension card
3. Reload any open BookBub/Amazon tabs
4. Debug content scripts via F12 DevTools on the page
5. Debug service worker via "Inspect" link on the extensions page
6. Debug popup via right-click popup -> Inspect

## Important Patterns

- All inter-component communication uses `chrome.runtime.sendMessage` / `onMessage`
- Async message handlers must `return true` to keep the message channel open
- Books are processed sequentially (one tab at a time) with configurable delay
- Book IDs can be Amazon ASINs (`B0XXXXXX`), BookBub promotion IDs (`bb_12345`), or URL hashes (`hash_xxx`)
- Both purchased AND skipped books are stored to avoid re-checking
- Auto-pagination uses a storage flag (`autoStartPagination`) to trigger auto-start on the next page load

## Common Gotchas

- Service worker can go to sleep during long processing - keep processing fast
- `waitForTabProcessing` has a 30-second timeout per book
- Two `onMessage.addListener` calls in `background.js` (main handler + `GET_CURRENT_STATS`)
- The `hashString` function exists in both `bookbub.js` and `amazon.js` (duplicated)
- Library detection in `amazon.js` intentionally checks only button text and buy box area, not full page body, to avoid false positives
