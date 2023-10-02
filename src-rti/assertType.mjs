import {typecheckOptions    } from "./typecheckOptions.mjs";
import {typecheckWarnedTable} from "./typecheckTable.mjs";
import {typecheckWarn       } from "./typecheckWarn.mjs";
import {validateType        } from "./validateType.mjs";
/**
 * @param {*} value - The actual value that we need to validate.
 * @param {*} expect - The supposed type information of said value.
 * @param {string} loc - String like `BoundingBox#compute`
 * @param {string} name - Name of the argument
 * @param {boolean} critical - Only `false` for unions.
 * @returns {boolean} - Boolean indicating if a type is correct.
 */
export function assertType(value, expect, loc, name, critical = true) {
  if (!expect) {
    typecheckWarn("assertType> 'expect' always should be set");
    return false;
  }
  const ret = validateType(value, expect, loc, name, critical);
  if (!ret && critical) {
    typecheckOptions.count++;
    let expectStr = ', expected: ' + JSON.stringify(expect);
    if (expectStr.length >= 40) {
      expectStr = ', expected: ';
    }
    expectStr = '';
    const msg = `${loc}> type of '${name}' is invalid${expectStr}`;
    typecheckWarn(msg, { expect, value });
    const warnObj = typecheckOptions.warned[msg];
    if (!warnObj.tr) {
      const tr = document.createElement('tr');
      const dbg = document.createElement('td');
      const dbgInput = document.createElement("input");
      dbgInput.type = "checkbox";
      dbgInput.onchange = () => {
        warnObj.dbg = dbgInput.checked;
      }
      const count = document.createElement('td');
      const desc = document.createElement('td');
      desc.innerText = msg;
      tr.append(dbg, count, desc);
      dbg.append(dbgInput);
      typecheckWarnedTable.append(tr);
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
