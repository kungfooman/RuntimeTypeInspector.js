import {crossContextPostMessage  } from './crossContextPostMessage.js';
import {options                  } from './options.js';
import {stringifyType            } from './stringifyType.js';
import {validateType             } from './validateType.js';
import {partition                } from './partition.js';
import {importNamespaceSpecifiers} from './registerImportNamespaceSpecifier.js';
import {isClonable               } from './isClonable.js';
const breakpoints = new Set();
// In the simplest case we are attaching to `window` here, but it's designed to handle
// more complex scenarious like running RTI inside a `Worker` or `<iframe>` aswell.
(globalThis.window || self).addEventListener('message', (e) => {
  const {data} = e;
  const {type, action, destination} = data;
  // console.log("Message event", e);
  // console.log("Message data", data);
  if (type !== 'rti') {
    return;
  }
  // Messages come from Worker/IFrame/window to update UI state:
  if (destination === 'ui') {
    // console.log("Ignoring UI events here, handled in TypePanel instead.");
    return;
  }
  // Messages come from UI to control a few behaviours:
  if (destination === 'worker') {
    if (action === 'addError') {
      console.warn('We are not keeping track of errors in workers at all.');
      return;
    }
    if (action === 'deleteBreakpoint') {
      const {key} = data;
      breakpoints.delete(key);
      return;
    }
    if (action === 'addBreakpoint') {
      const {key} = data;
      breakpoints.add(key);
      return;
    }
    if (action === 'enable') {
      options.enabled = true;
      return;
    }
    if (action === 'disable') {
      options.enabled = false;
      return;
    }
    if (action === 'strictNullChecks') {
      options.strictNullChecks = data.value !== false;
      return;
    }
  }
  console.log('Unhandled action destination combo', {action, destination, e, data});
});
/**
 * Describes a runtime value as a type, mirroring how TypeScript renders the
 * actual side of its assignability errors (`'"b"'`, `1`, `{sub: string}`).
 * Depth- and width-capped: detail beyond that lives in the raw `value` extra.
 * @param {*} value - The actual value.
 * @param {number} depth - Remaining nesting depth.
 * @returns {string} Type-style description.
 */
function describeValueType(value, depth = 2) {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  const kind = typeof value;
  if (kind === 'string' || kind === 'number' || kind === 'boolean') {
    return JSON.stringify(value) ?? kind;
  }
  if (kind === 'bigint') {
    return `${String(value)}n`;
  }
  if (kind !== 'object' || depth <= 0) {
    return kind;
  }
  if (value instanceof Array) {
    const shown = value.slice(0, 3).map((element) => describeValueType(element, depth - 1));
    return `[${shown.join(', ')}${value.length > 3 ? ', ...' : ''}]`;
  }
  const proto = Object.getPrototypeOf(value);
  const prefix = proto !== null && proto !== Object.prototype && value.constructor?.name ? `${value.constructor.name} ` : '';
  const keys = Object.keys(value).slice(0, 5);
  const shown = keys.map((key) => `${key}: ${describeValueType(value[key], depth - 1)}`);
  return `${prefix}{${shown.join(', ')}${Object.keys(value).length > 5 ? ', ...' : ''}}`;
}
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function inspectType(value, expect, loc, name, critical = true) {
  if (!options.enabled) {
    return true;
  }
  if (!expect) {
    console.warn("inspectType> 'expect' always should be set");
    return false;
  }
  if (typeof expect === 'string' && expect.includes('.')) {
    // Quoted literals (e.g. narrowed `"a.b.c"`) are values, not namespace
    // paths: rewriting them misfires `unhandled` noise on the next check.
    const first = expect[0];
    const last = expect[expect.length - 1];
    const quoted = expect.length >= 2 && (first === '"' && last === '"' || first === "'" && last === "'");
    if (!quoted) {
      // E.g. ['MathUtils', 'Quaternion']
      const parts = expect.split('.');
      if (parts.length === 2) {
        const [a, b] = parts;
        if (importNamespaceSpecifiers[a]) {
          const ns = importNamespaceSpecifiers[a][b];
          const expectWhat = typeof ns;
          // console.log("expectWhat", expectWhat);
          if (value?.constructor === ns) {
            return true;
          }
          expect = expectWhat;
        }
      } else {
        console.log("import namespace specifier rewrite unhandled", {expect, parts});
      }
    }
  }
  /** @type {any[]} */
  const warnings = [];
  /** @type {console["warn"]} */
  const innerWarn = (...args) => {
    warnings.push(...args);
  };
  const ret = validateType(value, expect, loc, name, critical, innerWarn, 0);
  if (!ret && critical) {
    options.count++;
    // let expectStr = ', expected: ' + JSON.stringify(expect);
    // if (expectStr.length < 40) {
    //   //expectStr = ', expected: ';
    //   expectStr = '';
    // }
    const [strings, extras] = partition(warnings, _ => typeof _ === 'string');
    // TypeScript-style summary first: it carries the whole diagnostic triple
    // (actual type, expected type, argument) that `tsc` reports, e.g.
    // `Argument of type '"b"' is not assignable to parameter of type '"a"'`.
    // Everything after it is RTI-only extra detail (kept, not replaced).
    let summary;
    try {
      summary = `Argument of type ${describeValueType(value)} is not assignable to parameter of type ${stringifyType(expect)}.`;
    } catch {
      summary = undefined;
    }
    if (summary !== undefined) {
      strings.unshift(summary);
    }
    // String form allows us to see more about certain values, like a vector with a NaN component.
    // Since `value` will "only" be the actual reference and might be "repaired" after further calculations.
    const valueToString = value?.toString?.();
    const key = `${loc}-${name}`;
    if (breakpoints.has(key)) {
      // console.log("breakpoints", breakpoints);
      debugger;
      breakpoints.delete(key); // trigger only once to quickly get app running again
      crossContextPostMessage({type: 'rti', action: 'deleteBreakpoint', destination: 'ui', key});
    }
    // Nytaralyxe: options.warns where each warn callback supports one system (node, div/dom etc.)
    // Don't post `value` when it can't be transmitted cross-context (just stringify it instead).
    if (!isClonable(value)) {
      value = valueToString;
    }
    for (const extra of extras) {
      if (!isClonable(extra)) {
        extra.value = extra.value?.toString();
      }
    }
    const msg = {type: 'rti', action: 'addError', destination: 'ui', value, expect, loc, name, valueToString, strings, extras, key};
    try {
      crossContextPostMessage(msg);
    } catch (e) {
      console.error(e, msg);
    }
  }
  return ret;
}
export {breakpoints, inspectType};
