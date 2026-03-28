# Events

## ObjectEventMap

Events available on any `BaseObject`:

```ts
interface ObjectEventMap {
  click:      CanvasPointerEvent
  dblclick:   CanvasPointerEvent
  mousedown:  CanvasPointerEvent
  mouseup:    CanvasPointerEvent
  mousemove:  CanvasPointerEvent
  mouseenter: CanvasPointerEvent
  mouseleave: CanvasPointerEvent
  dragstart:  CanvasPointerEvent
  drag:       CanvasPointerEvent
  dragend:    CanvasPointerEvent
  tap:        CanvasPointerEvent
  doubletap:  CanvasPointerEvent
}
```

## StageEventMap

Stage emits all of `ObjectEventMap` plus:

```ts
interface StageEventMap extends ObjectEventMap {
  wheel:             CanvasWheelEvent
  render:            { timestamp: number }
  'object:added':    { object: BaseObject }
  'object:removed':  { object: BaseObject }
}
```

## CanvasPointerEvent

```ts
interface CanvasPointerEvent {
  screen:        { x: number; y: number }   // canvas pixel space
  world:         { x: number; y: number }   // world space
  originalEvent: PointerEvent | MouseEvent | TouchEvent
  stopped:       boolean
  stopPropagation(): void
}
```

## CanvasWheelEvent

```ts
interface CanvasWheelEvent {
  screen:        { x: number; y: number }
  world:         { x: number; y: number }
  deltaX:        number
  deltaY:        number
  originalEvent: WheelEvent
}
```

## PointerPosition

```ts
interface PointerPosition {
  screen: { x: number; y: number }
  world:  { x: number; y: number }
}
```
