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
    this.type = type;
  }
}
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
    this.value = value;
  }
  /**
   * @param {K} value
   */
  set(value) {
    this.value = value;
  }
}
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
    this.x = x;
  }
}
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
    this.x = x;
  }
}
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
    this.pair = [a, b];
  }
  /**
   * @template {number} T
   * @param {T} x
   * @param {K} y
   */
  mixed(x, y) {
    return [x, y];
  }
}
new Pair('a', 'a'); // ok
new Pair('a', 'b'); // ok: K widens to string
new Pair('a', 1); // warns: 1 is not a string
new Pair('a', 'a').mixed(1, 'x'); // ok
new Pair('a', 'a').mixed('x', 'y'); // warns: T is number
