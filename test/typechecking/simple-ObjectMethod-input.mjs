const body = new ReadableStream({
  /**
   * @param {Controller} controller 
   */
  start(controller) {
    console.log('controller', controller);
  }
});
console.log('body', body);
