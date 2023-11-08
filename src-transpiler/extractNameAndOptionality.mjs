/**
 * Extracts the parameter name and its optionality from a JSDoc parameter string.
 *
 * This function takes a rest parameter string from a JSDoc comment, trims it, and determines the parameter's
 * name and whether it is optional. The optionality is inferred based on the presence of square brackets around
 * the parameter name.
 *
 * @param {string} rest - The rest part of a JSDoc parameter string to parse.
 * @returns {[string, boolean]} A tuple where the first element is the name of the parameter,
 * and the second element is a boolean indicating if the parameter is optional.
 */
function extractNameAndOptionality(rest) {
  rest = rest.trim();
  let optional = false;
  // Examples:
  //   name: [kwargs={}] The configuration parameters.
  //   name: [d = 1.0] Sample spacing
  if (rest[0] === '[') {
    // Possible improvement: counting opening/closing brackets for perfect match
    const closer = rest.lastIndexOf(']');
    // Afterwards name will be: d = 1.0
    rest = rest.substring(1, closer);
    // mark it for the type:
    optional = true;
  }
  // Strip the rest (either leftover of optional value or description)
  const name = rest.split(' ')[0].split('=')[0].trim();
  return [name, optional];
}
export {extractNameAndOptionality};
