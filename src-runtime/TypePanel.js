import {assertMode } from "./assertMode.js";
import {decodeBase64 } from "./base64.js";
import {encodeBase64 } from "./base64.js";
import {options    } from "./options.js";
import {createTable} from "./warnedTable.js";
import {stringifyValue} from "./stringifyValue.js";
import {RTI_VERSION, RTI_BUILD} from "./version.js";
import {formatCompare} from "./humanizeExpect.js";
import {explainMismatch} from "./explainMismatch.js";
import {buildTypeTree} from "./typeTree.js";
import {Warning    } from "./Warning.js";
import {Div, Span, Button, Input, Select, Option, H3, Pre, Details, Summary, genJsx} from "./jsx.js";
/**
 * @typedef {MessageEvent<{action: string}>} MessageEventRTI
 */
/**
 * Refreshes a warning row with the latest failure. Rows are keyed by
 * `loc-name`, so one row absorbs every call site hit: value, expect,
 * message and strings must ALL follow the latest error, otherwise the
 * modal explains one call's value with another call's type.
 * @param {import('./Warning.js').Warning} warnObj - The row to refresh.
 * @param {object} error - The latest failure.
 * @param {*} error.value - The latest wrong value.
 * @param {*} error.expect - The latest expected type.
 * @param {string} error.msg - The latest short message.
 * @param {string[]} error.strings - The latest validator messages.
 */
function refreshWarning(warnObj, {value, expect, msg, strings}) {
  // The value may change and we only show the latest wrong value.
  warnObj.value = value;
  // Same for the expected type: template inference re-substitutes per call,
  // so a stale expect contradicts the fresh value.
  warnObj.expect = expect;
  // Message may change aswell, especially after loading state.
  warnObj.msg = msg;
  warnObj.detailStrings = [...strings];
}
const Style = genJsx('style');
const Label = genJsx('label');
/**
 * @param {HTMLDivElement} div - The <div>.
 */
