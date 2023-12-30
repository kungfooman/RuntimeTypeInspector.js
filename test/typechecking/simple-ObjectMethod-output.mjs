const body = new ReadableStream({
  /**
   * @param {Controller} controller 
   */
  start(controller) {
    if (!inspectType(controller, "Controller", 'start', 'controller')) {
      youCanAddABreakpointHere();
    }
    console.log('controller', controller);
  }
});
console.log('body', body);
