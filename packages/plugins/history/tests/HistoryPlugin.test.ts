import { describe, it, expect, vi, beforeEach } from 'vitest'
import { HistoryPlugin, type HistoryCommand } from '../src/HistoryPlugin.js'
import type { StageInterface, Viewport, FontManager } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStage(): StageInterface {
  return {
    id: 'test-stage',
    canvasKit: {},
    layers: [],
    viewport: { x: 0, y: 0, scale: 1, width: 800, height: 600, getState: () => ({ x: 0, y: 0, scale: 1, width: 800, height: 600 }) } as unknown as Viewport,
    fonts: {} as unknown as FontManager,
    on: vi.fn(),
    off: vi.fn(),
    addRenderPass: vi.fn(),
    removeRenderPass: vi.fn(),
    getBoundingBox: vi.fn(),
    render: vi.fn(),
    markDirty: vi.fn(),
    emit: vi.fn(),
    resize: vi.fn(),
  } as unknown as StageInterface
}

function makeCommand(label?: string): HistoryCommand & { applyCalls: number; undoCalls: number } {
  const cmd = {
    label,
    applyCalls: 0,
    undoCalls: 0,
    apply() {
      this.applyCalls++
    },
    undo() {
      this.undoCalls++
    },
  }
  return cmd
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HistoryPlugin', () => {
  let plugin: HistoryPlugin
  let stage: StageInterface

  beforeEach(() => {
    plugin = new HistoryPlugin()
    stage = makeStage()
    plugin.install(stage)
  })

  it('installs and uninstalls without error', () => {
    expect(plugin.canUndo).toBe(false)
    expect(plugin.canRedo).toBe(false)
    plugin.uninstall(stage)
  })

  it('record applies command immediately', () => {
    const cmd = makeCommand()
    plugin.record(cmd)
    expect(cmd.applyCalls).toBe(1)
    expect(plugin.canUndo).toBe(true)
  })

  it('undo calls undo on last command', () => {
    const cmd = makeCommand()
    plugin.record(cmd)
    plugin.undo()
    expect(cmd.undoCalls).toBe(1)
    expect(plugin.canUndo).toBe(false)
    expect(plugin.canRedo).toBe(true)
  })

  it('redo re-applies the undone command', () => {
    const cmd = makeCommand()
    plugin.record(cmd)
    plugin.undo()
    plugin.redo()
    expect(cmd.applyCalls).toBe(2)
    expect(plugin.canRedo).toBe(false)
    expect(plugin.canUndo).toBe(true)
  })

  it('record after undo clears redo stack', () => {
    const cmd1 = makeCommand()
    const cmd2 = makeCommand()
    plugin.record(cmd1)
    plugin.undo()
    plugin.record(cmd2)
    expect(plugin.canRedo).toBe(false)
  })

  it('undo on empty stack does nothing', () => {
    expect(() => plugin.undo()).not.toThrow()
  })

  it('redo on empty stack does nothing', () => {
    expect(() => plugin.redo()).not.toThrow()
  })

  it('clear resets both stacks', () => {
    plugin.record(makeCommand())
    plugin.record(makeCommand())
    plugin.undo()
    plugin.clear()
    expect(plugin.canUndo).toBe(false)
    expect(plugin.canRedo).toBe(false)
  })

  it('respects maxSize', () => {
    const limited = new HistoryPlugin({ maxSize: 2 })
    limited.install(stage)

    limited.record(makeCommand('a'))
    limited.record(makeCommand('b'))
    limited.record(makeCommand('c')) // oldest 'a' is evicted

    // Can undo twice (b, c) but not a third time
    limited.undo()
    limited.undo()
    expect(limited.canUndo).toBe(false)

    limited.uninstall(stage)
  })

  it('Ctrl+Z triggers undo', () => {
    const cmd = makeCommand()
    plugin.record(cmd)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    expect(cmd.undoCalls).toBe(1)
  })

  it('Ctrl+Y triggers redo', () => {
    const cmd = makeCommand()
    plugin.record(cmd)
    plugin.undo()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true }))
    expect(cmd.applyCalls).toBe(2)
  })

  it('Ctrl+Shift+Z triggers redo', () => {
    const cmd = makeCommand()
    plugin.record(cmd)
    plugin.undo()

    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true }),
    )
    expect(cmd.applyCalls).toBe(2)
  })

  it('uninstall removes keyboard listener', () => {
    const cmd = makeCommand()
    plugin.record(cmd)
    plugin.uninstall(stage)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }))
    expect(cmd.undoCalls).toBe(0)
  })

  it('multiple undo/redo cycling works correctly', () => {
    const cmd1 = makeCommand()
    const cmd2 = makeCommand()
    plugin.record(cmd1)
    plugin.record(cmd2)

    plugin.undo()
    plugin.undo()
    expect(plugin.canUndo).toBe(false)

    plugin.redo()
    plugin.redo()
    expect(plugin.canRedo).toBe(false)

    expect(cmd1.applyCalls).toBe(2)
    expect(cmd2.applyCalls).toBe(2)
  })
})
