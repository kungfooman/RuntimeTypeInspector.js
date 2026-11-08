import {nodeIsFunctionLike} from '../nodeIsFunctionLike.js';

/**
 * Finds documentation blocks attached to a function or its declaration.
 * Class-level constructor overloads are combined with constructor docs.
 * @param {import('@babel/types').Node} node - Function or its body.
 * @param {import('@babel/types').Node[]} parents - Traversal ancestors.
 * @returns {string[]} Comment values in source order.
 * @example
 * collectOverloadBlocks({type: 'FunctionDeclaration', leadingComments: []}, []); // []
 */
function collectOverloadBlocks(node, parents) {
  if (node.type === 'BlockStatement') {
    node = parents[parents.length - 2];
  }
  let owner = node;
  if (!owner.leadingComments && (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression')) {
    const index = parents.lastIndexOf(node);
    for (let i = index - 1; i >= 0; i--) {
      const parent = parents[i];
      if (nodeIsFunctionLike(parent)) break;
      if (parent.type === 'VariableDeclarator' && parent.init !== node) break;
      if (parent.leadingComments) {
        owner = parent;
        break;
      }
    }
  }
  if (!owner.leadingComments && node.type === 'FunctionDeclaration') {
    const index = parents.lastIndexOf(node);
    const parent = parents[index - 1];
    if (parent && (parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration')) {
      owner = parent;
    }
  }
  const comments = owner.leadingComments || [];
  const blocks = [];
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i];
    if (comment.type !== 'CommentBlock' || !comment.value.startsWith('*')) break;
    if (i < comments.length - 1 && comments[i + 1].loc && comment.loc &&
        comments[i + 1].loc.start.line > comment.loc.end.line + 1) break;
    blocks.unshift(comment.value);
  }
  if (node.type === 'ClassMethod' && node.kind === 'constructor') {
    const classNode = parents.findLast((parent) => parent.type === 'ClassDeclaration' || parent.type === 'ClassExpression');
    if (classNode?.leadingComments) {
      const classBlocks = classNode.leadingComments.filter((comment) => (
        comment.type === 'CommentBlock' && /@overload\b/.test(comment.value)
      ));
      blocks.unshift(...classBlocks.map((comment) => comment.value));
    }
  }
  return blocks;
}
export {collectOverloadBlocks};
