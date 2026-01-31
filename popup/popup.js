// Popup script for BookBub Auto-Purchase Extension

document.addEventListener('DOMContentLoaded', init);

async function init() {
  console.log('Popup initialized');

  // Load current stats
  await updateStats();

  // Load storage info
  await updateStorageInfo();

  // Set up event listeners
  document.getElementById('clear-storage').addEventListener('click', handleClearStorage);

  // Update stats every 2 seconds while popup is open
  setInterval(updateStats, 2000);
}

// Update statistics display
async function updateStats() {
  chrome.runtime.sendMessage({ type: 'GET_CURRENT_STATS' }, (response) => {
    if (response) {
      const { stats, isProcessing } = response;

      // Update status
      const statusElement = document.getElementById('status');
      if (isProcessing) {
        statusElement.textContent = 'Processing...';
        statusElement.style.color = '#FFA500';
      } else {
        statusElement.textContent = 'Idle';
        statusElement.style.color = '#4CAF50';
      }

      // Update stats
      document.getElementById('processed').textContent = stats.processed;
      document.getElementById('purchased').textContent = stats.purchased;
      document.getElementById('skipped').textContent = stats.skipped;
    }
  });
}

// Update storage information
async function updateStorageInfo() {
  chrome.storage.local.get(['purchasedBooks'], (result) => {
    const purchasedBooks = result.purchasedBooks || {};
    const totalBooks = Object.keys(purchasedBooks).length;
    document.getElementById('total-books').textContent = totalBooks;
  });
}

// Handle clear storage button click
async function handleClearStorage() {
  const confirmed = confirm(
    'Are you sure you want to clear the purchase history?\n\n' +
    'This will remove all tracked books and allow the extension to attempt purchasing them again.'
  );

  if (!confirmed) {
    return;
  }

  chrome.storage.local.set({ purchasedBooks: {} }, () => {
    console.log('Purchase history cleared');
    updateStorageInfo();
    alert('Purchase history cleared successfully!');
  });

  // Also reset current session stats
  chrome.runtime.sendMessage({ type: 'RESET_STATS' });
  updateStats();
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.purchasedBooks) {
    updateStorageInfo();
  }
});
