# migrate

Upgrades a serialized scene JSON to a target schema version. Safe to call on any stored scene before loading it.

## Signature

```ts
function migrate(json: SceneJSON, targetVersion?: string): SceneJSON
```

## Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `json` | `SceneJSON` | — | Stored scene JSON (from `stage.toJSON()`) |
| `targetVersion` | `string` | `CURRENT_SCHEMA_VERSION` | Target semver version to upgrade to |

## Returns

A `SceneJSON` at `targetVersion`. If the input is already at `targetVersion`, the same object reference is returned (no clone).

## Throws

| Condition | Error message |
|---|---|
| Invalid semver in input or target | `invalid semver "..."` |
| `targetVersion` is older than input | `cannot downgrade schema from "..." to "..."` |
| No migration step covers the gap | `no migration step registered for schema version "..."` |

## CURRENT_SCHEMA_VERSION

The schema version produced by the current framework's `stage.toJSON()`:

```ts
import { CURRENT_SCHEMA_VERSION } from '@nexvas/core'
// '1.0.0'
```

## Example

```ts
import { migrate } from '@nexvas/core'

const stored = JSON.parse(localStorage.getItem('scene') ?? '{}')
const current = migrate(stored)   // upgrade to latest
stage.loadJSON(current)
```

See [Schema Migration guide](/guide/migration) for how to write migration steps.
