// Test the formatAvailabilityDate function logic

function formatAvailabilityDate(availableDate) {
  if (!availableDate) {
    return "Contact for availability"
  }

  const lowerDate = availableDate.toLowerCase()
  
  // If it says "available now" or is today's date, show "Available Now"
  if (lowerDate === "available now" || lowerDate === "available immediately") {
    return "Available Now"
  }

  // Check if it's today's date
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  console.log(`[v0] Today's date: ${todayStr}`)
  console.log(`[v0] Input date: ${availableDate}`)
  console.log(`[v0] Are they equal? ${availableDate === todayStr}`)
  
  if (availableDate === todayStr) {
    return "Available Now"
  }

  // If it's a future date in YYYY-MM-DD format, format as "Available Month DD"
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/
  const match = availableDate.match(dateRegex)
  console.log(`[v0] Regex match: ${match ? 'YES' : 'NO'}`)
  
  if (match) {
    const [_, year, month, day] = match
    console.log(`[v0] Parsed: year=${year}, month=${month}, day=${day}`)
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const monthName = date.toLocaleDateString('en-US', { month: 'long' })
    console.log(`[v0] Formatted month: ${monthName}`)
    return `Available ${monthName} ${parseInt(day)}`
  }

  // Fallback: return as-is if format is unexpected
  return availableDate
}

// Test cases
console.log("\n=== Testing formatAvailabilityDate ===\n")

const testCases = [
  { input: null, expected: "Contact for availability", desc: "null value" },
  { input: "2026-06-27", expected: "Available Now", desc: "today's date" },
  { input: "2026-07-15", expected: "Available July 15", desc: "future date" },
  { input: "2026-12-25", expected: "Available December 25", desc: "future date (Dec)" },
  { input: "Available Now", expected: "Available Now", desc: "literal 'Available Now'" },
  { input: "Available immediately", expected: "Available Now", desc: "literal 'Available immediately'" },
  { input: "2026-06-01", expected: "Available June 1", desc: "future date (June 1)" },
]

testCases.forEach(test => {
  console.log(`\nTest: ${test.desc}`)
  console.log(`Input: ${JSON.stringify(test.input)}`)
  const result = formatAvailabilityDate(test.input)
  console.log(`Expected: ${test.expected}`)
  console.log(`Got: ${result}`)
  console.log(`${result === test.expected ? "✅ PASS" : "❌ FAIL"}`)
})
