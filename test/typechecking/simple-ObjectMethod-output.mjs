const body = new ReadableStream({
  /**
   * @param {Controller} controller
   */
  start(controller) {
    if (!assertType(controller, "Controller", 'start', 'controller')) {
      youCanAddABreakpointHere();
    }
    console.log('controller', controller);
  }
});
console.log('body', body);
