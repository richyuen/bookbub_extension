// BookBub Selector Diagnostic Script
// Paste this into the browser console on the BookBub deals page to find the correct selectors

console.log('=== BookBub Selector Diagnostic ===\n');

// 1. Find all possible deal containers
console.log('1. SEARCHING FOR DEAL CONTAINERS:');
const possibleContainerSelectors = [
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

for (const selector of possibleContainerSelectors) {
  try {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      console.log(`  ✓ "${selector}" found ${elements.length} elements`);
      if (dealElements.length === 0) {
        dealElements = Array.from(elements);
        workingSelector = selector;
      }
    }
  } catch (e) {
    console.log(`  ✗ "${selector}" - error: ${e.message}`);
  }
}

if (dealElements.length === 0) {
  console.log('  ❌ No deal containers found with standard selectors');
  console.log('  📊 Analyzing page structure...');

  // Look for repeating elements that might be book cards
  const allDivs = document.querySelectorAll('div[class]');
  const classCount = {};
  allDivs.forEach(div => {
    const classes = div.className.split(' ').filter(c => c.length > 0);
    classes.forEach(cls => {
      classCount[cls] = (classCount[cls] || 0) + 1;
    });
  });

  console.log('  Most common classes (might be containers):');
  Object.entries(classCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([cls, count]) => {
      if (count > 5 && count < 100) { // Likely to be repeating card elements
        console.log(`    - .${cls} (${count} instances)`);
      }
    });
} else {
  console.log(`\n  ✅ Using "${workingSelector}" (${dealElements.length} elements)\n`);
}

// 2. Analyze structure of first few deal elements
if (dealElements.length > 0) {
  console.log('2. ANALYZING FIRST 3 DEAL ELEMENTS:\n');

  dealElements.slice(0, 3).forEach((deal, index) => {
    console.log(`--- Deal #${index + 1} ---`);

    // Find title
    const titleSelectors = [
      '.book-title',
      '.deal-title',
      'h1', 'h2', 'h3', 'h4',
      '[data-title]',
      '[class*="title"]',
      'a[href*="books"]'
    ];

    let foundTitle = false;
    for (const sel of titleSelectors) {
      const titleEl = deal.querySelector(sel);
      if (titleEl && titleEl.textContent.trim()) {
        console.log(`  Title (${sel}): "${titleEl.textContent.trim().substring(0, 50)}"`);
        foundTitle = true;
        break;
      }
    }
    if (!foundTitle) {
      console.log('  Title: ❌ Not found');
    }

    // Find Amazon link
    const amazonLink = deal.querySelector('a[href*="amazon.com"]');
    if (amazonLink) {
      console.log(`  Amazon Link: ✓ "${amazonLink.href}"`);
    } else {
      const allLinks = deal.querySelectorAll('a[href]');
      console.log(`  Amazon Link: ❌ Not found (${allLinks.length} total links in element)`);
      if (allLinks.length > 0) {
        console.log(`    First link: ${allLinks[0].href}`);
      }
    }

    // Find price
    const priceSelectors = [
      '.price',
      '.deal-price',
      '[class*="price"]',
      '[class*="Price"]',
      '[data-price]'
    ];

    let foundPrice = false;
    for (const sel of priceSelectors) {
      const priceEl = deal.querySelector(sel);
      if (priceEl && priceEl.textContent.trim()) {
        console.log(`  Price (${sel}): "${priceEl.textContent.trim()}"`);
        foundPrice = true;
        break;
      }
    }
    if (!foundPrice) {
      console.log('  Price: ❌ Not found');
    }

    // Show all classes on this element
    if (deal.className) {
      console.log(`  Classes: ${deal.className}`);
    }

    // Show data attributes
    const dataAttrs = Array.from(deal.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => `${attr.name}="${attr.value}"`);
    if (dataAttrs.length > 0) {
      console.log(`  Data attributes: ${dataAttrs.join(', ')}`);
    }

    console.log('');
  });
}

// 3. Search specifically for "Water" book
console.log('3. SEARCHING FOR "WATER" BOOK:\n');
const allText = document.body.innerText;
if (allText.includes('Water')) {
  console.log('  ✓ "Water" text found on page');

  // Find all elements containing "Water"
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const waterNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim() === 'Water' ||
        node.textContent.includes('Water')) {
      waterNodes.push(node);
    }
  }

  console.log(`  Found ${waterNodes.length} text nodes containing "Water"`);

  if (waterNodes.length > 0) {
    const waterNode = waterNodes[0];
    let current = waterNode.parentElement;
    let depth = 0;
    console.log('  Walking up DOM tree from "Water" text:');

    while (current && depth < 10) {
      const info = [];
      if (current.tagName) info.push(`<${current.tagName.toLowerCase()}>`);
      if (current.className) info.push(`class="${current.className}"`);
      if (current.id) info.push(`id="${current.id}"`);

      const dataAttrs = Array.from(current.attributes || [])
        .filter(attr => attr.name.startsWith('data-'))
        .map(attr => `${attr.name}="${attr.value}"`);
      if (dataAttrs.length > 0) info.push(dataAttrs.join(' '));

      console.log(`    ${'  '.repeat(depth)}${info.join(' ')}`);

      // Check if this might be the deal container
      const hasAmazonLink = current.querySelector('a[href*="amazon.com"]');
      if (hasAmazonLink && depth > 0) {
        console.log(`    ${'  '.repeat(depth)}⭐ THIS MIGHT BE THE DEAL CONTAINER`);
      }

      current = current.parentElement;
      depth++;
    }
  }
} else {
  console.log('  ❌ "Water" text not found on page');
}

// 4. Summary and Recommendations
console.log('\n4. RECOMMENDATIONS:\n');

if (workingSelector) {
  console.log(`  Deal Container Selector: "${workingSelector}"`);

  // Find best title selector
  const firstDeal = dealElements[0];
  const titleSelectors = [
    '.book-title',
    '.deal-title',
    'h1', 'h2', 'h3', 'h4',
    '[data-title]',
    '[class*="title"]'
  ];

  for (const sel of titleSelectors) {
    const titleEl = firstDeal.querySelector(sel);
    if (titleEl && titleEl.textContent.trim()) {
      console.log(`  Title Selector: "${sel}"`);
      break;
    }
  }

  // Check Amazon links
  const hasAmazon = firstDeal.querySelector('a[href*="amazon.com"]');
  if (hasAmazon) {
    console.log(`  Amazon Link Selector: 'a[href*="amazon.com"]' ✓`);
  } else {
    console.log(`  Amazon Link Selector: ❌ Need alternative approach`);
  }

  // Find best price selector
  const priceSelectors = [
    '.price',
    '.deal-price',
    '[class*="price"]',
    '[class*="Price"]'
  ];

  for (const sel of priceSelectors) {
    const priceEl = firstDeal.querySelector(sel);
    if (priceEl && priceEl.textContent.trim()) {
      console.log(`  Price Selector: "${sel}"`);
      break;
    }
  }
}

console.log('\n=== END DIAGNOSTIC ===');
console.log('\nCopy the recommendations above and update your selectors in bookbub.js');
