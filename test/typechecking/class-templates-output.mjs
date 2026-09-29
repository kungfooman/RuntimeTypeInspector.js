registerTypedef('AssetType', "string");

/**
 * Issue #265: a templated class was unchecked — `@template` on the class
 * never reached the constructor, so `@param {K}` degraded to `unchecked`.
 * Class templates scope over constructor and methods (like tsc): each
 * `new` infers `K` jointly from the constructor arguments.
 *
 * @typedef {string} AssetType
 */

/**
 * The `Asset` shape from the issue: constrained template with a default.
 *
 * @template {AssetType | (string & {})} [K=string]
 */
class Asset {
  
  /**
   * @type {K}
   */
  type;
  
  /**
   * @param {string} name
   * @param {K} type
   */

  constructor(name, type) {
    const rtiTemplates = {
      "K": {
        "type": "union",
        "members": [
          "AssetType",
          {
            "type": "intersection",
            "members": [
              "string",
              {
                "type": "object"
              }
            ]
          }
        ]
      }
    };
    if (!inspectTypeWithTemplates(name, "string", 'Asset#constructor', 'name', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    if (!inspectTypeWithTemplates(type, "K", 'Asset#constructor', 'type', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    this.type = type;
  }
}
registerClass(Asset);
registerTypedef('Asset', {
  "type": "object",
  "properties": {
    "type": "K"
  }
});
new Asset('cube', 'container'); // ok

new Asset('cube', 123); // warns: 123 is not a string


/**
 * Plain constrained class template, reused by constructor and method.
 *
 * @template {string} K
 */

class Box {
  
  /**
   * @param {K} value
   */
  constructor(value) {
    const rtiTemplates = {
      "K": "string"
    };
    if (!inspectTypeWithTemplates(value, "K", 'Box#constructor', 'value', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    this.value = value;
  }
  
  /**
   * @param {K} value
   */

  set(value) {
    const rtiTemplates = {
      "K": "string"
    };
    if (!inspectTypeWithTemplates(value, "K", 'Box#set', 'value', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    this.value = value;
  }
}
registerClass(Box);
registerTypedef('Box', {
  "type": "object",
  "properties": {
    "set": "Function"
  }
});
new Box('a'); // ok

new Box(1); // warns: 1 is not a string

new Box('a').set('b'); // ok: fresh call, 'b' satisfies string


/**
 * Class templates survive `export` wrappers.
 *
 * @template {string} K
 */

export class ExportedBox {
  
  /**
   * @param {K} x
   */
  constructor(x) {
    const rtiTemplates = {
      "K": "string"
    };
    if (!inspectTypeWithTemplates(x, "K", 'ExportedBox#constructor', 'x', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    this.x = x;
  }
}
registerClass(ExportedBox);
new ExportedBox('a'); // ok

new ExportedBox(1); // warns: 1 is not a string


/**
 * Bare class template: unconstrained, stands in as any.
 *
 * @template K
 */

class Bare {
  
  /**
   * @param {K} x
   */
  constructor(x) {
    const rtiTemplates = {
      "K": "any"
    };
    if (!inspectTypeWithTemplates(x, "K", 'Bare#constructor', 'x', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    this.x = x;
  }
}
registerClass(Bare);
new Bare('x'); // ok


/**
 * Joint inference across constructor params, method-local templates win
 * over class templates for their own keys.
 *
 * @template {string} K
 */

class Pair {
  
  /**
   * @param {K} a
   * @param {K} b
   */
  constructor(a, b) {
    const rtiTemplates = {
      "K": "string"
    };
    if (!inspectTypeWithTemplates(a, "K", 'Pair#constructor', 'a', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    if (!inspectTypeWithTemplates(b, "K", 'Pair#constructor', 'b', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    this.pair = [a, b];
  }
  
  /**
   * @template {number} T
   * @param {T} x
   * @param {K} y
   */

  mixed(x, y) {
    const rtiTemplates = {
      "K": "string",
      "T": "number"
    };
    if (!inspectTypeWithTemplates(x, "T", 'Pair#mixed', 'x', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    if (!inspectTypeWithTemplates(y, "K", 'Pair#mixed', 'y', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    return [x, y];
  }
}
registerClass(Pair);
registerTypedef('Pair', {
  "type": "object",
  "properties": {
    "mixed": "Function",
    "pair": {
      "type": "array",
      "elementType": "any"
    }
  }
});
new Pair('a', 'a'); // ok

new Pair('a', 'b'); // ok: K widens to string

new Pair('a', 1); // warns: 1 is not a string

new Pair('a', 'a').mixed(1, 'x'); // ok

new Pair('a', 'a').mixed('x', 'y'); // warns: T is number

