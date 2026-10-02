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
  return value;
}
takeIntersection('ok-string');
// 1 is not a string.
// @ts-expect-error
takeIntersection(1);
