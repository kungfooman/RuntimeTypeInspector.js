import {assertMode } from "./assertMode.js";
import {options    } from "./options.js";
import {warnedTable} from "./warnedTable.js";
import {Warning    } from "./Warning.js";
/**
 * @param {HTMLDivElement} div - The <div>.
 */
function niceDiv(div) {
  div.style.border  = "1px solid #C1C1C1";
  div.style.margin = "10px";
  div.style.padding = "10px";
  div.style.textAlign = "left";
  div.style.lineHeight = "25px";
  div.style.backgroundColor = "#F3F3F3";
  div.style.borderRadius = "4px";
  const rule = document.createElement('style');
  rule.innerHTML = /* css */ `
    .rti tr:nth-child(even) {
      background-color: #ccc;
    }
    .rti {
      color: black;
    }
    .rti .value {
      max-width: 15vw;
      text-wrap: nowrap;
      overflow: hidden;
    }
    .rti .desc {
      max-width: 20vw;
      overflow: hidden;
    }
    .rti td {
      word-break: break-all;
      max-width: 200px;
      width: min-content;
    }
  `;
  div.classList.add('rti');
  document.head.appendChild(rule);
}
class TypePanel {
  div             = document.createElement('div');
  spanErrors      = document.createElement('span');
  span            = document.createElement('span');
  select          = document.createElement('select');
  option_spam     = document.createElement('option');
  option_once     = document.createElement('option');
  option_never    = document.createElement('option');
  buttonHide      = document.createElement('button');
  buttonLoadState = document.createElement('button');
  buttonSaveState = document.createElement('button');
  constructor() {
    const {div, spanErrors, span, select, option_spam, option_once, option_never, buttonHide, buttonLoadState, buttonSaveState} = this;
    div.style.position = "absolute";
    div.style.bottom = "0px";
    div.style.right = "0px";
    div.style.zIndex = "10";
    niceDiv(div);
    span.innerText = " Type report mode:";
    option_spam.text = 'spam';
    option_once.text = 'once';
    option_never.text = 'never';
    select.append(option_spam, option_once, option_never);
    const spamTypeReports = localStorage.getItem('rti-spam-type-reports');
    select.value = options.mode;
    if (spamTypeReports !== null) {
      select.value = spamTypeReports;
    }
    const onchange = () => {
      const {value} = select;
      localStorage.setItem('rti-spam-type-reports', value);
      assertMode(value);
      options.mode = value;
    };
    select.onchange = onchange;
    onchange(); // set mode in options
    buttonHide.textContent = 'Hide';
    buttonHide.onclick = () => {
      div.style.display = 'none';
    };
    buttonLoadState.textContent = 'Load state';
    buttonLoadState.onclick = () => this.loadState();
    buttonSaveState.textContent = 'Save state';
    buttonSaveState.onclick = () => this.saveState();
    div.append(spanErrors, span, select, buttonHide, buttonLoadState, buttonSaveState, warnedTable);
    div.style.maxHeight = '200px';
    div.style.overflow = 'scroll';
    const finalFunc = () => document.body.append(div);
    // Add our <div> to <body> when possible
    if (document.readyState === "complete") {
      finalFunc();
    } else {
      // add when page is loaded
      document.addEventListener("DOMContentLoaded", finalFunc);
    }
    this.loadState();
  }
  get state() {
    /** @type {object[]} */
    const fullState = [];
    /**
     * @todo I would rather save loc/name because it's less likely to change in future... to keep state URL's alive
     */
    for (const key in options.warned) {
      const e = options.warned[key];
      const {state} = e;
      if (state) {
        const {loc, name} = e;
        fullState.push({loc, name, state});
      }
    }
    return fullState;
  }
  /** @type {object|undefined} */
  get stateFromLocation() {
    const arr = location.hash.slice(1).split('&').filter(_ => _.startsWith('typepanel='));
    if (!arr.length) {
      return undefined; // ESLint bs
    }
    const base64 = arr[0].slice(10); // 'typepanel='.length === 10
    const text = atob(base64);
    const json = JSON.parse(text);
    return json;
  }
  loadState() {
    const json = this.stateFromLocation;
    if (!json) {
      return false;
    }
    for (const e of json) {
      const {loc, name, state} = e;
      /** @type {Warning|undefined} */
      let foundWarning;
      for (const key in options.warned) {
        const warning = options.warned[key];
        if (warning.loc === loc && warning.name === name) {
          foundWarning = warning;
          break;
        }
      }
      // If we didn't find it, create it.
      if (!foundWarning) {
        foundWarning = new Warning('msg', 'value', 'expect', loc, name);
        warnedTable?.append(foundWarning.tr);
        options.warned[`${loc}-${name}`] = foundWarning;
      }
      foundWarning.state = state;
    }
    return true;
  }
  saveState() {
    const str = btoa(JSON.stringify(this.state));
    const map = new Map(location.hash.slice(1).split('&').map(_ => _.split('=')));
    map.set('typepanel', str);
    const hash = [...map].map(_ => _.join('=')).join('&');
    location.hash = hash;
  }
  updateErrorCount() {
    this.spanErrors.innerText = `Type validation errors: ${options.count}`;
  }
}
const typePanel = new TypePanel();
export {niceDiv, TypePanel, typePanel};
