/**
 * Library half of the minified-bundle fixture: plain classes, an old-style
 * function constructor with a prototype chain (the cannon.js shape: no
 * `constructor` fixup after `World.prototype = new EventTarget()`), and a
 * generic box. Kept in its own module so Rollup scope-hoists it next to the
 * entry and deconflicts/mangles the bindings, like a real bundler would.
 */
function EventTarget() {
}
EventTarget.prototype = {};
/**
 * @param {*} event - The event to dispatch.
 * @returns {*} The event.
 */
EventTarget.prototype.dispatch = function (event) {
  return event;
};
class Vec {
  /**
   * @param {number} x - X component.
   * @param {number} y - Y component.
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
  /**
   * @param {Vec} other - The other vector.
   * @returns {number} The dot product.
   */
  dot(other) {
    return this.x * other.x + this.y * other.y;
  }
}
/**
 * @template T
 */
class Box {
  /**
   * @param {T} value - The boxed value.
   */
  constructor(value) {
    this.value = value;
  }
}
function World() {
  EventTarget.apply(this);
  this.bodies = [];
}
World.prototype = new EventTarget();
/**
 * @param {Vec} gravity - Gravity vector.
 * @returns {void}
 */
World.prototype.setGravity = function (gravity) {
  this.gravity = gravity;
};
export {Box, EventTarget, Vec, World};
