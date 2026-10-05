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
