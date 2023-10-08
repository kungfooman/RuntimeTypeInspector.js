/**
 * @typedef {import('./utils/maths.js').TypedArray} TypedArray
 */

/**
 * @typedef {{ sequences: Tensor, decoder_attentions: Tensor, cross_attentions: Tensor }} EncoderDecoderOutput
 * @typedef {Object} DecoderOutput
 */

/**
 * @typedef {Object} PretrainedOptions Options for loading a pretrained model.     
 * @property {boolean?} [quantized=true] Whether to load the 8-bit quantized version of the model (only applicable when loading model files).
 * @property {function} [progress_callback=null] If specified, this function will be called during model construction, to provide the user with progress updates.
 * @property {Object} [config=null] Configuration for the model to use instead of an automatically loaded configuration. Configuration can be automatically loaded when:
 * - The model is a model provided by the library (loaded with the *model id* string of a pretrained model).
 * - The model is loaded by supplying a local directory as `pretrained_model_name_or_path` and a configuration JSON file named *config.json* is found in the directory.
 * @property {string} [cache_dir=null] Path to a directory in which a downloaded pretrained model configuration should be cached if the standard cache should not be used.
 * @property {boolean} [local_files_only=false] Whether or not to only look at local files (e.g., not try downloading the model).
 * @property {string} [revision='main'] The specific model version to use. It can be a branch name, a tag name, or a commit id,
 * since we use a git-based system for storing models and other artifacts on huggingface.co, so `revision` can be any identifier allowed by git.
 * NOTE: This setting is ignored for local requests.
 * @property {string} [model_file_name=null] If specified, load the model with this name (excluding the .onnx suffix). Currently only valid for encoder- or decoder-only models.
 */
