import { writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseXsd } from './parser/xsd-parser.js'
import { resolveHierarchy } from './parser/hierarchy-resolver.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../src/data')
const VERSIONS_DIR = join(DATA_DIR, 'versions')

const GITHUB_API = 'https://api.github.com/repos/NeTEx-CEN/NeTEx'
const GITHUB_CONTENTS_API = `${GITHUB_API}/contents`
const BRANCHES_API = `${GITHUB_API}/branches`

const PART1_DIRS = ['xsd/netex_part_1']
const PART2_DIRS = ['xsd/netex_part_2']

const PART1_GROUP_NAMES = [
  'StopPlace', 'Quay', 'AccessSpace', 'Parking', 'PathLink', 'NavigationPath',
  'Line', 'Route', 'Network', 'ScheduledStopPoint', 'ServiceLink', 'StopArea',
  'Connection', 'FlexibleLine', 'SiteFrame', 'NetworkFrame',
]

const PART2_GROUP_NAMES = [
  'ServiceJourney', 'VehicleJourney', 'TimetabledPassingTime',
  'Block', 'VehicleService', 'Interchange', 'DeadRun', 'TrainNumber',
]

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
    'xsd/netex_framework/netex_frames',
    'xsd/netex_framework/netex_utility',
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

/**
 * Fetch list of branches from GitHub that match version pattern
 * @returns {Promise<string[]>} Array of branch names like ['v1.3', 'v2.0', 'v2.1-wip', 'v3.0-wip']
 */
async function fetchBranches() {
  const res = await fetch(BRANCHES_API, { headers: AUTH_HEADERS })
  if (!res.ok) throw new Error(`Failed to fetch branches: ${res.status}`)
  const branches = await res.json()
  return branches
    .map(b => b.name)
    .filter(name => /^v\d+\.\d+(-wip)?$/.test(name))  // Only vX.Y or vX.Y-wip
    .sort((a, b) => {
      // Sort by version number
      const parseVer = (v) => {
        const match = v.match(/^v(\d+)\.(\d+)/)
        if (!match) return [0, 0]
        return [parseInt(match[1]), parseInt(match[2])]
      }
      const [aMaj, aMin] = parseVer(a)
      const [bMaj, bMin] = parseVer(b)
      if (aMaj !== bMaj) return aMaj - bMaj
      return aMin - bMin
    })
}

async function listFiles(dir, version = 'master') {
  const res = await fetch(`${GITHUB_CONTENTS_API}/${dir}?ref=${version}`, { headers: AUTH_HEADERS })
  if (!res.ok) throw new Error(`Failed to list ${dir}: ${res.status}`)
  return res.json()
}

async function fetchText(path, version = 'master') {
  const rawBase = `https://raw.githubusercontent.com/NeTEx-CEN/NeTEx/${version}`
  const res = await fetch(`${rawBase}/${path}`, { headers: AUTH_HEADERS })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  return res.text()
}

async function listXsdFiles(dirs, version = 'master') {
  const files = []
  for (const dir of dirs) {
    const entries = await listFiles(dir, version)
    for (const entry of entries) {
      if (entry.name.endsWith('.xsd') && (entry.name.includes('_version') || entry.name.includes('_support'))) {
        files.push(entry.path)
      }
    }
  }
  return files
}

/**
 * Recursively list all XSD _version/_support files under a top-level directory.
 * @param {string} topDir
 * @param {string} version
 * @returns {Promise<string[]>}
 */
async function listXsdFilesDeep(topDir, version = 'master') {
  const files = []
  const entries = await listFiles(topDir, version)
  for (const entry of entries) {
    if (entry.type === 'dir') {
      const nested = await listXsdFilesDeep(entry.path, version)
      files.push(...nested)
    } else if (
      entry.name.endsWith('.xsd') &&
      (entry.name.includes('_version') || entry.name.includes('_support'))
    ) {
      files.push(entry.path)
    }
  }
  return files
}

