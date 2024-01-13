/** @type {Record<string, any>} */
const variables = {};
function registerVariable(name, value) {
  variables[name] = value;
}
export {variables, registerVariable};
