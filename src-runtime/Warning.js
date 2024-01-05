class Warning {
  hits = 0;
  _dbg = false;
  set dbg(_) {
    this._dbg = _;
    console.log("set dbg", _);
  }
  get dbg() {
    console.log("get dbg");
    return this._dbg;
  }
}
export {Warning};
