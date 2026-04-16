import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseXsd } from './parser/xsd-parser.js'
import { resolveHierarchy } from './parser/hierarchy-resolver.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../src/data')

const GITHUB_API = 'https://api.github.com/repos/NeTEx-CEN/NeTEx/contents'
const RAW_BASE = 'https://raw.githubusercontent.com/NeTEx-CEN/NeTEx/master'

const PART3_DIRS = [
  'xsd/netex_part_3/part3_fares',
  'xsd/netex_part_3/part3_frames',
  'xsd/netex_part_3/part3_salesTransactions',
]

// Framework dirs providing base types (TypeOfValue, entity, assignment, dayType, versionFrame)
const FRAMEWORK_DIRS = [
  'xsd/netex_framework/netex_responsibility',
  'xsd/netex_framework/netex_genericFramework',
  'xsd/netex_framework/netex_reusableComponents',
]

const EXAMPLES_DIR = 'examples/functions/fares'

const TOP_GROUP_NAMES = [
  'FareProduct', 'FarePrice', 'SalesOfferPackage', 'FareStructureElement',
  'UsageParameter', 'ValidableElement', 'DistributionChannel', 'FulfilmentMethod',
  'TypeOfTravelDocument', 'FareTable', 'FareSeries', 'GeographicStructureFactor',
  'QualityStructureFactor', 'TimeStructureFactor', 'DistanceMatrixElement',
  'FareZone', 'Tariff', 'PricingRule',
]

// Use GITHUB_TOKEN env var or fall back to gh CLI token to avoid rate limits
async function getAuthHeaders() {
  const token = process.env.GITHUB_TOKEN
  if (token) return { Authorization: `Bearer ${token}` }
  try {
    const { execSync } = await import('child_process')
    const ghToken = execSync('gh auth token', { encoding: 'utf8' }).trim()
    if (ghToken) return { Authorization: `Bearer ${ghToken}` }
  } catch { /* gh not available */ }
  return {}
}

const AUTH_HEADERS = await getAuthHeaders()

async function listFiles(dir) {
  const res = await fetch(`${GITHUB_API}/${dir}`, { headers: AUTH_HEADERS })
  if (!res.ok) throw new Error(`Failed to list ${dir}: ${res.status}`)
  return res.json()
}

async function fetchText(path) {
  const res = await fetch(`${RAW_BASE}/${path}`, { headers: AUTH_HEADERS })
  if (res.status === 404) return null  // file listed by API but missing in raw — skip silently
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return res.text()
}

async function listXsdFiles(dirs) {
  const files = []
  for (const dir of dirs) {
    const entries = await listFiles(dir)
    for (const entry of entries) {
      if (entry.name.endsWith('.xsd') && (entry.name.includes('_version') || entry.name.includes('_support'))) {
        files.push(entry.path)
      }
    }
  }
  return files
}

async function buildElementsJson() {
  console.log('Fetching Part 3 XSD file list...')
  const part3Paths = await listXsdFiles(PART3_DIRS)
  console.log(`Found ${part3Paths.length} Part 3 XSD files`)

  console.log('Fetching framework XSD file list...')
  const frameworkPaths = await listXsdFiles(FRAMEWORK_DIRS)
  console.log(`Found ${frameworkPaths.length} framework XSD files`)

  // Framework files: only import types and groups, NOT elements (to avoid polluting the element list)
  const merged = { elements: new Map(), types: new Map(), groups: new Map() }

  console.log('Parsing framework files (types/groups only)...')
  for (const path of frameworkPaths) {
    process.stdout.write(`  Parsing ${path.split('/').pop()}...`)
    const text = await fetchText(path)
    if (!text) { console.log(' skipped (404)'); continue }
    const { types, groups } = parseXsd(text)
    for (const [k, v] of types) merged.types.set(k, v)
    for (const [k, v] of groups) merged.groups.set(k, v)
    console.log(' done')
  }

  console.log('Parsing Part 3 files...')
  for (const path of part3Paths) {
    process.stdout.write(`  Parsing ${path.split('/').pop()}...`)
    const text = await fetchText(path)
    if (!text) { console.log(' skipped (404)'); continue }
    const { elements, types, groups } = parseXsd(text)
    for (const [k, v] of elements) merged.elements.set(k, v)
    for (const [k, v] of types) merged.types.set(k, v)
    for (const [k, v] of groups) merged.groups.set(k, v)
    console.log(' done')
  }

  console.log('Resolving hierarchy...')
  const netexElements = resolveHierarchy(merged, TOP_GROUP_NAMES)
  console.log(`Resolved ${netexElements.length} concrete element types`)

  mkdirSync(DATA_DIR, { recursive: true })
  writeFileSync(join(DATA_DIR, 'netex-elements.json'), JSON.stringify(netexElements, null, 2))
  console.log('Wrote src/data/netex-elements.json')
}

async function buildExamplesJson() {
  console.log('Fetching example file list...')
  const entries = await listFiles(EXAMPLES_DIR)
  const xmlFiles = entries.filter((e) => e.name.endsWith('.xml'))
  console.log(`Found ${xmlFiles.length} example XML files`)

  const examples = []
  for (const file of xmlFiles) {
    process.stdout.write(`  Fetching ${file.name}...`)
    const xml = await fetchText(file.path)
    const label = file.name
      .replace(/\.xml$/, '')
      .replace(/^Netex_\d+\.\d+_/, '')
      .replace(/_/g, ' ')
    examples.push({ filename: file.name, label, xml })
    console.log(' done')
  }

  writeFileSync(join(DATA_DIR, 'netex-examples.json'), JSON.stringify(examples, null, 2))
  console.log('Wrote src/data/netex-examples.json')
}

async function main() {
  console.log('=== NeTEx fetch-and-parse ===\n')
  await buildElementsJson()
  console.log()
  await buildExamplesJson()
  console.log('\nDone.')
}

main().catch((err) => { console.error(err); process.exit(1) })
