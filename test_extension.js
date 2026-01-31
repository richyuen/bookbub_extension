// Quick test script - paste this in the BookBub page console

console.log('=== EXTENSION TEST SCRIPT ===');

// Test 1: Check if button exists
const button = document.getElementById('bookbub-auto-purchase-btn');
if (button) {
  console.log('✓ Button found!');
} else {
  console.log('✗ Button NOT found - content script may not be running');
}

// Test 2: Check if content script has run
if (window.hasOwnProperty('bookbubExtensionLoaded')) {
  console.log('✓ Content script variables exist');
} else {
  console.log('✗ Content script may not have loaded');
}

// Test 3: Check storage
chrome.storage.local.get(['purchasedBooks'], (result) => {
  if (chrome.runtime.lastError) {
    console.log('✗ Storage error:', chrome.runtime.lastError);
  } else {
    const count = result.purchasedBooks ? Object.keys(result.purchasedBooks).length : 0;
    console.log(`✓ Storage works - ${count} books tracked`);

    if (count > 0) {
      console.log('Purchased books:');
      for (const [id, book] of Object.entries(result.purchasedBooks)) {
        console.log(`  - ${id}: ${book.title}`);
      }
    }
  }
});

// Test 4: Try to scrape books manually
console.log('\nAttempting manual book scrape...');
const containers = document.querySelectorAll('[data-testid*="book"]');
console.log(`Found ${containers.length} book containers`);

if (containers.length > 0) {
  const firstBook = containers[0];
  const titleEl = firstBook.querySelector('[class*="title"]');
  const amazonBtn = Array.from(firstBook.querySelectorAll('a')).find(a =>
    a.textContent.trim() === 'Amazon'
  );

  console.log('First book:');
  console.log('  Title:', titleEl ? titleEl.textContent.trim() : 'NOT FOUND');
  console.log('  Amazon button:', amazonBtn ? amazonBtn.href : 'NOT FOUND');
}

console.log('\n=== TEST COMPLETE ===');
console.log('Copy the output above and share it.');
