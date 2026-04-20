import type {
  Plugin,
  StageInterface,
  CanvasPointerEvent,
  BaseObject,
} from '@nexvas/core'
import { Text } from '@nexvas/core'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Options passed to `startEditing()` when editing a custom (non-Text) object.
 * The plugin manages the textarea overlay; the caller supplies text get/set
 * callbacks and optional style hints.
 */
export interface CustomEditOptions {
  /** Return the current text value to pre-fill the textarea. */
  getText: () => string
  /**
   * Called when the user commits the edit (Enter / blur).
   * The plugin wraps this call in `stage.batch()` so HistoryPlugin records
   * one undo entry.
   */
  onCommit: (newText: string) => void
  /** Called when the user cancels the edit (Escape). No undo entry is created. */
  onCancel?: () => void
  /** Optional style hints for sizing and font-matching the textarea overlay. */
  style?: {
    /** World-space left edge of the edit area. */
    x: number
    /** World-space top edge of the edit area. */
    y: number
    /** World-space width of the edit area. */
    width: number
    /** World-space height of the edit area. */
    height: number
    fontSize?: number
    fontFamily?: string
    /** CSS color string for the text, e.g. `'#1a1a1a'`. */
    color?: string
    align?: 'left' | 'center' | 'right'
  }
}

/**
 * Type augmentation for accessing TextEditPlugin through the stage.
 * @example
 * const edit = (stage as TextEditPluginAPI).textEdit
 */
export interface TextEditPluginAPI {
  textEdit: TextEditPlugin
}

// ---------------------------------------------------------------------------
// Internal session types
// ---------------------------------------------------------------------------

interface TextSession {
  kind: 'text'
  object: Text
  originalText: string
}

interface CustomSession {
  kind: 'custom'
  object: BaseObject
  options: CustomEditOptions
  originalText: string
}

type EditSession = TextSession | CustomSession

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

/**
 * TextEditPlugin — inline text editing via a DOM textarea overlay.
 *
 * Automatically triggers on double-click of built-in {@link Text} objects.
 * Custom object types can opt in by calling `startEditing(object, options)`.
 *
 * Events fired on stage:
 * - `textedit:start`  — editing began
 * - `textedit:commit` — user committed (Enter / click-outside)
 * - `textedit:cancel` — user cancelled (Escape)
 */
export class TextEditPlugin implements Plugin {
  readonly name = 'text-edit'
  readonly version = '0.1.0'

  private _stage: StageInterface | null = null
  private _session: EditSession | null = null
  private _textarea: HTMLTextAreaElement | null = null

  private _onDblClick: (e: CanvasPointerEvent) => void
  private _onTextareaKeyDown: (e: KeyboardEvent) => void
  private _onTextareaBlur: () => void

  constructor() {
    this._onDblClick = this._handleDblClick.bind(this)
    this._onTextareaKeyDown = this._handleTextareaKeyDown.bind(this)
    this._onTextareaBlur = this._handleTextareaBlur.bind(this)
  }

  // ---------------------------------------------------------------------------
  // Plugin lifecycle
  // ---------------------------------------------------------------------------

  install(stage: StageInterface): void {
    this._stage = stage
    ;(stage as unknown as TextEditPluginAPI).textEdit = this
    stage.on('dblclick', this._onDblClick)
  }

