class Test {
  test() {
    return validateDivision(123, 0, "Test#test");
  }
}
registerClass(Test);
registerTypedef('Test', {
  "type": "object",
  "properties": {
    "test": "Function"
  }
});
