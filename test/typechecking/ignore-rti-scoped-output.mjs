
/**
 * Scoped `@ignoreRTI`: a proven-correct over-allocated call suppresses
 * only the listed check while siblings keep validating. Core hole
 * checking stays strict (see the array specs): `computeStrict` below
 * throws on the same value `compute` accepts silently.
 */
/** @type {number[]} */
const sparse = [];
sparse.length = 6;

/**
 * @param {ArrayLike<number>} vertices - The vertices, tail unused past `used`.
 * @param {number} used - Live entries.
 * @ignoreRTI vertices
 */

function compute(vertices, used) {
  if (!inspectType(used, "number", 'compute', 'used')) {
    youCanAddABreakpointHere();
  }
  return used;
}
compute(sparse, 3); // ok: suppressed

// @ts-expect-error: used is no number (vertices stays suppressed)

 // ok: suppressed

// @ts-expect-error: used is no number (vertices stays suppressed)
compute(sparse, 'x');

/**
 * @param {ArrayLike<number>} vertices - The vertices.
 * @param {number} used - Live entries.
 */

function computeStrict(vertices, used) {
  if (!inspectType(vertices, {
    "type": "reference",
    "name": "ArrayLike",
    "args": [
      "number"
    ],
    "optional": false
  }, 'computeStrict', 'vertices')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(used, "number", 'computeStrict', 'used')) {
    youCanAddABreakpointHere();
  }
  return used;
}
// RTI throws here (holes fail): tsc accepts sparse arrays as number[], so

// no directive can express it — deliberate divergence, documented.


// RTI throws here (holes fail): tsc accepts sparse arrays as number[], so

// no directive can express it — deliberate divergence, documented.
computeStrict(sparse, 3);

/**
 * @param {ArrayLike<number>} vertices - The vertices.
 * @param {number} used - Live entries.
 * @ignoreRTI
 */

function computeBare(vertices, used) {
  return used;
}
// @ts-expect-error: bare ignore silences everything

computeBare(sparse, 'x');
