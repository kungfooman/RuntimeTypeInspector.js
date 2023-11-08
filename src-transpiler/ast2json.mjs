/**
 * @param {object} ast - The Babel AST.
 * @returns {string} String representation in JSON format for debugging/inspecting the AST.
 */
function ast2json(ast) {
  return JSON.stringify(ast, function (name, val) {
    if (name === "loc" || name === "start" || name === "end") {
      return; // remove
    }
    return val; // keep
  }, 2);
}
export {ast2json};
