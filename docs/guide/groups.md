# Groups

A `Group` is a container object. Its transform composes onto all children. Use groups to move, scale, or rotate multiple objects together — or to build composite objects (e.g. a card with a background rect and a text label).

## Basic usage

```ts
import { Group, Rect, Text } from '@nexvas/core'

const card = new Group({
  x: 100,
  y: 100,
  width: 220,
  height: 140,
})

card.add(new Rect({
  x: 0, y: 0, width: 220, height: 140,
  fill: { type: 'solid', color: { r: 1, g: 1, b: 1, a: 1 } },
  stroke: { color: { r: 0.8, g: 0.8, b: 0.8, a: 1 }, width: 1 },
  cornerRadius: 8,
}))

card.add(new Text({
  x: 16, y: 16, width: 188, height: 32,
  content: 'Card Title',
  fontSize: 16,
  fontWeight: 700,
  fill: { type: 'solid', color: { r: 0.1, g: 0.1, b: 0.1, a: 1 } },
}))

layer.add(card)
```

Moving the group moves all children:

```ts
card.x = 300   // all children shift with it
card.rotation = 15
```

## Nesting

Groups can nest arbitrarily:

```ts
const outer = new Group({ x: 0, y: 0, width: 400, height: 300 })
const inner = new Group({ x: 50, y: 50, width: 100, height: 100 })
inner.add(rect)
outer.add(inner)
layer.add(outer)
```

## Clip

By default, children can render outside the group's bounds. Set `clip: true` to clip them:

```ts
const group = new Group({
  x: 100, y: 100, width: 200, height: 200,
  clip: true,  // children outside this rect are clipped
})
```

## Managing children

```ts
group.add(obj)             // add to end (top of z-order)
group.remove(obj)          // remove by reference
group.clear()              // remove all children

group.objects              // readonly BaseObject[] — all direct children
```

## Hit testing in groups

Hit testing respects the group transform. Clicking anywhere on a child registers as a hit on that child. The click event bubbles up through the group to the layer and stage.

If you want the group itself to be the hit target (not individual children), listen on the group:

```ts
group.on('click', (e) => {
  // fires when any child is clicked
})
```
