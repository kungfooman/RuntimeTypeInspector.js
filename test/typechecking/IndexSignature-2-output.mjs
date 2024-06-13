registerTypedef('Arrayish', {
  "type": "object",
  "indexSignatures": [
    {
      "type": "indexSignature",
      "indexType": "boolean",
      "indexParameters": [
        {
          "type": "number",
          "name": "n"
        }
      ]
    }
  ]
});
registerTypedef('Mapish', {
  "type": "object",
  "indexSignatures": [
    {
      "type": "indexSignature",
      "indexType": "boolean",
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
 * @typedef {{[n: number]: boolean}} Arrayish
 * @typedef {{[k: string]: boolean}} Mapish
 */
/**
 * @param {Arrayish} arrayish - Arrayish.
 */
function takeArrayish(arrayish) {
  if (!inspectType(arrayish, "Arrayish", 'takeArrayish', 'arrayish')) {
    youCanAddABreakpointHere();
  }
}
/**
 * @param {Mapish} mapish - Mapish.
 */
function takeMapish(mapish) {
  if (!inspectType(mapish, "Mapish", 'takeMapish', 'mapish')) {
    youCanAddABreakpointHere();
  }
}
takeArrayish({
  0: true,
  1: false,
});
takeArrayish({
  0: "1st error"
});
takeArrayish({
  "0": "2nd error",
});
takeArrayish({
  "0": "3rd and 4th error",
});
takeMapish({
  'a': true,
  'b': false,
  'c': "trigger",
});