  uninstall(stage: StageInterface): void {
    stage.off('dblclick', this._onDblClick)
    this._cancelEdit()
    this._stage = null
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Returns true while an inline edit session is active. */
  isEditing(): boolean {
    return this._session !== null
  }

  /**
   * Begin inline editing.
   *
   * @overload Editing a built-in {@link Text} object — reads font/position
   * from the object itself.
   * @param textObject - The Text object to edit.
   */
  startEditing(textObject: Text): void
  /**
   * Begin inline editing for a custom object type.
   *
   * @overload Editing any {@link BaseObject} via caller-supplied callbacks.
   * @param object - The object to hide while editing.
   * @param options - Text callbacks and optional textarea style hints.
   */
  startEditing(object: BaseObject, options: CustomEditOptions): void
  startEditing(object: Text | BaseObject, options?: CustomEditOptions): void {
    const stage = this._stage
    if (!stage) return

    // Commit any active session before starting a new one.
    if (this._session !== null) this._commitEdit()

    if (options !== undefined) {
      this._startCustomEdit(object, options)
    } else {
      if (!(object instanceof Text)) return
      this._startTextEdit(object)
    }
  }

  /**
   * Commit the active edit session (same as pressing Enter / clicking outside).
   * No-op if no session is active.
   */
  stopEditing(): void {
    this._commitEdit()
  }

  /**
   * Cancel the active edit session (same as pressing Escape).
   * No-op if no session is active.
   */
  cancelEditing(): void {
    this._cancelEdit()
  }

  // ---------------------------------------------------------------------------
  // Edit session helpers
  // ---------------------------------------------------------------------------

  private _startTextEdit(obj: Text): void {
    const stage = this._stage!
    const session: TextSession = {
      kind: 'text',
      object: obj,
      originalText: obj.text,
    }
    this._session = session

    const screenPos = stage.viewport.worldToScreen(obj.x, obj.y)
    const scale = stage.viewport.scale
    this._createTextarea({
      screenX: screenPos.x,
      screenY: screenPos.y,
      width: obj.width * scale,
      height: obj.height * scale,
      fontSize: obj.fontSize * scale,
      fontFamily: obj.fontFamily,
      color: undefined,
      align: obj.align as 'left' | 'center' | 'right',
      initialValue: obj.text,
    })

    obj.visible = false
    stage.markDirty()
    stage.emit('textedit:start', { object: obj })
  }

  private _startCustomEdit(obj: BaseObject, options: CustomEditOptions): void {
    const stage = this._stage!
    const session: CustomSession = {
      kind: 'custom',
      object: obj,
      options,
      originalText: options.getText(),
    }
    this._session = session

    const s = options.style
    let screenX = 0
    let screenY = 0
    let width = 200
    let height = 40
    let fontSize = 16
    let fontFamily: string | undefined
    let color: string | undefined
    let align: 'left' | 'center' | 'right' | undefined

    if (s) {
      const screenPos = stage.viewport.worldToScreen(s.x, s.y)
      const scale = stage.viewport.scale
      screenX = screenPos.x
      screenY = screenPos.y
      width = s.width * scale
      height = s.height * scale
      fontSize = (s.fontSize ?? 16) * scale
      fontFamily = s.fontFamily
      color = s.color
      align = s.align
    }

    this._createTextarea({
      screenX,
      screenY,
      width,
      height,
      fontSize,
      fontFamily,
      color,
      align,
      initialValue: session.originalText,
    })

    obj.visible = false
    stage.markDirty()
    stage.emit('textedit:start', { object: obj })
  }

  private _createTextarea(opts: {
    screenX: number
    screenY: number
    width: number
    height: number
    fontSize: number
    fontFamily: string | undefined
    color: string | undefined
    align: 'left' | 'center' | 'right' | undefined
    initialValue: string
  }): void {
    if (typeof document === 'undefined') return

    const stage = this._stage!
    const canvasRect = stage.canvas.getBoundingClientRect()

    const ta = document.createElement('textarea')
    ta.value = opts.initialValue
    // Position fixed so scroll offsets don't affect placement.
    ta.style.cssText = [
      'position:fixed',
      `left:${canvasRect.left + opts.screenX}px`,
      `top:${canvasRect.top + opts.screenY}px`,
      `width:${Math.max(opts.width, 1)}px`,
      `height:${Math.max(opts.height, 1)}px`,
      `font-size:${opts.fontSize}px`,
      `font-family:${opts.fontFamily ?? 'Noto Sans, sans-serif'}`,
      `color:${opts.color ?? 'inherit'}`,
      `text-align:${opts.align ?? 'left'}`,
      'border:none',
      'outline:none',
      'background:transparent',
      'resize:none',
      'overflow:hidden',
      'padding:0',
      'margin:0',
      'box-sizing:border-box',
      'z-index:9999',
    ].join(';')

    ta.addEventListener('keydown', this._onTextareaKeyDown)
    ta.addEventListener('blur', this._onTextareaBlur)

    document.body.appendChild(ta)
    // Select all text so the user can immediately replace it.
    ta.focus()
    ta.select()

    this._textarea = ta
  }

  private _removeTextarea(): void {
    const ta = this._textarea
    if (!ta) return
    ta.removeEventListener('keydown', this._onTextareaKeyDown)
    ta.removeEventListener('blur', this._onTextareaBlur)
    ta.parentNode?.removeChild(ta)
    this._textarea = null
  }

  private _commitEdit(): void {
    const session = this._session
    const stage = this._stage
    if (!session || !stage) return

    const newText = this._textarea?.value ?? ''
    // Remove textarea first to prevent the blur handler from re-entering.
    this._removeTextarea()
    this._session = null

    const obj = session.object

    if (session.kind === 'text') {
      const oldText = session.originalText
      stage.batch(() => {
        session.object.text = newText
      })
      obj.visible = true
      stage.markDirty()
      stage.emit('textedit:commit', { object: obj, oldText, newText })
    } else {
      const oldText = session.originalText
      stage.batch(() => {
        session.options.onCommit(newText)
      })
      obj.visible = true
      stage.markDirty()
      stage.emit('textedit:commit', { object: obj, oldText, newText })
    }
  }

  private _cancelEdit(): void {
    const session = this._session
    const stage = this._stage
    if (!session) return

    this._removeTextarea()
    this._session = null

    const obj = session.object
    obj.visible = true
    stage?.markDirty()

    if (session.kind === 'custom') {
      session.options.onCancel?.()
    }

    stage?.emit('textedit:cancel', { object: obj })
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  private _handleDblClick(e: CanvasPointerEvent): void {
    const stage = this._stage
    if (!stage) return

    // Find the topmost object at the click position.
    const { world } = e
    let hit: BaseObject | null = null
    const layers = stage.layers
    for (let i = layers.length - 1; i >= 0; i--) {
      hit = layers[i]!.hitTest(world.x, world.y)
      if (hit !== null) break
    }

    if (hit instanceof Text) {
      this.startEditing(hit)
    }
  }

  private _handleTextareaKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      this._commitEdit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      this._cancelEdit()
    }
  }

  private _handleTextareaBlur(): void {
    // Only commit if the session is still active (Escape clears session first).
    if (this._session !== null) {
      this._commitEdit()
    }
  }
}
