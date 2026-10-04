import {stringifyType} from './stringifyType.js';
import {stringifyValue} from './stringifyValue.js';
import {prettyValue} from './describeValue.js';
/**
 * Pretty side-by-side texts for the comparator modal (issue #134 item 3).
 * Pure (no DOM) so it is unit-testable. Values with a dedicated display
 * rendering (`Map`/`Set` as an entry listing, typed arrays, dates, errors,
 * bigints, class instances, …) render through it instead of the raw
 * `{"$type": …}` snapshot (issue #267).
 * @param {*} expect - The expected type.
 * @param {*} value - The actual value.
 * @returns {{expectPretty: string, actualPretty: string}} Formatted texts.
 * @example
 * formatCompare('number', 1); // {expectPretty: 'number', actualPretty: '1'}
 */
function formatCompare(expect, value) {
  let expectPretty;
  try {
    expectPretty = stringifyType(expect, null, 2);
  } catch {
    expectPretty = String(expect?.type ?? expect);
  }
  let actualPretty;
  try {
    actualPretty = prettyValue(value) ?? JSON.stringify(stringifyValue(value), null, 2) ?? String(value);
  } catch {
    actualPretty = String(value?.toString?.() ?? value);
  }
  return {expectPretty, actualPretty};
}
export {formatCompare};
