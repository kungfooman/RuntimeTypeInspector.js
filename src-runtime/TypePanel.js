import {assertMode } from "./assertMode.js";
import {options    } from "./options.js";
import {createTable} from "./warnedTable.js";
import {Warning    } from "./Warning.js";
/**
 * @typedef {MessageEvent<{action: string}>} MessageEventRTI
 */
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
function isEnabled() {
  const tmp = localStorage.getItem('rti-enabled');
  return tmp === null || tmp === 'true';
}
class TypePanel {
  div             = document.createElement('div');
  inputEnable     = document.createElement('input');
  spanErrors      = document.createElement('span');
  span            = document.createElement('span');
  select          = document.createElement('select');
  option_spam     = document.createElement('option');
  option_once     = document.createElement('option');
  option_never    = document.createElement('option');
  buttonHide      = document.createElement('button');
  buttonLoadState = document.createElement('button');
  buttonSaveState = document.createElement('button');
  buttonClear     = document.createElement('button');
  warnedTable     = createTable();
  constructor() {
    const {
      div, inputEnable, spanErrors, span, select, option_spam, option_once, option_never,
      buttonHide, buttonLoadState, buttonSaveState, buttonClear, warnedTable,
    } = this;
    div.style.position = "absolute";
    div.style.bottom = "0px";
    div.style.right = "0px";
    div.style.zIndex = "10";
    niceDiv(div);
    inputEnable.checked = isEnabled();
    inputEnable.type = "checkbox";
    inputEnable.onchange = (e) => {
      if (inputEnable.checked) {
        this.enableTypeChecking();
      } else {
        this.disableTypeChecking();
      }
    };
    inputEnable.onchange();
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
      this.hide();
    };
    buttonLoadState.textContent = 'Load state';
    buttonLoadState.onclick = () => this.loadState();
    buttonSaveState.textContent = 'Save state';
    buttonSaveState.onclick = () => this.saveState();
    buttonClear.textContent = 'Clear';
    buttonClear.onclick = () => this.clear();
    div.append(inputEnable, spanErrors, span, select, buttonHide, buttonLoadState, buttonSaveState, buttonClear, warnedTable);
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
    // In the simplest case RTI sends its errors onto `window` to update UI state.
    // If you start a Worker, you have to attach RTI yourself.
    window.addEventListener('message', (e) => {
      const {data} = e;
      const {type, destination} = data;
      // console.log("TypePanel Message event", e);
      // console.log("TypePanel Message data", data);
      if (type !== 'rti') {
        return;
      }
      if (destination !== 'ui') {
        return;
      }
      this.handleEvent(e);
    });
  }
  hide() {
    this.div.style.display = 'none';
  }
  show() {
    this.div.style.display = '';
  }
  disableTypeChecking() {
    localStorage.setItem('rti-enabled', 'false');
    this.sendEnabledDisabledStateToWorker();
  }
  enableTypeChecking() {
    localStorage.setItem('rti-enabled', 'true');
    this.sendEnabledDisabledStateToWorker();
  }
  lastKnownCountWithStatus = '0-true';
  sendEnabledDisabledStateToWorker() {
    // Problem: First time the worker may not even have started and `this.eventSources.size === 0`
    // So we first know a RTI worker started after receiving the first message from it.
    const {eventSources} = this;
    const key = `${eventSources.size}-${this.inputEnable.checked}`;
    // Only update when either changed.
    if (key === this.lastKnownCountWithStatus) {
      return;
    }
    this.lastKnownCountWithStatus = key;
    // console.log("Update state to eventSources", eventSources, "key", key);
    this.eventSources.forEach(eventSource => {
      eventSource.postMessage({
        type: 'rti',
        action: this.inputEnable.checked ? 'enable' : 'disable',
        destination: 'worker',
      });
    });
  }
  clear() {
    const {warned} = options;
    for (const key in warned) {
      const warning = warned[key];
      warning.tr.remove();
      delete warned[key];
    }
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
        this.warnedTable?.append(foundWarning.tr);
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
  get eventSources() {
    /** @type {Set<EventTarget | MessageEventSource>} */
    const eventSources = new Set();
    for (const key in options.warned) {
      const warning = options.warned[key];
      if (warning.eventSource) {
        eventSources.add(warning.eventSource);
      }
    }
    return eventSources;
  }
  /**
   * @param {MessageEventRTI} event - The event from Worker, IFrame or own window.
   */
  addError(event) {
    const {value, expect, loc, name, valueToString, strings, extras = [], key} = event.data;
    const msg = `${loc}> The '${name}' argument has an invalid type. ${strings.join(' ')}`.trim();
    this.updateErrorCount();
    let warnObj = options.warned[key];
    if (!warnObj) {
      warnObj = new Warning(msg, value, expect, loc, name);
      this.warnedTable?.append(warnObj.tr);
      options.warned[key] = warnObj;
    }
    warnObj.event = event;
    warnObj.hits++;
    warnObj.warn(msg, {expect, value, valueToString}, ...extras);
    // The value may change and we only show the latest wrong value
    warnObj.value = value;
    // Message may change aswell, especially after loading state.
    warnObj.msg = msg;
  }
  /**
   * @param {MessageEventRTI} event - The event from Worker, IFrame or own window.
   */
  deleteBreakpoint(event) {
    const {key} = event.data;
    const warnObj = options.warned[key];
    if (!warnObj) {
      console.warn("warnObj doesn't exist", {key});
      return;
    }
    warnObj.dbg = false;
  }
  /**
   * @param {MessageEventRTI} event - The event from Worker, IFrame or own window.
   */
  addBreakpoint(event) {
    console.warn('TypePanel#addBreakpoint> Not adding breakpoints for UI via messages, event', event);
  }
  /**
   * @param {MessageEventRTI} event - The event from Worker, IFrame or own window.
   */
  handleEvent(event) {
    const {action} = event.data;
    this[action](event);
    // Could be anywhere we know that a new worker is sending RTI messages.
    this.sendEnabledDisabledStateToWorker();
  }
}
/** @type {TypePanel | undefined} */
let typePanel;
// @todo create UI explicitly programmatically inside e.g. src/index.rti.js of the projects using it.
if (typeof importScripts === 'undefined') {
  typePanel = new TypePanel();
}
export {niceDiv, TypePanel, typePanel};
