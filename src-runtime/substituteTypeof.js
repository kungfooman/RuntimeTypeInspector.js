/**
 * Substitutes a typeof type. Currently a no-op: `typeof X` names a value,
 * not a type, so a same-named template must not rewrite it. Consumers may
 * override this to customize typeof handling.
 * @param {*} type - The typeof type.
 * @param {*} search - The search.
 * @param {*} replace - The replace.
 * @param {console["warn"]} warn - Function to warn with.
 * @returns {*} The original type, unchanged.
 * @example
 * substituteTypeof({type: 'typeof', argument: 'X'}, 'X', 'number', console.warn);
 * // {type: 'typeof', argument: 'X'}
 */
function substituteTypeof(type, search, replace, warn) {
  return type;
}
export {substituteTypeof};
