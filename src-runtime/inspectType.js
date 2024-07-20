import {crossContextPostMessage  } from './crossContextPostMessage.js';
import {options                  } from './options.js';
import {validateType             } from './validateType.js';
import {partition                } from './partition.js';
import {Warning                  } from './Warning.js';
import {typePanel                } from './TypePanel.js';
import {importNamespaceSpecifiers} from './registerImportNamespaceSpecifier.js';
const breakpoints = new Set();
// Handle events for either window or worker/iframe
(globalThis.window || self).addEventListener('message', (e) => {
  const {data} = e;
  const {type, action, destination} = data;
  // console.log("Message event", e);
  // console.log("Message data", data);
  if (type !== 'rti') {
    return;
  }
  if (action === 'addError') {
    const {value, expect, loc, name, valueToString, strings, extras, key} = data;
    if (destination === 'worker') {
      console.warn('We are not keeping track of errors in workers at all.');
      return;
    }
    if (destination === 'ui') {
      const msg = `${loc}> The '${name}' argument has an invalid type. ${strings.join(' ')}`.trim();
      typePanel?.updateErrorCount();
      let warnObj = options.warned[key];
      if (!warnObj) {
        warnObj = new Warning(msg, value, expect, loc, name);
        typePanel?.warnedTable?.append(warnObj.tr);
        options.warned[key] = warnObj;
      }
      warnObj.event = e;
      warnObj.hits++;
      warnObj.warn(msg, {expect, value, valueToString}, ...extras);
      // The value may change and we only show the latest wrong value
      warnObj.value = value;
      // Message may change aswell, especially after loading state.
      warnObj.msg = msg;
      return;
    }
  }
  if (action === 'deleteBreakpoint') {
    // Message comes from Worker/IFrame to update UI state
    const {key} = data;
    if (destination === 'worker') {
      breakpoints.delete(key);
      return;
    }
    if (destination === 'ui') {
      const warnObj = options.warned[key];
      if (!warnObj) {
        console.warn("warnObj doesn't exist", {key});
        return;
      }
      warnObj.dbg = false;
      return;
    }
  }
  if (action === 'addBreakpoint') {
    const {key} = data;
    if (destination === 'worker') {
      breakpoints.add(key);
      return;
    }
    if (destination === 'ui') {
      console.warn("Not adding breakpoints for UI via messages");
      return;
    }
  }
  console.log('Unhandled action destination combo', {action, destination, e, data});
});
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
function inspectType(value, expect, loc, name, critical = true) {
  if (!expect) {
    console.warn("inspectType> 'expect' always should be set");
    return false;
  }
  if (typeof expect === 'string' && expect.includes('.')) {
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
    // String form allows us to see more about certain values, like a vector with a NaN component.
    // Since `value` will "only" be the actual reference and might be "repaired" after further calculations.
    const valueToString = value?.toString?.();
    const key = `${loc}-${name}`;
    if (breakpoints.has(key)) {
      console.log("breakpoints", breakpoints);
      debugger;
      breakpoints.delete(key); // trigger only once to quickly get app running again
      crossContextPostMessage({type: 'rti', action: 'deleteBreakpoint', destination: 'ui', key});
    }
    // Nytaralyxe: options.warns where each warn callback supports one system (node, div/dom etc.)
    crossContextPostMessage({type: 'rti', action: 'addError', destination: 'ui', value, expect, loc, name, valueToString, strings, extras, key});
  }
  return ret;
}
export {inspectType};
