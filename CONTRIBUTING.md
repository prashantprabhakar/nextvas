# Contributing to NexVas

Thank you for your interest in contributing. This is a production-quality open-source project — the bar is high, but so is the reward. Please read this guide before opening a PR.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Adding a New Object Type](#adding-a-new-object-type)
- [Adding a New Plugin](#adding-a-new-plugin)
- [Commit Convention](#commit-convention)
- [Release Process](#release-process)

---

## Code of Conduct

Be professional. Critique ideas, not people. Maintainers reserve the right to remove comments or close issues that violate this principle.

---

## Getting Started

**Prerequisites**

- Node.js 20+
- pnpm 9+ (`npm install -g pnpm`)
- A browser with WebGL2 support (for running the examples)

**Setup**

```bash
git clone https://github.com/your-org/nexvas.git
cd nexvas
pnpm install
pnpm --filter @nexvas/core run build   # core must be built first
```

**Verify everything works**

```bash
pnpm lint         # ESLint + Prettier check
pnpm -r typecheck # TypeScript strict typecheck across all packages
pnpm test:run     # All unit tests
```

---

## Project Structure

```
packages/core        — Scene graph, event system, viewport, hit testing
packages/renderer    — CanvasKit loader and surface management
packages/plugins/*   — Official plugins (selection, drag, history, grid, export, guides)
examples/*           — Working browser demos
benchmarks/          — Performance regression suite
docs/                — VitePress documentation site
```

Each package is independently versioned and published. Packages reference each other via the pnpm workspace protocol (`workspace:*`).

---

## Development Workflow

All commands use **pnpm**. Never use npm or yarn.

| Task | Command |
|---|---|
| Install all deps | `pnpm install` |
| Build core | `pnpm --filter @nexvas/core run build` |
| Build everything | `pnpm -r run build` |
| Test one package | `pnpm -F @nexvas/core test` |
| Test all | `pnpm test:run` |
| Lint | `pnpm lint` |
| Format | `pnpm format` |
| Typecheck all | `pnpm -r run typecheck` |

> **Core must be built before typechecking plugins or renderer**, because plugins import types from the compiled `dist/` rather than source.

---

## Coding Standards

These are enforced by CI and will block merges if violated.

- **TypeScript strict mode** everywhere — no `any` in public APIs, no `@ts-ignore` without an explanatory comment.
- **JSDoc on every public class and method** — describe what it does, not how.
- **No dead code** — no commented-out blocks, no unused exports.
- **Explicit over clever** — readable > terse.
- **No DOM manipulation in `packages/core` or `packages/renderer`** — the Stage owns the canvas element.
- **No imports from `packages/renderer` inside `packages/core`** — core is renderer-agnostic.
- **No `console.log`** — use the internal `logger` utility (warn/error only in production builds).
- **No new dependencies in `packages/core`** without maintainer discussion — it must stay lean.

Run `pnpm lint` and `pnpm -r run typecheck` before pushing.

---

## Testing Requirements

Every PR must maintain or improve test coverage. Specifically:

| What you changed | What you must add |
|---|---|
| New built-in object type | Render test, hit test, serialization round-trip test, transform test |
| New plugin | Install/uninstall test, behavior test |
| New public API | Unit test for the happy path and meaningful error cases |
| Bug fix | Regression test that fails before your fix and passes after |

Tests live in `packages/<pkg>/tests/`. Run them with:

```bash
pnpm -F @nexvas/core test
pnpm test:run          # all packages
```

We use **Vitest**. Tests must pass in a Node.js environment (no browser required for unit tests). CanvasKit is mocked via `tests/__mocks__/canvaskit.ts`.

---

## Submitting a Pull Request

1. **Fork** the repository and create a branch from `main`.
   ```bash
   git checkout -b feat/my-feature
   ```
2. Make your changes, following the coding and testing standards above.
3. Add a **changeset** describing what changed:
   ```bash
   pnpm changeset
   ```
   Select the affected packages, the change type (patch/minor/major), and write a one-sentence summary.
4. Push your branch and open a PR against `main`.
5. Fill in the PR template — describe *what* changed and *why*.
6. CI will run lint, typecheck, tests, and benchmarks. All must pass.

**Small, focused PRs are strongly preferred** over large ones. A PR that does one thing is easier to review and faster to merge.

---

## Adding a New Object Type

Use the scaffolding command:

```bash
# Inside the repo, with pnpm available:
# (Claude Code CLI shorthand — also works as a plain prompt)
/new-object
```

This creates the full boilerplate: the object class, `toJSON`/`fromJSON`, registration in `objectFromJSON.ts`, and the four required test stubs (render, hit test, serialization, transform).

Manually, you need to:
1. Create `packages/core/src/objects/MyObject.ts` extending `BaseObject`.
2. Implement `render(canvas, ctx)`, `hitTest(wx, wy)`, `toJSON()`, and `static fromJSON(json)`.
3. Register the type in `packages/core/src/objects/objectFromJSON.ts`.
4. Export from `packages/core/src/objects/index.ts` and `packages/core/src/index.ts`.
5. Add tests covering all four required scenarios.

---

## Adding a New Plugin

Use the scaffolding command:

```bash
/new-plugin
```

Or manually:
1. Create `packages/plugins/my-plugin/` with its own `package.json`, `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`.
2. Implement the `Plugin` interface from `@nexvas/core`:
   ```ts
   import type { Plugin, StageInterface } from '@nexvas/core'

   export const MyPlugin: Plugin = {
     name: 'my-plugin',
     version: '0.1.0',
     install(stage: StageInterface) { /* ... */ },
     uninstall(stage: StageInterface) { /* ... */ },
   }
   ```
3. Add the package to `pnpm-workspace.yaml` and run `pnpm install`.
4. Write install/uninstall and behavior tests.

Plugins must be fully reversible: `uninstall()` must undo everything `install()` did.

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
```

Types: `feat`, `fix`, `perf`, `refactor`, `test`, `docs`, `chore`, `ci`.

Examples:
```
feat(core): add Line object type
fix(selection): handle multi-select with locked objects
perf(core): skip culling pass when viewport covers full scene
docs: add contributing guide
```

---

## Release Process

Releases are automated via [Changesets](https://github.com/changesets/changesets).

1. Every PR that touches a published package must include a changeset (`pnpm changeset`).
2. When PRs merge to `main`, the release CI job opens a "Version Packages" PR that bumps versions and updates changelogs.
3. Merging that PR publishes the packages to npm automatically.

Maintainers handle releases. Contributors only need to add the changeset.

---

## Questions?

Open a [GitHub Discussion](https://github.com/your-org/nexvas/discussions) for design questions or ideas. Use [Issues](https://github.com/your-org/nexvas/issues) for bugs and concrete feature requests.
