/**
 * Asynchronously processes audio and generates text transcription using the model.
 * @param {Float32Array|Float32Array[]} audio The audio to be transcribed. Can be a single Float32Array or an array of Float32Arrays.
 * @param {Object} [kwargs={}] Optional arguments.
 * @param {boolean|'word'} [kwargs.return_timestamps] Whether to return timestamps or not. Default is `false`.
 * @param {number} [kwargs.chunk_length_s] The length of audio chunks to process in seconds. Default is 0 (no chunking).
 * @param {number} [kwargs.stride_length_s] The length of overlap between consecutive audio chunks in seconds. If not provided, defaults to `chunk_length_s / 6`.
 * @returns {Promise<Object>} A Promise that resolves to an object containing the transcription text and optionally timestamps if `return_timestamps` is `true`.
 */
