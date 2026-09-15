const catharsis = require("catharsis");
const originalParse = catharsis.parse;
// Fallback for modern TS types catharsis can't handle (tuple, Array<>, Record<>, import() etc.)
// Catharsis itself already warns + returns '*', this just ensures plugin is loaded
// and could be extended to use stringifyType/expandType for docs (issue #72)
catharsis.parse = function (str, opts) {
  try {
    return originalParse.call(this, str, opts);
  } catch (e) {
    return originalParse.call(this, 'any', opts);
  }
};
