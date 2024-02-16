/** @type {Record<string, object>} */
const importNamespaceSpecifiers = {};
/**
 * @param {string} name - The name of module.
 * @param {object} module - The module.
 */
function registerImportNamespaceSpecifier(name, module) {
  importNamespaceSpecifiers[name] = module;
}
export {importNamespaceSpecifiers, registerImportNamespaceSpecifier};
