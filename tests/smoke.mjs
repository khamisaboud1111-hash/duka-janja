/**
 * Basic smoke tests — verifies key files exist, export expected things,
 * and that the project structure is sound. Run with: node tests/smoke.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
let passed = 0
let failed = 0

function assert(condition, label) {
  if (condition) { passed++; console.log(`  ✅ ${label}`) }
  else { failed++; console.error(`  ❌ ${label}`) }
}

function assertFile(path, label) {
  assert(existsSync(resolve(root, path)), `${label} — ${path} exists`)
}

function assertContent(path, search, label) {
  const full = resolve(root, path)
  if (!existsSync(full)) { failed++; console.error(`  ❌ ${label} — file not found`); return }
  const content = readFileSync(full, 'utf-8')
  assert(content.includes(search), `${label} — contains "${search}"`)
}

console.log('\n📋 Duka Janja Smoke Tests\n')

// Critical files exist
console.log('  ── Core files ──')
assertFile('package.json', 'package.json')
assertFile('next.config.js', 'Next.js config')
assertFile('tailwind.config.ts', 'Tailwind config')
assertFile('tsconfig.json', 'TypeScript config')

console.log('  ── Source files ──')
assertFile('src/app/layout.tsx', 'Root layout')
assertFile('src/app/globals.css', 'Global CSS')
assertFile('src/app/(marketplace)/page.tsx', 'Marketplace homepage')
assertFile('src/app/(marketplace)/layout.tsx', 'Marketplace layout')
assertFile('src/app/(auth)/login/page.tsx', 'Login page')
assertFile('src/app/(auth)/register/page.tsx', 'Register page')

console.log('  ── Components ──')
const components = [
  'src/components/layout/Navbar.tsx',
  'src/components/layout/Sidebar.tsx',
  'src/components/layout/MobileBottomNav.tsx',
  'src/components/ui/Button.tsx',
  'src/components/ui/Card.tsx',
  'src/components/ui/Input.tsx',
  'src/components/ui/Modal.tsx',
  'src/components/home/HeroSection.tsx',
  'src/components/home/TrustBadges.tsx',
  'src/components/product/ProductCard.tsx',
  'src/components/shared/FadeInView.tsx',
]
components.forEach(f => assertFile(f, `Component: ${f.split('/').pop()}`))

console.log('  ── Page Exports ──')
assertContent('src/app/(marketplace)/page.tsx', 'export default async function', 'Homepage exports async function')
assertContent('src/components/layout/Sidebar.tsx', 'export default function Sidebar', 'Sidebar exports correctly')
assertContent('src/components/ui/Button.tsx', 'export const Button', 'Button exports correctly')

console.log('  ── CSS Classes ──')
const css = readFileSync(resolve(root, 'src/app/globals.css'), 'utf-8')
assert(css.includes('.page-container'), 'CSS has .page-container')
assert(css.includes('.card'), 'CSS has .card')
assert(css.includes('.input'), 'CSS has .input')
assert(css.includes('.btn-primary'), 'CSS has .btn-primary')
assert(css.includes('.glass-card'), 'CSS has .glass-card')
assert(css.includes('@layer base'), 'CSS has @layer base')
assert(css.includes('@layer components'), 'CSS has @layer components')

console.log(`\n  ── ${passed} passed, ${failed} failed ──\n`)
process.exit(failed > 0 ? 1 : 0)
