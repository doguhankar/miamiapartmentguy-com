/**
 * Test parseAvailabilityDate function
 */

function parseAvailabilityDate(dateStr) {
  if (!dateStr) {
    // Default to today's date (represents "now leasing")
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  const lowerStr = dateStr.toLowerCase().trim();

  // Handle "Contact for availability" or similar
  if (lowerStr.includes('contact for') || lowerStr === '') {
    return null;
  }

  // Handle "Available now" or "Available immediately"
  if (lowerStr.includes('available now') || lowerStr.includes('immediately') || lowerStr.includes('asap')) {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  // Try to match MM/DD/YYYY format
  let dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dateMatch) {
    const [_, month, day, year] = dateMatch;
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
      return `${year}-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    }
  }

  // Try to match Month DD, YYYY format
  dateMatch = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i);
  if (dateMatch) {
    const monthMap = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
    const month = monthMap[dateMatch[1].toLowerCase().slice(0, 3)];
    const day = parseInt(dateMatch[2]);
    const year = dateMatch[3];
    
    if (month && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Default to today if we couldn't parse
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Test cases
console.log('[v0] Testing parseAvailabilityDate function:');
console.log('');

const testCases = [
  { input: 'Available Now', expected: '2026-06-27' },
  { input: 'Available now', expected: '2026-06-27' },
  { input: 'Now Leasing', expected: '2026-06-27' },
  { input: 'available immediately', expected: '2026-06-27' },
  { input: null, expected: '2026-06-27' },
  { input: '', expected: '2026-06-27' },
  { input: '07/15/2026', expected: '2026-07-15' },
  { input: 'Available 08/20/2026', expected: '2026-08-20' },
  { input: 'July 15, 2026', expected: '2026-07-15' },
  { input: 'Contact for availability', expected: null },
];

let passed = 0;
let failed = 0;

testCases.forEach(({ input, expected }) => {
  const result = parseAvailabilityDate(input);
  const status = result === expected ? '✓ PASS' : '✗ FAIL';
  
  if (result === expected) {
    passed++;
  } else {
    failed++;
  }
  
  console.log(`${status}: "${input}" → "${result}" (expected: "${expected}")`);
});

console.log('');
console.log(`[v0] Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('[v0] All tests passed!');
  process.exit(0);
} else {
  console.log('[v0] Some tests failed!');
  process.exit(1);
}
