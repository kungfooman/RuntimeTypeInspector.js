import {ast2jsonForComparison} from "./ast2jsonForComparison.js";
import {parse                } from '@babel/parser';
/**
 * @param {string} left - Left source code.
 * @param {string} right - Right source code.
 * @returns {boolean} Whether source codes are identical on the AST level.
 */
function compareAST(left, right) {
  const l = parse(left , {sourceType: 'module'});
  const r = parse(right, {sourceType: 'module'});
  const ljson = ast2jsonForComparison(l);
  const rjson = ast2jsonForComparison(r);
  const test = ljson === rjson;
  return test;
}
export {compareAST};
