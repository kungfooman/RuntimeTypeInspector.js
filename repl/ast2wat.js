import {WATConverter} from "../src-transpiler/WATConverter.js";
export function ast2wat(ast) {
  const converter = new WATConverter();
  return converter.toSource(ast);
}
