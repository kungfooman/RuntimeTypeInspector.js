import {expandTypeDepFree} from './expandTypeDepFree.mjs';
import {parseJSDoc       } from './parseJSDoc.mjs';
import {parseJSDocSetter } from './parseJSDocSetter.mjs';
import {statReset        } from './stat.mjs';
import {Stringifier      } from './Stringifier.mjs';
/** @typedef {import('@babel/types').Node} Node */
/** @typedef {import('./stat.mjs').Stat} Stat */
/**
 * @typedef {object} Options
 * @property {boolean} [forceCurly]
 * @property {boolean} [validateDivision]
 * @property {Function} [expandType]
 */
class StringifierWithTypeAssertions extends Stringifier {
  /**
   * @param {Options} [options]
   */
  constructor({
    forceCurly = true,
    validateDivision = true,
    expandType = expandTypeDepFree,
  } = {}) {
    super();
    this.forceCurly = forceCurly;
    this.validateDivision = validateDivision;
    // @todo collect every type + manually validate as test set
    // + implement expandType using Babel Flow type parser aswell
    this.expandType = expandType;
  }
  /** @type {Record<string, Stat>} */
  stats = {
    'FunctionDeclaration'    : {checked: 0, unchecked: 0},
    'FunctionExpression'     : {checked: 0, unchecked: 0},
    'ArrowFunctionExpression': {checked: 0, unchecked: 0},
    'ClassMethod#constructor': {checked: 0, unchecked: 0},
    'ClassMethod#method'     : {checked: 0, unchecked: 0},
    'ClassMethod#set'        : {checked: 0, unchecked: 0},
    'ClassMethod#get'        : {checked: 0, unchecked: 0},
  };
  /**
   * We expand type-asserted ArrowFunctionExpressions in order to add type assertions.
   * @override
   * @param {import("@babel/types").ArrowFunctionExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ArrowFunctionExpression(node) {
    const {async, body, generator, params/*, extra*/} = node;
    let out = '';
    if (async) {
      out += 'async ';
    }
    if (generator) {
      out += ' * ';
    }
    out += this.FunctionDeclarationParams(params);
    out += ' =>';
    if (body.type === 'BlockStatement') {
      out += this.toSource(body);
    } else {
      out += ' {\n';
      out += this.generateTypeChecks(node);
      out += this.spaces + 'return ' + this.toSource(body) + ';\n';
      out += '}';
    }
    return out;
  }
  /**
   * @param {Node} node
   * @param {string} type
   * @returns {Node|undefined}
   */
  findParentOfType(node, type) {
    const currentIndex = this.parents.findLastIndex(_ => _ == node);
    return this.parents.findLast((_, i) => {
      if (i > currentIndex) {
        return false;
      }
      return _.type === type;
    });
  }
  /**
   * @param {Node} node - Start searching above this node.
   * @param {string} type - Type we are searching for.
   * @param {Function} predicate - Stop searching when this returns true.
   * @returns {Node|undefined}
   */
  findParentOfTypeWithPredicate(node, type, predicate) {
    const {parents} = this;
    let i = parents.findLastIndex(_ => _ == node);
    i--; // not interested in our start node
    while (i >= 0) {
      const parent = parents[i];
      if (predicate(parent)) {
        return;
      }
      if (parent.type === type) {
        return parent;
      }
      i--;
    }
  }
  /**
   * @param {Node} node - The Babel AST node.
   * @returns {undefined | {}}
   */
  getJSDoc(node) {
    if (node.type === 'BlockStatement') {
      node = this.parent;
    }
    // Receive the leadingComments from the ExpressionStatement, not the FunctionExpression itself.
    if (node.type === 'FunctionExpression') {
      if (node.leadingComments) {
        console.warn("Case of FunctionExpression containing its own leadingComments is not handled");
        return;
      }
      node = this.findParentOfType(node, 'ExpressionStatement');
      if (!node) {
        return;
      }
    }
    let {leadingComments} = node;
    // Receive the leadingComments from ExportNamedDeclaration, if FunctionDeclaration has none
    if (!leadingComments) {
      if (node.type === 'FunctionDeclaration') {
        const exportNamedDeclaration = this.findParentOfType(node, 'ExportNamedDeclaration');
        leadingComments = exportNamedDeclaration?.leadingComments;
      }
      if (node.type === 'ArrowFunctionExpression') {
        let tmp = this.findParentOfType(node, 'VariableDeclaration');
        if (!tmp?.leadingComments) {
          function isFunc(node) {
            // console.log("isFunc", node.type);
            return (
              node.type === 'ArrowFunctionExpression' ||
              node.type === 'FunctionDeclaration'
            );
          }
          tmp = this.findParentOfTypeWithPredicate(node, 'ExportNamedDeclaration', isFunc);
        }
        leadingComments = tmp?.leadingComments;
      }
    }
    if (leadingComments && leadingComments.length) {
      const lastComment = leadingComments[leadingComments.length - 1];
      if (lastComment.type == "CommentBlock") {
        if (lastComment.value.includes('@event')) {
          return;
        }
        if (node.type === 'ClassMethod' && node.kind === 'set') {
          const paramName = this.toSource(node.params[0]);
          if (node.params.length !== 1) {
            console.warn("getJSDoc> setters require exactly one argument");
          }
          return {
            [paramName]: parseJSDocSetter(lastComment.value, this.expandType)
          }
        }
        return parseJSDoc(lastComment.value, this.expandType);
      }
    }
  }
  statsReset() {
    Object.values(this.stats).forEach(statReset);
  }
  statsPrint() {
    console.table(this.stats);
  }
  /**
   * @param {Node} node - The Babel AST node.
   * @returns {Stat}
   */
  getStatsForNode(node) {
    const {parentType, stats} = this;
    if (parentType == 'ClassMethod') {
      const kind = this.parent.kind;
      return stats[`ClassMethod#${kind}`];
    } else if (node.type === 'ArrowFunctionExpression') {
      return stats.ArrowFunctionExpression;
    }
    const stat = stats[parentType];
    if (!stat) {
      console.warn("getStatsForNode> dummy, but unhandled... fix for node type", node);
      return {checked: 0, unchecked: 0};
    }
    return stat;
  }
  /**
   * @param {Node} node - The Babel AST node.
   * @param {string} name
   * @returns {boolean}
   */
  nodeHasParamName(node, name) {
    if (node.type === 'BlockStatement') {
      node = this.parent;
    }
    const {params} = node;
    if (!params) {
      console.warn("nodeHasParamName> Expected params for", {node, name});
      return false;
    }
    return params.some(node => {
      const {type} = node;
      if (type === "AssignmentPattern") {
        const {left} = node;
        console.assert(
          left.type === 'Identifier' ||
          left.type === 'ObjectPattern' ||
          left.type === 'ArrayPattern' ||
          left.type === 'AssignmentPattern',
          'Expected Identifier or ObjectPattern'
        );
        return left.name === name;
      } else if (type === 'Identifier') {
        return node.name === name;
      } else if (type === 'ArrayPattern' || type === 'RestElement') {
        return false;
      } else {
        console.log("Unknown type to test params for", type, node);
      }
      return false;
    })
  }
  /**
   * @override
   * @param {Node} node - The Babel AST node.
   * @returns {string}
   */
  generateTypeChecks(node) {
    const {parentType} = this;
    if (
      node.type === 'BlockStatement' &&
      parentType != 'FunctionDeclaration' &&
      parentType != 'ClassMethod' &&
      parentType != 'FunctionExpression'
    ) {
      return '';
    }
    const jsdoc = this.getJSDoc(node);
    // return '// ' + JSON.stringify(jsdoc) + '\n';
    const stat = this.getStatsForNode(node);
    if (!jsdoc) {
      stat.unchecked++;
      return '';
    }
    stat.checked++;
    let spaces = this.spaces;
    if (node.type !== 'ArrowFunctionExpression') {
      spaces += '  ';
    }
    let out = '';
    //out += `${spaces}/*${spaces}  node.type=${node.type}\n${spaces}
    //  ${JSON.stringify(jsdoc)}\n${parent}\n${spaces}*/\n`;
    for (let name in jsdoc) {
      const type = jsdoc[name];
      const hasParam = this.nodeHasParamName(node, name);
      if (!hasParam) {
        let testNode = node;
        if (node.type === 'BlockStatement') {
          testNode = this.parent;
        }
        const paramIndex = Object.keys(jsdoc).findIndex(_ => _ === name);
        const param = testNode.params[paramIndex];
        if (param) {
          const isObjectPattern = param.type === 'ObjectPattern';
          const isArrayPattern = param.type === 'ArrayPattern';
          const isSupportedPattern = isObjectPattern || isArrayPattern;
          // There are four kinds of patterns:
          //   ObjectPattern:
          //     function test({x = 123}) {return x;} test({x: 456});
          //   ArrayPattern:
          //     function test([x = 123]) {return x;}; test([456]);
          //   AssignmentPattern made up of ObjectPattern:
          //     function test({x = 123} = {}) {return x;} test();
          //   AssignmentPattern made up of ArrayPattern:
          //     function test([x = 123] = []) {return x;} test();
          if (isSupportedPattern) {
            // The name doesn't matter any longer, because any pattern inherently
            // drops the identifier from the AST. But we can access it
            // via arguments[paramIndex] anyway.
            name = `arguments[${paramIndex}]`;
          } else if (param.type === 'AssignmentPattern') {
            const loc = this.getName(node);
            if (param.left.type === 'ArrayPattern' && type.type === 'array') {
              // Add a type assertion for each element of the ArrayPattern
              for (const element of param.left.elements) {
                if (element.type !== 'Identifier') {
                  console.warn('Only Identifier case handled right now');
                  continue;
                }
                const t = JSON.stringify(type.elementType, null, 2).replaceAll('\n', '\n' + spaces);
                out += `${spaces}if (!assertType(${element.name}, ${t}, '${loc}', '${name}')) {\n`;
                out += `${spaces}  youCanAddABreakpointHere();\n${spaces}}\n`;
              }
              continue;
            } else if (param.left.type === 'ObjectPattern' && type.type === 'object') {
              // Add a type assertion for each property of the ObjectPattern
              for (const property of param.left.properties) {
                if (property.key.type !== 'Identifier') {
                  console.warn('ObjectPattern> Only Identifier case handled right now');
                  continue;
                }
                const keyName = property.key.name;
                const subType = type.properties[keyName];
                if (!subType) {
                  console.warn("missing subtype information in JSDoc");
                  continue;
                }
                const t = JSON.stringify(subType, null, 2).replaceAll('\n', '\n' + spaces);
                out += `${spaces}if (!assertType(${keyName}, ${t}, '${loc}', '${name}')) {\n`;
                out += `${spaces}  youCanAddABreakpointHere();\n${spaces}}\n`;
              }
              continue;
            }
            console.warn(`generateTypeChecks> ${loc}> todo implement`,
                        `AssignmentPattern for parameter ${name}`);
            continue;
          }
        } else {
          const loc = this.getName(node);
          console.warn(`generateTypeChecks> ${loc}> Missing param: ${name}`);
          continue;
        }
      }
      let t = JSON.stringify(type, null, 2).replaceAll('\n', '\n' + spaces);
      if (type === 'this') {
        const classDecl = this.findParentOfType(node, 'ClassDeclaration');
        if (!classDecl?.id) {
          console.warn('generateTypeChecks> !classDecl?.id');
        }
        t = '"' + this.toSource(classDecl.id) + '"';
      }
      const loc = this.getName(node);
      let prevCheck = '';
      // JSDoc doesn't support multiple function signatures yet, but this is
      // exactly what we would need to deal with ObjectPool'ing
      if (
        loc === 'ContactPoint#constructor' ||
        loc === 'ContactResult#constructor' ||
        loc === 'SingleContactResult#constructor'
      ) {
        prevCheck = 'arguments.length !== 0 && ';
      }
      out += `${spaces}if (${prevCheck}!assertType(${name}, ${t}, '${loc}', '${name}')) {\n`;
      out += `${spaces}  youCanAddABreakpointHere();\n${spaces}}\n`;
    }
    return out;
  }
  /**
   * @param {Node} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  getName(node) {
    const toSource = this.toSource.bind(this);
    if (node.type === 'BlockStatement') {
      node = this.parent;
    }
    const {type, key, id} = node;
    switch (type) {
      case 'FunctionDeclaration':
        return toSource(id);
      case "ClassMethod":
        const classDecl = this.parents.findLast(_ => _.type == 'ClassDeclaration');
        let out = ''
        if (classDecl) {
          out += toSource(classDecl.id) + '#';
        }
        out += toSource(key);
        return out;
      case 'FunctionExpression':
        if (id) {
          return toSource(id);
        }
        const expressionStatement = this.findParentOfType(node, 'ExpressionStatement');
        if (!expressionStatement) {
          return "unnamed function expression";
        }
        return toSource(expressionStatement.expression.left);
      case 'ArrowFunctionExpression':
        const parent = this.findParentOfType(node, 'VariableDeclarator');
        if (parent) {
          return toSource(parent.id);
        } else {
          return "getName> missing parent for " + node.type;
        }
      default:
        console.warn("getName> unhandled type", type, "for", node);
        return '/*MISSING*/';
    }
  }
  /**
   * @override
   * @param {import("@babel/types").BinaryExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  BinaryExpression(node) {
    if (!this.validateDivision) {
      return super.BinaryExpression(node);
    }
    const {left, operator, right} = node;
    const left_ = this.toSource(left);
    const right_ = this.toSource(right);
    if (operator === '/') {
      return `validateDivision(${left_}, ${right_})`;
    }
    return `${left_} ${operator} ${right_}`;
  }
  /** @type {Record<string, object>} */
  typedefs = {};
  /**
   * @param {string} comment - The comment.
   */
  handleBlockCommentOfFile(comment) {
    const {type, value} = comment;
    if (type !== 'CommentBlock') {
      return;
    }
    const lines = value.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (line[0] === '*') {
        line = line.slice(1).trim();
      }
      if (line.startsWith('@typedef')) {
        const firstCurly = line.indexOf('{');
        let k = firstCurly + 1;
        let count = 0;
        for (; k<line.length; k++) {
          const c = line[k];
          if (c === '{') {
            count++;
          } else if (c === '}') {
            count--;
          }
          if (count === -1) {
            break;
          }
        }
        const def = line.substring(firstCurly + 1, k);
        let i = k;
        while (i < line.length) {
          const c = line[i];
          if (c === ' ') {
            i++;
            continue;
          }
          break;
        }
        if (line[i] !== '}') {
          console.warn("expected }");
          break;
        }
        i++;
        let name = line.substring(i).trim();
        // Drop description
        name = name.split(' ')[0];
        this.typedefs[name] = this.expandType(def);
      }
    }
  }
  /**
   * @override
   * @param {import("@babel/types").File} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  File(node) {
    const {errors, program, comments} = node;
    for (const comment of comments) {
      this.handleBlockCommentOfFile(comment);
    }
    //console.log("this.typedefs", this.typedefs);
    let out = '';
    for (const name in this.typedefs) {
      const typedef = this.typedefs[name];
      const json = JSON.stringify(typedef, null, 2);
      out += `registerTypedef('${name}', ${json});\n`;
    }
    const code = this.toSource(program) + '\n';
    out += code;
    return out;
  }
}
export {StringifierWithTypeAssertions};