async function buildElementsJson(version = 'master') {
  const merged = { elements: new Map(), types: new Map(), groups: new Map() }
  const partMap = new Map()
  const allEnums = new Map()

  console.log(`\n📦 Building elements for ${version}...`)

  // Framework: types/groups only, no elements
  console.log('  Fetching framework XSD file list...')
  const frameworkPaths = await listXsdFiles(FRAMEWORK_DIRS, version)
  console.log(`  Found ${frameworkPaths.length} framework XSD files`)
  for (const path of frameworkPaths) {
    process.stdout.write(`    Parsing ${path.split('/').pop()}...`)
    const text = await fetchText(path, version)
    if (!text) { console.log(' skipped (404)'); continue }
    const { types, groups } = parseXsd(text)
    for (const [k, v] of types) merged.types.set(k, v)
    for (const [k, v] of groups) merged.groups.set(k, v)
    console.log(' done')
  }

  // Part 1
  console.log('  Fetching Part 1 XSD file list...')
  const part1Paths = await listXsdFilesDeep(PART1_DIRS[0], version)
  console.log(`  Found ${part1Paths.length} Part 1 XSD files`)
  for (const path of part1Paths) {
    process.stdout.write(`    Parsing ${path.split('/').pop()}...`)
    const text = await fetchText(path, version)
    if (!text) { console.log(' skipped (404)'); continue }
    const { elements, types, groups } = parseXsd(text)
    for (const [k, v] of elements) { merged.elements.set(k, v); partMap.set(k, 1) }
    for (const [k, v] of types) merged.types.set(k, v)
    for (const [k, v] of groups) merged.groups.set(k, v)
    console.log(' done')
  }

  // Part 2
  console.log('  Fetching Part 2 XSD file list...')
  const part2Paths = await listXsdFilesDeep(PART2_DIRS[0], version)
  console.log(`  Found ${part2Paths.length} Part 2 XSD files`)
  for (const path of part2Paths) {
    process.stdout.write(`    Parsing ${path.split('/').pop()}...`)
    const text = await fetchText(path, version)
    if (!text) { console.log(' skipped (404)'); continue }
    const { elements, types, groups, enums } = parseXsd(text)
    for (const [k, v] of elements) { merged.elements.set(k, v); partMap.set(k, 2) }
    for (const [k, v] of types) merged.types.set(k, v)
    for (const [k, v] of groups) merged.groups.set(k, v)
    for (const [k, v] of enums) allEnums.set(k, v)
    console.log(' done')
  }

  // Part 3 (processed last so Part 3 elements win if names overlap)
  console.log('  Fetching Part 3 XSD file list...')
  const part3Paths = await listXsdFiles(PART3_DIRS, version)
  console.log(`  Found ${part3Paths.length} Part 3 XSD files`)
  for (const path of part3Paths) {
    process.stdout.write(`    Parsing ${path.split('/').pop()}...`)
    const text = await fetchText(path, version)
    if (!text) { console.log(' skipped (404)'); continue }
    const { elements, types, groups, enums } = parseXsd(text)
    for (const [k, v] of elements) { merged.elements.set(k, v); partMap.set(k, 3) }
    for (const [k, v] of types) merged.types.set(k, v)
    for (const [k, v] of groups) merged.groups.set(k, v)
    for (const [k, v] of enums) allEnums.set(k, v)
    console.log(' done')
  }

  const allTopGroups = [...PART1_GROUP_NAMES, ...PART2_GROUP_NAMES, ...TOP_GROUP_NAMES]
  console.log('  Resolving hierarchy...')
  const netexElements = resolveHierarchy(merged, allTopGroups, partMap)
  console.log(`  ✓ Resolved ${netexElements.length} element types`)

  // Convert enums Map to sorted object
  const enumsObject = Object.fromEntries(
    Array.from(allEnums.entries()).sort(([a], [b]) => a.localeCompare(b))
  )

  return { elements: netexElements, enums: enumsObject }
}

