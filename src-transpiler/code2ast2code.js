import {parse        } from "@babel/parser";
import {Stringifier  } from "./Stringifier.js";
import {parserOptions} from "./parserOptions.js";
/**
 * A roundtrip between code -> AST -> code to validate Stringifier.
 * @param {string} code - The code.
 * @returns {string | undefined} The new and once parsed and stringified code.
 */
function code2ast2code(code) {
  const ast = parse(code, parserOptions);
  if (!ast) {
    return;
  }
  const stringifier = new Stringifier();
  const out = stringifier.toSource(ast);
  return out;
}
export {code2ast2code};
