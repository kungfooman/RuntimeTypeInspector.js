class Tokenizer {
  /**
   * Loads a pre-trained tokenizer from the given `pretrained_model_name_or_path`. 
   * 
   * @param {string} pretrained_model_name_or_path The path to the pre-trained tokenizer.
   * @param {PretrainedTokenizerOptions} options Additional options for loading the tokenizer.
   * 
   * @throws {Error} Throws an error if the tokenizer.json or tokenizer_config.json files are not found in the `pretrained_model_name_or_path`.
   * @returns {Promise<PreTrainedTokenizer>} A new instance of the `PreTrainedTokenizer` class.
   */
  static async from_pretrained(pretrained_model_name_or_path, {
    progress_callback = null,
    config = null,
    cache_dir = null,
    local_files_only = false,
    revision = 'main',
    legacy = null,
  } = {}) {
    const info = await loadTokenizer(pretrained_model_name_or_path, {
      progress_callback,
      config,
      cache_dir,
      local_files_only,
      revision,
      legacy,
    });
    // @ts-ignore
    return new this(...info);
  }
}
