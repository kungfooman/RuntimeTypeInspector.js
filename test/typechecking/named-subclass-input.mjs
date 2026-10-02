/**
 * Named platform types accept subclasses in every environment: the
 * `window` fallback in `validateType` only covers browsers, so a
 * Float32Array subclass failed in workers/Node despite being correct.
 * Every throwing call carries `@ts-expect-error`, so a tsc-strict run is
 * green if and only if each directive is consumed and nothing else
 * errors; `*-errors.json` pins the same sequence for RTI.
 */
class MyFloat32Array extends Float32Array {}
/**
 * @param {Float32Array} data - The data.
 */
function takeFloat(data) {
  return data;
}
takeFloat(new Float32Array(4)); // ok
takeFloat(new MyFloat32Array(4)); // ok: subclass, every environment
// @ts-expect-error: plain objects are no Float32Array
takeFloat({length: 4});
// @ts-expect-error: wrong primitive kind
takeFloat('nope');
