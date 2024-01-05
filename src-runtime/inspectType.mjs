import {options     } from './options.mjs';
import {warnedTable } from './warnedTable.mjs';
import {warn        } from './warn.mjs';
import {validateType} from './validateType.mjs';
import {partition   } from './partition.js';
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
  const ret = validateType(value, expect, loc, name, critical, innerWarn);
  if (!ret && critical) {
    options.count++;
    // let expectStr = ', expected: ' + JSON.stringify(expect);
    // if (expectStr.length < 40) {
    //   //expectStr = ', expected: ';
    //   expectStr = '';
    // }
    const [strings, extras] = partition(warnings, _ => typeof _ === 'string');
    const msg = `${loc}> The '${name}' argument has an invalid type. ${strings.join(' ')}`;
    warn(msg, {expect, value, valueToString: value?.toString()}, ...extras);
    // Nytaralyxe: options.warns where each warn callback supports one system (node, div/dom etc.)
    const warnObj = options.warned[msg];
    if (!warnObj.tr) {
      const tr = document.createElement('tr');
      const dbg = document.createElement('td');
      const hide = document.createElement('td');
      const locationTD = document.createElement('td');
      const nameTD = document.createElement('td');
      const expectTD = document.createElement('td');
      const valueTD = document.createElement('td');
      const dbgInput = document.createElement("button");
      dbgInput.textContent = '🧐';
      dbgInput.onclick = () => {
        warnObj.dbg = !warnObj.dbg;
        dbgInput.textContent = warnObj.dbg ? '🐞' : '🧐';
      };
      const hideInput = document.createElement("button");
      hideInput.textContent = '👁️‍🗨️';
      warnObj.hidden = false;
      //hideInput.type = "checkbox";
      hideInput.onclick = () => {
        warnObj.hidden = !warnObj.hidden;
        hideInput.textContent = warnObj.hidden ? '🌚' : '👁️‍🗨️';
      };
      locationTD.textContent = loc;
      nameTD.textContent = name;
      expectTD.textContent = expect;
      valueTD.textContent = value;
      const count = document.createElement('td');
      const desc = document.createElement('td');
      desc.innerText = msg;
      tr.append(hide, dbg, count, locationTD, nameTD, expectTD, valueTD, desc);
      dbg.append(dbgInput);
      hide.append(hideInput);
      warnedTable.append(tr);
      warnObj.tr = tr;
      warnObj.hitsTableCell = count;
    }
    const {tr, dbg} = warnObj;
    if (dbg) {
      debugger;
      warnObj.dbg = false; // trigger only once to quickly get app running again
      tr.children[0].children[0].checked = false; // update ui state
    }
    warnObj.hitsTableCell.textContent = warnObj.hits;
  }
  return ret;
}
export {inspectType};
