
/**
 * Template constrained to an abstract construct signature: abstractness
 * erases at runtime (constructors are still functions), so any constructor
 * validates while non-functions throw. Valid TypeScript throughout
 * (tsc-checked alongside).
 */

/**
 * @template {abstract new (...args: any[]) => any} T
 */
class AbstractPool {

  /**
   * @param {T} constructorFunc - An abstract constructor.
   */   constructor(constructorFunc) {
    const rtiTemplates = {
      "T": {
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
        "ret": "any"
      }
    };
    if (!inspectTypeWithTemplates(constructorFunc, "T", 'AbstractPool#constructor', 'constructorFunc', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    this._c = constructorFunc;
  }
}
registerClass(AbstractPool);
class Base {

}
registerClass(Base);
const okAbs = new AbstractPool(Base); // ok

// @ts-expect-error: 42 is no constructor

 // ok

// @ts-expect-error: 42 is no constructor
const badAbs = new AbstractPool(42);
