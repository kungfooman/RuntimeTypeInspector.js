import {parse      } from "@babel/parser";
import {Stringifier} from "./Stringifier.js";
/**
 * A roundtrip between code -> AST -> code to validate Stringifier.
 * @param {string} code - The code.
 * @returns {string | undefined} The new and once parsed and stringified code.
 */
function code2ast2code(code) {
  const stringifier = new Stringifier();
  const ast = parse(code, {sourceType: 'module'});
  if (!ast) {
    return;
  }
  const out = stringifier.toSource(ast);
  return out;
}
export {code2ast2code};
