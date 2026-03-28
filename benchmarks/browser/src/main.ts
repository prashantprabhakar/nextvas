/**
 * NexVas-only benchmark orchestrator.
 *
 * Tracks rendering performance across releases.
 * Paste results into benchmarks/RESULTS.md to build a history.
 */
import { SCENARIOS } from './harness.js'
import type { Scenario, BenchmarkResult, ScenarioId } from './harness.js'
import { runNexVas } from './nexvas-runner.js'

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const results = new Map<ScenarioId, BenchmarkResult>()
let running = false

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------

const scenarioList   = document.getElementById('scenario-list')   as HTMLElement
const runBtn         = document.getElementById('run-btn')          as HTMLButtonElement
const copyBtn        = document.getElementById('copy-btn')         as HTMLButtonElement
const benchContainer = document.getElementById('bench-container')  as HTMLElement
const statusEl       = document.getElementById('status')           as HTMLElement
const progressBar    = document.getElementById('progress-bar')     as HTMLElement
const resultsBody    = document.getElementById('results-body')     as HTMLElement
const resultsSection = document.getElementById('results-section')  as HTMLElement

// ---------------------------------------------------------------------------
// Build scenario checkboxes
// ---------------------------------------------------------------------------

for (const scenario of SCENARIOS) {
  const label = document.createElement('label')
  label.className = 'scenario-label'

  const cb = document.createElement('input')
  cb.type = 'checkbox'
  cb.value = scenario.id
  cb.checked = scenario.defaultEnabled
  cb.className = 'scenario-cb'

  label.appendChild(cb)
  label.appendChild(document.createTextNode(scenario.label))
  scenarioList.appendChild(label)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setStatus(msg: string): void { statusEl.textContent = msg }
function setProgress(pct: number): void { progressBar.style.width = `${Math.round(pct * 100)}%` }

function getSelectedScenarios(): Scenario[] {
  const cbs = scenarioList.querySelectorAll<HTMLInputElement>('.scenario-cb:checked')
  const ids = new Set(Array.from(cbs).map((c) => c.value as ScenarioId))
  return SCENARIOS.filter((s) => ids.has(s.id))
}

// ---------------------------------------------------------------------------
// Results table
// ---------------------------------------------------------------------------

function fps(n: number): string { return n.toFixed(1) }

function renderResultsTable(): void {
  resultsBody.innerHTML = ''
  resultsSection.style.display = 'block'

  for (const scenario of SCENARIOS) {
    const r = results.get(scenario.id)
    if (!r) continue

    const tr = document.createElement('tr')
    tr.innerHTML = `
      <td class="cell-scenario">${scenario.label}</td>
      <td class="cell-num">${fps(r.avgFPS)}</td>
      <td class="cell-num">${fps(r.medianFPS)}</td>
      <td class="cell-num">${fps(r.p5FPS)}</td>
      <td class="cell-num">${fps(r.minFPS)}</td>
      <td class="cell-num cell-frames">${r.totalFrames}</td>
    `.trim()
    resultsBody.appendChild(tr)
  }
}

// ---------------------------------------------------------------------------
// Markdown export
// ---------------------------------------------------------------------------

function buildMarkdown(): string {
  const date   = new Date().toISOString().split('T')[0]!
  const ua     = navigator.userAgent
  const lines: string[] = [
    `## ${date}`,
    '',
    `**Browser:** \`${ua}\``,
    `**Canvas:** 1280×720 · object size: 30×30px · 5 s + 60-frame warm-up`,
    '',
    '| Scenario | Avg FPS | Median FPS | p5 FPS | Min FPS | Frames |',
    '|----------|---------|------------|--------|---------|--------|',
  ]

  for (const scenario of SCENARIOS) {
    const r = results.get(scenario.id)
    if (!r) continue
    lines.push(
      `| ${scenario.label} | ${fps(r.avgFPS)} | ${fps(r.medianFPS)} | ${fps(r.p5FPS)} | ${fps(r.minFPS)} | ${r.totalFrames} |`,
    )
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Run button
// ---------------------------------------------------------------------------

runBtn.addEventListener('click', async () => {
  if (running) return
  const selected = getSelectedScenarios()
  if (selected.length === 0) { setStatus('Select at least one scenario.'); return }

  running = true
  runBtn.disabled = true
  runBtn.textContent = 'Running…'
  benchContainer.style.display = 'block'

  for (const scenario of selected) {
    setStatus(`Warming up: ${scenario.label}…`)
    setProgress(0)

    try {
      const result = await runNexVas(benchContainer, scenario, (pct) => {
        setStatus(`Running: ${scenario.label} (${Math.round(pct * 100)}%)`)
        setProgress(pct)
      })
      results.set(scenario.id, result)
      renderResultsTable()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setStatus(`Error: ${scenario.label} — ${msg}`)
      console.error(err)
    }

    setProgress(1)
    await new Promise((r) => setTimeout(r, 300))
  }

  benchContainer.style.display = 'none'
  setStatus(`Done — ${selected.length} scenarios completed.`)
  setProgress(0)
  copyBtn.style.display = 'inline-flex'
  running = false
  runBtn.disabled = false
  runBtn.textContent = '▶ Run Benchmark'
})

// ---------------------------------------------------------------------------
// Copy button
// ---------------------------------------------------------------------------

copyBtn.addEventListener('click', async () => {
  const md = buildMarkdown()
  try {
    await navigator.clipboard.writeText(md)
    copyBtn.textContent = 'Copied!'
    setTimeout(() => { copyBtn.textContent = 'Copy as Markdown' }, 2000)
  } catch {
    const blob = new Blob([md], { type: 'text/plain' })
    window.open(URL.createObjectURL(blob), '_blank')
  }
})
