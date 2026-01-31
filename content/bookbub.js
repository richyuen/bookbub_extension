// Content script for BookBub pages

let currentPage = 1;
let isProcessing = false;
let autoNextPageEnabled = true; // Loaded from storage

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  // Load auto-pagination setting from storage
  loadAutoPaginationSetting();

  // Check if we're on a deals page
  if (window.location.pathname.includes('/ebook-deals') ||
      window.location.pathname.includes('/deals')) {
    injectButton();

    // Check if we should auto-start (came from previous page via pagination)
    checkAndAutoStart();
  }

  // Listen for processing complete messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROCESSING_COMPLETE') {
      handleProcessingComplete(message.stats);
    }
  });

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.settings) {
      loadAutoPaginationSetting();
    }
  });
}

// Inject the "Start Auto-Purchase" button
function injectButton() {
  // Check if button already exists
  if (document.getElementById('bookbub-auto-purchase-btn')) {
    return;
  }

  const button = document.createElement('button');
  button.id = 'bookbub-auto-purchase-btn';
  updateButtonText(button);
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    padding: 15px 25px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0,0,0,0.3);
    transition: background 0.3s;
  `;

  button.addEventListener('mouseenter', () => {
    button.style.background = '#45a049';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = '#4CAF50';
  });

  button.addEventListener('click', handleButtonClick);

  document.body.appendChild(button);
}

// Load auto-pagination setting from storage
function loadAutoPaginationSetting() {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || { delayBetweenBooks: 1000, autoNextPage: true };
    autoNextPageEnabled = settings.autoNextPage;

    // Update button text if it exists
    const button = document.getElementById('bookbub-auto-purchase-btn');
    if (button) {
      updateButtonText(button);
    }
  });
}

// Update button text based on auto-pagination state
function updateButtonText(button) {
  button.textContent = autoNextPageEnabled
    ? 'Start Auto-Purchase (Auto-Page ON)'
    : 'Start Auto-Purchase';
  button.title = autoNextPageEnabled
    ? 'Click to start processing books. Auto-pagination enabled.'
    : 'Click to start processing books. Auto-pagination disabled.';
}

// Handle button click
async function handleButtonClick() {
  // If already processing, clicking stops it
  if (isProcessing) {
    const confirmed = confirm('Stop processing books?');
    if (confirmed) {
      chrome.runtime.sendMessage({ type: 'STOP_PROCESSING' });
      resetButton();
    }
    return;
  }

  const button = document.getElementById('bookbub-auto-purchase-btn');
  button.textContent = 'Processing... (click to stop)';
  button.style.background = '#FFA500';
  isProcessing = true;

  try {
    const books = await scrapeBooks();

    if (books.length === 0) {
      alert('No unpurchased books found on this page.');
      resetButton();
      return;
    }

    // Mark the last book
    if (books.length > 0) {
      books[books.length - 1].isLastBook = true;
    }

    // Send books to background script for processing
    chrome.runtime.sendMessage({
      type: 'START_PROCESSING',
      books: books
    });

  } catch (error) {
    console.error('Error scraping books:', error);
    alert('Error scraping books. Check console for details.');
    resetButton();
  }
}

// Scrape books from the current page
async function scrapeBooks() {
  const books = [];

  // BookBub deal cards - try multiple selectors
  const dealSelectors = [
    '[data-testid*="book"]',  // Current BookBub structure (2026)
    '.deal-tile',
    '.daily-deal-tile',
    '[data-deal-id]',
    '.book-deal'
  ];

  let dealElements = [];
  for (const selector of dealSelectors) {
    dealElements = document.querySelectorAll(selector);
    if (dealElements.length > 0) break;
  }

  if (dealElements.length === 0) {
    return books;
  }

  // Track book IDs to avoid duplicates in the same scrape
  const seenBookIds = new Set();

  for (const deal of dealElements) {
    try {
      const book = await extractBookData(deal);
      if (book) {
        // Check if we've already added this book in this scrape session
        if (seenBookIds.has(book.id)) continue;

        // Check if already purchased in previous sessions
        const isPurchased = await isBookPurchased(book.id);
        if (!isPurchased) {
          books.push(book);
          seenBookIds.add(book.id);
        }
      }
    } catch (error) {
      // Skip books that fail to extract
    }
  }

  return books;
}

// Extract book data from a deal element
async function extractBookData(dealElement) {
  // Try to find the Amazon link (direct or via BookBub redirect)
  let amazonLink = null;
  let amazonUrl = '';

  // First, try direct Amazon links
  amazonLink = dealElement.querySelector('a[href*="amazon.com"]');

  if (!amazonLink) {
    // Look for the Amazon retailer button (BookBub's new structure)
    // These are buttons/links with text "Amazon" and class "bub-button"
    const allLinks = dealElement.querySelectorAll('a');
    for (const link of allLinks) {
      const text = link.textContent.trim();
      const href = link.href;

      // Look for Amazon button by text content
      if (text === 'Amazon' || text.toLowerCase().includes('amazon')) {
        amazonLink = link;
        break;
      }

      // Or look for BookBub redirect links to Amazon
      if (href.includes('r.bookbub.com') || href.includes('promotion_site_active_check')) {
        // Check if this is the Amazon retailer (retailer_id=1 is Amazon)
        if (href.includes('retailer_id=1')) {
          amazonLink = link;
          break;
        }
      }
    }
  }

  if (!amazonLink) {
    return null;
  }

  amazonUrl = amazonLink.href;

  // Log whether we're using direct Amazon link or redirect
  if (amazonUrl.includes('amazon.com')) {
    console.log('Found direct Amazon link');
  } else {
    console.log('Using BookBub redirect link:', amazonUrl);
  }

  // Extract book title - try multiple approaches
  let title = '';
  const titleSelectors = [
    '[class*="title"]',  // Current BookBub structure (2026)
    '.book-title',
    '.deal-title',
    'h3',
    'h2',
    '[data-title]'
  ];

  for (const selector of titleSelectors) {
    const titleElement = dealElement.querySelector(selector);
    if (titleElement) {
      title = titleElement.textContent.trim();
      break;
    }
  }

  // Fallback: try to get title from link text
  if (!title) {
    title = amazonLink.textContent.trim();
  }

  if (!title) {
    console.warn('Could not extract title from deal element');
    return null;
  }

  // Generate a book ID from the Amazon URL
  const bookId = generateBookId(amazonUrl);

  // Check if the price is free
  const priceElement = dealElement.querySelector('.price, .deal-price, [class*="price"]');
  const priceText = priceElement ? priceElement.textContent.trim() : '';

  // Only include if price indicates free
  if (!priceText.includes('$0.00') && !priceText.includes('Free')) {
    return null;
  }

  return {
    id: bookId,
    title: title,
    amazonUrl: amazonUrl
  };
}

// Generate a unique book ID from Amazon URL
function generateBookId(amazonUrl) {
  // Extract ASIN from direct Amazon URL
  const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/i) ||
                    amazonUrl.match(/\/gp\/product\/([A-Z0-9]{10})/i);

  if (asinMatch) {
    return asinMatch[1];
  }

  // Extract promotion ID from BookBub redirect URL
  // Pattern: https://r.bookbub.com/promotion_site_active_check/177380?...
  const promotionMatch = amazonUrl.match(/promotion_site_active_check\/(\d+)/);
  if (promotionMatch) {
    return 'bb_' + promotionMatch[1];
  }

  // Fallback: use hash of URL (remove query params for consistency)
  const urlWithoutParams = amazonUrl.split('?')[0];
  return 'hash_' + hashString(urlWithoutParams);
}

// Simple string hash function
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return 'hash_' + Math.abs(hash).toString(36);
}

// Check if a book has been purchased
async function isBookPurchased(bookId) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'CHECK_IF_PURCHASED',
      bookId: bookId
    }, (response) => {
      resolve(response?.isPurchased || false);
    });
  });
}

// Handle processing complete message
function handleProcessingComplete(stats) {
  isProcessing = false;

  // Check if we should go to next page
  if (autoNextPageEnabled && shouldGoToNextPage(stats)) {
    // Last book was purchased, continue to next page
    console.log(`Page complete. Processed: ${stats.processed}, Purchased: ${stats.purchased}, Skipped: ${stats.skipped}. Last book purchased - moving to next page...`);
    goToNextPage();
  } else {
    // All done
    const message = `Processing complete!\n\n` +
                    `Processed: ${stats.processed}\n` +
                    `Purchased: ${stats.purchased}\n` +
                    `Skipped: ${stats.skipped}\n\n` +
                    `${autoNextPageEnabled && !stats.lastBookPurchased ? 'Last book not purchased - stopping.' : 'Done!'}`;
    alert(message);
    resetButton();
  }
}

// Determine if we should navigate to next page
function shouldGoToNextPage(stats) {
  if (!autoNextPageEnabled) return false;

  // Only continue to next page if the LAST book on this page was purchased
  return stats.lastBookPurchased === true;
}

// Check if we should auto-start processing (came from pagination)
function checkAndAutoStart() {
  chrome.storage.local.get(['autoStartPagination'], (result) => {
    if (result.autoStartPagination) {
      // Clear the flag
      chrome.storage.local.remove('autoStartPagination');

      // Wait for page to fully load, then auto-click button
      setTimeout(() => {
        const button = document.getElementById('bookbub-auto-purchase-btn');
        if (button && !isProcessing) {
          console.log('Auto-starting pagination on new page...');
          button.click();
        }
      }, 2000); // Wait 2 seconds for page to fully load
    }
  });
}

// Navigate to next page
function goToNextPage() {
  const url = new URL(window.location.href);

  // Get current page number from URL or default to 1
  const urlPage = parseInt(url.searchParams.get('page') || '1');
  const nextPage = urlPage + 1;

  // Set new page number
  url.searchParams.set('page', nextPage);

  // Set flag to auto-start on next page
  chrome.storage.local.set({ autoStartPagination: true }, () => {
    // Navigate to next page
    window.location.href = url.toString();
  });
}

// Reset button to initial state
function resetButton() {
  const button = document.getElementById('bookbub-auto-purchase-btn');
  if (button) {
    updateButtonText(button);
    button.style.background = '#4CAF50';
  }
  isProcessing = false;
}
