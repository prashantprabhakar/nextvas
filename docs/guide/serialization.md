# Serialization

The full scene graph serializes to and from plain JSON. The format is versioned so it can evolve without breaking existing saved files.

## Saving a scene

```ts
const json = stage.toJSON()
// {
//   version: '1.0.0',
//   layers: [ { id, name, visible, locked, objects: [...] } ]
// }

// Persist however you like
localStorage.setItem('scene', JSON.stringify(json))
// or: await fetch('/api/save', { method: 'POST', body: JSON.stringify(json) })
```

## Restoring a scene

```ts
const json = JSON.parse(localStorage.getItem('scene') ?? '{}')
stage.loadJSON(json)
```

`loadJSON` removes all existing layers and objects before loading the new scene.

## Single-object serialization

Every object also serializes individually:

```ts
const rectJson = rect.toJSON()
const restored = Rect.fromJSON(rectJson)

// Or use the type-agnostic helper
import { objectFromJSON } from '@nexvas/core'
const obj = objectFromJSON(rectJson)  // returns the correct typed instance
```

## Custom object types

If you register a custom object type via a plugin, implement `toJSON()` and a static `fromJSON()` on your class, and register a deserializer:

```ts
// In your plugin's install():
stage.registerObject('MyShape', MyShape)

// Your class:
class MyShape extends BaseObject {
  toJSON(): ObjectJSON {
    return { ...super.toJSON(), type: 'MyShape', myProp: this.myProp }
  }
  static fromJSON(json: ObjectJSON): MyShape {
    return new MyShape({ ...json, myProp: json.myProp as string })
  }
}
```

## Schema

The JSON schema is documented in [SceneJSON](/api/scene-json).