async function buildExamplesJson(version) {
  console.log(`\n📄 Building examples for ${version}...`)
  try {
    const entries = await listFiles(EXAMPLES_DIR, version)
    const xmlFiles = entries.filter((e) => e.name.endsWith('.xml'))
    console.log(`  Found ${xmlFiles.length} example XML files`)

    const examples = []
    for (const file of xmlFiles) {
      process.stdout.write(`    Fetching ${file.name}...`)
      const xml = await fetchText(file.path, version)
      const label = file.name
        .replace(/\.xml$/, '')
        .replace(/^Netex_\d+\.\d+_/, '')
        .replace(/_/g, ' ')
      examples.push({ filename: file.name, label, xml })
      console.log(' done')
    }

    return examples
  } catch (err) {
    console.log(`  ⚠️  No examples found for ${version} (${err.message})`)
    return []
  }
}

async function main() {
  console.log('=== NeTEx Multi-Version Fetch & Parse ===\n')
  
  // Create directories
  mkdirSync(DATA_DIR, { recursive: true })
  mkdirSync(VERSIONS_DIR, { recursive: true })
  
  // Fetch available branches
  console.log('🔍 Fetching available NeTEx versions from GitHub...')
  const branches = await fetchBranches()
  console.log(`Found ${branches.length} versions: ${branches.join(', ')}\n`)
  
  const versionsData = []
  
  // Process each version
  for (const version of branches) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Processing ${version}`)
    console.log('='.repeat(60))
    
    try {
      // Build elements and enums
      const { elements, enums } = await buildElementsJson(version)
      
      // Build examples
      const examples = await buildExamplesJson(version)
      
      // Save version-specific files
      const versionFile = `netex-${version}.json`
      const versionPath = join(VERSIONS_DIR, versionFile)
      
      const versionData = {
        version,
        elements,
        enums,
        examples,
        fetchedAt: new Date().toISOString(),
      }
      
      writeFileSync(versionPath, JSON.stringify(versionData, null, 2))
      console.log(`  ✓ Wrote ${versionFile}`)
      
      versionsData.push({
        version,
        file: versionFile,
        elementCount: elements.length,
        enumCount: Object.keys(enums).length,
        exampleCount: examples.length,
        fetchedAt: versionData.fetchedAt,
      })
      
    } catch (err) {
      console.error(`  ❌ Error processing ${version}:`, err.message)
      versionsData.push({
        version,
        error: err.message,
        fetchedAt: new Date().toISOString(),
      })
    }
  }
  
  // Write versions manifest
  const manifest = {
    versions: versionsData,
    generatedAt: new Date().toISOString(),
  }
  writeFileSync(join(DATA_DIR, 'versions-manifest.json'), JSON.stringify(manifest, null, 2))
  console.log(`\n✓ Wrote versions-manifest.json with ${versionsData.length} versions`)
  
  // Also write latest stable version (v2.0) to default location for backward compatibility
  const stableVersion = versionsData.find(v => v.version === 'v2.0')
  if (stableVersion && !stableVersion.error) {
    const { readFileSync } = await import('fs')
    const stableData = JSON.parse(readFileSync(join(VERSIONS_DIR, stableVersion.file), 'utf8'))
    writeFileSync(join(DATA_DIR, 'netex-elements.json'), JSON.stringify(stableData.elements, null, 2))
    writeFileSync(join(DATA_DIR, 'netex-enums.json'), JSON.stringify(stableData.enums, null, 2))
    writeFileSync(join(DATA_DIR, 'netex-examples.json'), JSON.stringify(stableData.examples, null, 2))
    console.log('✓ Wrote default files (v2.0) for backward compatibility')
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('✅ All versions fetched successfully!')
  console.log('='.repeat(60))
  console.log('\nSummary:')
  versionsData.forEach(v => {
    if (v.error) {
      console.log(`  ❌ ${v.version}: ${v.error}`)
    } else {
      console.log(`  ✓ ${v.version}: ${v.elementCount} elements, ${v.enumCount} enums, ${v.exampleCount} examples`)
    }
  })
}

main().catch((err) => { console.error(err); process.exit(1) })
