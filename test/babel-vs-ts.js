// https://github.com/babel/babel/issues/16048
// https://github.com/microsoft/TypeScript/issues/2536
const tests = [
  "type satisfies = 0;",
  "type constructor = 0;",
  "type declare = 0;",
  "type get = 0;",
  "type module = 0;",
  "type require = 0;",
  "type set = 0;",
  "type type = 0;",
  "type from = 0;",
  "type of = 0;",
  "type as = 0;",
  "type implements = 0;",
  "type interface = 0;",
  "type let = 0;",
  "type package = 0;",
  "type private = 0;",
  "type protected = 0;",
  "type public = 0;",
  "type static = 0;",
  "type yield = 0;",
  "type namespace = 0;",
  "type async = 0;",
  "type await = 0;",
  // everything after await is causing a TS error
  "type string = 0;",
  "type symbol = 0;",
  "type number = 0;",
  "type any = 0;",
  "type boolean = 0;",
  "type break = 0;",
  "type case = 0;",
  "type catch = 0;",
  "type class = 0;",
  "type const = 0;",
  "type continue = 0;",
  "type debugger = 0;",
  "type default = 0;",
  "type delete = 0;",
  "type do = 0;",
  "type else = 0;",
  "type enum = 0;",
  "type export = 0;",
  "type extends = 0;",
  "type false = 0;",
  "type finally = 0;",
  "type for = 0;",
  "type function = 0;",
  "type if = 0;",
  "type import = 0;",
  "type in = 0;",
  "type instanceof = 0;",
  "type new = 0;",
  "type null = 0;",
  "type switch = 0;",
  "type return = 0;",
  "type super = 0;",
  "type this = 0;",
  "type throw = 0;",
  "type true = 0;",
  "type try = 0;",
  "type typeof = 0;",
  "type var = 0;",
  "type void = 0;",
  "type while = 0;",
  "type with = 0;",
];
// console.log(tests.join('\n'));
function testBabel(test) {
  try {
      parse(test, {plugins: ["typescript"]});
      return true;
  } catch {}
  return false;
}
function testTS(test) {
  const ret = ts.createSourceFile('repl.ts', test, ts.ScriptTarget.Latest, true /*setParentNodes*/);
  return {
    isTypeAlias: ret.statements[0].kind === ts.SyntaxKind.TypeAliasDeclaration,
    expression: ret.statements[0].expression,
    text: ret.statements[0].getText()
  };
}
function testBoth(test) {
  const babel = testBabel(test);
  const ts = testTS(test);
  return {test, babel, ...ts};
}
const ret = tests.map(testBoth);
window.ret = ret;
console.table(ret);
/*
https://github.com/wooorm/markdown-table/blob/main/index.js
const keys = Object.keys(ret[0]);
const vals = ret.map(o => Object.values(o));
console.log(markdownTable([keys, ...vals]))
*/
