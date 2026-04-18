import { describe, it, expect } from 'vitest'
import { migrate, CURRENT_SCHEMA_VERSION } from '../src/migrate.js'
import type { SceneJSON } from '../src/types.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scene(version: string, extra?: Partial<SceneJSON>): SceneJSON {
  return {
    version,
    layers: [],
    ...extra,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('migrate', () => {
  describe('identity — same version', () => {
    it('returns the same object reference when already at target', () => {
      const json = scene('1.0.0')
      const result = migrate(json, '1.0.0')
      // Already at target → returns as-is (reference equality)
      expect(result).toBe(json)
    })

    it('defaults target to CURRENT_SCHEMA_VERSION', () => {
      const json = scene(CURRENT_SCHEMA_VERSION)
      const result = migrate(json)
      expect(result.version).toBe(CURRENT_SCHEMA_VERSION)
    })
  })

  describe('invalid inputs', () => {
    it('throws on invalid input semver', () => {
      const json = scene('not-semver')
      expect(() => migrate(json, '1.0.0')).toThrow(/invalid semver/i)
    })

    it('throws on invalid target semver', () => {
      const json = scene('1.0.0')
      expect(() => migrate(json, 'bad')).toThrow(/invalid semver/i)
    })

    it('throws when attempting to downgrade', () => {
      // Simulate a future JSON being loaded by an older runtime
      const json = scene('2.0.0')
      expect(() => migrate(json, '1.0.0')).toThrow(/cannot downgrade/i)
    })
  })

  describe('chain traversal', () => {
    it('throws when no migration step covers the gap', () => {
      // 1.0.0 → 9.0.0 — no step registered
      const json = scene('1.0.0')
      expect(() => migrate(json, '9.0.0')).toThrow(/no migration step registered/i)
    })
  })

  describe('immutability', () => {
    it('does not mutate the input when steps are applied', () => {
      // We cannot add real steps without touching the private MIGRATIONS array,
      // but we can verify the no-op path preserves the input reference.
      const json = scene('1.0.0')
      const before = JSON.stringify(json)
      migrate(json)
      expect(JSON.stringify(json)).toBe(before)
    })
  })

  describe('CURRENT_SCHEMA_VERSION', () => {
    it('is a valid semver string', () => {
      expect(CURRENT_SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    })

    it('matches the version produced by Stage.toJSON()', async () => {
      const { Stage } = await import('../src/Stage.js')
      const { createMockCK, createMockHTMLCanvas } = await import(
        './__mocks__/canvaskit.js'
      )
      const stage = new Stage({ canvas: createMockHTMLCanvas(), canvasKit: createMockCK() })
      expect(stage.toJSON().version).toBe(CURRENT_SCHEMA_VERSION)
      stage.destroy()
    })
  })
})
