class Test {
  /**
   * Only description.
   */
  set abc(value) {
    console.log('Got', {
      value
    });
  }
}
registerClass(Test);
registerTypedef('Test', {
  "type": "object",
  "properties": {
    "abc": "any"
  }
});
