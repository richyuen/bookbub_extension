// Enhanced BookBub content script with better debugging
// This version includes extensive logging to help diagnose selector issues

console.log('BookBub content script loaded (ENHANCED DEBUG VERSION)');

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
  console.log('=== STARTING BOOK SCRAPING ===');
  console.log('URL:', window.location.href);
  const books = [];

  // Expanded list of possible deal selectors
  const dealSelectors = [
    '.deal-tile',
    '.daily-deal-tile',
    '[data-deal-id]',
    '.book-deal',
    '[class*="deal"]',
    '[class*="book"]',
    '[data-testid*="deal"]',
    '[data-testid*="book"]',
    'article',
    '.card',
    '[class*="card"]'
  ];

  let dealElements = [];
  let workingSelector = null;

  console.log('Testing deal selectors...');
  for (const selector of dealSelectors) {
    try {
      const elements = document.querySelectorAll(selector);
      console.log(`  Selector "${selector}": found ${elements.length} elements`);

      if (elements.length > 0 && dealElements.length === 0) {
        dealElements = elements;
        workingSelector = selector;
        console.log(`  ✓ Using "${selector}" (${elements.length} elements)`);
      }
    } catch (error) {
      console.log(`  ✗ Selector "${selector}" failed:`, error.message);
    }
  }

  if (dealElements.length === 0) {
    console.error('❌ No deal elements found with any selector!');
    console.log('Attempting fallback: looking for repeating patterns...');

    // Fallback: find the most common class that appears 10-50 times (likely book cards)
    const allDivs = document.querySelectorAll('div[class]');
    const classCount = {};
    allDivs.forEach(div => {
      const classes = div.className.split(' ').filter(c => c.length > 0);
      classes.forEach(cls => {
        classCount[cls] = (classCount[cls] || 0) + 1;
      });
    });

    console.log('Most common classes (10-50 instances):');
    const candidates = Object.entries(classCount)
      .filter(([cls, count]) => count >= 10 && count <= 50)
      .sort((a, b) => b[1] - a[1]);

    candidates.slice(0, 5).forEach(([cls, count]) => {
      console.log(`  .${cls}: ${count} instances`);
    });

    if (candidates.length > 0) {
      const fallbackSelector = `.${candidates[0][0]}`;
      dealElements = document.querySelectorAll(fallbackSelector);
      workingSelector = fallbackSelector;
      console.log(`  ⚠️  Trying fallback selector: "${fallbackSelector}" (${dealElements.length} elements)`);
    }
  }

  if (dealElements.length === 0) {
    console.error('❌ Still no elements found. Page structure may have changed significantly.');
    return books;
  }

  console.log(`\n=== PROCESSING ${dealElements.length} DEAL ELEMENTS ===`);

  let processedCount = 0;
  let skippedNoAmazonLink = 0;
  let skippedNotFree = 0;
  let skippedNoTitle = 0;
  let skippedAlreadyPurchased = 0;

  for (const deal of dealElements) {
    processedCount++;
    try {
      console.log(`\nDeal #${processedCount}:`);
      const book = await extractBookData(deal);

      if (!book) {
        if (!deal.querySelector('a[href*="amazon.com"]')) {
          skippedNoAmazonLink++;
        } else {
          const priceElement = deal.querySelector('.price, .deal-price, [class*="price"], [class*="Price"]');
          const priceText = priceElement ? priceElement.textContent.trim() : '';
          if (!priceText.includes('$0.00') && !priceText.includes('Free') && priceText !== '') {
            skippedNotFree++;
          } else {
            skippedNoTitle++;
          }
        }
        continue;
      }

      // Check if already purchased
      const isPurchased = await isBookPurchased(book.id);
      if (!isPurchased) {
        books.push(book);
        console.log(`  ✓ Added to list: "${book.title}"`);
      } else {
        skippedAlreadyPurchased++;
        console.log(`  ⊗ Already purchased: "${book.title}"`);
      }
    } catch (error) {
      console.error(`  ✗ Error extracting book data:`, error);
    }
  }

  console.log('\n=== SCRAPING SUMMARY ===');
  console.log(`Total elements processed: ${processedCount}`);
  console.log(`Books found to purchase: ${books.length}`);
  console.log(`Skipped (no Amazon link): ${skippedNoAmazonLink}`);
  console.log(`Skipped (not free): ${skippedNotFree}`);
  console.log(`Skipped (no title): ${skippedNoTitle}`);
  console.log(`Skipped (already purchased): ${skippedAlreadyPurchased}`);
  console.log(`Working selector: ${workingSelector}`);

  return books;
}

// Extract book data from a deal element
async function extractBookData(dealElement) {
  // Try to find the Amazon link
  const amazonLink = dealElement.querySelector('a[href*="amazon.com"]');
  if (!amazonLink) {
    console.log('  ✗ No Amazon link found');
    return null;
  }

  const amazonUrl = amazonLink.href;
  console.log(`  Amazon URL: ${amazonUrl.substring(0, 60)}...`);

  // Extract book title - try multiple approaches
  let title = '';
  const titleSelectors = [
    '.book-title',
    '.deal-title',
    'h3',
    'h2',
    'h1',
    'h4',
    '[data-title]',
    '[class*="title"]',
    '[class*="Title"]'
  ];

  for (const selector of titleSelectors) {
    const titleElement = dealElement.querySelector(selector);
    if (titleElement && titleElement.textContent.trim()) {
      title = titleElement.textContent.trim();
      console.log(`  Title found (${selector}): "${title}"`);
      break;
    }
  }

  // Fallback: try to get title from link text
  if (!title) {
    title = amazonLink.textContent.trim();
    if (title) {
      console.log(`  Title from link text: "${title}"`);
    }
  }

  if (!title) {
    console.log('  ✗ Could not extract title');
    return null;
  }

  // Generate a book ID from the Amazon URL
  const bookId = generateBookId(amazonUrl);
  console.log(`  Book ID: ${bookId}`);

  // Check if the price is free
  const priceSelectors = [
    '.price',
    '.deal-price',
    '[class*="price"]',
    '[class*="Price"]',
    '[data-price]'
  ];

  let priceText = '';
  for (const selector of priceSelectors) {
    const priceElement = dealElement.querySelector(selector);
    if (priceElement && priceElement.textContent.trim()) {
      priceText = priceElement.textContent.trim();
      console.log(`  Price (${selector}): "${priceText}"`);
      break;
    }
  }

  if (!priceText) {
    console.log('  ⚠️  No price found (might be free with no price shown)');
    // Continue anyway - might be a free book with no price displayed
  }

  // Only include if price indicates free (or no price shown)
  if (priceText && !priceText.includes('$0.00') && !priceText.includes('Free') && !priceText.includes('0.00')) {
    console.log(`  ✗ Not free: "${priceText}"`);
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
