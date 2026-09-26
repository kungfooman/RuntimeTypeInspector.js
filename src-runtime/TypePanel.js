import {assertMode } from "./assertMode.js";
import {decodeBase64 } from "./base64.js";
import {encodeBase64 } from "./base64.js";
import {options    } from "./options.js";
import {createTable} from "./warnedTable.js";
import {stringifyValue} from "./stringifyValue.js";
import {RTI_VERSION} from "./version.js";
import {formatCompare} from "./humanizeExpect.js";
import {explainMismatch} from "./explainMismatch.js";
import {Warning    } from "./Warning.js";
import {Div, Span, Button, Input, Select, Option, H3, Dialog, Pre, Details, Summary, genJsx} from "./jsx.js";
/**
 * @typedef {MessageEvent<{action: string}>} MessageEventRTI
 */
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
      right: 0;
      bottom: 0;
      z-index: 10001;
      display: flex;
      gap: 4px;
      align-items: center;
      padding: 3px 6px;
      background: linear-gradient(to bottom, #3d95ff 0%, #0058e6 100%);
      color: white;
      border: 1px solid #0058e6;
      border-radius: 6px 0 0 0;
      font-size: 12px;
      line-height: 20px;
    }
    .rti-taskbar button {
      cursor: pointer;
      font-weight: bold;
    }
    .rti-taskbar-count {
      white-space: nowrap;
    }
    .rti-setting-row {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 2px 0;
      white-space: nowrap;
    }
    .rti-modal {
      border: 1px solid #888;
      border-radius: 8px;
      padding: 16px;
      width: min(90vw, 900px);
      max-width: 90vw;
      max-height: 85vh;
      overflow: auto;
    }
    .rti-modal::backdrop {
      background: rgba(0, 0, 0, 0.5);
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
class TypePanel {
  /** @type {HTMLDivElement | null} */
  static divAll = null;
  /** @type {HTMLDivElement} */
  div;
  /** @type {HTMLInputElement} */
  inputEnable;
  /** @type {HTMLInputElement} */
  inputStrict;
  /** @type {HTMLInputElement} */
  inputInfinity;
  /** @type {HTMLSpanElement} */
  spanErrors;
  /** @type {HTMLSpanElement} */
  span;
  /** @type {HTMLSpanElement} */
  spanStrict;
  /** @type {HTMLSpanElement} */
  spanInfinity;
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
  /** @type {HTMLSpanElement} */
  taskbarCount;
  /** @type {HTMLButtonElement} */
  taskbarCompare;
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
  /** @type {HTMLDialogElement | null} */
  compareDialog = null;
  /** @type {HTMLDivElement | null} */
  compareBody = null;
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
    this.spanErrors = Span({});
    this.span = Span({innerText: 'Report mode:'});
    this.spanStrict = Span({innerText: ' Strict null checks'});
    this.spanInfinity = Span({innerText: ' Check Infinity'});
    this.option_spam = Option({text: 'spam'});
    this.option_once = Option({text: 'once'});
    this.option_never = Option({text: 'never'});
    this.select = Select({onchange: () => {
      const {value} = this.select;
      localStorage.setItem('rti-spam-type-reports', value);
      assertMode(value);
      options.mode = value;
    }}, this.option_spam, this.option_once, this.option_never);
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
                        Label({}, this.inputStrict, this.spanStrict)),
                    Div({className: 'rti-setting-row'},
                        Label({}, this.inputInfinity, this.spanInfinity)),
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
    // Mini taskbar (our stand-in for the missing OS taskbar): the only way
    // back after `-` hides the panel, plus a re-opener for the compare modal.
    this.taskbarCount = Span({className: 'rti-taskbar-count', textContent: ''});
    this.taskbarCompare = Button({
      textContent: 'Compare',
      title: 'Reopen expected-vs-actual comparison',
      style: {display: 'none'},
      onclick: () => this.reopenComparator(),
    });
    this.taskbar = Div({className: 'rti-taskbar', style: {display: 'none'}},
                       Button({textContent: 'RTI', title: 'Show RTI panel', onclick: () => this.show()}),
                       this.taskbarCount, this.taskbarCompare);
    const {
      div, titlebar, toolbar, body,
    } = this;
    const {inputEnable, inputStrict, inputInfinity, select} = this;
    TypePanel.divAll ??= Div({
      className: 'rti-all',
      style: {position: 'fixed', bottom: '0px', right: '0px', zIndex: '10000', overflow: 'unset'},
    });
    const {divAll} = TypePanel;
    niceDiv(div);
    inputEnable.onchange();
    inputStrict.onchange();
    inputInfinity.onchange();
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
      this.makeResizable(handle, dir);
    }
    divAll.append(div);
    this.applyGeometry();
    this.makeDraggable(titlebar, divAll);
    this.observeGeometry(div);
    const finalFunc = () => {
      document.body.append(divAll);
      document.body.append(this.taskbar);
    };
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
    if (this.taskbar) {
      this.taskbar.style.display = '';
    }
  }
  show() {
    this.div.style.display = '';
    if (this.taskbar) {
      this.taskbar.style.display = 'none';
    }
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
   */
  applyGeometry() {
    try {
      const raw = localStorage.getItem('rti-panel-geometry');
      if (!raw) {
        return;
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
      }
    } catch {
      // Corrupt geometry must never break the panel.
    }
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
   * Makes the panel movable by dragging the blue titlebar only (XP style).
   * Clicks on caption buttons (`-`, pop-out) never start a drag.
   * @param {HTMLElement} handle - The titlebar to drag by.
   * @param {HTMLElement} root - The positioned wrapper to move.
   */
  makeDraggable(handle, root) {
    handle.addEventListener('mousedown', (e) => {
      const target = /** @type {HTMLElement} */ (e.target);
      if (target.closest('button')) {
        return;
      }
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
      const onMove = (ev) => {
        root.style.left = `${rect.left + ev.clientX - startX}px`;
        root.style.top = `${rect.top + ev.clientY - startY}px`;
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
   */
  makeResizable(handle, dir) {
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const root = TypePanel.divAll;
      const startX = e.clientX;
      const startY = e.clientY;
      const startW = this.div.offsetWidth;
      const startH = this.div.offsetHeight;
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
          this.div.style.width = `${Math.max(minW, startW + dx)}px`;
        }
        if (dir.includes('s')) {
          this.div.style.height = `${Math.max(minH, startH + dy)}px`;
        }
        if (dir.includes('w')) {
          const grow = Math.min(dx, startW - minW);
          this.div.style.width = `${startW - grow}px`;
          root.style.left = `${rect.left + grow}px`;
        }
        if (dir.includes('n')) {
          const grow = Math.min(dy, startH - minH);
          this.div.style.height = `${startH - grow}px`;
          root.style.top = `${rect.top + grow}px`;
        }
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
    const row = Div({className: `rti-finding rti-finding-${finding.kind}`},
                    Div({},
                        Span({className: 'rti-badge', textContent: finding.kind}),
                        Span({className: 'rti-path', textContent: finding.path})),
                    Div({textContent: finding.detail || ''}),
                    Div({textContent: `expected ${finding.expected}, got ${finding.actual}`}));
    if (finding.fix) {
      row.append(Div({className: 'rti-fix', textContent: `→ ${finding.fix}`}));
    }
    if (finding.children?.length) {
      row.append(Details({},
                         Summary({textContent: `Closest match problems (${finding.children.length})`}),
                         ...finding.children.map((_) => this.renderFinding(_))));
    }
    return row;
  }
  /**
   * Fullscreen comparator: a path-pinned diagnosis with fix hints first
   * (issue #134 item 3), then the expected/actual panes and raw messages.
   * @param {import('./Warning.js').Warning} warnObj - The row to inspect.
   */
  openComparator(warnObj) {
    if (!warnObj) {
      return;
    }
    const {expectPretty, actualPretty} = formatCompare(warnObj.expect, warnObj.value);
    // The dialog lives in whichever document currently hosts the panel, so
    // the modal opens on the popped-out window when popped out.
    const hostDoc = TypePanel.divAll?.ownerDocument || document;
    if (!this.compareDialog || this.compareDialog.ownerDocument !== hostDoc) {
      this.compareBody = Div({});
      this.compareDialog = Dialog({className: 'rti-modal'},
                                  this.compareBody,
                                  Div({style: {marginTop: '12px', textAlign: 'right'}},
                                      Button({textContent: 'Close', onclick: () => this.compareDialog?.close()})));
      hostDoc.body.append(this.compareDialog);
    }
    const {compareBody, compareDialog} = this;
    compareBody.innerHTML = '';
    const Grid = genJsx('div');
    let diagnosis;
    try {
      diagnosis = explainMismatch(warnObj.value, warnObj.expect, warnObj.name);
    } catch {
      diagnosis = {findings: [], stub: ''};
    }
    compareBody.append(
      H3({}, `Expected vs actual: ${warnObj.loc} / ${warnObj.name}`),
      Div({}, warnObj.msg || ''),
      H3({}, 'Diagnosis'),
    );
    if (diagnosis.findings.length) {
      compareBody.append(...diagnosis.findings.map((_) => this.renderFinding(_)));
    } else {
      compareBody.append(Div({textContent: 'The value now passes (or the shape is opaque to the differ); see raw messages below.'}));
    }
    if (diagnosis.stub) {
      compareBody.append(
        H3({}, 'To make it work, add the missing keys'),
        Pre({}, diagnosis.stub),
      );
    }
    compareBody.append(
      Grid({className: 'rti-compare'},
           Div({}, H3({}, 'Expected'), Pre({}, expectPretty)),
           Div({}, H3({}, 'Actual'), Pre({}, actualPretty)),
      ),
    );
    if (warnObj.detailStrings?.length) {
      compareBody.append(Details({},
                                 Summary({textContent: `Raw validator messages (${warnObj.detailStrings.length})`}),
                                 ...warnObj.detailStrings.map((_) => Div({textContent: _}))));
    }
    compareBody.append(
      Div({style: {fontSize: '12px', color: '#555'}},
          `Hits: ${warnObj.hits} — fix the JSDoc/type or the value, then reload.`),
    );
    if (typeof compareDialog.showModal === 'function') {
      if (!compareDialog.open) {
        compareDialog.showModal();
      }
    } else {
      compareDialog.setAttribute('open', '');
    }
    if (this.taskbarCompare) {
      this.taskbarCompare.style.display = '';
    }
  }
  /**
   * Reopens the last comparison (taskbar button: way back after Esc-close).
   */
  reopenComparator() {
    const {compareDialog} = this;
    if (!compareDialog) {
      return;
    }
    if (typeof compareDialog.showModal === 'function') {
      if (!compareDialog.open) {
        compareDialog.showModal();
      }
    } else {
      compareDialog.setAttribute('open', '');
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
   * Human- and LLM-oriented header for the downloaded log: not every entry is
   * a bug (strict-null and Infinity hits depend on the settings below), so the
   * header records exactly what produced this file.
   * @returns {object} Meta info for `exportLog`.
   */
  getLogMeta() {
    const pageUrl = typeof location !== 'undefined' ? location.href : undefined;
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
    return {
      rtiVersion: RTI_VERSION,
      downloadedAt: new Date().toISOString(),
      pageUrl,
      userAgent,
      settings: {
        enabled: options.enabled,
        mode: options.mode,
        strictNullChecks: options.strictNullChecks,
        checkInfinity: options.checkInfinity,
        logSuperfluousProperty: options.logSuperfluousProperty,
      },
      counts: {
        totalValidations: options.count,
        distinctWarnings: Object.keys(this.warnings).length,
        events: this.eventLog.length,
      },
      llmHint: [
        'This is a RuntimeTypeInspector error log. Each entry in `errors` is one failed runtime type check.',
        '`meta.settings` matters: `strictNullChecks: false` means null/undefined pass every type,',
        '`checkInfinity: false` means +-Infinity passes `number`. Those are settings, not bugs.',
        'Fix the underlying JSDoc/type or value; `stack` points at the check site, `loc`/`name` at the argument.',
      ].join(' '),
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
    if (this.taskbarCount) {
      this.taskbarCount.textContent = count ? `${count} error${count === 1 ? '' : 's'}` : '';
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
    // The value may change and we only show the latest wrong value
    warnObj.value = value;
    // Message may change aswell, especially after loading state.
    warnObj.msg = detail || msg;
    warnObj.detailStrings = [...strings];
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
