/**
 * @typedef {{[n: number]: boolean}} Arrayish
 * @typedef {{[k: string]: boolean}} Mapish
 */
/**
 * @param {Arrayish} arrayish - Arrayish.
 */
function takeArrayish(arrayish) {
  // Nothing yet.
}
/**
 * @param {Mapish} mapish - Mapish.
 */
function takeMapish(mapish) {
  // Nothing yet.
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
