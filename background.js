// Background service worker for BookBub Auto-Purchase Extension

let processingQueue = [];
let isProcessing = false;
let currentStats = {
  processed: 0,
  purchased: 0,
  skipped: 0
};

// Initialize storage on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['purchasedBooks', 'settings'], (result) => {
    if (!result.purchasedBooks) {
      chrome.storage.local.set({ purchasedBooks: {} });
    }
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          delayBetweenBooks: 3000,
          autoNextPage: true
        }
      });
    }
  });
  console.log('BookBub Auto-Purchase Extension installed');
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message.type);

  if (message.type === 'START_PROCESSING') {
    handleStartProcessing(message.books, sender.tab.id);
    sendResponse({ success: true });
  } else if (message.type === 'PURCHASE_COMPLETE') {
    handlePurchaseComplete(message);
    sendResponse({ success: true });
  } else if (message.type === 'PURCHASE_SKIPPED') {
    handlePurchaseSkipped(message);
    sendResponse({ success: true });
  } else if (message.type === 'GET_STATS') {
    sendResponse({ stats: currentStats });
  } else if (message.type === 'RESET_STATS') {
    currentStats = { processed: 0, purchased: 0, skipped: 0 };
    sendResponse({ success: true });
  } else if (message.type === 'CHECK_IF_PURCHASED') {
    checkIfPurchased(message.bookId, sendResponse);
    return true; // Keep channel open for async response
  }

  return false;
});

// Handle start processing request from BookBub page
async function handleStartProcessing(books, bookbubTabId) {
  console.log(`Starting processing of ${books.length} books`);

  if (isProcessing) {
    console.log('Already processing, ignoring request');
    return;
  }

  processingQueue = books;
  isProcessing = true;
  currentStats = { processed: 0, purchased: 0, skipped: 0 };

  // Process books sequentially
  for (const book of processingQueue) {
    await processBook(book);

    // Get delay from settings
    const settings = await getSettings();
    await delay(settings.delayBetweenBooks);
  }

  // All books processed, notify BookBub page
  isProcessing = false;
  console.log('Processing complete. Stats:', currentStats);

  chrome.tabs.sendMessage(bookbubTabId, {
    type: 'PROCESSING_COMPLETE',
    stats: currentStats
  });
}

// Process a single book
async function processBook(book) {
  console.log(`Processing book: ${book.title}`);
  currentStats.processed++;

  try {
    // Open Amazon page in new tab
    const tab = await chrome.tabs.create({
      url: book.amazonUrl,
      active: false
    });

    // Wait for the tab to load and content script to process
    await waitForTabProcessing(tab.id);

    // Close the tab after processing
    await delay(2000); // Brief delay before closing
    chrome.tabs.remove(tab.id);
  } catch (error) {
    console.error(`Error processing book ${book.title}:`, error);
    currentStats.skipped++;
  }
}

// Wait for Amazon content script to complete processing
function waitForTabProcessing(tabId) {
  return new Promise((resolve) => {
    let checkCount = 0;
    const maxChecks = 30; // 30 seconds max wait

    const interval = setInterval(() => {
      checkCount++;

      // Check if tab still exists
      chrome.tabs.get(tabId, (tab) => {
        if (chrome.runtime.lastError || !tab) {
          clearInterval(interval);
          resolve();
          return;
        }

        // Timeout after max checks
        if (checkCount >= maxChecks) {
          console.log('Timeout waiting for tab processing');
          clearInterval(interval);
          resolve();
        }
      });
    }, 1000);

    // Listen for completion message
    const listener = (message, sender) => {
      if (sender.tab?.id === tabId &&
          (message.type === 'PURCHASE_COMPLETE' || message.type === 'PURCHASE_SKIPPED')) {
        clearInterval(interval);
        chrome.runtime.onMessage.removeListener(listener);
        resolve();
      }
    };
    chrome.runtime.onMessage.addListener(listener);
  });
}

// Handle purchase completion notification
async function handlePurchaseComplete(message) {
  console.log(`Purchase complete: ${message.bookTitle}`);
  currentStats.purchased++;

  // Mark book as purchased in storage
  await markBookPurchased(message.bookId, message.bookTitle);
}

// Handle purchase skipped notification
function handlePurchaseSkipped(message) {
  console.log(`Purchase skipped: ${message.bookTitle} - Reason: ${message.reason}`);
  currentStats.skipped++;

  // If already in library, still mark as "purchased" to avoid future attempts
  if (message.reason === 'Already in library') {
    markBookPurchased(message.bookId, message.bookTitle);
  }
}

// Mark a book as purchased in storage
async function markBookPurchased(bookId, bookTitle) {
  return new Promise((resolve) => {
    chrome.storage.local.get(['purchasedBooks'], (result) => {
      const purchasedBooks = result.purchasedBooks || {};
      purchasedBooks[bookId] = {
        title: bookTitle,
        timestamp: Date.now(),
        source: 'extension'
      };
      chrome.storage.local.set({ purchasedBooks }, () => {
        console.log(`Marked ${bookTitle} as purchased`);
        resolve();
      });
    });
  });
}

// Check if a book has been purchased
function checkIfPurchased(bookId, sendResponse) {
  chrome.storage.local.get(['purchasedBooks'], (result) => {
    const purchasedBooks = result.purchasedBooks || {};
    const isPurchased = bookId in purchasedBooks;
    sendResponse({ isPurchased });
  });
}

// Get settings from storage
function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['settings'], (result) => {
      resolve(result.settings || { delayBetweenBooks: 3000, autoNextPage: true });
    });
  });
}

// Utility: delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Export current stats for popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_CURRENT_STATS') {
    sendResponse({
      stats: currentStats,
      isProcessing: isProcessing,
      queueLength: processingQueue.length
    });
  }
});
