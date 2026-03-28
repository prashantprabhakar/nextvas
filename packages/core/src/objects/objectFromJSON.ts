import type { ObjectJSON } from '../types.js'
import type { BaseObject } from './BaseObject.js'
import { Rect } from './Rect.js'
import { Circle } from './Circle.js'
import { Line } from './Line.js'
import { Path } from './Path.js'
import { Text } from './Text.js'
import { CanvasImage } from './CanvasImage.js'
import { Group } from './Group.js'

/**
 * Deserialize a plain JSON object (from `toJSON()`) back into a typed scene object.
 * Supports all built-in object types. Custom types registered via plugins are not
 * handled here — use a plugin-provided registry for those.
 *
 * @throws If the `type` field is missing or unrecognized.
 */
export function objectFromJSON(json: ObjectJSON): BaseObject {
  switch (json.type) {
    case 'Rect':
      return Rect.fromJSON(json)
    case 'Circle':
      return Circle.fromJSON(json)
    case 'Line':
      return Line.fromJSON(json)
    case 'Path':
      return Path.fromJSON(json)
    case 'Text':
      return Text.fromJSON(json)
    case 'CanvasImage':
      return CanvasImage.fromJSON(json)
    case 'Group':
      return Group.fromJSON(json)
    default:
      throw new Error(`[nexvas] objectFromJSON: unknown object type "${String(json.type)}"`)
  }
}
