# SceneJSON

The versioned JSON schema produced by `stage.toJSON()` and consumed by `stage.loadJSON()`.

## SceneJSON

```ts
interface SceneJSON {
  version: string      // semver, e.g. '1.0.0'
  layers:  LayerJSON[]
}
```

## LayerJSON

```ts
interface LayerJSON {
  id:      string
  name:    string
  visible: boolean
  locked:  boolean
  objects: ObjectJSON[]
}
```

## ObjectJSON

```ts
interface ObjectJSON {
  type:     string    // 'Rect' | 'Circle' | 'Line' | 'Path' | 'Text' | 'CanvasImage' | 'Group'
  id:       string
  name:     string
  x:        number
  y:        number
  width:    number
  height:   number
  rotation: number
  scaleX:   number
  scaleY:   number
  skewX:    number
  skewY:    number
  opacity:  number
  visible:  boolean
  locked:   boolean
  // Type-specific fields follow (fill, stroke, cornerRadius, content, etc.)
  [key: string]: unknown
}
```

## Example

```json
{
  "version": "1.0.0",
  "layers": [
    {
      "id": "layer_abc123",
      "name": "main",
      "visible": true,
      "locked": false,
      "objects": [
        {
          "type": "Rect",
          "id": "rect_xyz",
          "name": "Background",
          "x": 0,
          "y": 0,
          "width": 800,
          "height": 600,
          "rotation": 0,
          "scaleX": 1,
          "scaleY": 1,
          "skewX": 0,
          "skewY": 0,
          "opacity": 1,
          "visible": true,
          "locked": false,
          "cornerRadius": 0,
          "fill": {
            "type": "solid",
            "color": { "r": 1, "g": 1, "b": 1, "a": 1 }
          },
          "stroke": null
        }
      ]
    }
  ]
}
```

## Version history

| Version | Changes |
|---|---|
| `1.0.0` | Initial release — all built-in object types |

New versions are documented with migration steps. See [migrate](/api/migrate) and the [Schema Migration guide](/guide/migration).
