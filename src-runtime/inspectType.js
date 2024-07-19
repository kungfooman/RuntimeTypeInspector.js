import {crossContextPostMessage  } from './crossContextPostMessage.js';
import {options                  } from './options.js';
import {warnedTable              } from './warnedTable.js';
import {validateType             } from './validateType.js';
import {partition                } from './partition.js';
import {Warning                  } from './Warning.js';
import {typePanel                } from './TypePanel.js';
import {importNamespaceSpecifiers} from './registerImportNamespaceSpecifier.js';
if (typeof importScripts !== 'function') {
  window.addEventListener('message', ({data}) => {
    const {type, value, expect, loc, name, valueToString, strings, extras} = data;
    if (type !== 'rti') {
      return;
    }
    // console.log("Raw message data", data);
    const key = `${loc}-${name}`;
    const msg = `${loc}> The '${name}' argument has an invalid type. ${strings.join(' ')}`.trim();
    typePanel.updateErrorCount();
    let warnObj = options.warned[key];
    if (!warnObj) {
      warnObj = new Warning(msg, value, expect, loc, name);
      warnedTable?.append(warnObj.tr);
      options.warned[key] = warnObj;
    }
    warnObj.hits++;
    warnObj.warn(msg, {expect, value, valueToString}, ...extras);
    const {dbg} = warnObj;
    if (dbg) {
      debugger;
      warnObj.dbg = false; // trigger only once to quickly get app running again
    }
    // The value may change and we only show the latest wrong value
    warnObj.value = value;
    // Message may change aswell, especially after loadint state.
    warnObj.msg = msg;
  });
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
    // Nytaralyxe: options.warns where each warn callback supports one system (node, div/dom etc.)
    crossContextPostMessage({type: 'rti', value, expect, loc, name, valueToString, strings, extras});
  }
  return ret;
}
export {inspectType};
