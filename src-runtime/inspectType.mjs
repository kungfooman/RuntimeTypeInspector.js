import {options     } from './options.mjs';
import {warnedTable } from './warnedTable.mjs';
import {warn        } from './warn.mjs';
import {validateType} from './validateType.mjs';
import {partition   } from './partition.js';
import {Warning     } from './Warning.js';
import {typePanel   } from './TypePanel.js';
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
    warn("inspectType> 'expect' always should be set");
    return false;
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
    typePanel.updateErrorCount();
    // let expectStr = ', expected: ' + JSON.stringify(expect);
    // if (expectStr.length < 40) {
    //   //expectStr = ', expected: ';
    //   expectStr = '';
    // }
    const [strings, extras] = partition(warnings, _ => typeof _ === 'string');
    const msg = `${loc}> The '${name}' argument has an invalid type. ${strings.join(' ')}`.trim();
    // String form allows us to see more about certain values, like a vector with a NaN component.
    // Since `value` will "only" be the actual reference and might be "repaired" after further calculations.
    const valueToString = value?.toString?.();
    // Nytaralyxe: options.warns where each warn callback supports one system (node, div/dom etc.)
    let warnObj = options.warned[msg];
    if (!warnObj) {
      warnObj = new Warning(msg, value, expect, loc, name);
      warnedTable?.append(warnObj.tr);
      options.warned[msg] = warnObj;
    }
    warnObj.hits++;
    warn(msg, {expect, value, valueToString}, ...extras);
    const {dbg} = warnObj;
    if (dbg) {
      debugger;
      warnObj.dbg = false; // trigger only once to quickly get app running again
    }
    // The value may change and we only show the latest wrong value
    warnObj.value = value;
  }
  return ret;
}
export {inspectType};
