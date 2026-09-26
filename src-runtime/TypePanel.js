import {assertMode } from "./assertMode.js";
import {decodeBase64 } from "./base64.js";
import {encodeBase64 } from "./base64.js";
import {options    } from "./options.js";
import {createTable} from "./warnedTable.js";
import {stringifyValue} from "./stringifyValue.js";
import {Warning    } from "./Warning.js";
import {Div, Span, Button, Input, Select, Option, genJsx} from "./jsx.js";
/**
 * @typedef {MessageEvent<{action: string}>} MessageEventRTI
 */
const Style = genJsx('style');
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
  const rule = Style({},
    /* css */ `
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
  `);
  div.classList.add('rti');
  document.head.appendChild(rule);
}
function isEnabled() {
  const tmp = localStorage.getItem('rti-enabled');
  return tmp === null || tmp === 'true';
}
function isStrictNullChecks() {
  const tmp = localStorage.getItem('rti-strict-null-checks');
  return tmp === null || tmp === 'true';
}
class TypePanel {
  /** @type {HTMLDivElement | null} */
  static divAll = null;
  /** @type {HTMLDivElement} */
  div;
  /** @type {HTMLInputElement} */
  inputEnable;
  /** @type {HTMLInputElement} */
  inputStrict;
  /** @type {HTMLSpanElement} */
  spanErrors;
  /** @type {HTMLSpanElement} */
  span;
  /** @type {HTMLSpanElement} */
  spanStrict;
  /** @type {HTMLSelectElement} */
  select;
  /** @type {HTMLOptionElement} */
  option_spam;
  /** @type {HTMLOptionElement} */
  option_once;
  /** @type {HTMLOptionElement} */
  option_never;
  /** @type {HTMLButtonElement} */
  buttonHide;
  /** @type {HTMLButtonElement} */
  buttonLoadState;
  /** @type {HTMLButtonElement} */
  buttonSaveState;
  /** @type {HTMLButtonElement} */
  buttonClear;
  /** @type {HTMLButtonElement} */
  buttonDownloadLog;
  warnedTable;
  /** @type {Record<string, import('./Warning.js').Warning>} */
  warnings = {};
  /** @type {object[]} */
  eventLog = [];
  maxEventLogSize = 1000;
  maxStackFrames = 20;
  constructor() {
    // UI IS THE SOURCE-OF-TRUTH: build nodes declaratively, read `checked`/
    // `value`/children straight off the DOM, never mirror them in JS state.
    this.div = Div({style: {maxHeight: '200px', overflow: 'scroll'}});
    this.inputEnable = Input({type: 'checkbox', checked: isEnabled(), onchange: () => {
      if (this.inputEnable.checked) {
        this.enableTypeChecking();
      } else {
        this.disableTypeChecking();
      }
    }});
    this.inputStrict = Input({type: 'checkbox', checked: isStrictNullChecks(), onchange: () => {
      options.strictNullChecks = this.inputStrict.checked;
      localStorage.setItem('rti-strict-null-checks', String(this.inputStrict.checked));
      this.sendStrictStateToWorker();
    }});
    this.spanErrors = Span({});
    this.span = Span({innerText: ' Type report mode:'});
    this.spanStrict = Span({innerText: ' Strict null checks:'});
    this.option_spam = Option({text: 'spam'});
    this.option_once = Option({text: 'once'});
    this.option_never = Option({text: 'never'});
    this.select = Select({onchange: () => {
      const {value} = this.select;
      localStorage.setItem('rti-spam-type-reports', value);
      assertMode(value);
      options.mode = value;
    }}, this.option_spam, this.option_once, this.option_never);
    this.buttonHide = Button({textContent: 'Hide', onclick: () => this.hide()});
    this.buttonLoadState = Button({textContent: 'Load state', onclick: () => this.loadState()});
    this.buttonSaveState = Button({textContent: 'Save state', onclick: () => this.saveState()});
    this.buttonClear = Button({textContent: 'Clear', onclick: () => this.clear()});
    this.buttonDownloadLog = Button({textContent: 'Download log', onclick: () => this.downloadLog()});
    this.warnedTable = createTable();
    const {
      div, inputEnable, inputStrict, spanErrors, span, spanStrict, select,
      buttonHide, buttonLoadState, buttonSaveState, buttonClear, buttonDownloadLog, warnedTable,
    } = this;
    TypePanel.divAll ??= Div({
      className: 'rti-all',
      style: {position: 'absolute', bottom: '0px', right: '0px', zIndex: '10'},
    });
    const {divAll} = TypePanel;
    niceDiv(div);
    inputEnable.onchange();
    inputStrict.onchange();
    const spamTypeReports = localStorage.getItem('rti-spam-type-reports');
    select.value = options.mode;
    if (spamTypeReports !== null) {
      select.value = spamTypeReports;
    }
    select.onchange(); // set mode in options
    div.append(inputEnable, spanErrors, span, select, inputStrict, spanStrict,
               buttonHide, buttonLoadState, buttonSaveState, buttonClear, buttonDownloadLog, warnedTable);
    divAll.append(div);
    const finalFunc = () => document.body.append(divAll);
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
  report() {
    console.table(this.warnings);
  }
  lastKnownCountWithStatus = '0-true';
  sendStrictStateToWorker() {
    const {eventSources} = this;
    eventSources.forEach(eventSource => {
      eventSource.postMessage({
        type: 'rti',
        action: 'strictNullChecks',
        value: options.strictNullChecks,
        destination: 'worker',
      });
    });
  }
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
    const {warnings} = this;
    for (const key in warnings) {
      const warning = warnings[key];
      warning.tr.remove();
      delete warnings[key];
    }
    this.eventLog.length = 0;
  }
  /**
   * Captures the current stack like the console shows it for warnings,
   * bounded so deep stacks can't bloat the log.
   * @returns {string[]} Stack lines, oldest dropped past the cap.
   */
  captureStack() {
    const lines = (new Error().stack ?? '').split('\n');
    if (lines.length > this.maxStackFrames + 1) {
      return [...lines.slice(0, this.maxStackFrames + 1), `... (+${lines.length - this.maxStackFrames - 1} more frames)`];
    }
    return lines;
  }
  /**
   * @returns {string} JSON log of recorded type errors, e.g. for AI debugging context.
   */
  exportLog() {
    return JSON.stringify(this.eventLog, null, 2);
  }
  downloadLog() {
    const blob = new Blob([this.exportLog()], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'rti-errors.json';
    anchor.click();
    URL.revokeObjectURL(url);
  }
  get state() {
    /** @type {object[]} */
    const fullState = [];
    /**
     * @todo I would rather save loc/name because it's less likely to change in future... to keep state URL's alive
     */
    for (const key in this.warnings) {
      const e = this.warnings[key];
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
    const text = decodeBase64(base64);
    const json = JSON.parse(text);
    return json;
  }
  loadState() {
    const json = this.stateFromLocation;
    if (!json) {
      return false;
    }
    const {warnings} = this;
    for (const e of json) {
      const {loc, name, state} = e;
      /** @type {Warning|undefined} */
      let foundWarning;
      for (const key in warnings) {
        const warning = warnings[key];
        if (warning.loc === loc && warning.name === name) {
          foundWarning = warning;
          break;
        }
      }
      // If we didn't find it, create it.
      if (!foundWarning) {
        foundWarning = new Warning('msg', 'value', 'expect', loc, name);
        this.warnedTable?.append(foundWarning.tr);
        warnings[`${loc}-${name}`] = foundWarning;
      }
      foundWarning.state = state;
    }
    return true;
  }
  saveState() {
    const str = encodeBase64(JSON.stringify(this.state));
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
    const {warnings} = this;
    for (const key in warnings) {
      const warning = warnings[key];
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
    // Keep a capped, serializable log for download/AI context. Recorded
    // first so a UI rendering failure below can't lose the error. Values
    // are snapshotted bounded instead of referenced, so later mutation and
    // unserializable shapes can't corrupt the log.
    this.eventLog.push({timestamp: Date.now(), loc, name, key, expect, value: stringifyValue(value), valueToString, messages: [...strings], stack: this.captureStack()});
    if (this.eventLog.length > this.maxEventLogSize) {
      this.eventLog.splice(0, this.eventLog.length - this.maxEventLogSize);
    }
    let warnObj = this.warnings[key];
    if (!warnObj) {
      warnObj = new Warning(msg, value, expect, loc, name);
      this.warnedTable?.append(warnObj.tr);
      this.warnings[key] = warnObj;
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
    const warnObj = this.warnings[key];
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
export {niceDiv, TypePanel};
