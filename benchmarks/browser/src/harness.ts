/**
 * Shared types, scenario definitions, and measurement utilities
 * used by both the NexVas and Konva benchmark runners.
 */

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

export type ScenarioId =
  | 'static-1k'
  | 'static-5k'
  | 'static-10k'
  | 'static-25k'
  | 'animated-1k'
  | 'animated-5k'
  | 'animated-10k'

export interface Scenario {
  id: ScenarioId
  label: string
  count: number
  animated: boolean
  defaultEnabled: boolean
}

export const SCENARIOS: Scenario[] = [
  { id: 'static-1k',    label: 'Static — 1,000 objects',    count: 1_000,  animated: false, defaultEnabled: true  },
  { id: 'static-5k',    label: 'Static — 5,000 objects',    count: 5_000,  animated: false, defaultEnabled: true  },
  { id: 'static-10k',   label: 'Static — 10,000 objects',   count: 10_000, animated: false, defaultEnabled: true  },
  { id: 'static-25k',   label: 'Static — 25,000 objects',   count: 25_000, animated: false, defaultEnabled: false },
  { id: 'animated-1k',  label: 'Animated — 1,000 objects',  count: 1_000,  animated: true,  defaultEnabled: true  },
  { id: 'animated-5k',  label: 'Animated — 5,000 objects',  count: 5_000,  animated: true,  defaultEnabled: true  },
  { id: 'animated-10k', label: 'Animated — 10,000 objects', count: 10_000, animated: true,  defaultEnabled: false },
]

// ---------------------------------------------------------------------------
// Benchmark constants
// ---------------------------------------------------------------------------

/** How long to run each scenario (ms). */
export const BENCH_DURATION_MS = 5_000

/** Number of frames to render before recording starts (GPU/JIT warm-up). */
export const WARMUP_FRAMES = 60

export const CANVAS_WIDTH  = 1280
export const CANVAS_HEIGHT = 720
export const RECT_SIZE     = 30

// ---------------------------------------------------------------------------
// Object state shared between runners
// ---------------------------------------------------------------------------

export interface ObjectState {
  x: number
  y: number
  dx: number
  dy: number
  r: number
  g: number
  b: number
}

/** Generate N objects with random positions, velocities, and colors. */
export function makeObjects(count: number): ObjectState[] {
  const objects: ObjectState[] = []
  for (let i = 0; i < count; i++) {
    objects.push({
      x:  Math.random() * (CANVAS_WIDTH  - RECT_SIZE),
      y:  Math.random() * (CANVAS_HEIGHT - RECT_SIZE),
      dx: (Math.random() - 0.5) * 4,
      dy: (Math.random() - 0.5) * 4,
      r:  Math.random(),
      g:  Math.random(),
      b:  Math.random(),
    })
  }
  return objects
}

/** Advance all objects by one frame, bouncing off canvas edges. */
export function stepAnimation(objects: ObjectState[]): void {
  for (const obj of objects) {
    obj.x += obj.dx
    obj.y += obj.dy
    if (obj.x < 0 || obj.x + RECT_SIZE > CANVAS_WIDTH) {
      obj.dx = -obj.dx
      obj.x = Math.max(0, Math.min(obj.x, CANVAS_WIDTH - RECT_SIZE))
    }
    if (obj.y < 0 || obj.y + RECT_SIZE > CANVAS_HEIGHT) {
      obj.dy = -obj.dy
      obj.y = Math.max(0, Math.min(obj.y, CANVAS_HEIGHT - RECT_SIZE))
    }
  }
}

// ---------------------------------------------------------------------------
// Benchmark result
// ---------------------------------------------------------------------------

export interface BenchmarkResult {
  scenario: ScenarioId
  framework: 'nexvas' | 'konva'
  objectCount: number
  totalFrames: number
  durationMs: number
  avgFPS: number
  medianFPS: number
  p5FPS: number
  minFPS: number
  maxFPS: number
}

/**
 * Compute FPS statistics from an array of inter-frame durations (ms).
 * Returned FPS values are rounded to one decimal place.
 */
export function computeStats(frameDurationsMs: number[]): Pick<
  BenchmarkResult,
  'avgFPS' | 'medianFPS' | 'p5FPS' | 'minFPS' | 'maxFPS'
> {
  if (frameDurationsMs.length === 0) {
    return { avgFPS: 0, medianFPS: 0, p5FPS: 0, minFPS: 0, maxFPS: 0 }
  }

  const fpsList = frameDurationsMs
    .filter((d) => d > 0)
    .map((d) => 1000 / d)
    .sort((a, b) => a - b)

  const len = fpsList.length
  const sum = fpsList.reduce((acc, v) => acc + v, 0)
  const round1 = (n: number) => Math.round(n * 10) / 10

  return {
    avgFPS:    round1(sum / len),
    medianFPS: round1(fpsList[Math.floor(len * 0.5)]!),
    p5FPS:     round1(fpsList[Math.floor(len * 0.05)]!),
    minFPS:    round1(fpsList[0]!),
    maxFPS:    round1(fpsList[len - 1]!),
  }
}

/** Format a BenchmarkResult as a Markdown table row. */
export function resultToMarkdownRow(r: BenchmarkResult): string {
  const fw = r.framework === 'nexvas' ? '**NexVas**' : 'Konva'
  return `| ${r.label ?? r.scenario} | ${fw} | ${r.avgFPS} | ${r.medianFPS} | ${r.p5FPS} | ${r.minFPS} | ${r.totalFrames} |`
}
