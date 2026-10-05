/**
 * Utilities over implicit index-signature objects (`{[k: string]: number}`): the signatures carry through `Partial`/`Required`/`Pick` with base behavior intact, and signature-covered values validate against the value type. The throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if the directive is consumed and nothing else errors; `*-errors.json` pins the same throw for RTI.
 */
/**
 * @typedef {{[k: string]: number}} Scores
 */
/**
 * @param {Partial<Scores>} x
 */
function takePartialScores(x) {
  return x;
}
takePartialScores({}); // ok
takePartialScores({ k: 1 }); // ok
/**
 * @param {Required<Scores>} x
 */
function takeReqScores(x) {
  return x;
}
takeReqScores({}); // ok
takeReqScores({ k: 1 }); // ok
/**
 * @param {Pick<Scores, 'k'>} x
 */
function takePickScores(x) {
  return x;
}
takePickScores({ k: 1 }); // ok
// @ts-expect-error: string is not assignable to number
takePickScores({ k: 'x' });
/**
 * @param {Partial<{[n: number]: string}>} x
 */
function takePartialNums(x) {
  return x;
}
takePartialNums({}); // ok
takePartialNums({ 0: 'a', '-1': 'b', 1.5: 'c' }); // ok: canonical numeric names
// @ts-expect-error: hex spellings are not numeric names
takePartialNums({ '0x10': 'a' });
// @ts-expect-error: empty key is not numeric
takePartialNums({ '': 'a' });
// @ts-expect-error: named keys are not numeric
takePartialNums({ abc: 'a' });
// @ts-expect-error: number is not assignable to string
takePartialNums({ 0: 1 });
