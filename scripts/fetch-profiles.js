import { writeFileSync, readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { parseXsdRestrictions } from './parser/profile-xsd-parser.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../src/data')
const PROFILES_DIR = join(DATA_DIR, 'profiles')
const MANUAL_DIR = join(__dirname, 'profiles')

const FR_GITHUB_API = 'https://api.github.com/repos/etalab/transport-profil-netex-fr/contents'
const FR_RAW_BASE = 'https://raw.githubusercontent.com/etalab/transport-profil-netex-fr/master'

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

async function listDir(apiUrl, headers) {
  const res = await fetch(apiUrl, { headers })
  if (!res.ok) throw new Error(`HTTP ${res.status} listing ${apiUrl}`)
  return res.json()
}

async function fetchText(rawUrl, headers) {
  const res = await fetch(rawUrl, { headers })
  if (!res.ok) return null
  return res.text()
}

/** Recursively collect .xsd file paths from a GitHub API directory listing */
async function collectXsdPaths(apiUrl, headers, depth = 0) {
  if (depth > 3) return []
  let entries
  try {
    entries = await listDir(apiUrl, headers)
  } catch {
    return []
  }
  const paths = []
  for (const entry of entries) {
    if (entry.type === 'file' && entry.name.endsWith('.xsd')) {
      paths.push(entry.path)
    } else if (entry.type === 'dir') {
      const sub = await collectXsdPaths(entry.url, headers, depth + 1)
      paths.push(...sub)
    }
  }
  return paths
}

async function buildFrenchProfile(headers) {
  console.log('Building French profile...')

  // Load base element list to know all valid element names
  const allElements = JSON.parse(readFileSync(join(DATA_DIR, 'netex-elements.json'), 'utf8'))
  const elementAttrMap = {}
  for (const el of allElements) {
    elementAttrMap[el.name] = new Set([
      ...el.attributes.map((a) => a.name),
      ...el.inheritedAttributes.map((a) => a.name),
    ])
  }

  // Fetch XSD file list from French profile repo
  let xsdPaths = []
  try {
    xsdPaths = await collectXsdPaths(FR_GITHUB_API, headers)
    console.log(`  Found ${xsdPaths.length} XSD files`)
  } catch (err) {
    console.warn(`  Could not list French profile repo: ${err.message}`)
    console.warn('  French profile will be empty — inspect repo and adjust parser')
  }

  // Parse all XSD files and merge restriction maps
  const allRestrictions = {}
  for (const xsdPath of xsdPaths) {
    process.stdout.write(`  Parsing ${xsdPath.split('/').pop()}...`)
    const text = await fetchText(`${FR_RAW_BASE}/${xsdPath}`, headers)
    if (!text) { console.log(' skipped'); continue }
    const restrictions = parseXsdRestrictions(text)
    Object.assign(allRestrictions, restrictions)
    console.log(` ${Object.keys(restrictions).length} types`)
  }

  console.log(`  Parsed ${Object.keys(allRestrictions).length} restricted types total`)

  // Build profile data: map each known NeTEx element to a status + attribute map
  const profile = {}
  const hasData = Object.keys(allRestrictions).length > 0

  for (const el of allElements) {
    const restriction = allRestrictions[el.name]
    if (!restriction) {
      // Not found in French profile XSDs
      if (hasData) {
        profile[el.name] = { status: 'not-in-profile', attributes: {} }
      }
      continue
    }

    const attrMap = {}
    for (const attr of [...el.attributes, ...el.inheritedAttributes]) {
      const status = restriction[attr.name]
      if (status) {
        attrMap[attr.name] = status
      }
      // Attributes not mentioned in restriction get no entry (unknown)
    }

    // Element is in the profile; treat as optional at element level
    profile[el.name] = { status: 'optional', attributes: attrMap }
  }

  return profile
}

async function buildNordicProfile() {
  console.log('Building Nordic profile (from manual source)...')
  const manual = JSON.parse(readFileSync(join(MANUAL_DIR, 'nordic-manual.json'), 'utf8'))
  console.log(`  ${Object.keys(manual).length} elements`)
  return manual
}

async function main() {
  console.log('=== fetch-profiles ===\n')
  mkdirSync(PROFILES_DIR, { recursive: true })

  const headers = await getAuthHeaders()

  const frProfile = await buildFrenchProfile(headers)
  writeFileSync(join(PROFILES_DIR, 'fr.json'), JSON.stringify(frProfile, null, 2))
  console.log(`Wrote src/data/profiles/fr.json (${Object.keys(frProfile).length} elements)\n`)

  const nordicProfile = await buildNordicProfile()
  writeFileSync(join(PROFILES_DIR, 'nordic.json'), JSON.stringify(nordicProfile, null, 2))
  console.log(`Wrote src/data/profiles/nordic.json (${Object.keys(nordicProfile).length} elements)\n`)

  console.log('Done.')
}

main().catch((err) => { console.error(err); process.exit(1) })
