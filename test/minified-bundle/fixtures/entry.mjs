/**
 * Entry half of the minified-bundle fixture: annotated functions exercised
 * with valid calls plus exactly two intentional negatives (`step` with a
 * number, `setGravity` with a plain object). Both the plain and the minified
 * bundle must report exactly these two and nothing else.
 */
import {Box, Vec, World} from './shapes.mjs';
/**
 * @param {Vec} v - A vector.
 * @returns {number} Length squared.
 */
function lengthSquared(v) {
  return v.x * v.x + v.y * v.y;
}
/**
 * @param {World} world - The world.
 * @param {Vec} gravity - Gravity vector.
 * @returns {void}
 */
function boot(world, gravity) {
  world.setGravity(gravity);
}
/**
 * @param {Box<number>} box - A boxed number.
 * @returns {number} The unboxed value.
 */
function unbox(box) {
  return box.value;
}
const velocity = new Vec(3, 4);
lengthSquared(velocity);
lengthSquared(42);
const world = new World();
boot(world, new Vec(0, -9));
boot(world, {
  x: 0,
  y: 1,
});
unbox(new Box(7));
console.log('fixture done', lengthSquared(velocity));
