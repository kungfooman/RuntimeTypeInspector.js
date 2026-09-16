const catharsis = require("catharsis");
const originalParse = catharsis.parse;
// Fallback for modern TS types catharsis can't handle (tuple, Array<>, Record<>,
// import(), indexed access, etc.) — 213/605 types in src-transpiler.
// Instead of returning 'any' (/****), preserve original string so docs show
// `import('@babel/types').Node` / `Node[]` correctly via template's typeLink.
// Could be extended to use expandType/stringifyType for full AST (issue #72).
catharsis.parse = function (str, opts) {
  let result;
  // Suppress Catharsis's console.warn for fallback types to keep `npm run docs` clean
  const origWarn = console.warn;
  let warned = false;
  console.warn = (...args) => {
    // Only suppress PEG syntax warnings, keep other warns
    if (String(args[0]).includes('peg$SyntaxError') || String(args[0]).includes('Expected')) return;
    warned = true;
    return origWarn.apply(console, args);
  };
  try {
    result = originalParse.call(this, str, opts);
  } catch (e) {
    console.warn = origWarn;
    const fake = { type: 'NameExpression', name: str };
    Object.defineProperty(fake, 'typeExpression', { value: str, enumerable: false });
    return Object.freeze(fake);
  }
  console.warn = origWarn;
  // Catharsis internally catches PEG errors and returns AllLiteral '*'
  // Detect that fallback and preserve original string instead of 'any'
  if (result && result.type === 'AllLiteral' && str.trim() !== '*' && str.trim() !== 'any') {
    const fake = { type: 'NameExpression', name: str };
    Object.defineProperty(fake, 'typeExpression', { value: str, enumerable: false });
    return Object.freeze(fake);
  }
  return result;
};
