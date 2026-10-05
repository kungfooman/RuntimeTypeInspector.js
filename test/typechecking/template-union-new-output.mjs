
/**
 * Template constrained to a union of construct signatures: each member
 * expands, so constructible classes validate and anything else throws.
 * Valid TypeScript throughout (tsc-checked alongside).
 */

/**
 * @template {(new () => Date) | (new () => RegExp)} T
 */
class UnionFactory {

  /**
   * @param {T} make - A zero-arg constructor.
   */   constructor(make) {
    const rtiTemplates = {
      "T": {
        "type": "union",
        "members": [
          {
            "type": "new",
            "parameters": [],
            "ret": "Date"
          },
          {
            "type": "new",
            "parameters": [],
            "ret": "RegExp"
          }
        ]
      }
    };
    if (!inspectTypeWithTemplates(make, "T", 'UnionFactory#constructor', 'make', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    this._make = make;
  } 
  /**
   * @returns {T} The constructor itself.
   */ 
  getMake() {
    return this._make;
  }
}
registerClass(UnionFactory);
registerTypedef('UnionFactory', {
  "type": "object",
  "properties": {
    "getMake": "Function"
  }
});
const a = new UnionFactory(Date); // ok

// @ts-expect-error: 42 is no constructor

 // ok

// @ts-expect-error: 42 is no constructor
const c = new UnionFactory(42);
