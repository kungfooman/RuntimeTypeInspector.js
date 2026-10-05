registerTypedef('Scores', {
  "type": "object",
  "indexSignatures": [
    {
      "type": "indexSignature",
      "indexType": "number",
      "indexParameters": [
        {
          "type": "string",
          "name": "k"
        }
      ]
    }
  ]
});

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
  if (!inspectType(x, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "Scores"
    ],
    "optional": false
  }, 'takePartialScores', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePartialScores({}); // ok

takePartialScores({
  k: 1
}); // ok


/**
 * @param {Required<Scores>} x
 */

function takeReqScores(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Required",
    "args": [
      "Scores"
    ],
    "optional": false
  }, 'takeReqScores', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takeReqScores({}); // ok

takeReqScores({
  k: 1
}); // ok


/**
 * @param {Pick<Scores, 'k'>} x
 */

function takePickScores(x) {
  if (!inspectType(x, {
    "type": "reference",
    "name": "Pick",
    "args": [
      "Scores",
      "'k'"
    ],
    "optional": false
  }, 'takePickScores', 'x')) {
    youCanAddABreakpointHere();
  }
  return x;
}
takePickScores({
  k: 1
}); // ok

// @ts-expect-error: string is not assignable to number

 // ok

// @ts-expect-error: string is not assignable to number
takePickScores({
  k: 'x'
});
