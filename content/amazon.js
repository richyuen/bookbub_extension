// Content script for Amazon pages

console.log('Amazon content script loaded');

// Store original book ID from BookBub (will be sent by background script)
let originalBookId = null;
let originalBookTitle = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_ORIGINAL_BOOK_ID') {
    originalBookId = message.originalBookId;
    originalBookTitle = message.bookTitle;
    console.log('Received original book ID:', originalBookId);
  }
});

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  console.log('Initializing Amazon content script');

  // Wait a bit for dynamic content to load
  await delay(2000);

  // Check if this is a Kindle book page
  if (!isKindleBookPage()) {
    console.log('Not a Kindle book page');
    notifySkipped('Not a Kindle book page');
    return;
  }

  // Extract book information
  const bookTitle = getBookTitle();
  const bookId = getBookId();
  const price = getBookPrice();

  console.log(`Book: ${bookTitle}`);
  console.log(`Price: ${price}`);
  console.log(`Book ID: ${bookId}`);

  // Check if book is free
  if (!isFree(price)) {
    console.log('Book is not free, skipping');
    notifySkipped('Not free', bookTitle, bookId);
    return;
  }

  // Check if already in library
  if (isInLibrary()) {
    console.log('Book is already in library');
    notifySkipped('Already in library', bookTitle, bookId);
    return;
  }

  // Attempt to purchase with 1-Click
  const success = await purchaseWithOneClick();

  if (success) {
    console.log('Purchase successful');
    notifyPurchaseComplete(bookTitle, bookId);
  } else {
    console.log('Purchase failed or button not found');
    notifySkipped('Purchase button not found', bookTitle, bookId);
  }
}

// Check if this is a Kindle book page
function isKindleBookPage() {
  // Check URL
  const url = window.location.href;
  if (!url.includes('/dp/') && !url.includes('/gp/product/')) {
    return false;
  }

  // Check for Kindle-specific elements
  const kindleIndicators = [
    '[data-feature-name="kindle"]',
    '#kindle-edition',
    '.kindle-logo',
    'a[href*="kindle"]'
  ];

  for (const selector of kindleIndicators) {
    if (document.querySelector(selector)) {
      return true;
    }
  }

  // Check page content
  const bodyText = document.body.textContent;
  return bodyText.includes('Kindle') || bodyText.includes('Read instantly');
}

// Get book title
function getBookTitle() {
  const titleSelectors = [
    '#productTitle',
    '#ebooksProductTitle',
    'h1[data-feature-name="title"]',
    'h1.a-size-large'
  ];

  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent.trim();
    }
  }

  return 'Unknown Book';
}

// Get book ID (ASIN)
function getBookId() {
  // Try to get from URL
  const url = window.location.href;
  const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/i) ||
                    url.match(/\/gp\/product\/([A-Z0-9]{10})/i);

  if (asinMatch) {
    return asinMatch[1];
  }

  // Try to get from page elements
  const asinElement = document.querySelector('[data-asin]');
  if (asinElement) {
    return asinElement.getAttribute('data-asin');
  }

  // Fallback: generate from URL
  return 'amazon_' + hashString(url);
}

// Get book price
function getBookPrice() {
  const priceSelectors = [
    '.a-price .a-offscreen',
    '#kindle-price',
    '#price',
    '.a-color-price',
    '[data-a-color="price"]'
  ];

  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const priceText = element.textContent.trim();
      if (priceText.includes('$')) {
        return priceText;
      }
    }
  }

  // Check for "Free" text
  const bodyText = document.body.textContent;
  if (bodyText.includes('$0.00')) {
    return '$0.00';
  }

  return 'Unknown';
}

// Check if price indicates the book is free
function isFree(price) {
  if (!price) return false;

  const priceStr = price.toLowerCase();
  return priceStr.includes('$0.00') ||
         priceStr.includes('free') ||
         priceStr === '$0';
}

// Check if book is already in library
function isInLibrary() {
  // Look for indicators that book is already owned
  const ownedIndicators = [
    'Read for Free',
    'Already purchased',
    'Read now',
    'You own this book',
    'In your library'
  ];

  const bodyText = document.body.textContent;

  for (const indicator of ownedIndicators) {
    if (bodyText.includes(indicator)) {
      return true;
    }
  }

  // Check for specific button text
  const buttons = document.querySelectorAll('button, a.a-button, input[type="submit"]');
  for (const button of buttons) {
    const buttonText = button.textContent.trim();
    if (buttonText.includes('Read for Free') ||
        buttonText.includes('Read now') ||
        buttonText.includes('Already purchased')) {
      return true;
    }
  }

  return false;
}

// Purchase book using 1-Click
async function purchaseWithOneClick() {
  console.log('Attempting 1-Click purchase...');

  // Look for 1-Click button
  const oneClickSelectors = [
    '#one-click-button',
    '#buyOneClick',
    'input[name="submit.buy-now"]',
    '[name="submit.buy-now"]',
    '#buybox input[type="submit"]',
    'input[value*="Buy now with 1-Click"]'
  ];

  let button = null;
  for (const selector of oneClickSelectors) {
    button = document.querySelector(selector);
    if (button) {
      console.log(`Found 1-Click button with selector: ${selector}`);
      break;
    }
  }

  if (!button) {
    // Try to find button by text content
    const allButtons = document.querySelectorAll('button, input[type="submit"], a.a-button');
    for (const btn of allButtons) {
      const text = btn.textContent || btn.value || '';
      if (text.includes('Buy now with 1-Click') ||
          text.includes('1-Click') ||
          text.includes('Buy with 1-Click')) {
        button = btn;
        console.log('Found 1-Click button by text content');
        break;
      }
    }
  }

  if (!button) {
    console.error('1-Click button not found');
    return false;
  }

  // Scroll button into view
  button.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(500);

  // Click the button
  try {
    button.click();
    console.log('1-Click button clicked');
    await delay(1000);
    return true;
  } catch (error) {
    console.error('Error clicking 1-Click button:', error);
    return false;
  }
}

// Notify background script of purchase completion
function notifyPurchaseComplete(bookTitle, bookId) {
  chrome.runtime.sendMessage({
    type: 'PURCHASE_COMPLETE',
    bookTitle: bookTitle,
    bookId: bookId,  // Amazon ASIN
    originalBookId: originalBookId  // BookBub promotion ID (if available)
  });
}

// Notify background script that purchase was skipped
function notifySkipped(reason, bookTitle = 'Unknown', bookId = 'unknown') {
  chrome.runtime.sendMessage({
    type: 'PURCHASE_SKIPPED',
    reason: reason,
    bookTitle: bookTitle,
    bookId: bookId,  // Amazon ASIN
    originalBookId: originalBookId  // BookBub promotion ID (if available)
  });
}

// Utility: delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Simple string hash function
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