function niceDiv(div) {
  div.style.border  = "1px solid #0058e6";
  div.style.margin = "10px";
  div.style.padding = "0px";
  div.style.textAlign = "left";
  div.style.lineHeight = "25px";
  div.style.backgroundColor = "#F3F3F3";
  div.style.borderRadius = "8px 8px 4px 4px";
  div.style.overflow = "hidden";
  div.style.position = "relative";
  div.style.minWidth = "320px";
  div.style.minHeight = "120px";
  // Viewport caps (not 70vh): with a full table the window already sat at the
  // old cap, so south-resizing visibly did nothing. The body scrolls instead.
  div.style.maxWidth = "calc(100vw - 20px)";
  div.style.maxHeight = "calc(100vh - 20px)";
  div.style.width = "640px";
  div.style.boxShadow = "2px 2px 8px rgba(0, 0, 0, 0.3)";
  // Flex column so the warning table (`rti-body`) grows/shrinks with the
  // window when resizing instead of being stuck at a fixed max-height.
  div.style.display = "flex";
  div.style.flexDirection = "column";
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
    .rti-toolbar {
      user-select: none;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      align-items: center;
      padding: 6px 8px;
      flex: none;
      position: relative;
    }
    .rti-menu-btn {
      margin-left: auto;
      font-weight: bold;
    }
    .rti-menu {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 20;
      background: white;
      color: black;
      border: 1px solid #888;
      border-radius: 4px;
      box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
      padding: 6px 10px;
      min-width: 210px;
    }
    .rti-titlebar {
      cursor: move;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 3px 4px 3px 8px;
      background: linear-gradient(to bottom, #3d95ff 0%, #0058e6 100%);
      color: white;
      font-weight: bold;
      border-radius: 6px 6px 0 0;
      flex: none;
    }
    .rti-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }
    .rti-titlebar.rti-inactive {
      background: linear-gradient(to bottom, #b8c7e8 0%, #7f8ba3 100%);
      color: #f0f0f0;
    }
    .rti-caption {
      display: flex;
      gap: 2px;
      align-items: center;
    }
    .rti-caption button {
      cursor: pointer;
      width: 22px;
      height: 20px;
      line-height: 1;
      padding: 0;
      font-weight: bold;
    }
    .rti-body {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      padding: 0 8px 8px 8px;
    }
    .rti-body table {
      width: 100%;
    }
    .rti-all {
      overflow: unset;
    }
    .rti-handle {
      position: absolute;
      z-index: 5;
    }
    .rti-handle-e {
      cursor: e-resize;
      top: 8px;
      right: 0;
      width: 8px;
      bottom: 8px;
    }
    .rti-handle-w {
      cursor: w-resize;
      top: 8px;
      left: 0;
      width: 8px;
      bottom: 8px;
    }
    .rti-handle-s {
      cursor: s-resize;
      left: 8px;
      right: 8px;
      bottom: 0;
      height: 8px;
    }
    .rti-handle-n {
      cursor: n-resize;
      left: 8px;
      right: 8px;
      top: 0;
      height: 5px;
    }
    .rti-handle-se {
      cursor: se-resize;
      right: 0;
      bottom: 0;
      width: 14px;
      height: 14px;
      z-index: 6;
    }
    .rti-handle-sw {
      cursor: sw-resize;
      left: 0;
      bottom: 0;
      width: 14px;
      height: 14px;
      z-index: 6;
    }
    .rti-handle-ne {
      cursor: ne-resize;
      right: 0;
      top: 0;
      width: 10px;
      height: 10px;
      z-index: 6;
    }
    .rti-handle-nw {
      cursor: nw-resize;
      left: 0;
      top: 0;
      width: 10px;
      height: 10px;
      z-index: 6;
    }
    .rti-popped {
      left: 0 !important;
      top: 0 !important;
      right: auto !important;
      bottom: auto !important;
      width: 100% !important;
      position: static !important;
      margin: 0 !important;
    }
    .rti-popped .rti {
      width: 100% !important;
      max-width: none !important;
      max-height: none !important;
      height: 100vh !important;
      margin: 0 !important;
      border-radius: 0 !important;
    }
    .rti-popped .rti-titlebar {
      border-radius: 0 !important;
    }
    .rti-popped .rti-body {
      max-height: calc(100vh - 110px) !important;
    }
    .rti-taskbar {
      position: fixed;
      left: 0;
      bottom: 0;
      z-index: 10001;
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 3px 6px;
      background: linear-gradient(to bottom, #3d95ff 0%, #0058e6 100%);
      color: white;
      border: 1px solid #0058e6;
      border-radius: 0 6px 0 0;
      font-size: 12px;
      line-height: 20px;
    }
    .rti-taskbar button {
      cursor: pointer;
      font-weight: bold;
    }
    .rti-taskbar-entry {
      background: rgba(255, 255, 255, 0.25);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.55);
      border-radius: 3px;
    }
    .rti-taskbar-active {
      background: #ffffff;
      color: #003399;
    }
    .rti-setting-row {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 2px 0;
      white-space: nowrap;
    }
    .rti-compare-win {
      position: fixed;
      display: flex;
      flex-direction: column;
      border: 1px solid #0058e6;
      border-radius: 8px 8px 4px 4px;
      background: #F3F3F3;
      color: black;
      box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.4);
      width: min(92vw, 760px);
      max-height: 85vh;
      overflow: hidden;
    }
    .rti-compare-win .rti-titlebar {
      border-radius: 6px 6px 0 0;
      flex: none;
    }
    .rti-compare-body {
      overflow: auto;
      padding: 4px 16px 16px 16px;
    }
    .rti-compare {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .rti-compare pre {
      background: #eee;
      padding: 10px;
      overflow: auto;
      font-size: 12px;
      white-space: pre-wrap;
      word-break: break-all;
    }
    .rti-expect summary {
      cursor: pointer;
      color: #0645ad;
    }
    .rti-finding {
      border-left: 3px solid #888;
      padding: 4px 8px;
      margin: 6px 0;
      background: #fafafa;
    }
    .rti-finding-missing {
      border-left-color: #d00;
    }
    .rti-finding-wrong, .rti-finding-not-object {
      border-left-color: #e80;
    }
    .rti-finding-union {
      border-left-color: #05e;
    }
    .rti-finding-extra {
      border-left-color: #888;
    }
    .rti-finding-info {
      border-left-color: #aaa;
      background: #f5f5f5;
    }
    .rti-path {
      font-family: monospace;
      font-weight: bold;
    }
    .rti-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: bold;
      border-radius: 3px;
      padding: 0 5px;
      margin-right: 6px;
      background: #ddd;
    }
    .rti-fix {
      color: #060;
    }
    .rti-tree details {
      margin-left: 14px;
    }
    .rti-tree summary {
      cursor: pointer;
    }
    .rti-pass {
      color: #060;
      font-weight: bold;
    }
    .rti-fail {
      color: #d00;
      font-weight: bold;
    }
    .rti-kind {
      display: inline-block;
      font-size: 11px;
      border-radius: 3px;
      padding: 0 5px;
      margin: 0 6px;
      background: #dde7ff;
    }
    .rti-chip {
      display: inline-block;
      font-family: monospace;
      border: 1px solid #888;
      border-radius: 3px;
      padding: 0 5px;
      margin: 1px 2px;
      background: white;
    }
    .rti-chip-ok {
      background: #dfd;
      border-color: #060;
    }
    .rti-chip-bad {
      background: #fdd;
      border-color: #d00;
    }
    .rti-entered {
      display: inline-block;
      font-size: 11px;
      font-weight: bold;
      border-radius: 3px;
      padding: 0 5px;
      margin-left: 6px;
      background: #dfd;
    }
    .rti-skipped {
      display: inline-block;
      font-size: 11px;
      border-radius: 3px;
      padding: 0 5px;
      margin-left: 6px;
      background: #eee;
      color: #666;
    }
    .rti-dimmed {
      opacity: 0.55;
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
function isCheckInfinity() {
  const tmp = localStorage.getItem('rti-check-infinity');
  return tmp === null || tmp === 'true';
}
function isExactObjects() {
  return localStorage.getItem('rti-exact-objects') !== 'false';
}
/**
 * Asserts a panel start position, falling back to the default corner.
 * @param {unknown} value - Candidate position.
 * @returns {'bottom-right'|'bottom-left'|'top-right'|'top-left'|'center'} Valid position.
 */
function assertPanelPosition(value) {
  if (value === 'bottom-left' || value === 'top-right' || value === 'top-left' || value === 'center') {
    return value;
  }
  return 'bottom-right';
}
/**
 * Validated start corner for a fresh panel (`rti-panel-position`).
 * @returns {'bottom-right'|'bottom-left'|'top-right'|'top-left'|'center'} Start position.
 */
function isPanelPosition() {
  return assertPanelPosition(localStorage.getItem('rti-panel-position'));
}
class TypePanel {
  /** @type {HTMLDivElement | null} */
  static divAll = null;
  /** @type {TypePanel | null} */
  static instance = null;
  /** Views already carrying the shrink-revive listener (main + pop-outs). */
  static viewportClampedViews = new Set();
  /** @type {HTMLDivElement} */
  div;
  /** @type {HTMLInputElement} */
  inputEnable;
  /** @type {HTMLInputElement} */
  inputStrict;
  /** @type {HTMLInputElement} */
  inputInfinity;
  /** @type {HTMLInputElement} */
  inputExact;
  /** @type {HTMLSpanElement} */
  spanErrors;
  /** @type {HTMLSpanElement} */
  span;
  /** @type {HTMLSpanElement} */
  spanStrict;
  /** @type {HTMLSpanElement} */
  spanInfinity;
  /** @type {HTMLSpanElement} */
  spanExact;
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
  /** @type {HTMLButtonElement} */
  buttonPopout;
  /** @type {HTMLDivElement} */
  titlebar;
  /** @type {HTMLSpanElement} */
  titleText;
  /** @type {HTMLDivElement} */
  toolbar;
  /** @type {HTMLButtonElement} */
  menuButton;
  /** @type {HTMLDivElement} */
  menu;
  /** @type {((e: Event) => void) | null} */
  menuCloser = null;
  /** @type {HTMLDivElement} */
  body;
  /** @type {HTMLDivElement} */
  taskbar;
  /** @type {HTMLButtonElement} */
  taskbarRti;
  /** @type {HTMLDivElement} */
  taskbarWins;
  /** @type {string | null} */
  poppedDivAllCss = null;
  /** @type {string | null} */
  poppedDivCss = null;
  /** @type {string | null} */
  poppedTitleCss = null;
  /** @type {string | null} */
  poppedBodyCss = null;
  /** @type {Window | null} */
  popoutWin = null;
  /** @type {Map<string, {el: HTMLDivElement, minimized: boolean}>} */
  compareWins = new Map();
  /** @type {string[]} */
  compareFocus = [];
  winZ = 10002;
  winSeq = 0;
  /** @type {Set<Document>} */
  escDocs = new Set();
  /** @type {Set<Document>} */
  focusDocs = new Set();
  warnedTable;
  /** @type {Record<string, import('./Warning.js').Warning>} */
  warnings = {};
  /** @type {object[]} */
  eventLog = [];
  maxEventLogSize = 1000;
  maxStackFrames = 20;
  constructor() {
    // Single panel by design (one shared wrapper, one message stream):
    // re-evaluating `new TypePanel()` (REPL Shift-Enter) refreshes and
    // reveals the existing panel instead of stacking dead twins whose
    // identical windows made clicks appear to do nothing. But a detached
    // wrapper (closed pop-out, wiped body, replaced root) is a corpse:
    // handing it back would keep appending new errors into dead nodes
    // where nobody can see them, so that rebuilds fresh instead.
    if (TypePanel.instance && TypePanel.divAll?.isConnected) {
      TypePanel.instance.clear();
      TypePanel.instance.show();
      // Singleton hand-back: returning an object overrides `this` by design.
      // eslint-disable-next-line no-constructor-return
      return TypePanel.instance;
    }
    if (TypePanel.divAll && !TypePanel.divAll.isConnected) {
      TypePanel.divAll.remove();
      TypePanel.divAll = null;
    }
    TypePanel.instance = this;
    // Shrink-revive: viewport resizes (docked devtools, unplugged monitor)
    // re-clamp every window back on-screen. Pop-out views wire in ensureFocus.
    this.ensureViewportClamp(typeof window === 'undefined' ? null : window);
    // UI IS THE SOURCE-OF-TRUTH: build nodes declaratively, read `checked`/
    // `value`/children straight off the DOM, never mirror them in JS state.
    // (Sizing/positioning lives in `niceDiv` + saved geometry, not here.)
    this.div = Div({});
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
    this.inputInfinity = Input({type: 'checkbox', checked: isCheckInfinity(), onchange: () => {
      options.checkInfinity = this.inputInfinity.checked;
      localStorage.setItem('rti-check-infinity', String(this.inputInfinity.checked));
      this.sendInfinityStateToWorker();
    }});
    this.inputExact = Input({type: 'checkbox', checked: isExactObjects(), onchange: () => {
      options.exactObjects = this.inputExact.checked;
      localStorage.setItem('rti-exact-objects', String(this.inputExact.checked));
      this.sendExactStateToWorker();
    }});
    this.spanErrors = Span({});
    this.span = Span({innerText: 'Report mode:'});
    this.spanStrict = Span({innerText: ' Strict null checks'});
    this.spanInfinity = Span({innerText: ' Check Infinity'});
    this.spanExact = Span({innerText: ' Exact objects'});
    this.option_spam = Option({text: 'spam'});
    this.option_once = Option({text: 'once'});
    this.option_never = Option({text: 'never'});
    this.select = Select({onchange: () => {
      const {value} = this.select;
      localStorage.setItem('rti-spam-type-reports', value);
      assertMode(value);
      options.mode = value;
    }}, this.option_spam, this.option_once, this.option_never);
    this.spanPosition = Span({innerText: ' Panel start:'});
    this.option_pos_bottom_right = Option({text: 'bottom-right'});
    this.option_pos_bottom_left = Option({text: 'bottom-left'});
    this.option_pos_top_right = Option({text: 'top-right'});
    this.option_pos_top_left = Option({text: 'top-left'});
    this.option_pos_center = Option({text: 'center'});
    this.selectPosition = Select({onchange: () => this.applyChosenPosition()},
                                 this.option_pos_bottom_right, this.option_pos_bottom_left,
                                 this.option_pos_top_right, this.option_pos_top_left, this.option_pos_center);
    this.buttonHide = Button({textContent: '_', title: 'Hide', onclick: () => this.hide()});
    this.buttonLoadState = Button({textContent: 'Load state', onclick: () => this.loadState()});
    this.buttonSaveState = Button({textContent: 'Save state', onclick: () => this.saveState()});
    this.buttonClear = Button({textContent: 'Clear', onclick: () => this.clear()});
    this.buttonDownloadLog = Button({textContent: 'Download log', onclick: () => this.downloadLog()});
    this.buttonPopout = Button({textContent: '⧉', title: 'Pop out to own window', onclick: () => this.popout()});
    this.titleText = Span({className: 'rti-title', textContent: 'Runtime Type Inspector'});
    this.titlebar = Div({className: 'rti-titlebar', title: 'Drag to move panel'},
                        this.titleText,
                        Div({className: 'rti-caption'}, this.buttonHide, this.buttonPopout));
    // Chrome-style overflow menu: status + frequent actions stay visible,
    // rare configuration lives behind `⋮` and costs zero lines when closed.
    this.menuButton = Button({
      className: 'rti-menu-btn', textContent: '⋮', title: 'Settings',
      onclick: (e) => {
        e.stopPropagation();
        this.toggleMenu();
      },
    });
    this.menu = Div({className: 'rti-menu', hidden: true, role: 'menu'},
                    Div({className: 'rti-setting-row'},
                        Label({}, this.inputEnable, ' Enabled')),
                    Div({className: 'rti-setting-row'},
                        Label({}, this.span, ' ', this.select)),
                    Div({className: 'rti-setting-row'},
                        Label({}, this.spanPosition, ' ', this.selectPosition)),
                    Div({className: 'rti-setting-row'},
                        Label({}, this.inputStrict, this.spanStrict)),
                    Div({className: 'rti-setting-row'},
                        Label({}, this.inputInfinity, this.spanInfinity)),
                    Div({className: 'rti-setting-row'},
                        Label({}, this.inputExact, this.spanExact)),
                    Div({className: 'rti-setting-row'},
                        this.buttonLoadState, this.buttonSaveState));
    this.menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.toggleMenu(false);
        this.menuButton.focus();
      }
    });
    this.toolbar = Div({className: 'rti-toolbar'},
                       this.spanErrors, this.buttonClear, this.buttonDownloadLog,
                       this.menuButton, this.menu);
    this.body = Div({className: 'rti-body'});
    this.warnedTable = createTable();
    this.body.append(this.warnedTable);
    // Mini taskbar (our stand-in for the missing OS taskbar): the panel is
    // just another entry, and every entry toggles — open minimizes,
    // minimized maximizes. The error count lives in the RTI title.
    this.taskbarRti = Button({textContent: 'RTI', title: 'Focus RTI panel', onclick: () => this.togglePanel()});
    this.taskbarWins = Span({});
    this.taskbar = Div({className: 'rti-taskbar', style: {display: 'none'}},
                       this.taskbarRti, this.taskbarWins);
    const {
      div, titlebar, toolbar, body,
    } = this;
    const {inputEnable, inputStrict, inputInfinity, inputExact, select} = this;
    TypePanel.divAll ??= Div({
      className: 'rti-all',
      style: {position: 'fixed', bottom: '0px', right: '0px', zIndex: '10000', overflow: 'unset'},
    });
    const {divAll} = TypePanel;
    niceDiv(div);
    inputEnable.onchange();
    inputStrict.onchange();
    inputInfinity.onchange();
    inputExact.onchange();
    const spamTypeReports = localStorage.getItem('rti-spam-type-reports');
    select.value = options.mode;
    if (spamTypeReports !== null) {
      select.value = spamTypeReports;
    }
    select.onchange(); // set mode in options
    div.append(titlebar, toolbar, body);
    for (const dir of ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']) {
      const handle = Div({className: `rti-handle rti-handle-${dir}`, dataset: {dir}});
      div.append(handle);
      this.makeResizable(handle, dir, this.div, TypePanel.divAll, () => this.saveGeometry());
    }
    divAll.append(div);
    const positionRestored = this.applyGeometry();
    this.selectPosition.value = options.panelPosition;
    const storedPosition = localStorage.getItem('rti-panel-position');
    if (storedPosition !== null) {
      this.selectPosition.value = storedPosition;
    }
    if (positionRestored) {
      // A persisted drag wins over the start position; still normalize.
      options.panelPosition = assertPanelPosition(this.selectPosition.value);
    } else {
      this.applyChosenPosition();
    }
    this.makeDraggable(titlebar, divAll);
    this.observeGeometry(div);
    const finalFunc = () => {
      document.body.append(divAll);
      document.body.append(this.taskbar);
      if (!positionRestored) {
        // Center needs layout: re-dock fresh panels once measurable.
        this.applyStartPosition();
      }
    };
    // Add our <div> to <body> when possible
    if (document.readyState === "complete") {
      finalFunc();
    } else {
      // add when page is loaded
      document.addEventListener("DOMContentLoaded", finalFunc);
    }
    this.loadState();
    this.updateTaskbarVisibility();
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
    // Fresh panel starts front and active (it is the only thing on screen),
    // so the first RTI taskbar click minimizes instead of no-op fronting.
    this.setActive('panel');
  }
  hide() {
    this.div.style.display = 'none';
    this.updateTaskbarVisibility();
    this.refreshCompareTaskbar();
    this.settleActive();
  }
  show() {
    this.div.style.display = '';
    this.updateTaskbarVisibility();
    this.refreshCompareTaskbar();
    this.frontPanel();
  }
  /**
   * Taskbar entry for the panel: hidden shows it, inactive fronts it,
   * active minimizes it — plain XP toggle semantics.
   */
  togglePanel() {
    if (this.div.style.display === 'none') {
      this.show();
    } else if (this.activeWindow === 'panel') {
      this.hide();
    } else {
      this.frontPanel();
    }
  }
  /**
   * Taskbar entry for a compare window: minimized reopens, inactive
   * focuses, active minimizes — plain XP toggle semantics.
   * @param {string} key - The warning key.
   */
  toggleCompare(key) {
    const win = this.compareWins.get(key);
    if (!win) {
      return;
    }
    if (win.minimized) {
      this.restoreCompare(key);
    } else if (this.activeWindow === key) {
      this.minimizeCompare(key);
    } else {
      this.focusCompare(key);
    }
  }
  /**
   * The taskbar is always visible: it holds the panel entry plus every open
   * compare window, so there is always a way back.
   */
  updateTaskbarVisibility() {
    if (!this.taskbar) {
      return;
    }
    this.taskbar.style.display = '';
  }
  /**
   * Chrome-style `⋮` overflow menu: outside pointer-down or `Escape` closes.
   * @param {boolean} [force] - Force open/closed instead of toggling.
   */
  toggleMenu(force) {
    const show = force !== undefined ? force : this.menu.hidden;
    this.menu.hidden = !show;
    this.menuButton.setAttribute('aria-expanded', String(show));
    if (show) {
      this.menuCloser = (e) => {
        const target = /** @type {HTMLElement} */ (e.target);
        if (!this.menu.hidden && !this.menu.contains(target) && !this.menuButton.contains(target)) {
          this.toggleMenu(false);
        }
      };
      document.addEventListener('pointerdown', this.menuCloser, true);
    } else if (this.menuCloser) {
      document.removeEventListener('pointerdown', this.menuCloser, true);
      this.menuCloser = null;
    }
  }
  /**
   * Restores persisted panel size/position (bottom-right defaults).
   * Persisted positions predate the viewport clamp (or the screen shrank
   * since), so they are clamped back on-screen: a reviveable panel.
   * @returns {boolean} True when a persisted position was restored.
   */
  applyGeometry() {
    try {
      const raw = localStorage.getItem('rti-panel-geometry');
      if (!raw) {
        return false;
      }
      const geo = JSON.parse(raw);
      if (geo.width) {
        this.div.style.width = geo.width;
      }
      if (geo.height) {
        this.div.style.height = geo.height;
      }
      const {divAll} = TypePanel;
      if (geo.left !== undefined && geo.top !== undefined) {
        divAll.style.left = geo.left;
        divAll.style.top = geo.top;
        divAll.style.right = 'auto';
        divAll.style.bottom = 'auto';
        const left = Number.parseFloat(divAll.style.left);
        const top = Number.parseFloat(divAll.style.top);
        if (Number.isFinite(left) && Number.isFinite(top)) {
          const pos = this.clampToViewport(divAll, left, top, this.titlebar?.offsetHeight || 28);
          divAll.style.left = `${pos.x}px`;
          divAll.style.top = `${pos.y}px`;
        }
        return true;
      }
      return false;
    } catch {
      // Corrupt geometry must never break the panel.
      return false;
    }
  }
  /**
   * Docks a fresh (never-moved) panel at the configured start position:
   * a corner re-anchors, `center` measures the live size once laid out.
   * Persisted drag positions win over it — callers skip this when
   * geometry was restored.
   */
  applyStartPosition() {
    const {divAll} = TypePanel;
    if (!divAll || typeof window === 'undefined') {
      return;
    }
    const pos = options.panelPosition;
    divAll.style.position = 'fixed';
    if (pos === 'center') {
      // Fallbacks only cover measuring before layout; finalFunc re-docks
      // once appended, and the menu path always measures laid-out DOM.
      const w = divAll.offsetWidth || 640;
      const h = divAll.offsetHeight || 320;
      const at = this.clampToViewport(divAll,
                                      Math.round(window.innerWidth / 2 - w / 2),
                                      Math.round(window.innerHeight / 2 - h / 2));
      divAll.style.left = `${at.x}px`;
      divAll.style.top = `${at.y}px`;
      divAll.style.right = 'auto';
      divAll.style.bottom = 'auto';
      return;
    }
    const top = pos.startsWith('top');
    const leftSide = pos.endsWith('left');
    divAll.style.top = top ? '0px' : 'auto';
    divAll.style.bottom = top ? 'auto' : '0px';
    divAll.style.left = leftSide ? '0px' : 'auto';
    divAll.style.right = leftSide ? 'auto' : '0px';
  }
  /**
   * Applies the settings-menu start position: validates the select,
   * persists it, and re-docks a fresh panel live.
   */
  applyChosenPosition() {
    const pos = assertPanelPosition(this.selectPosition.value);
    this.selectPosition.value = pos;
    localStorage.setItem('rti-panel-position', pos);
    options.panelPosition = pos;
    this.applyStartPosition();
  }
  /**
   * Persists current panel size/position for the next page load.
   */
  saveGeometry() {
    try {
      const {divAll} = TypePanel;
      localStorage.setItem('rti-panel-geometry', JSON.stringify({
        width: this.div.style.width || undefined,
        height: this.div.style.height || undefined,
        left: divAll.style.left || undefined,
        top: divAll.style.top || undefined,
      }));
    } catch {
      // Storage may be unavailable; panel still works.
    }
  }
  /**
   * Records resizes so a bigger panel survives reloads.
   * @param {HTMLDivElement} div - The panel body.
   */
  observeGeometry(div) {
    if (typeof ResizeObserver === 'undefined') {
      div.addEventListener('mouseup', () => this.saveGeometry());
      return;
    }
    let timer;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => this.saveGeometry(), 200);
    });
    observer.observe(div);
  }
  /**
   * Activates whatever window a grab started on: compare windows by key,
   * the main panel wrapper otherwise. Grabbing always marks, like any OS.
   * @param {HTMLElement} root - The dragged/resized wrapper.
   */
  activateRoot(root) {
    const key = root?.dataset?.rtiWin;
    if (key && this.compareWins.has(key)) {
      this.focusCompare(key);
    } else if (root === TypePanel.divAll) {
      this.frontPanel();
    }
  }
  /**
   * Pulls every explicitly-positioned window back on-screen (panel plus
   * all live compare windows). Runs on viewport resize: docking devtools
   * or unplugging a monitor shrinks the viewport, stranding positions
   * that were valid a moment ago with no grab left to revive them.
   * Bottom/right-anchored panels are skipped — anchoring can't strand.
   */
  clampAllToViewport() {
    const {divAll} = TypePanel;
    if (divAll) {
      const left = Number.parseFloat(divAll.style.left);
      const top = Number.parseFloat(divAll.style.top);
      if (Number.isFinite(left) && Number.isFinite(top)) {
        const pos = this.clampToViewport(divAll, left, top, this.titlebar?.offsetHeight || 28);
        divAll.style.left = `${pos.x}px`;
        divAll.style.top = `${pos.y}px`;
      }
    }
    for (const win of this.compareWins.values()) {
      if (!win.el?.isConnected) {
        continue;
      }
      const left = Number.parseFloat(win.el.style.left);
      const top = Number.parseFloat(win.el.style.top);
      if (!Number.isFinite(left) || !Number.isFinite(top)) {
        continue;
      }
      const pos = this.clampToViewport(win.el, left, top, win.titlebar?.offsetHeight || 28);
      win.el.style.left = `${pos.x}px`;
      win.el.style.top = `${pos.y}px`;
    }
  }
  /**
   * Wires the shrink-revive listener once per view (main window plus any
   * popped-out one). The handler always goes through the live singleton,
   * so rebuilt panels never stack duplicate listeners.
   * @param {Window|null} view - The view to watch.
   */
  ensureViewportClamp(view) {
    if (!view || typeof view.addEventListener !== 'function' || TypePanel.viewportClampedViews.has(view)) {
      return;
    }
    TypePanel.viewportClampedViews.add(view);
    view.addEventListener('resize', () => TypePanel.instance?.clampAllToViewport());
  }
  /**
   * XP rule: a window is never draggable fully off-screen — its caption
   * stays on-screen and grabbable, so every window stays "reviveable".
   * Clamps a desired left/top so the top edge (caption) never leaves the
   * viewport vertically and a horizontal sliver always stays reachable.
   * @param {HTMLElement} root - The positioned wrapper being moved.
   * @param {number} x - Desired left in px.
   * @param {number} y - Desired top in px.
   * @param {number} [captionH] - Caption height to keep visible.
   * @returns {{x: number, y: number}} Clamped position.
   */
  clampToViewport(root, x, y, captionH = 28) {
    const vw = typeof window === 'undefined' ? undefined : window.innerWidth;
    const vh = typeof window === 'undefined' ? undefined : window.innerHeight;
    if (!Number.isFinite(vw) || !Number.isFinite(vh)) {
      return {x, y};
    }
    const rect = root.getBoundingClientRect?.();
    const w = rect?.width || root.offsetWidth || 0;
    const gripX = 64;
    const cap = Math.max(1, captionH || 28);
    return {
      x: Math.min(Math.max(x, gripX - w), vw - gripX),
      y: Math.min(Math.max(y, 0), Math.max(0, vh - cap)),
    };
  }
  /**
   * Makes the panel movable by dragging the blue titlebar only (XP style).
   * Clicks on caption buttons (`-`, pop-out) never start a drag. The
   * caption is clamped into the viewport: it can never be dragged
   * off-screen and lost.
   * @param {HTMLElement} handle - The titlebar to drag by.
   * @param {HTMLElement} root - The positioned wrapper to move.
   */
  makeDraggable(handle, root) {
    handle.addEventListener('mousedown', (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (target.closest('button')) {
        return;
      }
      this.activateRoot(root);
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const rect = root.getBoundingClientRect();
      // Switch from bottom/right anchoring to explicit left/top while dragging.
      root.style.left = `${rect.left}px`;
      root.style.top = `${rect.top}px`;
      root.style.right = 'auto';
      root.style.bottom = 'auto';
      root.style.position = 'fixed';
      const captionH = handle.offsetHeight || 28;
      const onMove = (ev) => {
        const pos = this.clampToViewport(root, rect.left + ev.clientX - startX, rect.top + ev.clientY - startY, captionH);
        root.style.left = `${pos.x}px`;
        root.style.top = `${pos.y}px`;
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        this.saveGeometry();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
  /**
   * XP-style 8-direction resizing with matching resize cursors (see
   * `.rti-handle-*`). Only the edge/corner grips resize; the body/table area
   * never does. The top (`n`) grip is a thin strip overlaying the titlebar's
   * top pixels: it is a sibling of the titlebar (not a child), so grabbing
   * the strip resizes while grabbing anywhere below it drags — no conflation.
   * West/north grips also move the wrapper, switching it from bottom/right
   * anchoring to explicit left/top just like dragging does.
   * @param {HTMLElement} handle - The edge/corner grip.
   * @param {string} dir - Resize direction (`e`, `w`, `n`, `s` and combos).
   * @param {HTMLElement} box - The window body to resize.
   * @param {HTMLElement} root - The positioned wrapper to move for w/n grips.
   * @param {Function} onDone - Called on mouse-up (e.g. persist geometry).
   */
  makeResizable(handle, dir, box, root, onDone) {
    handle.addEventListener('mousedown', (e) => {
      this.activateRoot(root);
      e.preventDefault();
      e.stopPropagation();
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = box.offsetWidth;
      const startH = box.offsetHeight;
      const rect = root.getBoundingClientRect();
      // Anchor explicitly so west/north growth can push left/top around.
      root.style.left = `${rect.left}px`;
      root.style.top = `${rect.top}px`;
      root.style.right = 'auto';
      root.style.bottom = 'auto';
      root.style.position = 'fixed';
      const minW = 320;
      const minH = 120;
      const onMove = (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (dir.includes('e')) {
          box.style.width = `${Math.max(minW, startW + dx)}px`;
        }
        if (dir.includes('s')) {
          box.style.height = `${Math.max(minH, startH + dy)}px`;
        }
        if (dir.includes('w')) {
          const grow = Math.min(dx, startW - minW);
          box.style.width = `${startW - grow}px`;
          const topNow = Number.parseFloat(root.style.top) || rect.top;
          root.style.left = `${this.clampToViewport(root, rect.left + grow, topNow).x}px`;
        }
        if (dir.includes('n')) {
          const grow = Math.min(dy, startH - minH);
          box.style.height = `${startH - grow}px`;
          const leftNow = Number.parseFloat(root.style.left) || rect.left;
          root.style.top = `${this.clampToViewport(root, leftNow, rect.top + grow).y}px`;
        }
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        onDone();
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }
  /**
   * Pops the panel into a separate window (e.g. a 2nd screen); toggles back.
   * The popup opens where/how big the panel currently is, and while popped
   * out the panel fills the whole popup window via inline styles (no
   * dependence on cloned stylesheets). Docking restores exact inline styles.
   */
  popout() {
    if (this.popoutWin && !this.popoutWin.closed) {
      this.dock();
      this.popoutWin.close();
      this.popoutWin = null;
      this.buttonPopout.textContent = '⧉';
      this.buttonPopout.title = 'Pop out to own window';
      return;
    }
    const rect = this.div.getBoundingClientRect();
    const width = Math.max(320, Math.round(rect.width) || 800);
    const height = Math.max(120, Math.round(rect.height) || 600);
    const screenX = typeof window.screenX === 'number' ? window.screenX : 0;
    const screenY = typeof window.screenY === 'number' ? window.screenY : 0;
    const left = Math.round(screenX + (rect.left || 0));
    const top = Math.round(screenY + (rect.top || 0));
    const popup = window.open('', 'rti-panel', `width=${width},height=${height},left=${left},top=${top}`);
    if (!popup) {
      console.warn('RTI pop-out blocked by the browser.');
      return;
    }
    popup.document.title = 'RTI Type Panel';
    for (const node of document.querySelectorAll('style')) {
      popup.document.head.appendChild(node.cloneNode(true));
    }
    this.poppedDivAllCss = TypePanel.divAll.style.cssText;
    this.poppedDivCss = this.div.style.cssText;
    this.poppedTitleCss = this.titlebar.style.cssText;
    this.poppedBodyCss = this.body.style.cssText;
    popup.document.body.style.margin = '0';
    popup.document.body.style.padding = '0';
    popup.document.body.append(TypePanel.divAll);
    for (const [, win] of this.compareWins) {
      popup.document.body.append(win.el);
    }
    this.ensureEsc(popup.document);
    this.ensureFocus(popup.document);
    // Fill the popup window; flex column lets the body take leftover space no
    // matter how tall the wrapped toolbar is (no magic-number max-heights).
    Object.assign(TypePanel.divAll.style, {
      position: 'static', left: '', top: '', right: '', bottom: '',
      width: '100%', margin: '0', zIndex: '',
    });
    Object.assign(this.div.style, {
      width: '100%', maxWidth: 'none', maxHeight: 'none', height: '100vh',
      margin: '0', borderRadius: '0', border: 'none', boxShadow: 'none',
      display: 'flex', flexDirection: 'column',
    });
    Object.assign(this.titlebar.style, {borderRadius: '0'});
    Object.assign(this.body.style, {
      flex: '1', minHeight: '0', maxHeight: 'none', overflow: 'auto',
    });
    TypePanel.divAll.classList.add('rti-popped');
    popup.addEventListener('beforeunload', () => {
      this.dock();
      this.popoutWin = null;
      this.buttonPopout.textContent = '⧉';
      this.buttonPopout.title = 'Pop out to own window';
    });
    this.popoutWin = popup;
    this.buttonPopout.textContent = '🗗';
    this.buttonPopout.title = 'Dock back to page';
  }
  /**
   * Moves the panel back into the page and restores its pre-popout styles,
   * then re-applies the persisted docked size/position.
   */
  dock() {
    if (TypePanel.divAll) {
      TypePanel.divAll.classList.remove('rti-popped');
      document.body.append(TypePanel.divAll);
      // Compare windows come home too, or they'd die with the popup.
      for (const [, win] of this.compareWins) {
        document.body.append(win.el);
      }
      if (this.poppedDivAllCss !== null) {
        TypePanel.divAll.style.cssText = this.poppedDivAllCss;
      }
      if (this.poppedDivCss !== null) {
        this.div.style.cssText = this.poppedDivCss;
      }
      if (this.poppedTitleCss !== null) {
        this.titlebar.style.cssText = this.poppedTitleCss;
      }
      if (this.poppedBodyCss !== null) {
        this.body.style.cssText = this.poppedBodyCss;
      }
      this.poppedDivAllCss = null;
      this.poppedDivCss = null;
      this.poppedTitleCss = null;
      this.poppedBodyCss = null;
      this.applyGeometry();
    }
  }
  /**
   * Renders one diagnosis finding as an interactive row. Union findings
   * expand to the closest member's own findings; everything is selectable.
   * @param {object} finding - One `explainMismatch` finding.
   * @returns {HTMLElement} The row element.
   */
  renderFinding(finding) {
    const row = Div({className: `rti-finding rti-finding-${finding.kind}${finding.info ? ' rti-finding-info' : ''}`},
                    Div({},
                        Span({className: 'rti-badge', textContent: finding.info ? `${finding.kind} · info` : finding.kind}),
                        Span({className: 'rti-path', textContent: finding.path})),
                    Div({textContent: finding.detail || ''}),
                    Div({textContent: `expected ${finding.expected}, got ${finding.actual}`}));
    if (finding.fix) {
      row.append(Div({className: 'rti-fix', textContent: `→ ${finding.fix}`}));
    }
    if (finding.children?.length) {
      row.append(Details({open: finding.children.length <= 2},
                         Summary({textContent: `Closest match problems (${finding.children.length})`}),
                         ...finding.children.map((_) => this.renderFinding(_))));
    }
    return row;
  }
  /**
   * Renders one type-tree level as a climbable nested disclosure: hover any
   * row for the full type, expand to climb one level deeper. The actual value
   * is probed per level so ✗ pinpoints the failing depth; keyof levels list
   * every allowed key with the value marked present/missing. Condition
   * branches carry entered/not-entered marks instead of hiding a branch.
   * @param {object} node - One `buildTypeTree` node.
   * @param {number} depth - Nesting depth (first two levels start open).
   * @param {boolean} dimmed - True for a decided-away conditional branch.
   * @returns {HTMLElement} The tree element.
   */
  renderTypeNode(node, depth, dimmed = false) {
    const mark = node.passes === true ? '✓' : node.passes === false ? '✗' : '?';
    const markCls = node.passes === true ? 'rti-pass' : node.passes === false ? 'rti-fail' : '';
    const head = Summary({title: node.full},
                         Span({className: markCls, textContent: `${mark} `}),
                         Span({className: 'rti-path', textContent: node.label}),
                         Span({className: 'rti-kind', textContent: node.kind}));
    if (node.entered === true) {
      head.append(Span({className: 'rti-entered', textContent: 'entered'}));
    } else if (dimmed) {
      head.append(Span({className: 'rti-skipped', textContent: 'not entered'}));
    }
    const box = Div({className: dimmed ? 'rti-tree rti-dimmed' : 'rti-tree'});
    const open = Details({open: depth < 2 || node.passes === false}, head);
    if (node.detail) {
      open.append(Div({textContent: node.detail}));
    }
    if (node.fix) {
      open.append(Div({className: 'rti-fix', textContent: `→ ${node.fix}`}));
    }
    if (node.keys) {
      const chips = Div({},
                        Span({textContent: 'Allowed: '}),
                        ...node.keys.map((_) => Span({className: 'rti-chip', textContent: String(_) })));
      if (node.moreKeys > 0) {
        chips.append(Span({textContent: ` (+${node.moreKeys} more)`}));
      }
      if (node.valueInKeys === false) {
        chips.append(Div({},
                         Span({className: 'rti-chip rti-chip-bad', textContent: JSON.stringify(node.value ?? null) ?? '?'}),
                         Span({textContent: ' is not among them.'})));
        if (node.suggestion) {
          chips.append(Div({className: 'rti-fix', textContent: `→ Did you mean \`${node.suggestion}\`?`}));
        }
      } else if (node.valueInKeys === true) {
        chips.append(Div({},
                         Span({className: 'rti-chip rti-chip-ok', textContent: JSON.stringify(node.value ?? null) ?? '?'}),
                         Span({textContent: ' is allowed here — another level fails.'})));
      }
      open.append(chips);
    }
    if (node.children?.length) {
      const dimChild = (/** @type {object} */ _) => node.kind === 'condition' && node.decision !== undefined && _.entered !== true;
      open.append(...node.children.map((_) => this.renderTypeNode(_, depth + 1, dimChild(_))));
    }
    if (node.truncated) {
      open.append(Div({textContent: '(tree truncated: too deep/wide to expand fully)'}));
    }
    box.append(open);
    return box;
  }
  /**
   * Builds the comparison content (diagnosis, stub, type tree, panes).
   * @param {import('./Warning.js').Warning} warnObj - The row to inspect.
   * @returns {HTMLDivElement} Content element.
   */
  buildCompareContent(warnObj) {
    const body = Div({});
    const {expectPretty, actualPretty} = formatCompare(warnObj.expect, warnObj.value);
    const Grid = genJsx('div');
    let diagnosis;
    try {
      diagnosis = explainMismatch(warnObj.value, warnObj.expect, warnObj.name);
    } catch {
      diagnosis = {findings: [], stub: ''};
    }
    body.append(
      Div({}, warnObj.msg || ''),
      H3({}, 'Diagnosis'),
    );
    if (diagnosis.findings.length) {
      body.append(...diagnosis.findings.map((_) => this.renderFinding(_)));
    } else {
      body.append(Div({textContent: 'The value now passes (or the shape is opaque to the differ); see raw messages below.'}));
    }
    if (diagnosis.stub) {
      body.append(
        H3({}, 'To make it work, add the missing keys'),
        Pre({}, diagnosis.stub),
      );
    }
    let tree;
    try {
      const rootLabel = typeof warnObj.expect === 'string' ? warnObj.expect : warnObj.name;
      tree = buildTypeTree(warnObj.expect, warnObj.value, rootLabel, undefined, warnObj.name);
    } catch {
      tree = undefined;
    }
    if (tree) {
      body.append(H3({}, 'Type tree (expand to climb, hover for full type)'));
      body.append(this.renderTypeNode(tree, 0));
    }
    body.append(
      Grid({className: 'rti-compare'},
           Div({}, H3({}, 'Expected'), Pre({}, expectPretty)),
           Div({}, H3({}, 'Actual'), Pre({}, actualPretty)),
      ),
    );
    if (warnObj.detailStrings?.length) {
      body.append(Details({},
                          Summary({textContent: `Raw validator messages (${warnObj.detailStrings.length})`}),
                          ...warnObj.detailStrings.map((_) => Div({textContent: _}))));
    }
    body.append(
      Div({style: {fontSize: '12px', color: '#555'}},
          `Hits: ${warnObj.hits} — fix the JSDoc/type or the value, then reload.`),
    );
    return body;
  }
  /**
   * Opens one compare window per warning row (XP frame: drag by the blue
   * titlebar, `_` minimizes to the taskbar, `×` destroys, `Escape` closes
   * the topmost). Reopening a live row focuses it instead of duplicating.
   * @param {import('./Warning.js').Warning} warnObj - The row to inspect.
   */
  openComparator(warnObj) {
    if (!warnObj) {
      return;
    }
    const key = `${warnObj.loc}-${warnObj.name}`;
    const existing = this.compareWins.get(key);
    if (existing?.el.isConnected) {
      if (existing.minimized) {
        this.restoreCompare(key);
      } else {
        this.focusCompare(key);
      }
      return;
    }
    if (existing) {
      this.compareWins.delete(key);
    }
    // Windows live in whichever document currently hosts the panel, so they
    // follow it into the popped-out window.
    const hostDoc = TypePanel.divAll?.ownerDocument || document;
    const view = hostDoc.defaultView || window;
    const n = this.winSeq++ % 10;
    const el = Div({className: 'rti-compare-win', dataset: {rtiWin: key}});
    const left = Math.max(8, Math.round(view.innerWidth * 0.5 - 380 + n * 32));
    const top = Math.max(8, Math.round(view.innerHeight * 0.15 + n * 28));
    const pos = this.clampToViewport(el, left, top);
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    const title = Span({className: 'rti-title', textContent: `Compare: ${warnObj.loc} / ${warnObj.name}`});
    const btnMin = Button({textContent: '_', title: 'Minimize to taskbar', onclick: () => this.minimizeCompare(key)});
    const btnClose = Button({textContent: '×', title: 'Close', onclick: () => this.closeCompare(key)});
    const titlebar = Div({className: 'rti-titlebar', title: 'Drag to move window'},
                         title, Div({className: 'rti-caption'}, btnMin, btnClose));
    el.append(titlebar, Div({className: 'rti-compare-body'}, this.buildCompareContent(warnObj)));
    for (const dir of ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']) {
      const handle = Div({className: `rti-handle rti-handle-${dir}`, dataset: {dir}});
      el.append(handle);
      this.makeResizable(handle, dir, el, el, () => {});
    }
    // No per-element focus listener: document-capture (ensureFocus) fronts
    // the window even when a subtree grip stops mousedown propagation.
    hostDoc.body.append(el);
    this.compareWins.set(key, {el, titlebar, minimized: false});
    this.makeDraggable(titlebar, el);
    this.ensureEsc(hostDoc);
    this.ensureFocus(hostDoc);
    this.refreshCompareTaskbar();
    this.updateTaskbarVisibility();
    this.focusCompare(key);
  }
  /**
   * Brings a compare window to the front and marks it active.
   * @param {string} key - The warning key.
   */
  focusCompare(key) {
    const win = this.compareWins.get(key);
    if (!win || win.minimized) {
      return;
    }
    win.el.style.zIndex = String(++this.winZ);
    if (this.taskbar) {
      this.taskbar.style.zIndex = String(this.winZ + 1);
    }
    this.compareFocus = [...this.compareFocus.filter((_) => _ !== key), key];
    this.setActive(key);
  }
  /**
   * The focused window: a compare key, `'panel'`, or `null` (nothing).
   * @type {string|null}
   */
  activeWindow = null;
  /**
   * The one and only place active-state is painted: clear everything, then
   * mark the single active window (compare, panel) or nothing at all.
   * @param {string|null} id - Compare key, `'panel'`, or null.
   */
  setActive(id) {
    this.activeWindow = id;
    for (const [key, win] of this.compareWins) {
      win.titlebar?.classList.toggle('rti-inactive', key !== id);
    }
    this.titlebar?.classList.toggle('rti-inactive', id !== 'panel');
    this.refreshCompareTaskbar();
  }
  /**
   * Settles activity after programmatic changes (minimize/close/hide): the
   * topmost visible window by z-order wins, else the panel if visible.
   */
  settleActive() {
    this.setActive(this.topCompareKey() ?? (this.div.style.display !== 'none' ? 'panel' : null));
  }
  /**
   * Key of the topmost visible compare window, if any.
   * @returns {string|null} Top key or null.
   */
  topCompareKey() {
    const panelZ = Number(TypePanel.divAll?.style.zIndex) || 10000;
    let topKey = null;
    let topZ = panelZ;
    for (const [key, win] of this.compareWins) {
      const z = Number(win.el.style.zIndex) || 0;
      if (!win.minimized && win.el.isConnected && z > topZ) {
        topZ = z;
        topKey = key;
      }
    }
    return topKey;
  }
  /**
   * Minimizes a compare window into a taskbar entry.
   * @param {string} key - The warning key.
   */
  minimizeCompare(key) {
    const win = this.compareWins.get(key);
    if (!win) {
      return;
    }
    win.minimized = true;
    win.el.style.display = 'none';
    this.refreshCompareTaskbar();
    this.updateTaskbarVisibility();
    this.settleActive();
  }
  /**
   * Restores a minimized compare window.
   * @param {string} key - The warning key.
   */
  restoreCompare(key) {
    const win = this.compareWins.get(key);
    if (!win) {
      return;
    }
    win.minimized = false;
    win.el.style.display = '';
    this.refreshCompareTaskbar();
    this.updateTaskbarVisibility();
    this.focusCompare(key);
  }
  /**
   * Closes (destroys) a compare window. Gone means gone.
   * @param {string} key - The warning key.
   */
  closeCompare(key) {
    const win = this.compareWins.get(key);
    if (!win) {
      return;
    }
    win.el.remove();
    this.compareWins.delete(key);
    this.compareFocus = this.compareFocus.filter((_) => _ !== key);
    this.refreshCompareTaskbar();
    this.updateTaskbarVisibility();
    this.settleActive();
  }
  /**
   * Closes the topmost visible compare window (Escape).
   */
  closeTopCompare() {
    for (let i = this.compareFocus.length - 1; i >= 0; i--) {
      const key = this.compareFocus[i];
      const win = this.compareWins.get(key);
      if (win && !win.minimized && win.el.isConnected) {
        this.closeCompare(key);
        return;
      }
    }
  }
  /**
   * Rebuilds taskbar entries: the panel plus one per open compare window.
   * Plain XP toggles: minimized entries reopen, inactive ones focus, the
   * active one minimizes. Minimizing happens nowhere else from here.
   */
  refreshCompareTaskbar() {
    if (!this.taskbarWins || !this.taskbarRti) {
      return;
    }
    const active = this.activeWindow;
    const panelActive = active === 'panel';
    this.taskbarRti.className = panelActive ? 'rti-taskbar-entry rti-taskbar-active' : 'rti-taskbar-entry';
    this.taskbarWins.innerHTML = '';
    for (const [key, win] of this.compareWins) {
      const label = key.length > 28 ? `…${key.slice(-27)}` : key;
      const isActive = key === active && !win.minimized;
      let title = `Focus compare window (${key})`;
      if (win.minimized) {
        title = `Open compare window (${key})`;
      } else if (isActive) {
        title = `Minimize compare window (${key})`;
      }
      this.taskbarWins.append(Button({
        className: isActive ? 'rti-taskbar-entry rti-taskbar-active' : 'rti-taskbar-entry',
        textContent: label,
        title,
        onclick: () => this.toggleCompare(key),
      }));
    }
  }
  /**
   * Listens for Escape on a document once, closing the topmost compare.
   * @param {Document} doc - The document to listen on.
   */
  ensureEsc(doc) {
    if (!doc || this.escDocs.has(doc)) {
      return;
    }
    this.escDocs.add(doc);
    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTopCompare();
      }
    });
  }
  /**
   * Fronts whichever compare window a mousedown lands in, or the main panel
   * itself (`.rti-all`) — which otherwise stays buried once any compare
   * window (z-index past the panel's fixed one) exists. Capture phase on
   * the document: subtree grips stop propagation on mousedown, which would
   * starve a per-element bubble listener.
   * @param {Document} doc - The document to listen on.
   */
  ensureFocus(doc) {
    if (!doc || this.focusDocs.has(doc)) {
      return;
    }
    this.focusDocs.add(doc);
    this.ensureViewportClamp(doc.defaultView || null);
    // mousedown AND pointerdown: touch/pen dispatch pointer events that may
    // never become mousedowns. Fronting is idempotent, so double delivery
    // from both is harmless.
    const onPress = (e) => {
      // The whole rule: clear everything, mark only the clicked window.
      // Taskbar entries are exempt: fronting here would rebuild the taskbar
      // (destroying the pressed button, so its click never fires) and
      // clobber the active state their XP toggle reads. They own focus
      // through their own click handlers.
      if (e.target?.closest?.('.rti-taskbar')) {
        return;
      }
      const win = e.target?.closest?.('.rti-compare-win');
      const key = win?.dataset?.rtiWin;
      if (key) {
        const entry = this.compareWins.get(key);
        if (entry && !entry.minimized) {
          this.focusCompare(key);
        }
        return;
      }
      if (e.target?.closest?.('.rti-all')) {
        this.frontPanel();
        return;
      }
      this.setActive(null);
    };
    doc.addEventListener('mousedown', onPress, true);
    doc.addEventListener('pointerdown', onPress, true);
  }
  /**
   * Brings the main panel above the compare windows (they outgrow its fixed
   * z-index otherwise) and keeps the taskbar chip above everything.
   */
  frontPanel() {
    const {divAll} = TypePanel;
    if (!divAll) {
      return;
    }
    divAll.style.zIndex = String(++this.winZ);
    if (this.taskbar) {
      this.taskbar.style.zIndex = String(this.winZ + 1);
    }
    this.setActive('panel');
  }
  /**
   * Destroys all compare windows (e.g. on Clear: their rows are gone).
   */
  closeAllCompares() {
    for (const key of [...this.compareWins.keys()]) {
      this.closeCompare(key);
    }
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
  sendInfinityStateToWorker() {
    const {eventSources} = this;
    eventSources.forEach(eventSource => {
      eventSource.postMessage({
        type: 'rti',
        action: 'checkInfinity',
        value: options.checkInfinity,
        destination: 'worker',
      });
    });
  }
  sendExactStateToWorker() {
    const {eventSources} = this;
    eventSources.forEach(eventSource => {
      eventSource.postMessage({
        type: 'rti',
        action: 'exactObjects',
        value: options.exactObjects,
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
    // Fresh session, fresh numbers: the counter is session state like the
    // rows, or the badge keeps bragging about dead runs while the table
    // only shows the latest ones.
    options.count = 0;
    this.updateErrorCount();
    this.closeAllCompares();
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
   * Human- and LLM-oriented header for the downloaded log: not every entry is
   * a bug (strict-null and Infinity hits depend on the settings below), so the
   * header records exactly what produced this file.
   * @returns {object} Meta info for `exportLog`.
   */
  getLogMeta() {
    const pageUrl = typeof location !== 'undefined' ? location.href : undefined;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
    const hints = [
      'This is a RuntimeTypeInspector error log. Each entry in `errors` is one failed runtime type check.',
      '`meta.settings` matters: `strictNullChecks: false` means null/undefined pass every type,',
      '`checkInfinity: false` means +-Infinity passes `number`.',
      '`exactObjects: true` means excess keys fail (stricter than tsc, which only checks fresh literals).',
      'Those are settings, not bugs.',
      '`meta.build` is null when running from source; bundles stamp date, commit and message.',
    ];
    if (options.projectVersion === null || options.projectVersion === undefined) {
      hints.push('`meta.projectVersion` is NOT set — pass `projectVersion` to your RTI bundler plugin (rollup/webpack loader option) or call `setProjectVersion(...)` so logs identify the app build.');
    }
    return {
      rtiVersion: RTI_VERSION,
      build: RTI_BUILD,
      projectVersion: options.projectVersion,
      downloadedAt: new Date().toISOString(),
      pageUrl,
      userAgent,
      settings: {
        enabled: options.enabled,
        mode: options.mode,
        strictNullChecks: options.strictNullChecks,
        checkInfinity: options.checkInfinity,
        exactObjects: options.exactObjects,
        logSuperfluousProperty: options.logSuperfluousProperty,
      },
      counts: {
        totalValidations: options.count,
        distinctWarnings: Object.keys(this.warnings).length,
        events: this.eventLog.length,
      },
      llmHint: [...hints,
        'Fix the underlying JSDoc/type or value; `stack` points at the check site, `loc`/`name` at the argument.'].join(' '),
    };
  }
  /**
   * @returns {string} JSON log with `{meta, errors}`, e.g. for AI debugging context.
   */
  exportLog() {
    return JSON.stringify({meta: this.getLogMeta(), errors: this.eventLog}, null, 2);
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
        foundWarning = new Warning('msg', 'value', 'expect', loc, name, () => this.openComparator(foundWarning));
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
    const {count} = options;
    this.spanErrors.innerText = `Type validation errors: ${count}`;
    this.titleText.textContent = count ? `Runtime Type Inspector (${count})` : 'Runtime Type Inspector';
    if (this.taskbarRti) {
      this.taskbarRti.textContent = count ? `RTI (${count} error${count === 1 ? '' : 's'})` : 'RTI';
    }
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
    // Item 1: Loc/Name already have their own table columns, so the Message
    // column shows only the detail (`strings`) instead of repeating them.
    const detail = strings.join(' ').trim();
    const msg = `${loc}> The '${name}' argument has an invalid type.${detail ? ` ${detail}` : ''}`;
    this.updateErrorCount();
    // Keep a capped, serializable log for download/AI context. Recorded
    // first so a UI rendering failure below can't lose the error. Values
    // are snapshotted bounded instead of referenced, so later mutation and
    // unserializable shapes can't corrupt the log.
    this.eventLog.push({timestamp: Date.now(), loc, name, key, expect, value: stringifyValue(value), valueToString, messages: [...strings], detail, message: msg, stack: this.captureStack()});
    if (this.eventLog.length > this.maxEventLogSize) {
      this.eventLog.splice(0, this.eventLog.length - this.maxEventLogSize);
    }
    let warnObj = this.warnings[key];
    if (!warnObj) {
      warnObj = new Warning(detail || msg, value, expect, loc, name, () => this.openComparator(warnObj));
      this.warnedTable?.append(warnObj.tr);
      this.warnings[key] = warnObj;
    }
    warnObj.onCompare = () => this.openComparator(warnObj);
    warnObj.event = event;
    warnObj.hits++;
    warnObj.warn(msg, {expect, value, valueToString}, ...extras);
    refreshWarning(warnObj, {value, expect, msg: detail || msg, strings});
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
    // Pre-singleton pages may hold leaked instances (each re-eval registered
    // another window listener): only the current panel processes messages.
    if (TypePanel.instance !== this) {
      return;
    }
    const {action} = event.data;
    this[action](event);
    // Could be anywhere we know that a new worker is sending RTI messages.
    this.sendEnabledDisabledStateToWorker();
  }
}
export {niceDiv, TypePanel, refreshWarning};
