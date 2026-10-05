/**
 * Utilities over implicit index-signature objects (`{[k: string]: number}`): the signatures carry through `Partial`/`Required`/`Pick` with base behavior intact. Base validation itself does not enforce index-signature value types (a separate, pre-existing gap), so the last case passes RTI exactly as it does for the unmapped shape while tsc rejects it — documented with an `// Expected:` note instead of a directive, so tsc-strict reports exactly that line and nothing else. There are no throwing calls here, hence no `*-errors.json` entry beyond an empty throws list.
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
// Expected: tsc rejects the mistyped value, RTI passes it like the unmapped base does (index-signature enforcement gap, pre-existing).
takePickScores({ k: 'x' });
