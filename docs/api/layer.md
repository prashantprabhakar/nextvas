# Layer

A grouping inside the Stage that controls render order (z-index). Objects on later layers render on top.

## Creating layers

Layers are created via `stage.addLayer()`, not directly:

```ts
const layer = stage.addLayer({ name: 'content' })
```

## Properties

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Auto-generated unique ID |
| `name` | `string` | Human-readable label |
| `visible` | `boolean` | If `false`, the entire layer is hidden |
| `locked` | `boolean` | If `true`, no objects in this layer are hit-testable |
| `objects` | `readonly BaseObject[]` | All direct children |

## Object management

```ts
layer.add(obj: BaseObject): void
layer.remove(obj: BaseObject): void
layer.clear(): void

layer.getById(id: string): BaseObject | undefined
```

## Serialization

```ts
layer.toJSON(): LayerJSON
Layer.fromJSON(json: LayerJSON): Layer
```
