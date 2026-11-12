import {parse} from '@babel/parser';
import {collectOverloadBlocks} from './collectOverloadBlocks.js';
// Stacked documentation on an exported declaration stays in source order.
function testExportedFunctionBlocks() {
  const src = `/** @overload */
    /** @param {number} x */
    export function f(x) { return x; }`;
  const ast = parse(src, {sourceType: 'module'});
  const [wrapper] = ast.program.body;
  const fn = wrapper.declaration;
  const blocks = collectOverloadBlocks(fn, [ast.program, wrapper, fn]);
  return blocks.length === 2 && blocks[0].includes('@overload');
}
// An arrow initializer inherits the declaration's stacked documentation.
function testArrowDeclarationBlocks() {
  const src = `/** @overload */
    /** @param {number} x */
    const f = (x) => x;`;
  const ast = parse(src);
  const [declaration] = ast.program.body;
  const [declarator] = declaration.declarations;
  const fn = declarator.init;
  const blocks = collectOverloadBlocks(fn, [ast.program, declaration, declarator, fn]);
  return blocks.length === 2 && blocks[0].includes('@overload');
}
// Class-level overloads belong to the constructor, alongside its own docs.
function testConstructorClassBlocks() {
  const src = `/** @overload @param {number} x */
    class C {
      /** @param {number} x */
      constructor(x) { this.x = x; }
    }`;
  const ast = parse(src);
  const [cls] = ast.program.body;
  const [method] = cls.body.body;
  const blocks = collectOverloadBlocks(method, [ast.program, cls, cls.body, method]);
  return blocks.length === 2 && blocks[0].includes('@overload');
}
export const tests = [testExportedFunctionBlocks, testArrowDeclarationBlocks, testConstructorClassBlocks];
