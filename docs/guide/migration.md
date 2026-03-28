# Schema Migration

When the scene JSON schema changes between framework versions, the `migrate()` utility upgrades stored files to the current format automatically.

## Basic usage

```ts
import { migrate } from '@nexvas/core'

const stored = JSON.parse(localStorage.getItem('scene') ?? '{}')

// Upgrade to the current schema version
const current = migrate(stored)

stage.loadJSON(current)
```

If the stored JSON is already at the current version, `migrate` returns it unchanged (same object reference — no clone overhead).

## Explicit target version

```ts
import { migrate, CURRENT_SCHEMA_VERSION } from '@nexvas/core'

// Upgrade to a specific version
const v110 = migrate(stored, '1.1.0')

// Upgrade to latest
const latest = migrate(stored, CURRENT_SCHEMA_VERSION)
```

## Error cases

`migrate` throws descriptively in these situations:

```ts
// Attempting to downgrade (not supported)
migrate(json_v2, '1.0.0')
// Error: cannot downgrade schema from "2.0.0" to "1.0.0"

// No migration path exists
migrate(json_v1, '9.0.0')
// Error: no migration step registered for schema version "1.0.0"
```

## Writing a migration step

When you release a new schema version, add a step to `MIGRATIONS` in `packages/core/src/migrate.ts`:

```ts
const MIGRATIONS: MigrationStep[] = [
  {
    from: '1.0.0',
    to: '1.1.0',
    up(json) {
      // Example: add a new `tags` field to every object
      for (const layer of json.layers) {
        for (const obj of layer.objects) {
          if (obj.tags === undefined) {
            obj.tags = []
          }
        }
      }
      return { ...json, version: '1.1.0' }
    },
  },
]
```

Steps are applied in sequence. A file at `1.0.0` being migrated to `1.2.0` will run the `1.0.0→1.1.0` step and then the `1.1.0→1.2.0` step.

::: warning
`migrate()` deep-clones the input before the first step. Never mutate the original — always return a new object from `up()`.
:::

## Recommended pattern

Always migrate before loading, even in development:

```ts
async function loadScene(raw: unknown) {
  // Runtime validation (e.g. zod, or a simple check)
  if (typeof raw !== 'object' || !raw || !('version' in raw)) {
    throw new Error('Invalid scene file')
  }
  const migrated = migrate(raw as SceneJSON)
  stage.loadJSON(migrated)
}
```
