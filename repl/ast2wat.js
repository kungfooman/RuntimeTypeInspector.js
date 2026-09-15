import {WATConverter} from "@runtime-type-inspector/transpiler";
export function ast2wat(ast) {
  const converter = new WATConverter();
  return converter.toSource(ast);
}

