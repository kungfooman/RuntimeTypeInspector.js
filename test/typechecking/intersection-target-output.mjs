
/**
 * Intersection targets keep scanning past members that cannot be decided:
 * a later definitive `false` still decides the whole check `false`. The
 * mapped member is valid but undecidable here; if the scan bailed out
 * early, the first call below would wrongly fail.
 */

/**
 * @param {"a" extends ({ [K in "x"]: number } & "b") ? number : string} value
 */
function takeIntersection(value) {
  if (!inspectType(value, {
    "type": "condition",
    "checkType": "\"a\"",
    "extendsType": {
      "type": "intersection",
      "members": [
        {
          "type": "mapping",
          "iterable": "\"x\"",
          "element": "K",
          "result": "number"
        },
        "\"b\""
      ]
    },
    "trueType": "number",
    "falseType": "string",
    "optional": false
  }, 'takeIntersection', 'value')) {
    youCanAddABreakpointHere();
  }
  return value;
}
takeIntersection('ok-string');
// 1 is not a string.

// @ts-expect-error


// 1 is not a string.

// @ts-expect-error
takeIntersection(1);
