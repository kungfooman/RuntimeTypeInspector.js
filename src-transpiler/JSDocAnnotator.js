import {expandTypeDepFree} from './expandTypeDepFree.js';
import {nodeChildren} from './nodeChildren.js';
import {nodeIsFunctionLike} from './nodeIsFunctionLike.js';
import {parseJSDoc} from './parseJSDoc.js';
import {parseJSDocSetter} from './parseJSDocSetter.js';
import {parseJSDocTemplates} from './parseJSDocTemplates.js';
import {parseJSDocTypedef} from './parseJSDocTypedef.js';
class JSDocAnnotator {
  /** @type {import('@babel/types').Node[]} */
  parents = [];
  /** @type {Record<string, object>} */
  typedefs = {};
  /** @type {Record<string, string[]>} */
  typedefTemplates = {};
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
          parseJSDocTypedef(this.typedefs, this.typedefTemplates, warn, comment, this.expandType);
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
    if (nodeIsFunctionLike(node)) {
      const jsdoc = this.getJSDoc(node);
      if (jsdoc) {
        node.jsdoc = jsdoc;
        const paramTypes = this.collectParamTypes(node);
        if (Object.keys(paramTypes).length > 0) {
          node.paramTypes = paramTypes;
        }
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
   * Collects the parameter names into a map of names to types.
   * @param {import('@babel/types').ArrowFunctionExpression | import('@babel/types').FunctionDeclaration | import('@babel/types').FunctionExpression | import('@babel/types').ObjectMethod | import('@babel/types').ClassMethod | import('@babel/types').ClassPrivateMethod} node - The function-like node.
   * @returns {Record<string, string | object>} The map of parameter names to types.
   */
  collectParamTypes(node) {
    const jsdocParams = node.jsdoc?.params || {};
    const paramNames = Object.keys(jsdocParams);
    const paramTypes = {};
    node.params.forEach((paramNode, index) => {
      const paramName = paramNames[index];
      if (paramName) {
        const typeInfo = jsdocParams[paramName];
        this.collectParamNames(paramNode, typeInfo, paramTypes);
      }
    });
    return paramTypes;
  }
  /**
   * Recursively collects parameter names from a pattern with their types.
   * @param {import('@babel/types').PatternLike} paramNode - The parameter node.
   * @param {string | object} typeInfo - The type information.
   * @param {Record<string, string | object>} map - The map to collect into.
   */
  collectParamNames(paramNode, typeInfo, map) {
    if (!typeInfo) {
      console.warn("!typeInfo", {paramNode, typeInfo});
      return;
    }
    const {type} = paramNode;
    if (type === 'Identifier') {
      map[paramNode.name] = typeInfo;
    } else if (type === 'ObjectPattern') {
      if (typeof typeInfo !== 'object' || typeInfo.type !== 'object' || !typeInfo.properties) {
        console.warn("typeof typeInfo !== 'object' || typeInfo.type !== 'object' || !typeInfo.properties", {paramNode, typeInfo});
        return;
      }
      const propTypes = typeInfo.properties;
      paramNode.properties.forEach(prop => {
        if (prop.type !== 'ObjectProperty') {
          console.warn("prop.type !== 'ObjectProperty'", {paramNode, typeInfo});
          return;
        }
        if (prop.key.type !== 'Identifier') {
          console.warn("prop.key.type !== 'Identifier'", {paramNode, typeInfo});
          return;
        }
        const keyName = prop.key.name;
        const subType = propTypes[keyName];
        if (!subType) {
          console.warn("!subType", {paramNode, typeInfo});
          return;
        }
        this.collectParamNames(prop.value, subType, map);
      });
    } else if (type === 'ArrayPattern') {
      // console.log("ARRAY PATTERN", {type, typeInfo});
      if (typeof typeInfo !== 'object') {
        console.warn("typeof typeInfo !== 'object'", {paramNode, typeInfo});
        return;
      }
      switch (typeInfo.type) {
        case 'array':
          if (!typeInfo.elementType) {
            console.warn("Expected array type, but missing 'elementType' property.", {paramNode, typeInfo});
            return;
          }
          const elementType = typeInfo.elementType;
          paramNode.elements.forEach(el => {
            if (!el) {
              console.warn("!el", {paramNode, typeInfo});
              return;
            }
            this.collectParamNames(el, elementType, map);
          });
          break;
        case 'tuple':
          // console.log("TUPLE PATTERN", {type, typeInfo});
          if (!typeInfo.elements) {
            console.warn("Expected tuple type, but missing 'elements' property.", {paramNode, typeInfo});
            return;
          }
          const elements = typeInfo.elements;
          paramNode.elements.forEach((el, i) => {
            const elType = elements[i];
            if (el === null) {
              // Example missing 'd' param: function addStr(a, {b}, [c], [, e])
              return;
            }
            // console.log(`paramNode.elements[${i}]`, el, "elType", elType);
            this.collectParamNames(el, elType, map);
          });
          break;
        default:
          console.warn('Unsupported type for ArrayPattern:', typeInfo.type, {paramNode, typeInfo});
          break;
      }
    } else if (type === 'AssignmentPattern') {
      this.collectParamNames(paramNode.left, typeInfo, map);
    } else if (type === 'RestElement') {
      this.collectParamNames(paramNode.argument, typeInfo, map);
    }
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
      if (nodeIsFunctionLike(parent)) {
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
      if (nodeIsFunctionLike(parent)) {
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
