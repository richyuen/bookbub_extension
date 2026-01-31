// Auto-Fix Generator for BookBub Extension
// Run this in the console on a BookBub deals page to get exact code fixes

console.log('%c=== BOOKBUB AUTO-FIX GENERATOR ===', 'font-size: 16px; font-weight: bold; color: #4CAF50');
console.log('This will analyze the page and generate the exact code you need to fix the extension.\n');

const results = {
  dealSelector: null,
  titleSelector: null,
  priceSelector: null,
  amazonLinkType: null,
  sampleBook: null
};

// 1. Find deal container selector
console.log('Step 1: Finding deal container selector...');
const containerSelectors = [
  '.deal-tile',
  '.daily-deal-tile',
  '[data-deal-id]',
  '.book-deal',
  '[data-book-id]',
  '[data-testid*="book"]',
  '.deal-card',
  '.book-card',
  'article[class*="book"]',
  'article[class*="deal"]'
];

for (const selector of containerSelectors) {
  try {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      results.dealSelector = selector;
      console.log(`  ✓ Found ${elements.length} containers using: ${selector}`);
      break;
    }
  } catch (e) {
    // Skip invalid selectors
  }
}

// Fallback: find most common class (likely book cards)
if (!results.dealSelector) {
  console.log('  No standard selector found. Analyzing page structure...');
  const allDivs = document.querySelectorAll('div[class], article[class]');
  const classCount = {};

  allDivs.forEach(el => {
    const classes = el.className.split(' ').filter(c => c.length > 0);
    classes.forEach(cls => {
      // Only count if element has an Amazon link or looks like a book card
      if (el.querySelector('a[href*="amazon"]') || cls.toLowerCase().includes('book') || cls.toLowerCase().includes('deal')) {
        classCount[cls] = (classCount[cls] || 0) + 1;
      }
    });
  });

  const candidates = Object.entries(classCount)
    .filter(([cls, count]) => count >= 5 && count <= 100)
    .sort((a, b) => b[1] - a[1]);

  if (candidates.length > 0) {
    results.dealSelector = `.${candidates[0][0]}`;
    console.log(`  ⚠️  Using fallback: ${results.dealSelector} (${candidates[0][1]} instances)`);
  }
}

if (!results.dealSelector) {
  console.error('  ❌ Could not find any deal containers!');
  console.log('  The page structure might be too different. Manual inspection required.');
} else {
  // 2. Analyze first deal element
  console.log('\nStep 2: Analyzing deal structure...');
  const firstDeal = document.querySelector(results.dealSelector);

  if (firstDeal) {
    // Find title selector
    const titleSelectors = [
      '.book-title',
      '.deal-title',
      'h1', 'h2', 'h3', 'h4',
      '[data-title]',
      '[class*="title"]',
      'a[href*="books"]'
    ];

    for (const sel of titleSelectors) {
      const titleEl = firstDeal.querySelector(sel);
      if (titleEl && titleEl.textContent.trim()) {
        results.titleSelector = sel;
        results.sampleBook = { title: titleEl.textContent.trim() };
        console.log(`  ✓ Title selector: ${sel}`);
        console.log(`    Sample: "${titleEl.textContent.trim().substring(0, 50)}"`);
        break;
      }
    }

    if (!results.titleSelector) {
      console.log('  ⚠️  No title selector found - will use link text as fallback');
    }

    // Find Amazon link type
    const directAmazon = firstDeal.querySelector('a[href*="amazon.com"]');
    const bookbubLink = firstDeal.querySelector('a[href*="/books/"]');

    if (directAmazon) {
      results.amazonLinkType = 'direct';
      console.log(`  ✓ Amazon link: Direct link found`);
      if (results.sampleBook) {
        results.sampleBook.amazonUrl = directAmazon.href.substring(0, 60) + '...';
      }
    } else if (bookbubLink) {
      results.amazonLinkType = 'redirect';
      console.log(`  ⚠️  Amazon link: BookBub redirect detected`);
      console.log(`    You may need to extract Amazon URL from data attributes`);

      // Check for data attributes
      const dataAttrs = Array.from(bookbubLink.attributes)
        .filter(attr => attr.name.startsWith('data-') && attr.value.includes('amazon'))
        .map(attr => attr.name);

      if (dataAttrs.length > 0) {
        console.log(`    Found data attributes: ${dataAttrs.join(', ')}`);
      }
    } else {
      results.amazonLinkType = 'none';
      console.log(`  ❌ No Amazon link found in first deal!`);
    }

    // Find price selector
    const priceSelectors = [
      '.price',
      '.deal-price',
      '[class*="price"]',
      '[class*="Price"]',
      '[data-price]'
    ];

    for (const sel of priceSelectors) {
      const priceEl = firstDeal.querySelector(sel);
      if (priceEl) {
        results.priceSelector = sel;
        const priceText = priceEl.textContent.trim();
        console.log(`  ✓ Price selector: ${sel}`);
        console.log(`    Sample: "${priceText}"`);
        if (results.sampleBook) {
          results.sampleBook.price = priceText;
        }
        break;
      }
    }

    if (!results.priceSelector) {
      console.log('  ⚠️  No price element found - might be free with no price shown');
    }
  }
}

// 3. Search for specific book (Water)
console.log('\nStep 3: Looking for "Water" book...');
const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
let waterFound = false;
let node;

