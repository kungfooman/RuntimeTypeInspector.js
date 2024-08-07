import {requiredTypeofs    } from './expandType.js';
import {expandTypeDepFree  } from './expandTypeDepFree.js';
import {nodeIsFunction     } from './nodeIsFunction.js';
import {parseJSDoc         } from './parseJSDoc.js';
import {parseJSDocSetter   } from './parseJSDocSetter.js';
import {parseJSDocTemplates} from './parseJSDocTemplates.js';
import {parseJSDocTypedef  } from './parseJSDocTypedef.js';
import {statReset          } from './stat.js';
import {Stringifier        } from './Stringifier.js';
/** @typedef {import('@babel/types').Node              } Node               */
/** @typedef {import('@babel/types').ClassMethod       } ClassMethod        */
/** @typedef {import('@babel/types').ClassPrivateMethod} ClassPrivateMethod */
/** @typedef {import('./stat.js').Stat                 } Stat               */
/**
 * @typedef {object} Options
 * @property {boolean} [forceCurly] - Determines whether curly braces are enforced in Stringifier.
 * @property {boolean} [validateDivision] - Indicates whether division operations should be validated.
 * @property {import('./parseJSDoc.js').ExpandType} [expandType] - A function that expands shorthand types into full descriptions.
 * @property {string} [filename] - The name of a file to which the instance pertains.
 * @property {boolean} [addHeader] - Whether to add import declarations headers. Defaults to true.
 * @property {string[]} [ignoreLocations] - Ignore these locations because they are known false-positives.
 */
