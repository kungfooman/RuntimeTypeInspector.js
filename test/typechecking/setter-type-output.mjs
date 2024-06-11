class Test {
  /**
   * Only description.
   *
   * @type {string}
   */
  set abc(value) {
    if (!inspectType(value, "string", 'Test#abc', 'value')) {
      youCanAddABreakpointHere();
    }
    console.log('Got', {
      value
    });
  }
}
registerClass(Test);
