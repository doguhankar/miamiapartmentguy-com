import fs from 'fs'

let content = fs.readFileSync('app/map/page.tsx', 'utf-8')

// Color replacements: Blue to Flamingo Pink/Aqua/Gold
const replacements = [
  // Main button colors: blue to flamingo pink
  ['#3b82f6', '#FF4D8D'],
  ['#2563eb', '#E53A73'],
  ['bg-blue-600', 'bg-[#FF4D8D]'],
  ['bg-blue-700', 'bg-[#E53A73]'],
  ['focus:ring-blue-500', 'focus:ring-[#FF4D8D]'],
  ['text-blue-600', 'text-[#FF4D8D]'],
  
  // Background colors: gray to navy
  ['bg-gray-50', 'bg-[#0F1B30]'],
  ['bg-gray-100', 'bg-[#1B2A45]'],
  ['bg-gray-900', 'bg-[#0B1220]'],
  ['bg-white', 'bg-[#0F1B30]'],
  
  // Text colors: gray to light
  ['text-gray-900', 'text-[#F6F8F9]'],
  ['text-gray-600', 'text-[#B8C4D4]'],
  ['text-gray-400', 'text-[#7E8CA0]'],
  
  // Border colors: gray to aqua/navy
  ['border-gray-200', 'border-[#19C6C0]'],
  ['border-gray-300', 'border-[#19C6C0]'],
  ['border-gray-400', 'border-[#19C6C0]'],
]

replacements.forEach(([old, newVal]) => {
  content = content.replaceAll(old, newVal)
})

// Special styling for major UI elements
content = content.replace(
  "style.color = '#3b82f6'",
  "style.color = '#FF4D8D'"
)
content = content.replace(
  "style.backgroundColor = '#3b82f6'",
  "style.backgroundColor = '#FF4D8D'"
)
content = content.replace(
  "style.backgroundColor = '#2563eb'",
  "style.backgroundColor = '#E53A73'"
)

// Add navy background wrapper if not exists
if (!content.includes('background: \'#0B1220\'') && !content.includes("bg-[#0B1220]")) {
  content = content.replace(
    'return (',
    'return (<div style={{ background: \'#0B1220\', color: \'#F6F8F9\', minHeight: \'100vh\' }}>'
  )
  content = content.replace(
    /;[\s]*\}\);[\s]*$\);/,
    ');</div>;'
  )
}

fs.writeFileSync('app/map/page.tsx', content)
console.log('[v0] Integrated MAG design colors into working map')
