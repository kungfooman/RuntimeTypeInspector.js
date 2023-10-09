/**
 * @param {string} rest 
 * @returns {[string, boolean]}
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
