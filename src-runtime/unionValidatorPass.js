/**
 * Runs the real validators over every union member and accepts on the
 * first pass. This is the last resort before inventing a row: when every
 * member failed structurally, a passing member means the verdict was
 * acceptance (nominal trust, custom hooks, option leniency) and any row
 * would contradict it. Callers only reach here after the structural loop
 * found no clean member, so this never converts clean members to rows —
 * structurally clean members (with their informational children) keep
 * flowing through the loop above untouched.
 * @param {*} value - The actual value.
 * @param {any[]} members - The union members, already sliced to budget.
 * @param {(value: *, expect: *) => boolean} probe - Silent pass/fail probe.
 * @returns {boolean} True when some member accepts the value.
 * @example
 * unionValidatorPass({a: 1}, [{type: 'object', properties: {a: 'number'}}], (v, e) => true); // true
 * unionValidatorPass({a: 1}, ['number'], (v, e) => false); // false
 */
function unionValidatorPass(value, members, probe) {
  for (const member of members) {
    if (probe(value, member)) {
      return true;
    }
  }
  return false;
}
export {unionValidatorPass};
