/**
 * @todo Also construct a Node.js version, WarningConsole and WarningBrowser
 */
class Warning {
  tr               = document.createElement('tr');
  td_dbg           = document.createElement('td');
  td_hide          = document.createElement('td');
  td_location      = document.createElement('td');
  td_name          = document.createElement('td');
  td_expect        = document.createElement('td');
  td_value         = document.createElement('td');
  td_count         = document.createElement('td');
  td_desc          = document.createElement('td');
  button_dbgInput  = document.createElement('button');
  button_hideInput = document.createElement('button');
  _hits            = 0;
  _hidden          = false;
  _dbg             = false;
  /** @type {any} */
  _value;
  constructor(msg, value, expect, loc, name) {
    this.loc = loc;
    this.name = name;
    const {
      tr,
      td_hide, td_dbg, td_count, td_location, td_name, td_expect, td_value, td_desc,
      button_dbgInput, button_hideInput,
    } = this;
    button_dbgInput.textContent = '🧐';
    button_dbgInput.onclick = () => this.dbg = !this.dbg;
    button_hideInput.textContent = '👁️‍🗨️';
    button_hideInput.onclick = () => this.hidden = !this.hidden;
    tr.append(td_hide, td_dbg, td_count, td_location, td_name, td_expect, td_value, td_desc);
    td_hide.append(button_hideInput);
    td_dbg.append(button_dbgInput);
    // todo hits setter/getter
    td_location.textContent = loc;
    td_name.textContent = name;
    td_expect.textContent = expect;
    td_value.textContent = value;
    td_desc.innerText = msg;
  }
  set dbg(_) {
    this._dbg = _;
    this.button_dbgInput.textContent = _ ? '🐞' : '🧐';
  }
  get dbg() {
    return this._dbg;
  }
  set hidden(_) {
    this._hidden = _;
    this.button_hideInput.textContent = _ ? '🌚' : '👁️‍🗨️';
  }
  get hidden() {
    return this._hidden;
  }
  set hits(_) {
    this._hits = _;
    this.td_count.textContent = _ + '';
  }
  get hits() {
    return this._hits;
  }
  /**
   * @todo Log and show old values aswell for more comprehensive overview?
   */
  set value(_) {
    this._value = _;
    this.td_value.textContent = _ + '';
  }
  get value() {
    return this._value;
  }
  /**
   * Returns state of dbg/hidden only if relevant (meaning not being default values).
   * @returns {object|undefined} Relevant changes or `undefined`.
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
}
export {Warning};
