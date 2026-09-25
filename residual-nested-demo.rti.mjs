import {inspectIndexedAccess, inspectType, inspectTypeWithTemplates, youCanAddABreakpointHere, registerVariable, validateDivision, registerTypedef, registerClass, registerImportNamespaceSpecifier} from './src-runtime/index.js';
export * from './src-runtime/index.js';

/**
 * Residual-gap demo: nested template occurrences never contribute inference
 * candidates (only bare ones pin/widen).
 *
 * - TypeScript infers `K` jointly from all occurrences and accepts the first
 *   call below.
 * - RTI pins `K` from the bare `name` occurrence, then checks the nested
 *   `opts.sub` against the pin and warns (nested values never widen it).
 *
 * Run TS:  npx tsc --noEmit --allowJs --checkJs --strict residual-nested-demo.mjs
 *            -> clean, no errors.
 * Run RTI: node residual-nested-demo.run.mjs
 *            -> reports a type error on the first call.
 */

/**
 * @template K
 * @param {K} name - Bare occurrence: pins (then widens) `K`.
 * @param {{sub: K}} opts - Nested occurrence: checked against the binding,
 * never contributes its own candidate.
 * @returns {K} The sub value.
 */
function f(name, opts) {
  const rtiTemplates = {
    "K": "any"
  };
  if (!inspectTypeWithTemplates(name, "K", 'f', 'name', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(opts, {
    "type": "object",
    "properties": {
      "sub": "K"
    },
    "optional": false
  }, 'f', 'opts', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  return opts.sub;
}
f('a', {
  sub: 'b'
}); // TS: OK (`K` = string). RTI: warns (residual gap).

f('a', {
  sub: 'a'
}); // Both: OK.

