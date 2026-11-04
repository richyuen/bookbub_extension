# Privacy Policy — Book Deal Auto-Claimer

**Last updated:** November 3, 2026

**Published at:** https://richardyuen.com/bookbub_extension/privacy-policy.html

Book Deal Auto-Claimer ("the extension") is an unofficial browser extension for Microsoft Edge. This policy explains what the extension accesses, what it stores, and what it does with that information.

## Summary

The extension does not collect, transmit, sell, or share personal data. It has no servers, analytics, advertising, or remote code. Everything it stores stays in your browser.

## Information the extension accesses

To perform its single purpose, the extension reads parts of the web pages you open:

- **BookBub deal pages:** the extension reads the page to find book titles and Amazon links, and adds a "Start Auto-Claim" button to the page.
- **Amazon product pages:** the extension reads the page to check the Kindle price and whether the book is already in your Amazon library. When a book is free, it clicks Amazon's 1-Click button.
- **Amazon account state:** the extension relies on the Amazon session that is already signed in in your browser. It does not ask for, read, or store your Amazon password, payment card details, or other Amazon credentials.

## Information stored on your device

The extension stores the following data locally using the browser's `chrome.storage.local` API:

- **Claim history:** a book identifier, the book title, a timestamp, and a source flag for books the extension has processed.
- **Settings:** your auto-pagination preference.

This data is stored only on your device. It is not synced to your Microsoft account and is not sent anywhere. It remains until you use **Clear Purchase History** in the extension popup or uninstall the extension.

## Data sharing

None. The extension does not send data to the developer or to any third party. It does not use analytics, advertising, tracking, or crash-reporting services.

## Permissions

- **Storage:** saves claim history and settings locally.
- **Host access to `www.bookbub.com`:** runs the content script that adds the button and reads deal cards.
- **Host access to `www.amazon.com`:** runs the content script that checks the price and library status and claims free books.

The extension requests no other permissions.

## Children

The extension is not directed at children under 13 and does not knowingly collect information from anyone.

## Changes

If this policy changes, the updated version will be posted at this URL with a new "last updated" date.

## Contact

Questions about this policy: **admin@richardyuen.com**

---

This extension is independent and is not affiliated with, endorsed by, or sponsored by BookBub or Amazon.
