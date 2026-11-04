/**
 * Selects the argument list expression for an overload inspection call.
 * @param {object|null} fnNode - Function node, if the checked body is an arrow.
 * @param {object} fallback - Node whose arrow status decides the expression.
 * @param {object|null} wrapper - Stored wrapper call name.
 * @returns {string} Stored call name, legacy arguments otherwise.
 * @example
 * overloadInspectionArgs({rtiOverloadArguments: 'rtiArgs'}, {}, null); // '[...rtiArgs]'
 */
function overloadInspectionArgs(fnNode, fallback, wrapper = null) {
  if (fallback && fallback.type === 'ArrowFunctionExpression') {
    if (wrapper) {
      return wrapper.callName;
    }
    return `[...${fnNode.rtiOverloadArguments}]`;
  }
  return '[...arguments]';
}
export {overloadInspectionArgs};
