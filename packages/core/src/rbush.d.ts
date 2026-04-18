declare module 'rbush' {
  interface BBox {
    minX: number
    minY: number
    maxX: number
    maxY: number
  }

  class RBush<T extends BBox> {
    insert(item: T): this
    remove(item: T, equals?: (a: T, b: T) => boolean): this
    search(bbox: BBox): T[]
    clear(): this
    all(): T[]
  }

  export default RBush
}
