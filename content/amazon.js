// Content script for Amazon pages

// Store original book ID from BookBub (will be sent by background script)
let originalBookId = null;
let originalBookTitle = null;
let isLastBook = false;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_ORIGINAL_BOOK_ID') {
    originalBookId = message.originalBookId;
    originalBookTitle = message.bookTitle;
    isLastBook = message.isLastBook || false;
  }
});

// Wait for page to be fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

async function init() {
  // Wait for page to load
  await delay(1000);

  // Request original book ID from background script
  try {
    const response = await chrome.runtime.sendMessage({ type: 'REQUEST_BOOK_ID' });
    if (response && !response.error) {
      originalBookId = response.originalBookId;
      originalBookTitle = response.bookTitle;
      isLastBook = response.isLastBook;
      console.log('Received book info:', originalBookTitle, originalBookId);
    } else {
      console.log('No book info received from background script');
    }
  } catch (error) {
    console.error('Error requesting book ID:', error);
  }

  // Check if this is a Kindle book page
  if (!isKindleBookPage()) {
    notifySkipped('Not a Kindle book page');
    return;
  }

  // Extract book information
  const bookTitle = getBookTitle();
  const bookId = getBookId();

  // Check if already in library FIRST
  if (isInLibrary()) {
    notifySkipped('Already in library', bookTitle, bookId);
    return;
  }

  // Check if book is free
  const price = getBookPrice();
  if (!isFree(price)) {
    notifySkipped('Not free', bookTitle, bookId);
    return;
  }

  // Attempt to purchase with 1-Click
  const success = await purchaseWithOneClick();

  if (success) {
    notifyPurchaseComplete(bookTitle, bookId);
  } else {
    notifySkipped('Purchase button not found', bookTitle, bookId);
  }
}

// Check if this is a Kindle book page
function isKindleBookPage() {
  // Check URL
  const url = window.location.href;
  if (!url.includes('/dp/') &&
      !url.includes('/gp/product/') &&
      !url.includes('/gp/aw/d/')) {
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
                    url.match(/\/gp\/product\/([A-Z0-9]{10})/i) ||
                    url.match(/\/gp\/aw\/d\/([A-Z0-9]{10})/i);

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

// Extract a normalized dollar amount from text (e.g. "$0.00 with savings" => "$0.00")
function extractPriceAmount(text) {
  if (!text) return null;

  const normalized = text.replace(/\s+/g, ' ').trim();
  const amountMatch = normalized.match(/\$[0-9]+(?:\.[0-9]{1,2})?/);
  return amountMatch ? amountMatch[0] : null;
}

// Get book price
function getBookPrice() {
  // 1. Prefer Kindle format matrix price (avoids audiobook add-on prices)
  const kindleFormatSelectors = [
    '#tmm-grid-swatch-KINDLE .ebook-price-value',
    '#tmm-grid-swatch-KINDLE .slot-price .a-color-price',
    '#tmm-grid-swatch-KINDLE .slot-price',
    '#tmmSwatches .swatchElement.selected[id*="KINDLE"] .ebook-price-value',
    '#tmmSwatches .swatchElement.selected[id*="KINDLE"] .slot-price .a-color-price',
    '#tmmSwatches .swatchElement.selected[id*="KINDLE"] .slot-price'
  ];

  for (const selector of kindleFormatSelectors) {
    const element = document.querySelector(selector);
    const amount = extractPriceAmount(element?.textContent || '');
    if (amount) {
      return amount;
    }
  }

  // 2. Kindle/Apex layout selectors
  const apexSelectors = [
    '#KindleALCLegacy_feature_div .apex-pricetopay-accessibility-label',
    '#KindleALCLegacy_feature_div .apex-pricetopay-value .a-offscreen',
    '#kindle-price',
    '#price'
  ];

  for (const selector of apexSelectors) {
    const element = document.querySelector(selector);
    const amount = extractPriceAmount(element?.textContent || '');
    if (amount) {
      return amount;
    }
  }

  // 3. Generic fallback within purchase-related containers.
  // Prefer $0.00 if present anywhere in these containers.
  const containerSelectors = [
    '#tmm-grid-swatch-KINDLE',
    '#tmmSwatches .swatchElement.selected[id*="KINDLE"]',
    '#tmmSwatches',
    '#formats',
    '#KindleALCLegacy_feature_div',
    '#buyOneClick',
    '#buybox',
    '#buybox_feature_div'
  ];

  const genericSelectors = [
      '.ebook-price-value',
      '.slot-price .a-color-price',
      '.apex-pricetopay-accessibility-label',
      '.apex-pricetopay-value .a-offscreen',
      '.a-price .a-offscreen',
      '[data-a-color="price"]',
      '.a-color-price'
  ];

  let fallbackAmount = null;

  for (const containerSelector of containerSelectors) {
    const container = document.querySelector(containerSelector);
    if (!container) continue;

    for (const selector of genericSelectors) {
      const elements = container.querySelectorAll(selector);
      for (const element of elements) {
        const amount = extractPriceAmount(element?.textContent || '');
        if (!amount) continue;

        if (amount === '$0' || amount === '$0.00') {
          return '$0.00';
        }

        if (!fallbackAmount) {
          fallbackAmount = amount;
        }
      }
    }
  }

  if (fallbackAmount) {
    return fallbackAmount;
  }

  // 4. Final fallback: parse one-click purchase text.
  const oneClickContainer = document.querySelector('#KindleALCLegacy_feature_div') ||
                            document.querySelector('#buyOneClick');
  if (oneClickContainer) {
    const containerText = oneClickContainer.textContent || '';

    if (containerText.includes('$0.00')) {
      return '$0.00';
    }

    const amount = extractPriceAmount(containerText);
    if (amount) {
      return amount;
    }
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
  // Only check button text for ownership indicators (not entire page body)
  const buttons = document.querySelectorAll('button, a.a-button, input[type="submit"], span[role="button"]');
  for (const button of buttons) {
    const buttonText = button.textContent.trim().toLowerCase();

    // Very specific ownership phrases only
    if (buttonText.includes('read for free') ||
        buttonText.includes('already purchased') ||
        buttonText === 'read now' ||
        buttonText.includes('you own this') ||
        buttonText.includes('in your library')) {
      return true;
    }
  }

  // Check for ownership badges/indicators in the buy box area only
  const buyBox = document.querySelector('#buybox, #buybox_feature_div, #tmmSwatches, #formats');
  if (buyBox) {
    const buyBoxText = buyBox.textContent.toLowerCase();
    if (buyBoxText.includes('you own this book') ||
        buyBoxText.includes('already in your library')) {
      return true;
    }
  }

  return false;
}

// Purchase book using 1-Click
async function purchaseWithOneClick() {
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
    if (button) break;
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
        break;
      }
    }
  }

  if (!button) return false;

  // Scroll button into view and click
  button.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(300);

  try {
    button.click();
    await delay(500);
    return true;
  } catch (error) {
    return false;
  }
}

// Notify background script of purchase completion
function notifyPurchaseComplete(bookTitle, bookId) {
  chrome.runtime.sendMessage({
    type: 'PURCHASE_COMPLETE',
    bookTitle: bookTitle,
    bookId: bookId,  // Amazon ASIN
    originalBookId: originalBookId,  // BookBub promotion ID (if available)
    isLastBook: isLastBook
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
