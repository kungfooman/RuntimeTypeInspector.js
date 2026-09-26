import {options} from "./options.js";
import {DisplayAnything} from 'display-anything';
import {Tr, Td, Button} from './jsx.js';
/**
 * @todo Also construct a Node.js version, WarningConsole and WarningBrowser
 */
class Warning {
  /** @type {HTMLTableRowElement} */
  tr;
  /** @type {HTMLTableCellElement} */
  td_dbg;
  /** @type {HTMLTableCellElement} */
  td_hide;
  /** @type {HTMLTableCellElement} */
  td_location;
  /** @type {HTMLTableCellElement} */
  td_name;
  /** @type {HTMLTableCellElement} */
  td_expect;
  /** @type {HTMLTableCellElement} */
  td_value;
  /** @type {HTMLTableCellElement} */
  td_count;
  /** @type {HTMLTableCellElement} */
  td_desc;
  /** @type {HTMLButtonElement} */
  button_dbgInput;
  /** @type {HTMLButtonElement} */
  button_hideInput;
  _msg             = '';
  _hits            = 0;
  _hidden          = false;
  _dbg             = false;
  /** @type {any} */
  _value;
  /** @type {import('./validateType.js').Type} */
  _expect;
  constructor(msg, value, expect, loc, name) {
    this.loc = loc;
    this.name = name;
    this._expect = expect;
    this.button_dbgInput = Button({textContent: '🧐', onclick: () => this.dbg = !this.dbg});
    this.button_hideInput = Button({textContent: '👁️‍🗨️', onclick: () => this.hidden = !this.hidden});
    this.td_hide = Td({}, this.button_hideInput);
    this.td_dbg = Td({}, this.button_dbgInput);
    this.td_count = Td({});
    this.td_location = Td({textContent: loc});
    this.td_name = Td({textContent: name});
    this.td_expect = Td({});
    this.td_value = Td({className: 'value'});
    this.td_desc = Td({className: 'desc', innerText: msg});
    const {td_hide, td_dbg, td_count, td_location, td_name, td_expect, td_value, td_desc} = this;
    this.tr = Tr({}, td_hide, td_dbg, td_count, td_location, td_name, td_expect, td_value, td_desc);
    // todo hits setter/getter
    //td_expect.textContent = expect;
    this.expect = expect;
  }
  set dbg(_) {
    this._dbg = _;
    this.button_dbgInput.textContent = _ ? '🐞' : '🧐';
    this.eventSource?.postMessage({
      type: 'rti',
      action: _ ? 'addBreakpoint' : 'deleteBreakpoint',
      destination: 'worker',
      key: `${this.loc}-${this.name}`
    });
  }
  /**
   * Trigger `debugger;` next time this error is hit.
   */
  get dbg() {
    return this._dbg;
  }
  /**
   * The event from Worker, IFrame or window.
   * @type {import('./TypePanel.js').MessageEventRTI | undefined}
   */
  event;
  /**
   * @type {MessageEventSource | EventTarget | null}
   */
  get eventSource() {
    const {event} = this;
    if (!event) {
      // We have no event yet for restored state
      return null;
    }
    // If event came from window:
    /** @type {MessageEventSource | EventTarget | null} */
    let to = event.source;
    if (!to) {
      // If the event came from a worker, we get access to worker via this:
      to = event.srcElement;
    }
    if (!to) {
      console.log("Should not happen, why no event source?");
      debugger;
    }
    return to;
  }
  set hidden(_) {
    this._hidden = _;
    this.button_hideInput.textContent = _ ? '🌚' : '👁️‍🗨️';
    // Doesn't really matter if the workers know about it, we can just early-out in `Warning#warn`.
    // Maybe performance could be improved with many warnings, so might reconsider...
    // this.eventSource?.postMessage({
    //   type: 'rti',
    //   action: _ ? 'hide' : 'show',
    //   destination: 'worker',
    //   key: `${this.loc}-${this.name}`
    // });
  }
  /**
   * Prevent F12/DevTools spamming for errors that occur often, even in "spam" mode.
   */
  get hidden() {
    return this._hidden;
  }
  set hits(_) {
    this._hits = _;
    this.td_count.textContent = _ + '';
  }
  /**
   * How often this error occured.
   */
  get hits() {
    return this._hits;
  }
  /**
   * @todo Log and show old values aswell for more comprehensive overview?
   */
  set value(_) {
    this._value = _;
    const val = new DisplayAnything(_);
    this.td_value.innerHTML = '';
    this.td_value.append(val.render());
  }
  get value() {
    return this._value;
  }
  /**
   * @type {import('./validateType.js').Type}
   * @param {import('./validateType.js').Type} _ - The expected type.
   */
  set expect(_) {
    const val = new DisplayAnything(_);
    this.td_expect.innerHTML = '';
    this.td_expect.append(val.render());
  }
  get expect() {
    return this._expect;
  }
  set msg(_) {
    this._msg = _;
    this.td_desc.textContent = _ + '';
  }
  get msg() {
    return this._msg;
  }
  /**
   * @type {string[]}
   */
  set state(_) {
    if (!_) {
      return;
    }
    if (_.includes('dbg')) {
      this.dbg = true;
    }
    if (_.includes('hidden')) {
      this.hidden = true;
    }
  }
  /**
   * Returns state of dbg/hidden only if relevant (meaning not being default values).
   * @returns {string[]|undefined} Relevant changes or `undefined`.
   */
  get state() {
    const {dbg, hidden} = this;
    const ret = [];
    if (dbg) {
      ret.push('dbg');
    }
    if (hidden) {
      ret.push('hidden');
    }
    if (!ret.length) {
      return undefined; // ESLint bs
    }
    return ret;
  }
  /**
   * @param {string} msg - The main message.
   * @param {...any} extra - Extra strings or objects etc.
   */
  warn(msg, ...extra) {
    const {mode} = options;
    if (this.hidden) {
      return;
    }
    switch (mode) {
      case 'spam':
        console.error(msg, ...extra);
        break;
      case 'once':
        if (this.hits === 1) {
          console.error(msg, ...extra);
        }
        break;
      case 'never':
        break;
      default:
        console.error("warn> unsupported mode:", mode);
    }
  }
}
export {Warning};
