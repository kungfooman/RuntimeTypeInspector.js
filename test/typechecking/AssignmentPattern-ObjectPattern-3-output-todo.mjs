// TODO: Need to fix ObjectPattern spacing...
export class TokenClassificationPipeline extends Pipeline {
  /**
   * Executes the token classification task.
   * @param {any} texts The input texts to be classified.
   * @param {Object} options An optional object containing the following properties:
   * @returns {Promise<Object[]|Object>} A promise that resolves to an array or object containing the predicted labels and scores.
   */
  async _call(texts, {
    ignore_labels = ['O'], // TODO init param?
  } = {}) {
    if (!assertType(texts, "any", 'TokenClassificationPipeline#_call', 'texts')) {
      youCanAddABreakpointHere();
    }
    return isBatched ? toReturn : toReturn[0];
  }
}
registerClass(TokenClassificationPipeline);
