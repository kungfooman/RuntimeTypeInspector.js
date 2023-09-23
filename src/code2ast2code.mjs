import {parseSync} from "@babel/core";
import {Stringifier} from "./Stringifier.mjs";
/**
 * A roundtrip between code -> AST -> code to validate Stringifier.
 * @param {string} code - The code.
 */
function code2ast2code(code) {
  const stringifier = new Stringifier();
  const ast = parseSync(code);
  if (!ast) {
    return;
  }
  const out = stringifier.toSource(ast);
  return out;
}
export {code2ast2code};
