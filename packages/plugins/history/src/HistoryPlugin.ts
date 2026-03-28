import type { Plugin, StageInterface } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A reversible operation recorded in the history stack. */
export interface HistoryCommand {
  /** Applies (or re-applies) the operation. */
  apply(): void
  /** Reverses the operation. */
  undo(): void
  /** Optional human-readable label for debugging. */
  label?: string
}

export interface HistoryPluginOptions {
  /** Maximum number of undo steps stored. Default: 100. */
  maxSize?: number
}

/**
 * HistoryPlugin — undo/redo via the Command pattern.
 *
 * Records `HistoryCommand` objects and replays or reverses them on
 * Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z).
 */
export class HistoryPlugin implements Plugin {
  readonly name = 'history'
  readonly version = '0.1.0'

  private _stage: StageInterface | null = null
  private _maxSize: number
  private _undoStack: HistoryCommand[] = []
  private _redoStack: HistoryCommand[] = []

  private _onKeyDown: (e: KeyboardEvent) => void

  constructor(options: HistoryPluginOptions = {}) {
    this._maxSize = options.maxSize ?? 100
    this._onKeyDown = this._handleKeyDown.bind(this)
  }

  // ---------------------------------------------------------------------------
  // Plugin lifecycle
  // ---------------------------------------------------------------------------

  install(stage: StageInterface): void {
    this._stage = stage
    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', this._onKeyDown)
    }
  }

  uninstall(_stage: StageInterface): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('keydown', this._onKeyDown)
    }
    this._stage = null
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Record a command and immediately apply it.
   * Clears the redo stack (branching history).
   */
  record(command: HistoryCommand): void {
    command.apply()
    this._undoStack.push(command)
    if (this._undoStack.length > this._maxSize) {
      this._undoStack.shift()
    }
    this._redoStack = []
    this._stage?.markDirty()
  }

  /**
   * Undo the last recorded command.
   */
  undo(): void {
    const command = this._undoStack.pop()
    if (!command) return
    command.undo()
    this._redoStack.push(command)
    this._stage?.markDirty()
  }

  /**
   * Redo the last undone command.
   */
  redo(): void {
    const command = this._redoStack.pop()
    if (!command) return
    command.apply()
    this._undoStack.push(command)
    this._stage?.markDirty()
  }

  /** Returns true if there are commands that can be undone. */
  canUndo(): boolean {
    return this._undoStack.length > 0
  }

  /** Returns true if there are commands that can be redone. */
  canRedo(): boolean {
    return this._redoStack.length > 0
  }

  /** Clears all undo and redo history. */
  clear(): void {
    this._undoStack = []
    this._redoStack = []
  }

  // ---------------------------------------------------------------------------
  // Keyboard handler
  // ---------------------------------------------------------------------------

  private _handleKeyDown(e: KeyboardEvent): void {
    const ctrl = e.ctrlKey || e.metaKey
    if (!ctrl) return

    if (e.key === 'z' || e.key === 'Z') {
      if (e.shiftKey) {
        this.redo()
      } else {
        this.undo()
      }
      e.preventDefault()
    } else if (e.key === 'y' || e.key === 'Y') {
      this.redo()
      e.preventDefault()
    }
  }
}
