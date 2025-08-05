import {expandTypeDepFree} from './expandTypeDepFree.js';
import {nodeIsFunction} from './nodeIsFunction.js';
import {parseJSDoc} from './parseJSDoc.js';
import {parseJSDocSetter} from './parseJSDocSetter.js';
import {parseJSDocTemplates} from './parseJSDocTemplates.js';
import {parseJSDocTypedef} from './parseJSDocTypedef.js';
/**
 * Map of Babel node types to their child keys that contain traversable AST nodes.
 * @type {Record<string, string[]>}
 */
const nodeChildren = {
  'ArrayExpression': ['elements'],
  'ArrayPattern': ['elements'],
  'ArrowFunctionExpression': ['params', 'body'],
  'AssignmentExpression': ['left', 'right'],
  'AssignmentPattern': ['left', 'right'],
  'AwaitExpression': ['argument'],
  'BinaryExpression': ['left', 'right'],
  'BlockStatement': ['directives', 'body'],
  'BreakStatement': ['label'],
  'CallExpression': ['callee', 'arguments'],
  'CatchClause': ['param', 'body'],
  'ClassBody': ['body'],
  'ClassDeclaration': ['id', 'superClass', 'body'],
  'ClassExpression': ['id', 'superClass', 'body'],
  'ClassMethod': ['key', 'params', 'body'],
  'ClassPrivateMethod': ['key', 'params', 'body'],
  'ClassPrivateProperty': ['key', 'value'],
  'ClassProperty': ['key', 'value'],
  'ConditionalExpression': ['test', 'consequent', 'alternate'],
  'ContinueStatement': ['label'],
  'DebuggerStatement': [],
  'Directive': ['value'],
  'DirectiveLiteral': [],
  'DoWhileStatement': ['body', 'test'],
  'EmptyStatement': [],
  'ExportAllDeclaration': ['source'],
  'ExportDefaultDeclaration': ['declaration'],
  'ExportNamedDeclaration': ['declaration', 'specifiers', 'source'],
  'ExportNamespaceSpecifier': ['exported'],
  'ExportSpecifier': ['local', 'exported'],
  'ExpressionStatement': ['expression'],
  'File': ['program'],
  'ForInStatement': ['left', 'right', 'body'],
  'ForOfStatement': ['left', 'right', 'body'],
  'ForStatement': ['init', 'test', 'update', 'body'],
  'FunctionDeclaration': ['id', 'params', 'body'],
  'FunctionExpression': ['id', 'params', 'body'],
  'IfStatement': ['test', 'consequent', 'alternate'],
  'Import': [],
  'ImportDeclaration': ['specifiers', 'source'],
  'ImportDefaultSpecifier': ['local'],
  'ImportExpression': ['source'],
  'ImportNamespaceSpecifier': ['local'],
  'ImportSpecifier': ['imported', 'local'],
  'JSXAttribute': ['name', 'value'],
  'JSXElement': ['openingElement', 'children', 'closingElement'],
  'JSXExpressionContainer': ['expression'],
  'JSXFragment': ['openingFragment', 'children', 'closingFragment'],
  'JSXIdentifier': [],
  'JSXMemberExpression': ['object', 'property'],
  'JSXNamespacedName': ['namespace', 'name'],
  'JSXText': [],
  'LabeledStatement': ['label', 'body'],
  'LogicalExpression': ['left', 'right'],
  'MemberExpression': ['object', 'property'],
  'MetaProperty': ['meta', 'property'],
  'NewExpression': ['callee', 'arguments'],
  'ObjectExpression': ['properties'],
  'ObjectMethod': ['key', 'params', 'body'],
  'ObjectPattern': ['properties'],
  'ObjectProperty': ['key', 'value'],
  'OptionalCallExpression': ['callee', 'arguments'],
  'OptionalMemberExpression': ['object', 'property'],
  'ParenthesizedExpression': ['expression'],
  'PrivateName': ['id'],
  'Program': ['directives', 'body'],
  'RegExpLiteral': [],
  'RestElement': ['argument'],
  'ReturnStatement': ['argument'],
  'SequenceExpression': ['expressions'],
  'SpreadElement': ['argument'],
  'Super': [],
  'SwitchCase': ['test', 'consequent'],
  'SwitchStatement': ['discriminant', 'cases'],
  'TaggedTemplateExpression': ['tag', 'quasi'],
  'TemplateElement': [],
  'TemplateLiteral': ['quasis', 'expressions'],
  'ThisExpression': [],
  'ThrowStatement': ['argument'],
  'TryStatement': ['block', 'handler', 'finalizer'],
  'UnaryExpression': ['argument'],
  'UpdateExpression': ['argument'],
  'VariableDeclaration': ['declarations'],
  'VariableDeclarator': ['id', 'init'],
  'WhileStatement': ['test', 'body'],
  'YieldExpression': ['argument'],
};
class JSDocAnnotator {
  /** @type {import('@babel/types').Node[]} */
  parents = [];
  /** @type {Record<string, object>} */
  typedefs = {};
  /**
   * @param {Object} [options] - Options for the annotator.
   * @param {import('./parseJSDoc.js').ExpandType} [options.expandType] - Function to expand types.
   */
  constructor(options = {}) {
    /** @type {import('./parseJSDoc.js').ExpandType} */
    this.expandType = options.expandType || expandTypeDepFree;
  }
  /**
   * Annotates the AST by adding 'jsdoc' properties to relevant nodes.
   * @param {import('@babel/types').File|import('@babel/types').Program} ast - The Babel AST to annotate.
   * @returns {import('@babel/types').File|import('@babel/types').Program} The annotated AST.
   */
  annotate(ast) {
    if (ast.type === 'File') {
      const {comments} = ast;
      if (comments) {
        for (const comment of comments) {
          const warn = console.warn.bind(console);
          parseJSDocTypedef(this.typedefs, warn, comment, this.expandType);
        }
      }
      this.traverse(ast.program);
      ast.program.typedefs = this.typedefs;
    } else {
      this.traverse(ast);
      ast.typedefs = this.typedefs;
    }
    return ast;
  }
  /**
   * Traverses the AST node and annotates where applicable.
   * @param {import('@babel/types').Node} node - The node to traverse.
   */
  traverse(node) {
    if (!node) return;
    this.parents.push(node);
    if (this.isAnnotatableNode(node)) {
      const jsdoc = this.getJSDoc(node);
      if (jsdoc) {
        node.jsdoc = jsdoc;
      }
    }
    const type = node.type;
    const childrenKeys = nodeChildren[type] || [];
    for (const key of childrenKeys) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const c of child) {
          this.traverse(c);
        }
      } else if (child && typeof child === 'object' && child.type) {
        this.traverse(child);
      }
    }
    this.parents.pop();
  }
  /**
   * Determines if a node should be annotated with JSDoc.
   * @param {import('@babel/types').Node} node - The node to check.
   * @returns {boolean} True if the node is annotatable.
   */
  isAnnotatableNode(node) {
    const {type} = node;
    return (
      type === 'ArrowFunctionExpression' ||
      type === 'ClassMethod' ||
      type === 'ClassPrivateMethod' ||
      type === 'FunctionDeclaration' ||
      type === 'FunctionExpression' ||
      type === 'ObjectMethod'
    );
  }
  /**
   * Finds the closest ancestor of the given node that matches the specified type.
   * @param {import('@babel/types').Node} node - The starting node.
   * @param {string} type - The type to search for.
   * @returns {import('@babel/types').Node|undefined} The ancestor node or undefined.
   */
  findParentOfType(node, type) {
    const currentIndex = this.parents.findLastIndex(_ => _ === node);
    return this.parents.findLast((_, i) => i <= currentIndex && _.type === type);
  }
  /**
   * Gets the leading comment node for ArrowFunctionExpression.
   * @param {import('@babel/types').Node} node - The node.
   * @returns {import('@babel/types').Node|undefined} The node with leading comments.
   */
  getLeadingCommentsNodeForArrowFunctionExpression(node) {
    let i = this.parents.findLastIndex(_ => _ === node);
    let parent = this.parents[i];
    if (parent.leadingComments) {
      return parent;
    }
    i--;
    while (i >= 0) {
      parent = this.parents[i];
      if (nodeIsFunction(parent)) {
        break;
      }
      if (parent.leadingComments) {
        return parent;
      }
      i--;
    }
  }
  /**
   * Gets the leading comment node for FunctionExpression.
   * @param {import('@babel/types').Node} node - The node.
   * @returns {import('@babel/types').Node|undefined} The node with leading comments.
   */
  getLeadingCommentsNodeForFunctionExpression(node) {
    let i = this.parents.findLastIndex(_ => _ === node);
    let parent = this.parents[i];
    if (parent.leadingComments) {
      return parent;
    }
    i--;
    while (i >= 0) {
      parent = this.parents[i];
      if (nodeIsFunction(parent)) {
        break;
      }
      if (parent.leadingComments) {
        return parent;
      }
      i--;
    }
  }
  /**
   * Gets the leading comment string for a node.
   * @param {import('@babel/types').Node} node - The node.
   * @returns {string|undefined} The comment value.
   */
  getLeadingComment(node) {
    let leadingComments = node.leadingComments;
    if (!leadingComments) {
      if (node.type === 'FunctionDeclaration') {
        const exportNamedDeclaration = this.findParentOfType(node, 'ExportNamedDeclaration');
        leadingComments = exportNamedDeclaration?.leadingComments;
      } else if (node.type === 'ArrowFunctionExpression') {
        const tmp = this.getLeadingCommentsNodeForArrowFunctionExpression(node);
        leadingComments = tmp?.leadingComments;
      } else if (node.type === 'FunctionExpression') {
        const tmp = this.getLeadingCommentsNodeForFunctionExpression(node);
        leadingComments = tmp?.leadingComments;
      }
    }
    if (leadingComments && leadingComments.length) {
      const lastComment = leadingComments[leadingComments.length - 1];
      if (lastComment.type === 'CommentBlock') {
        return lastComment.value;
      }
    }
  }
  /**
   * Parses the JSDoc for a node.
   * @param {import('@babel/types').Node} node - The node.
   * @returns {{templates: any, params: any}|undefined} The parsed JSDoc.
   */
  getJSDoc(node) {
    const comment = this.getLeadingComment(node);
    if (!comment) {
      return;
    }
    if (comment.includes('@event') || comment.includes('@ignoreRTI')) {
      return;
    }
    if (node.type === 'ClassMethod' && node.kind === 'set') {
      if (node.params.length !== 1) {
        console.warn('getJSDoc> setters require exactly one argument');
      }
      const setterType = parseJSDocSetter(comment, this.expandType);
      if (!setterType) {
        return;
      }
      const paramName = node.params[0].type === 'Identifier' ? node.params[0].name : 'value';
      const params = {[paramName]: setterType};
      return {templates: undefined, params};
    }
    const templates = parseJSDocTemplates(comment);
    const params = parseJSDoc(comment, this.expandType);
    if (!templates && !params) {
      return;
    }
    return {templates, params};
  }
}
export {JSDocAnnotator};