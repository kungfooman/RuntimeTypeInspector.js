class Test {
  /**
   * Only description.
   */
  abc() {
    return 123;
  }
}
registerClass(Test);
registerTypedef('Test', {
  "type": "object",
  "properties": {
    "abc": "Function"
  }
});
const test = new Test();
console.log(test.abc());
