// Quick diagnostic to find the correct Amazon link
// Copy this entire script and paste into browser console on BookBub page

console.log('=== FINDING AMAZON LINK ===');

// Get first book container
const bookContainer = document.querySelector('[data-testid*="book"]');

if (!bookContainer) {
  console.error('No book container found!');
} else {
  console.log('✓ Found book container');

  // Get the title
  const titleEl = bookContainer.querySelector('[class*="title"]');
  const title = titleEl ? titleEl.textContent.trim() : 'Unknown';
  console.log('Book title:', title);

  // Find ALL links in this container
  const allLinks = bookContainer.querySelectorAll('a');
  console.log(`\nFound ${allLinks.length} links in this book container:\n`);

  allLinks.forEach((link, index) => {
    const href = link.href;
    const text = link.textContent.trim().substring(0, 50);
    const classes = link.className;
    const dataAttrs = {};

    // Get all data attributes
    for (let attr of link.attributes) {
      if (attr.name.startsWith('data-')) {
        dataAttrs[attr.name] = attr.value;
      }
    }

    console.log(`Link ${index + 1}:`);
    console.log(`  Text: "${text}"`);
    console.log(`  Href: ${href}`);
    console.log(`  Classes: ${classes}`);
    if (Object.keys(dataAttrs).length > 0) {
      console.log(`  Data attributes:`, dataAttrs);
    }

    // Identify link type
    if (href.includes('amazon.com')) {
      console.log('  ⭐ DIRECT AMAZON LINK');
    } else if (href.includes('/books/')) {
      console.log('  📖 BookBub book detail page');
    } else if (href.includes('bookbub.com')) {
      console.log('  🔗 BookBub link (might redirect)');
    }
    console.log('');
  });

  // Try to find the "Get this Deal" button
  const dealButton = bookContainer.querySelector('[href*="deals/click"]') ||
                     bookContainer.querySelector('[data-deal-click]') ||
                     bookContainer.querySelector('a[class*="deal"]') ||
                     bookContainer.querySelector('a[class*="button"]');

  if (dealButton) {
    console.log('🎯 LIKELY DEAL BUTTON:');
    console.log('  Text:', dealButton.textContent.trim());
    console.log('  Href:', dealButton.href);
    console.log('  Classes:', dealButton.className);
  }
}

console.log('\n=== SUGGESTED FIX ===');
console.log('Look at the links above and identify which one goes to Amazon.');
console.log('Then update the selector in extractBookData() to target that specific link.');
