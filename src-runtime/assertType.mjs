import {options     } from "./options.mjs";
import {warnedTable } from "./warnedTable.mjs";
import {warn        } from "./warn.mjs";
import {validateType} from "./validateType.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} Boolean indicating if a type is correct.
 */
export function assertType(value, expect, loc, name, critical = true) {
  if (!expect) {
    warn("assertType> 'expect' always should be set");
    return false;
  }
  /** @type {any[]} */
  const warnings = [];
  /** @type {console["warn"]} */
  const innerWarn = (...args) => {
    warnings.push(...args);
  };
  const ret = validateType(value, expect, loc, name, critical, innerWarn);
  if (!ret && critical) {
    options.count++;
    // let expectStr = ', expected: ' + JSON.stringify(expect);
    // if (expectStr.length < 40) {
    //   //expectStr = ', expected: ';
    //   expectStr = '';
    // }
    const extraInfo = warnings.filter(_ => typeof _ !== 'string');
    const msg = `${loc}> The '${name}' argument has an invalid type. ${warnings.filter(_ => typeof _ === 'string').join(' ')}`;
    warn(msg, {expect, value, valueToString: value?.toString()}, ...extraInfo);
    const warnObj = options.warned[msg];
    if (!warnObj.tr) {
      const tr = document.createElement('tr');
      const dbg = document.createElement('td');
      const dbgInput = document.createElement("input");
      dbgInput.type = "checkbox";
      dbgInput.onchange = () => {
        warnObj.dbg = dbgInput.checked;
      };
      const count = document.createElement('td');
      const desc = document.createElement('td');
      desc.innerText = msg;
      tr.append(dbg, count, desc);
      dbg.append(dbgInput);
      warnedTable.append(tr);
      warnObj.tr = tr;
    }
    const {tr, dbg} = warnObj;
    if (dbg) {
      debugger;
      warnObj.dbg = false; // trigger only once to quickly get app running again
      tr.children[0].children[0].checked = false; // update ui state
    }
    tr.children[1].textContent = warnObj.hits;
  }
  return ret;
}