class Asserter extends Stringifier {
  /**
   * @param {Options} [options] - The options.
   */
  constructor({
    forceCurly = true,
    validateDivision = true,
    expandType = expandTypeDepFree,
    filename,
    addHeader = true,
    ignoreLocations = [],
  } = {}) {
    super();
    this.forceCurly = forceCurly;
    this.validateDivision = validateDivision;
    // @todo collect every type + manually validate as test set
    // + implement expandType using Babel Flow type parser aswell
    this.expandType = expandType;
    this.filename = filename;
    this.addHeader = addHeader;
    this.ignoreLocations = ignoreLocations;
  }
  /** @type {Record<string, Stat>} */
  stats = {
    'ArrowFunctionExpression'  : {checked: 0, unchecked: 0},
    'ClassMethod#constructor'  : {checked: 0, unchecked: 0},
    'ClassMethod#get'          : {checked: 0, unchecked: 0},
    'ClassMethod#method'       : {checked: 0, unchecked: 0},
    'ClassMethod#set'          : {checked: 0, unchecked: 0},
    'ClassPrivateMethod#get'   : {checked: 0, unchecked: 0},
    'ClassPrivateMethod#method': {checked: 0, unchecked: 0},
    'ClassPrivateMethod#set'   : {checked: 0, unchecked: 0},
    'FunctionDeclaration'      : {checked: 0, unchecked: 0},
    'FunctionExpression'       : {checked: 0, unchecked: 0},
    'ObjectMethod'             : {checked: 0, unchecked: 0},
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
      const {spaces} = this;
      this.numSpaces++;
      out += this.spaces + 'return ' + this.toSource(body) + ';\n';
      this.numSpaces--;
      out += spaces;
      out += '}';
    }
    return out;
  }
  /**
   * @override
   * @param {import("@babel/types").ClassDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ClassDeclaration(node) {
    const {id} = node;
    const id_ = this.toSource(id);
    let out = super.ClassDeclaration(node);
    out += `${this.spaces}registerClass(${id_});`;
    return out;
  }
  /**
   * Finds the closest ancestor of the given node that matches the specified type.
   *
   * @param {Node} node - The starting node to search from.
   * @param {T} type - Type name of the node to search for.
   * @template {Node['type']} T
   * @returns {Extract<Node, {type: T}>|undefined} The first ancestor node of the specified type, or undefined if none is found.
   */
  findParentOfType(node, type) {
    const currentIndex = this.parents.findLastIndex(_ => _ === node);
    return this.parents.findLast((_, i) => {
      if (i > currentIndex) {
        return false;
      }
      return _.type === type;
    });
  }
  /**
   * Alternatively "import * as rti from ..." would also prevent "Unused external imports" warning...
   * or keeping log of every single call during RTI parsing.
   * @todo
   * Once we went over every node, we can see if we really require registerTypef, registerClass etc.
   * @returns {string} The import declaration header for importing RTI.
   * @override
   */
  getHeader() {
    if (!this.addHeader) {
      return '';
    }
    let header = super.getHeader();
    header += "import {inspectType, inspectTypeWithTemplates, youCanAddABreakpointHere, registerVariable";
    if (this.validateDivision) {
      header += ", validateDivision";
    }
    header += ", registerTypedef, registerClass, registerImportNamespaceSpecifier} from '@runtime-type-inspector/runtime';\n";
    // Prevent tree-shaking in UMD build so we can always "add a breakpoint here".
    header += "export * from '@runtime-type-inspector/runtime';\n";
    return header;
  }
  /**
   * Retrieves the node associated with the leading comments for an arrow function expression.
   *
   * This method travels up the syntax tree from the given node to find a parent node with leading comments.
   * This search is bounded by function boundaries or a 'CallExpression' node, as per the logic defined within the loop.
   * @param {Node} node - The node representing the arrow function expression for which to find the leading comments node.
   * @returns {Node|undefined} The node that contains the leading comments, or `undefined`
   * if none is found before reaching a different function or 'CallExpression'.
   */
  getLeadingCommentsNodeForArrowFunctionExpression(node) {
    const {parents} = this;
    let i = parents.findLastIndex(_ => _ === node);
    let parent = parents[i];
    if (parent.leadingComments) {
      return parent;
    }
    // Skip now, if we find another function first,
    // there is no JSDoc for our function anymore.
    // Not interested in our start node if it didn't
    // contain leadingComments.
    i--;
    while (i >= 0) {
      parent = parents[i];
      //if (parent.type === 'CallExpression') {
      //  break;
      //}
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
   * Emits a warning message to the console, optionally prefixed with the instance's filename.
   * @param {...any} args - A list of arguments to be passed to the console.warn function.
   */
  warn(...args) {
    if (this.filename) {
      console.warn("[WARN]", this.filename);
    }
    console.warn(...args);
  }
  getLeadingCommentsNodeForFunctionExpression(node) {
    const {parents} = this;
    let i = parents.findLastIndex(_ => _ === node);
    let parent = parents[i];
    if (parent.leadingComments) {
      return parent;
    }
    // Skip now, if we find another function first,
    // there is no JSDoc for our function anymore.
    // Not interested in our start node if it didn't
    // contain leadingComments.
    i--;
    while (i >= 0) {
      parent = parents[i];
      //if (parent.type === 'CallExpression') {
      //  break;
      //}
      if (nodeIsFunction(parent)) {
        break;
      }
      if (parent.leadingComments) {
        return parent;
      }
      i--;
    }
    /** @todo convert all files in test/typechecking/*.mjs into full unit tests */
    // Old way:
    // if (node.leadingComments) {
    //   return node.leadingComments;
    // }
    // node = this.findParentOfType(node, 'ExpressionStatement');
    // if (!node) {
    //   /**
    //    * @todo Need more refactoring, see missing type-assertions in test/typechecking/good-old-es5.mjs
    //    */
    //   node = this.parents.findLast(_ => _.type === 'VariableDeclaration');
    //   if (!node) {
    //     return;
    //   }
    // }
  }
  /**
   * @param {Node} node - The Babel AST node.
   * @returns {string|undefined} The JSDoc comment of `node`.
   */
  getLeadingComment(node) {
    if (node.type === 'BlockStatement') {
      node = this.parent;
    }
    let {leadingComments} = node;
    // Receive the leadingComments from the ExpressionStatement, not the FunctionExpression itself.
    if (node.type === 'FunctionExpression') {
      const tmp = this.getLeadingCommentsNodeForFunctionExpression(node);
      leadingComments = tmp?.leadingComments;
    }
    // Receive the leadingComments from ExportNamedDeclaration, if FunctionDeclaration has none
    if (!leadingComments) {
      if (node.type === 'FunctionDeclaration') {
        const exportNamedDeclaration = this.findParentOfType(node, 'ExportNamedDeclaration');
        leadingComments = exportNamedDeclaration?.leadingComments;
      }
      if (node.type === 'ArrowFunctionExpression') {
        const tmp = this.getLeadingCommentsNodeForArrowFunctionExpression(node);
        leadingComments = tmp?.leadingComments;
      }
    }
    if (leadingComments && leadingComments.length) {
      const lastComment = leadingComments[leadingComments.length - 1];
      if (lastComment.type === "CommentBlock") {
        return lastComment.value;
      }
    }
  }
  /**
   * @param {Node} node - The Babel AST node.
   * @todo ESLint problem:
   * returns {import('./parseJSDoc.js').ParseJSDocReturnType} The return value of `parseJSDoc`
   * returns {Record<string, import('./parseJSDoc.js').ExpandTypeReturnType> | undefined} The
   * return value of `parseJSDoc`.
   * @returns {Record<string, any>|undefined} asd
   */
  getJSDoc(node) {
    const comment = this.getLeadingComment(node);
    if (!comment) {
      return;
    }
    if (comment.includes('@event')) {
      return;
    }
    if (comment.includes('@ignoreRTI')) {
      return;
    }
    // Need to do same resolving as in: this.getLeadingComment(node)
    if (node.type === 'BlockStatement') {
      node = this.parent;
    }
    if (node.type === 'ClassMethod') {
      if (node.kind === 'get') {
        // JSDoc on a getter is just some documentation.
        return;
      } else if (node.kind === 'set') {
        if (node.params.length !== 1) {
          this.warn("getJSDoc> setters require exactly one argument");
        }
        const setterType = parseJSDocSetter(comment, this.expandType);
        if (!setterType) {
          return;
        }
        const paramName = this.getNameOfParam(node.params[0]);
        const params    = {[paramName]: setterType};
        return {templates: undefined, params};
      }
    }
    const templates = parseJSDocTemplates(comment);
    const params = parseJSDoc(comment, this.expandType);
    if (!templates && !params) {
      return;
    }
    return {templates, params};
  }
  /**
   * Retrieves the name of a parameter from a Babel AST node.
   *
   * This function expects a node representing a function parameter and attempts to extract
   * the parameter's name directly or from an AssignmentPattern.
   *
   * @param {Node} param - The AST node representing the function parameter from which to extract the name.
   * @returns {string} The name of the parameter as a string, or the parameter's source code if the extraction fails.
   */
  getNameOfParam(param) {
    if (param.type === 'Identifier') {
      return param.name;
    } else if (param.type === 'AssignmentPattern') {
      if (param.left.type === 'Identifier') {
        return param.left.name;
      }
    }
    this.warn("Unable to retrieve name from param in specified way - may contain too much information.");
    return this.toSource(param);
  }
  statsReset() {
    Object.values(this.stats).forEach(statReset);
  }
  statsPrint() {
    console.table(this.stats);
  }
  /**
   * Retrieves statistical information for a given Babel AST node of this instance.
   *
   * @param {Node} node - The Babel AST node for which the statistical data is retrieved.
   * @returns {Stat} An object containing the statistical data for the specified node. If the
   * node type is unhandled, defaults to returning a dummy object with 'checked' and 'unchecked'
   * properties both set to 0.
   */
  getStatsForNode(node) {
    const {stats} = this;
    const type = nodeIsFunction(node) ? node.type : this.parentType;
    if (type === 'ClassMethod') {
      const parent = /** @type {ClassMethod} */(
        this.parent
      );
      const {kind} = parent;
      return stats[`ClassMethod#${kind}`];
    } else if (type === 'ClassPrivateMethod') {
      const parent = /** @type {ClassPrivateMethod} */(
        this.parent
      );
      const {kind} = parent;
      return stats[`ClassPrivateMethod#${kind}`];
    }
    const stat = stats[type];
    if (!stat) {
      this.warn("getStatsForNode> dummy, but unhandled... fix for node type", node);
      return {checked: 0, unchecked: 0};
    }
    return stat;
  }
  /**
   * Checks if a provided Babel AST node has a parameter with the given name.
   *
   * This function will look at the node's parameters if available and determine whether
   * one of them matches the provided name. Supports various parameter types such as Identifiers
   * and AssignmentPatterns.
   *
   * @param {Node} node - The Babel AST node to inspect. If it's a BlockStatement, the parent node is used instead.
   * @param {string} name - The name of the parameter to look for within the node's parameters.
   * @returns {boolean} True if the node has a parameter with the given name; false otherwise.
   */
  nodeHasParamName(node, name) {
    if (node.type === 'BlockStatement') {
      node = this.parent;
    }
    const {params} = node;
    if (!params) {
      this.warn("nodeHasParamName> Expected params for", {node, name});
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
      } else if (type === 'ArrayPattern' || type === 'ObjectPattern' || type === 'RestElement') {
        return false;
      }
      const _ = new Stringifier();
      const code = _.toSource(node);
      console.log("Unknown type to test params for", type, code);
      return false;
    });
  }
  /**
   * Generates a string containing type checks for a given Babel AST node based on associated JSDoc information.
   *
   * This function analyzes the node and its JSDoc annotations to construct runtime type
   * check expressions. It handles various parameter patterns and outputs code that performs
   * actual type assertions. If a node does not correspond to any known or supported pattern,
   * it returns an empty string.
   *
   * @override
   * @param {Node} node - The Babel AST node for which to generate type checks.
   * @returns {string} A string of code with type check assertions, based on the JSDoc comments associated with the given node.
   */
  generateTypeChecks(node) {
    const {parent} = this;
    if (node.type === 'BlockStatement' && !nodeIsFunction(parent)) {
      return '';
    }
    const jsdoc = this.getJSDoc(node);
    // return '// ' + JSON.stringify(jsdoc) + '\n';
    const stat = this.getStatsForNode(node);
    if (!jsdoc) {
      stat.unchecked++;
      return '';
    }
    const {templates, params} = jsdoc;
    if (!params) {
      console.warn("This should never happen, please check your input code.", this.getLeadingComment(node), {jsdoc});
      stat.unchecked++;
      return '';
    }
    stat.checked++;
    const {spaces} = this;
    let out = '';
    let first = true;
    const loc = this.getName(node);
    if (this.ignoreLocations.includes(loc)) {
      return '// IGNORE RTI TYPE VALIDATIONS, KNOWN ISSUES\n';
    }
    if (templates) {
      const tmp = JSON.stringify(templates, null, 2).replaceAll('\n', '\n' + spaces);
      out += `\n${spaces}const rtiTemplates = ${tmp};`;
    }
    function newlineBeforeFirst() {
      if (first) {
        out += '\n';
        first = false;
      }
    }
    //out += `${spaces}/*${spaces}  node.type=${node.type}\n${spaces}
    //  ${JSON.stringify(jsdoc)}\n${parent}\n${spaces}*/\n`;
    for (let name in params) {
      const type = params[name];
      // Copy name for warnings, `name` may become `arguments[${paramIndex}]`.
      const nameFancy = name;
      const hasParam = this.nodeHasParamName(node, name);
      if (!hasParam) {
        let testNode = node;
        if (node.type === 'BlockStatement') {
          testNode = this.parent;
        }
        const paramIndex = Object.keys(params).findIndex(_ => _ === name);
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
                if (element.type === 'RestElement') {
                  // Case for:
                  // function test([a, b, ...rest] = [1, 2, 3]) {return rest;}
                  /** @todo We could typecheck the rest element too */
                  // console.log("Ignore RestElement", element);
                  continue;
                }
                if (element.type !== 'Identifier') {
                  this.warn('Only Identifier case handled right now');
                  continue;
                }
                const t = JSON.stringify(type.elementType, null, 2).replaceAll('\n', '\n' + spaces);
                newlineBeforeFirst();
                if (templates) {
                  out += `${spaces}if (!inspectTypeWithTemplates(${element.name}, ${t}, '${loc}', '${nameFancy}', rtiTemplates)) {\n`;
                } else {
                  out += `${spaces}if (!inspectType(${element.name}, ${t}, '${loc}', '${nameFancy}')) {\n`;
                }
                out += `${spaces}  youCanAddABreakpointHere();\n${spaces}}\n`;
              }
              continue;
            } else if (param.left.type === 'ObjectPattern') {
              // If we have properties from JSDoc, we can create individual type inspections.
              if (type?.properties && Object.keys(type.properties).length) {
                // Add a type assertion for each property of the ObjectPattern
                for (const property of param.left.properties) {
                  if (property.type !== 'ObjectProperty') {
                    // E.g. case of RestElement, {a, b, c, ...kwargs}
                    // console.log("Ignore property", property);
                    continue;
                  }
                  if (property.key.type !== 'Identifier') {
                    this.warn('ObjectPattern> Only Identifier case handled right now');
                    continue;
                  }
                  const keyName = property.key.name;
                  if (type.type !== 'object' || !type.properties) {
                    this.warn(
                      "missing subtype information in JSDoc> in type",
                      JSON.stringify(type, null, 2),
                      "for ObjectPattern:", this.toSource(property).trim()
                    );
                    continue;
                  }
                  const subType = type.properties[keyName];
                  if (!subType) {
                    this.warn("missing subtype information in JSDoc");
                    continue;
                  }
                  const t = JSON.stringify(subType, null, 2).replaceAll('\n', '\n' + spaces);
                  newlineBeforeFirst();
                  if (templates) {
                    out += `${spaces}if (!inspectTypeWithTemplates(${keyName}, ${t}, '${loc}', '${nameFancy}', rtiTemplates)) {\n`;
                  } else {
                    out += `${spaces}if (!inspectType(${keyName}, ${t}, '${loc}', '${nameFancy}')) {\n`;
                  }
                  out += `${spaces}  youCanAddABreakpointHere();\n${spaces}}\n`;
                }
                continue;
              } else {
                // The case when we have an ObjectPattern with a @typedef
                name = `arguments[${paramIndex}]`;
              }
            } else {
              this.warn(`generateTypeChecks> ${loc}> todo implement`,
                        `AssignmentPattern for parameter ${name}`);
              continue;
            }
          }
        } else {
          const loc = this.getName(node);
          this.warn(`generateTypeChecks> ${loc}> Missing param: ${name}`);
          continue;
        }
      }
      let t = JSON.stringify(type, null, 2).replaceAll('\n', '\n' + spaces);
      if (type === 'this') {
        const classDecl = this.findParentOfType(node, 'ClassDeclaration');
        if (!classDecl?.id) {
          this.warn('generateTypeChecks> !classDecl?.id');
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
      newlineBeforeFirst();
      if (templates) {
        out += `${spaces}if (${prevCheck}!inspectTypeWithTemplates(${name}, ${t}, '${loc}', '${nameFancy}', rtiTemplates)) {\n`;
      } else {
        out += `${spaces}if (${prevCheck}!inspectType(${name}, ${t}, '${loc}', '${nameFancy}')) {\n`;
      }
      out += `${spaces}  youCanAddABreakpointHere();\n${spaces}}\n`;
    }
    return out;
  }
  /**
   * @param {Node} node - The Babel AST node.
   * @returns {string} Best possible human-readable name of given node.
   */
  getNameForFunctionExpression(node) {
    const objectProperty = this.findParentOfType(node, 'ObjectProperty');
    if (objectProperty) {
      // See good-old-es5.mjs example for a test case
      // TODO: Make an even better name based on Object.assign(ScopeSpace.prototype
      // Ideally we would figure out the name: ScopeSpace#resolve
      // Currently we only find "resolve" (still better than 'unnamed function expression'...)
      return this.toSource(objectProperty.key);
    }
    const expressionStatement = this.findParentOfType(node, 'ExpressionStatement');
    if (expressionStatement) {
      // There are many kinds of expressions
      // type Expression = ArrayExpression | AssignmentExpression | BinaryExpression | CallExpression | ...
      const {left} = expressionStatement.expression;
      if (left) {
        return this.toSource(left);
      }
      console.warn("Asserter#getNameForFunctionExpression> expression without left");
    }
    return 'unnamed function expression';
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
      case 'ClassMethod':
      case 'ClassPrivateMethod':
        const classDecl = this.parents.findLast(_ => _.type === 'ClassDeclaration');
        let out = '';
        if (classDecl) {
          out += toSource(classDecl.id) + '#';
        }
        out += toSource(key);
        return out;
      case 'FunctionExpression':
        if (id) {
          return toSource(id);
        }
        return this.getNameForFunctionExpression(node);
      case 'ArrowFunctionExpression':
        const parent = this.findParentOfType(node, 'VariableDeclarator');
        if (parent) {
          return toSource(parent.id);
        }
        return 'getName> missing parent for ' + node.type;
      case 'ObjectMethod':
        return toSource(key);
      case 'BinaryExpression':
        const goodNames = ['FunctionDeclaration', 'ClassMethod', 'ClassPrivateMethod'];
        const goodParent = this.parents.findLast(_ => goodNames.includes(_.type));
        if (goodParent) {
          return this.getName(goodParent);
        }
        // top scope
        return `${this.filename}:${node?.loc?.start?.line}`;
    }
    this.warn('getName> unhandled type', type, 'for', node, this.path);
    //debugger;
    return `${this.filename}:${node?.loc?.start?.line}`;
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
      const loc = this.getName(node);
      return `validateDivision(${left_}, ${right_}, ${JSON.stringify(loc)})`;
    }
    return `${left_} ${operator} ${right_}`;
  }
  /** @type {Record<string, object>} */
  typedefs = {};
  /**
   * @override
   * @param {import("@babel/types").File} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  File(node) {
    // @todo figure out why errors is in Babel node and not in @babel/types...
    const {/*errors,*/ program, comments} = node;
    if (comments) {
      for (const comment of comments) {
        const warn = this.warn.bind(this);
        parseJSDocTypedef(this.typedefs, warn, comment, this.expandType);
      }
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
  /**
   * @override
   * @param {import("@babel/types").VariableDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  VariableDeclaration(node) {
    const {declarations} = node;
    let ret = super.VariableDeclaration(node);
    for (const {id} of declarations) {
      const name = this.toSource(id);
      if (requiredTypeofs[name] === 'missing') {
        ret += `\n${this.spaces}registerVariable('${name}', ${name});\n`;
        requiredTypeofs[name] = 'found';
      } else if (requiredTypeofs[name] === 'found') {
        console.warn(`Already registered variable named ${name} for typeof validation`);
      }
    }
    return ret;
  }
  /** @type {string[]} */
  addLaterImportNamespaceSpecifier = [];
  /**
   * @override
   * @param {import("@babel/types").ImportDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ImportDeclaration(node) {
    let out = super.ImportDeclaration(node);
    for (const name of this.addLaterImportNamespaceSpecifier) {
      out += `\nregisterImportNamespaceSpecifier('${name}', ${name});`;
    }
    return out;
  }
  /**
   * @override
   * @param {import("@babel/types").ImportNamespaceSpecifier} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ImportNamespaceSpecifier(node) {
    const {local} = node;
    const name = this.toSource(local);
    this.addLaterImportNamespaceSpecifier.push(name);
    return super.ImportNamespaceSpecifier(node);
  }
}
export {Asserter};
