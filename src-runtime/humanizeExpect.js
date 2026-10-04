import {classes} from './registerClass.js';
import {stringifyType} from './stringifyType.js';
import {stringifyValue} from './stringifyValue.js';
import {prettyValue} from './describeValue.js';
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
export {humanizeExpect};
