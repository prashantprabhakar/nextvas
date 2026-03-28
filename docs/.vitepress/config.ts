import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'NexVas',
  description: 'The high-performance 2D canvas framework for the web — backed by Skia.',
  lang: 'en-US',

  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' }],
    ['meta', { name: 'theme-color', content: '#5B6CF6' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'NexVas',

    nav: [
      { text: 'Guide', link: '/guide/introduction', activeMatch: '/guide/' },
      { text: 'API', link: '/api/stage', activeMatch: '/api/' },
      { text: 'Plugins', link: '/plugins/overview', activeMatch: '/plugins/' },
      {
        text: 'v0.1.0',
        items: [
          { text: 'Changelog', link: 'https://github.com/your-org/nexvas/releases' },
          { text: 'Contributing', link: 'https://github.com/your-org/nexvas/blob/main/CONTRIBUTING.md' },
        ],
      },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' },
          ],
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Stage & Layers', link: '/guide/stage-and-layers' },
            { text: 'Objects', link: '/guide/objects' },
            { text: 'Transforms', link: '/guide/transforms' },
            { text: 'Viewport (Pan & Zoom)', link: '/guide/viewport' },
            { text: 'Events', link: '/guide/events' },
            { text: 'Groups', link: '/guide/groups' },
          ],
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Serialization', link: '/guide/serialization' },
            { text: 'Schema Migration', link: '/guide/migration' },
            { text: 'Fonts', link: '/guide/fonts' },
            { text: 'Plugin System', link: '/guide/plugins' },
            { text: 'Performance', link: '/guide/performance' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'Core',
          items: [
            { text: 'Stage', link: '/api/stage' },
            { text: 'Layer', link: '/api/layer' },
            { text: 'Viewport', link: '/api/viewport' },
            { text: 'FontManager', link: '/api/font-manager' },
            { text: 'loadCanvasKit', link: '/api/load-canvas-kit' },
            { text: 'migrate', link: '/api/migrate' },
          ],
        },
        {
          text: 'Objects',
          items: [
            { text: 'BaseObject', link: '/api/base-object' },
            { text: 'Rect', link: '/api/rect' },
            { text: 'Circle', link: '/api/circle' },
            { text: 'Line', link: '/api/line' },
            { text: 'Path', link: '/api/path' },
            { text: 'Text', link: '/api/text' },
            { text: 'CanvasImage', link: '/api/canvas-image' },
            { text: 'Group', link: '/api/group' },
          ],
        },
        {
          text: 'Math',
          items: [
            { text: 'Vec2', link: '/api/vec2' },
            { text: 'Matrix3x3', link: '/api/matrix3x3' },
            { text: 'BoundingBox', link: '/api/bounding-box' },
          ],
        },
        {
          text: 'Types',
          items: [
            { text: 'Fill & Stroke', link: '/api/fill-stroke' },
            { text: 'Events', link: '/api/events' },
            { text: 'Plugin', link: '/api/plugin' },
            { text: 'SceneJSON', link: '/api/scene-json' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: 'Plugins',
          items: [
            { text: 'Overview', link: '/plugins/overview' },
            { text: 'SelectionPlugin', link: '/plugins/selection' },
            { text: 'DragPlugin', link: '/plugins/drag' },
            { text: 'HistoryPlugin', link: '/plugins/history' },
            { text: 'GridPlugin', link: '/plugins/grid' },
            { text: 'GuidesPlugin', link: '/plugins/guides' },
            { text: 'ExportPlugin', link: '/plugins/export' },
          ],
        },
        {
          text: 'Building Plugins',
          items: [
            { text: 'Writing a Plugin', link: '/plugins/writing-plugins' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-org/nexvas' },
    ],

    search: {
      provider: 'local',
    },

    editLink: {
      pattern: 'https://github.com/your-org/nexvas/edit/main/docs/:path',
      text: 'Edit this page on GitHub',
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 NexVas contributors',
    },

    outline: {
      level: [2, 3],
    },
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
})
