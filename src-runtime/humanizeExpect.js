import {classes} from './registerClass.js';
import {stringifyType} from './stringifyType.js';
import {stringifyValue} from './stringifyValue.js';
/**
 * Short human-readable summary for an expected type, for the panel's Expect
 * column (issue #134 item 2). Bare single-letter types like `K` are
 * unresolved generics; known class names are instances, not strings.
 * @param {*} expect - The expected type.
 * @returns {{summary: string, notes: string[]}} One-line summary plus hints.
 */
function humanizeExpect(expect) {
  let flat;
  try {
    flat = stringifyType(expect);
  } catch {
    flat = String(expect?.type ?? expect);
  }
  const notes = [];
  const bare = typeof expect === 'string' ? expect : expect?.type;
  if (typeof bare === 'string' && /^[A-Z]$/.test(bare)) {
    notes.push(`${bare} is an unresolved generic parameter; open Compare for call-site detail.`);
  }
  if (typeof bare === 'string' && classes[bare]) {
    notes.push(`${bare} is a registered class; the value must be an instance of it.`);
  } else if (bare === 'class' && expect?.elementType) {
    notes.push(`Class<${stringifyType(expect.elementType)}>; the value must be an instance.`);
  }
  const summary = flat.length > 140 ? `${flat.slice(0, 137)}...` : flat;
  return {summary, notes};
}
/**
 * Pretty side-by-side texts for the comparator modal (issue #134 item 3).
 * Pure (no DOM) so it is unit-testable.
 * @param {*} expect - The expected type.
 * @param {*} value - The actual value.
 * @returns {{expectPretty: string, actualPretty: string}} Formatted texts.
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
    actualPretty = JSON.stringify(stringifyValue(value), null, 2) ?? String(value);
  } catch {
    actualPretty = String(value?.toString?.() ?? value);
  }
  return {expectPretty, actualPretty};
}
export {humanizeExpect, formatCompare};
