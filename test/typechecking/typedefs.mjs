/**
 * @typedef {import('./utils/maths.js').TypedArray} TypedArray
 */

/**
 * @typedef {{ sequences: Tensor, decoder_attentions: Tensor, cross_attentions: Tensor }} EncoderDecoderOutput
 * @typedef {Object} DecoderOutput
 * 
 * Generates text based on the given inputs and generation configuration using the model.
 * @param {Tensor|Array|TypedArray} inputs An array of input token IDs.
 * @param {Object|GenerationConfig|null} generation_config The generation configuration to use. If null, default configuration will be used.
 * @param {Object|null} logits_processor An optional logits processor to use. If null, a new LogitsProcessorList instance will be created.
 * @param {Object} options options
 * @param {Object} [options.inputs_attention_mask=null] An optional attention mask for the inputs.
 * @returns {Promise<number[][]|EncoderDecoderOutput|DecoderOutput>} An array of generated output sequences, where each sequence is an array of token IDs.
 * @throws {Error} Throws an error if the inputs array is empty.
 */
 
1 / 2;
 
/**
 * Helper function to add attentions to beam
 * @param {Object} beam 
 * @param {Object} output
 * @private 
 */
function addAttentionsToBeam(beam, output) {
  
  /**
   * Inner function
   * @param {number} abc
   */
  function inner(abc) {}
}
