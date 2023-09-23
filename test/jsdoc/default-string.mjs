/**
 * Extract the features of the input(s).
 * @param {string|string[]} texts The input texts
 * @param {Object} options Additional options:
 * @param {string} [options.pooling="none"] The pooling method to use. Can be one of: "none", "mean".
 * @param {string} [options.normalize='nope'] Whether or not to normalize the embeddings in the last dimension.
 * @returns The features computed by the model.
 */