while (node = walker.nextNode()) {
  if (node.textContent.trim() === 'Water') {
    waterFound = true;
    let current = node.parentElement;
    let depth = 0;

    console.log('  ✓ Found "Water" - checking if it matches our selector...');

    while (current && depth < 15) {
      if (results.dealSelector) {
        const matches = current.matches ? current.matches(results.dealSelector) : false;
        if (matches) {
          console.log(`  ✓ "Water" is inside an element matching ${results.dealSelector}`);
          break;
        }
      }
      current = current.parentElement;
      depth++;
    }

    if (depth >= 15) {
      console.log(`  ⚠️  "Water" found but not inside ${results.dealSelector}`);
      console.log(`  This might indicate the wrong selector is chosen`);
    }
    break;
  }
}

if (!waterFound) {
  console.log('  ℹ️  "Water" book not found on this page');
}

// 4. Generate fix code
console.log('\n%c=== GENERATED FIX ===', 'font-size: 14px; font-weight: bold; color: #2196F3');

if (results.dealSelector) {
  console.log('\n1. UPDATE DEAL SELECTOR (line ~117 in content/bookbub.js):');
  console.log('%c\nconst dealSelectors = [\n' +
              `  '${results.dealSelector}',  // ← Add this first\n` +
              `  '.deal-tile',\n` +
              `  '.daily-deal-tile',\n` +
              `  '[data-deal-id]',\n` +
              `  '.book-deal'\n` +
              `];`, 'background: #f5f5f5; padding: 10px; font-family: monospace;');

  if (results.titleSelector) {
    console.log('\n2. TITLE SELECTOR CONFIRMED:');
    console.log(`   Current selector '${results.titleSelector}' is in the list and working.`);
  } else {
    console.log('\n2. TITLE SELECTOR WARNING:');
    console.log('   No standard title selector found. Will use link text as fallback.');
  }

  if (results.amazonLinkType === 'direct') {
    console.log('\n3. AMAZON LINK:');
    console.log('   ✓ Direct Amazon links found. Current code should work.');
  } else if (results.amazonLinkType === 'redirect') {
    console.log('\n3. AMAZON LINK FIX NEEDED (line ~160 in content/bookbub.js):');
    console.log('%c\n// Try redirect links with data attributes\n' +
                'const amazonLink = dealElement.querySelector(\'a[href*="amazon.com"]\') ||\n' +
                '                   dealElement.querySelector(\'a[data-url*="amazon"]\') ||\n' +
                '                   dealElement.querySelector(\'a[data-amazon-url]\');\n' +
                '\nif (!amazonLink) {\n' +
                '  const bookbubLink = dealElement.querySelector(\'a[href*="/books/"]\');\n' +
                '  if (bookbubLink) {\n' +
                '    // Extract from data attribute or follow redirect\n' +
                '    const dataUrl = bookbubLink.getAttribute(\'data-url\') ||\n' +
                '                    bookbubLink.getAttribute(\'data-amazon-url\');\n' +
                '    if (dataUrl) amazonUrl = dataUrl;\n' +
                '  }\n' +
                '}', 'background: #f5f5f5; padding: 10px; font-family: monospace;');
  } else {
    console.log('\n3. AMAZON LINK ERROR:');
    console.log('   ❌ No Amazon links found! Check page structure manually.');
  }

  if (results.priceSelector) {
    console.log('\n4. PRICE FILTER:');
    console.log(`   ✓ Price selector '${results.priceSelector}' found.`);
    if (results.sampleBook && results.sampleBook.price) {
      const price = results.sampleBook.price;
      const isFree = price.includes('$0.00') || price.includes('Free') || price.includes('0.00');
      if (isFree) {
        console.log('   ✓ Price format matches expected free book format.');
      } else {
        console.log(`   ⚠️  Sample price "${price}" might not match filter!`);
        console.log('   Consider updating price check (line ~204) to handle this format.');
      }
    }
  } else {
    console.log('\n4. PRICE FILTER UPDATE (line ~204 in content/bookbub.js):');
    console.log('   Consider allowing empty price (free books might not show price):');
    console.log('%c\n// Allow empty price text\n' +
                'if (priceText && \n' +
                '    !priceText.includes(\'$0.00\') && \n' +
                '    !priceText.includes(\'Free\') && \n' +
                '    !priceText.includes(\'0.00\')) {\n' +
                '  console.log(`Skipping non-free book: ${title} (${priceText})`);\n' +
                '  return null;\n' +
                '}', 'background: #f5f5f5; padding: 10px; font-family: monospace;');
  }

  console.log('\n\n%c=== QUICK FIX SUMMARY ===', 'font-size: 14px; font-weight: bold; color: #4CAF50');
  console.log(`\nDeal Container: ${results.dealSelector}`);
  console.log(`Title Selector: ${results.titleSelector || 'Use fallback'}`);
  console.log(`Amazon Links: ${results.amazonLinkType}`);
  console.log(`Price Selector: ${results.priceSelector || 'Empty/no price'}`);

  if (results.sampleBook) {
    console.log('\n%cSample Book:', 'font-weight: bold');
    console.log(results.sampleBook);
  }

  console.log('\n%c📋 COPY THE CODE ABOVE AND UPDATE YOUR FILES', 'font-size: 12px; color: #FF9800; font-weight: bold');

} else {
  console.log('\n❌ Could not generate fix - page structure too different from expected.');
  console.log('Manual inspection required. Check the Elements tab in DevTools.');
}

console.log('\n%c=== END ===', 'font-size: 14px; font-weight: bold');
