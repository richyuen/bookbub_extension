// Content script for BookBub pages

console.log('BookBub content script loaded');

let currentPage = 1;
let isProcessing = false;

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

function init() {
  console.log('Initializing BookBub content script');

  // Check if we're on a deals page
  if (window.location.pathname.includes('/ebook-deals') ||
      window.location.pathname.includes('/deals')) {
    injectButton();
  }

  // Listen for processing complete messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'PROCESSING_COMPLETE') {
      handleProcessingComplete(message.stats);
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
  button.textContent = 'Start Auto-Purchase';
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
  console.log('Auto-purchase button injected');
}

// Handle button click
async function handleButtonClick() {
  if (isProcessing) {
    alert('Already processing books. Please wait...');
    return;
  }

  const button = document.getElementById('bookbub-auto-purchase-btn');
  button.disabled = true;
  button.textContent = 'Processing...';
  button.style.background = '#FFA500';
  isProcessing = true;

  try {
    const books = await scrapeBooks();

    if (books.length === 0) {
      alert('No unpurchased books found on this page.');
      resetButton();
      return;
    }

    console.log(`Found ${books.length} unpurchased books`);

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
  console.log('Scraping books from page...');
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
    if (dealElements.length > 0) {
      console.log(`Found ${dealElements.length} deals using selector: ${selector}`);
      break;
    }
  }

  if (dealElements.length === 0) {
    console.warn('No deal elements found. Page structure may have changed.');
    return books;
  }

  for (const deal of dealElements) {
    try {
      const book = await extractBookData(deal);
      if (book) {
        // Check if already purchased
        const isPurchased = await isBookPurchased(book.id);
        if (!isPurchased) {
          books.push(book);
        } else {
          console.log(`Skipping already purchased: ${book.title}`);
        }
      }
    } catch (error) {
      console.error('Error extracting book data:', error);
    }
  }

  return books;
}

// Extract book data from a deal element
async function extractBookData(dealElement) {
  // Try to find the Amazon link (direct or via BookBub redirect)
  let amazonLink = dealElement.querySelector('a[href*="amazon.com"]');
  let amazonUrl = '';

  // If no direct Amazon link, try BookBub redirect links
  if (!amazonLink) {
    // Look for BookBub book links (they redirect to retailers)
    const bookbubLink = dealElement.querySelector('a[href*="/books/"]') ||
                        dealElement.querySelector('a[href*="bookbub.com"]');

    if (bookbubLink) {
      // Try to get Amazon URL from data attributes
      amazonUrl = bookbubLink.getAttribute('data-url') ||
                  bookbubLink.getAttribute('data-amazon-url') ||
                  bookbubLink.getAttribute('data-href');

      // If still no Amazon URL, use the BookBub link (will redirect)
      if (!amazonUrl) {
        amazonUrl = bookbubLink.href;
      }

      amazonLink = bookbubLink;
    }
  } else {
    amazonUrl = amazonLink.href;
  }

  if (!amazonLink || !amazonUrl) {
    console.log('No Amazon or BookBub link found in deal element');
    return null;
  }

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
    console.log(`Skipping non-free book: ${title} (${priceText})`);
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
  // Extract ASIN from Amazon URL
  const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/i) ||
                    amazonUrl.match(/\/gp\/product\/([A-Z0-9]{10})/i);

  if (asinMatch) {
    return asinMatch[1];
  }

  // Fallback: use hash of URL
  return hashString(amazonUrl);
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
  console.log('Processing complete:', stats);
  isProcessing = false;

  const message = `Processing complete!\n\n` +
                  `Processed: ${stats.processed}\n` +
                  `Purchased: ${stats.purchased}\n` +
                  `Skipped: ${stats.skipped}`;

  alert(message);

  // Check if we should go to next page
  if (stats.processed > 0 && shouldGoToNextPage()) {
    goToNextPage();
  } else {
    resetButton();
  }
}

// Determine if we should navigate to next page
function shouldGoToNextPage() {
  // For now, we'll let the user manually navigate
  // In future, could check if there's a "Next" button available
  return false;
}

// Navigate to next page
function goToNextPage() {
  currentPage++;
  const url = new URL(window.location.href);
  url.searchParams.set('page', currentPage);
  window.location.href = url.toString();
}

// Reset button to initial state
function resetButton() {
  const button = document.getElementById('bookbub-auto-purchase-btn');
  if (button) {
    button.disabled = false;
    button.textContent = 'Start Auto-Purchase';
    button.style.background = '#4CAF50';
  }
  isProcessing = false;
}
