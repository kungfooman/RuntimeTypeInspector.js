/**
 * Converts an amplitude spectrogram to the decibel scale. This computes `20 * log10(spectrogram / reference)`,
 * using basic logarithm properties for numerical stability. NOTE: Operates in-place.
 * 
 * The motivation behind applying the log function on the (mel) spectrogram is that humans do not hear loudness on a
 * linear scale. Generally to double the perceived volume of a sound we need to put 8 times as much energy into it.
 * This means that large variations in energy may not sound all that different if the sound is loud to begin with.
 * This compression operation makes the (mel) spectrogram features match more closely what humans actually hear.
 * 
 * @template {Float32Array|Float64Array} T
 * @param {T} spectrogram The input amplitude (mel) spectrogram.
 * @param {number} [reference=1.0] Sets the input spectrogram value that corresponds to 0 dB.
 * For example, use `np.max(spectrogram)` to set the loudest part to 0 dB. Must be greater than zero.
 * @param {number} [min_value=1e-5] The spectrogram will be clipped to this minimum value before conversion to decibels,
 * to avoid taking `log(0)`. The default of `1e-5` corresponds to a minimum of -100 dB. Must be greater than zero.
 * @param {number} [db_range=null] Sets the maximum dynamic range in decibels. For example, if `db_range = 80`, the
 * difference between the peak value and the smallest value will never be more than 80 dB. Must be greater than zero.
 * @returns {T} The modified spectrogram in decibels.
 */
function amplitude_to_db(spectrogram, reference = 1.0, min_value = 1e-5, db_range = null) {
  const rtiTemplates = {
    "T": {
      "type": "union",
      "members": [
        "Float32Array",
        "Float64Array"
      ]
    }
  };
  if (!inspectTypeWithTemplates(spectrogram, "T", 'amplitude_to_db', 'spectrogram', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(reference, {
    "type": "number",
    "optional": true
  }, 'amplitude_to_db', 'reference', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(min_value, {
    "type": "number",
    "optional": true
  }, 'amplitude_to_db', 'min_value', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(db_range, {
    "type": "number",
    "optional": true
  }, 'amplitude_to_db', 'db_range', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  return _db_conversion_helper(spectrogram, 20.0, reference, min_value, db_range);
}