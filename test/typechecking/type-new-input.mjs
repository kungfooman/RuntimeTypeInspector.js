class ObjectPool {
  /**
   * @param {new (...args: any[]) => any} constructorFunc - The constructor function for the
   * objects in the pool.
   */
  constructor(constructorFunc) {
    this._constructor = constructorFunc;
  }
}
const objectPool = new ObjectPool(Float32Array);
