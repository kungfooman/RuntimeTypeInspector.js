/** @type {Record<string, any>} */
const variables = {};
/**
 * Declaration kinds behind `variables` entries (`const`, `let`, `var` as
 * emitted by the transpiler): `const` bindings keep tsc literal types,
 * the rest widen. Missing (pre-kind registrations) widens.
 * @type {Record<string, string|undefined>}
 */
const variableKinds = {};
/**
 * @param {string} name - The variable name.
 * @param {*} value - The value.
 * @param {string} [kind] - The declaration kind (`const`, `let`, `var`).
 */
function registerVariable(name, value, kind) {
  variables[name] = value;
  variableKinds[name] = kind;
}
export {variables, variableKinds, registerVariable};
