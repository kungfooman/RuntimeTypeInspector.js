class ObjectPool {
  /**
   * @param {new (...args: any[]) => any} constructorFunc - The constructor function for the
   * objects in the pool.
   */
  constructor(constructorFunc) {
    if (!inspectType(constructorFunc, {
      "type": "new",
      "parameters": [
        {
          "type": "array",
          "elementType": {
            "type": {
              "type": "array",
              "elementType": "any"
            },
            "name": "args"
          }
        }
      ],
      "ret": "any",
      "optional": false
    }, 'ObjectPool#constructor', 'constructorFunc')) {
      youCanAddABreakpointHere();
    }
    this._constructor = constructorFunc;
  }
}
registerClass(ObjectPool);
const objectPool = new ObjectPool(Float32Array);
