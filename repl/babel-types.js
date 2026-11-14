// @babel/types is CJS-only, so browsers cannot import it. Fetch the real
// files from node_modules, eval them through a minimal sync CJS loader,
// and re-export the tables. No snapshot to rot: a @babel/types bump is
// picked up on next load.
// Test: const {VISITOR_KEYS} = await import("@babel/types");
const base = './node_modules/@babel/types/lib/';
const sources = new Map();
const modules = new Map();
const processShim = {env: {}};
const files = [
  'definitions/index.js',
  'definitions/core.js',
  'definitions/deprecated-aliases.js',
  'definitions/experimental.js',
  'definitions/flow.js',
  'definitions/jsx.js',
  'definitions/misc.js',
  'definitions/placeholders.js',
  'definitions/typescript.js',
  'definitions/utils.js',
  'constants/index.js',
  'utils/shallowEqual.js',
  'validators/is.js',
  'validators/isPlaceholderType.js',
  'validators/isType.js',
  'validators/isValidIdentifier.js',
  'validators/validate.js',
];
await Promise.all(files.map(async (file) => {
  sources.set(file, await (await fetch(base + file)).text());
}));
/**
 * Evaluates a prefetched file with a sync relative require.
 * @param {string} file - Normalized path relative to the lib directory.
 * @returns {Record<string, any>} The module exports.
 */
function evaluateCached(file) {
  if (modules.has(file)) {
    return modules.get(file);
  }
  const module = {exports: {}};
  modules.set(file, module.exports);
  const dir = file.slice(0, file.lastIndexOf('/') + 1);
  const require = (request) => {
    let target = dir + request;
    if (!target.endsWith('.js')) {
      target += '.js';
    }
    const parts = [];
    for (const part of target.split('/')) {
      if (part === '.' || (part === '' && parts.length > 0)) {
        continue;
      }
      if (part === '..') {
        parts.pop();
      } else {
        parts.push(part);
      }
    }
    return evaluateCached(parts.join('/'));
  };
  new Function('module', 'exports', 'require', 'process', sources.get(file))(module, module.exports, require, processShim);
  modules.set(file, module.exports);
  return module.exports;
}
const definitions = evaluateCached('definitions/index.js');
export const {VISITOR_KEYS, ALIAS_KEYS} = definitions;
export default {VISITOR_KEYS, ALIAS_KEYS};
