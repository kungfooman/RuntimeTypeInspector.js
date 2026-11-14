/**
 * Class static initialization blocks (`static { ... }`) round-trip through
 * the transpiler instead of degrading into an
 * `rtiUnhandled("StaticBlock")` placeholder. The block carries no params,
 * so it emits no checks; statements inside keep their expression-level
 * instrumentation.
 */
class Vec3 {
  static {
    console.log('once');
  }
  /**
   * Constructs a new 3d vector.
   *
   * @param {number} [x] - x component.
   */
  constructor(x = 0) {
    this.x = x;
  }
}
const vec = new Vec3();
vec.x; // ok
new Vec3('oops'); // warns: a string is not a number
new Vec3(); // ok
