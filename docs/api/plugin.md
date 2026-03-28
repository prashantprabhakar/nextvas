# Plugin

The interface all plugins implement.

```ts
interface Plugin {
  /** Unique kebab-case identifier, e.g. 'selection', 'drag'. */
  readonly name: string
  /** SemVer string. */
  readonly version: string
  /** Called once when installed on a stage. */
  install(stage: StageInterface, options?: Record<string, unknown>): void
  /** Called when removed. Must fully reverse install(). */
  uninstall(stage: StageInterface): void
}
```

See [Writing a Plugin](/plugins/writing-plugins) for a full guide.
