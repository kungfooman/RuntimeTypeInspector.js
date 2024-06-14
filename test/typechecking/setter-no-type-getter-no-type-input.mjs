class Test {
  _abc = 123;
  /**
   * Only description for getter.
   */
  get abc() {
    return this._abc;
  }
  /**
   * Only description for setter.
   */
  set abc(val) {
    this._abc = val;
  }
}
const test = new Test();
console.log(test.abc);
test.abc = 1;
console.log(test.abc);
