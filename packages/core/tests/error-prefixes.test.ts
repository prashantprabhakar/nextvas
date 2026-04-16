import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// ---------------------------------------------------------------------------
// NV-023 — Verify all error/warning prefixes follow [nexvas:<module>] format
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const CORE_SRC = resolve(__dirname, '../src')

/** Recursively collect all .ts files under a directory. */
function collectTsFiles(dir: string): string[] {
  const results: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      results.push(...collectTsFiles(full))
    } else if (entry.endsWith('.ts') && !entry.endsWith('.d.ts')) {
      results.push(full)
    }
  }
  return results
}

describe('NV-023: error prefix consistency', () => {
  const files = collectTsFiles(CORE_SRC)

  it('all [nexvas] prefixes use the [nexvas:<module>] format', () => {
    const violations: string[] = []

    // Matches [nexvas] NOT followed by a colon — i.e. bare [nexvas] prefixes
    // Allowed: [nexvas:stage], [nexvas:image], etc.
    // Forbidden: [nexvas] Stage.resize(), [nexvas] FontManager:, etc.
    const bare = /\[nexvas\](?!:)/g

    for (const file of files) {
      const content = readFileSync(file, 'utf-8')
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        if (bare.test(lines[i]!)) {
          const rel = file.replace(CORE_SRC, 'src')
          violations.push(`${rel}:${i + 1}: ${lines[i]!.trim()}`)
        }
        bare.lastIndex = 0 // reset regex state
      }
    }

    expect(violations, `Bare [nexvas] prefixes found:\n${violations.join('\n')}`).toHaveLength(0)
  })
})
