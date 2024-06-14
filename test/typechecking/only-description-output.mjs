class Test {
  /**
   * Only description.
   */
  abc() {
    return 123;
  }
}
registerClass(Test);
const test = new Test();
console.log(test.abc());
