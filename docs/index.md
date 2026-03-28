---
layout: home

hero:
  name: NexVas
  text: GPU-accelerated 2D canvas for the web.
  tagline: Build design tools, whiteboards, and diagram editors on a foundation that actually performs. Backed by Skia — the same engine as Chrome.
  image:
    src: /hero.svg
    alt: NexVas
  actions:
    - theme: brand
      text: Get Started
      link: /guide/introduction
    - theme: alt
      text: View on GitHub
      link: https://github.com/your-org/nexvas

features:
  - icon: ⚡
    title: GPU-Accelerated Rendering
    details: Powered by CanvasKit (Skia compiled to WebAssembly + WebGL2). Not Canvas 2D. Real GPU rendering — 60 fps with 10,000 objects.

  - icon: 🧩
    title: Plugin-First Architecture
    details: Selection, drag, history, grid, guides, and PDF export are all plugins. Core stays small. You only pay for what you use.

  - icon: 🎯
    title: Precise Hit Testing
    details: Bounding-box fast-reject, then Skia path.contains() for pixel-perfect precision on curves and paths. 4 px touch tolerance built-in.

  - icon: 🔄
    title: Undo / Redo Built-In
    details: Full command-pattern history stack with configurable depth. Ctrl+Z / Ctrl+Y work out of the box with the HistoryPlugin.

  - icon: 🗂️
    title: Full Serialization
    details: toJSON() and loadJSON() for the complete scene graph. Versioned schema with migrate() for forward-compatible upgrades.

  - icon: 🔡
    title: Text That Actually Works
    details: FontManager bundles Noto Sans by default. Load custom fonts from any URL. CanvasKit renders text — no browser font inconsistencies.
---
