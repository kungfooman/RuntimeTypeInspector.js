class Test {
  #a;
  #b = 123;
  #c = this.#b * 2;
  static #d;
  static #e = 1;
}
registerClass(Test);
const test = new Test();
