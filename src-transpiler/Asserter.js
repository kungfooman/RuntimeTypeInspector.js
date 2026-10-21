import {annotateOptional   } from './annotateOptional.js';
import {requiredTypeofs    } from './expandType.js';
import {expandTypeDepFree  } from './expandTypeDepFree.js';
import {harvestClassShape  } from './harvestClassShape.js';
import {inferTypeFromDefault} from './inferTypeFromDefault.js';
import {parseInlineParamType} from './parseInlineParamType.js';
import {quoteName} from './quoteName.js';
import {nodeIsFunctionLike } from './nodeIsFunctionLike.js';
import {parseJSDoc         } from './parseJSDoc.js';
import {parseJSDocSetter   } from './parseJSDocSetter.js';
import {parseJSDocTemplates} from './parseJSDocTemplates.js';
import {parseJSDocTypedef  } from './parseJSDocTypedef.js';
import {markTypeofRequirements} from './markTypeofRequirements.js';
import {ignoredParamsIn     } from './ignoredParamsIn.js';
import {runtimeImportNames  } from './runtimeImportNames.js';
import {simplifyTypeToSource} from './simplifyTypeToSource.js';
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
 * @property {boolean} [inspectIndexedAccess] - Indicates whether indexed accesses
 * like `arr[i]` should be wrapped for bounds and integer validation. Disable
 * to drop indexed access inspection entirely. Defaults to true.
 * @property {import('./parseJSDoc.js').ExpandType} [expandType] - A function that expands shorthand types into full descriptions.
 * @property {string} [filename] - The name of a file to which the instance pertains.
 * @property {boolean} [addHeader] - Whether to add import declarations headers. Defaults to true.
 * @property {string[]} [ignoreLocations] - Ignore these locations because they are known false-positives.
 * @property {string} [projectVersion] - Host project version funneled into
 * the emitted header via `setProjectVersion(...)`, so `Download log` meta
 * identifies the app build. Bundler plugins resolve it from their own
 * option or the host package.json.
 */
class Asserter extends Stringifier {
  /**
   * @param {Options} [options] - The options.
   */
  constructor({
    forceCurly = true,
    validateDivision = true,
    inspectIndexedAccess = true,
    expandType = expandTypeDepFree,
    filename,
    addHeader = true,
    ignoreLocations = [],
    projectVersion,
  } = {}) {
    super();
    this.forceCurly = forceCurly;
    this.validateDivision = validateDivision;
    this.inspectIndexedAccess = inspectIndexedAccess;
    // @todo collect every type + manually validate as test set
    // + implement expandType using Babel Flow type parser aswell
    this.expandType = expandType;
    this.filename = filename;
    this.addHeader = addHeader;
    this.ignoreLocations = ignoreLocations;
    this.projectVersion = projectVersion;
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
    const harvested = harvestClassShape(node, {expandType: this.expandType, warn: this.warn.bind(this)});
    if (harvested) {
      // Hand-written typedefs win: emitting a second registerTypedef for the
      // same name would be last-wins deterministic but noisy, so the harvest
      // step skips names already present in this.typedefs (populated in File).
      if (this.typedefs[harvested.name]) {
        this.warn(`harvestClassShape: skipping harvested shape for '${harvested.name}', hand-written typedef wins`);
      } else {
        const json = simplifyTypeToSource(harvested.shape);
        out += `\n${this.spaces}registerTypedef('${harvested.name}', ${json});`;
      }
    }
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
   * @param {import('@babel/types').File|import('@babel/types').Program} [ast] - Optional parsed
   * program: names the file already imports from the runtime are left out of
   * the header import, so bundlers never see the same binding twice. Imports
   * under other specifiers or aliased bindings still get the full header
   * (a loud duplicate beats silently calling the wrong function).
   * @returns {string} The import declaration header for importing RTI.
   * @override
   */
  getHeader(ast) {
    if (!this.addHeader) {
      return '';
    }
    let header = super.getHeader();
    const names = ['inspectIndexedAccess', 'inspectType', 'inspectTypeWithTemplates', 'youCanAddABreakpointHere', 'registerVariable'];
    if (this.validateDivision) {
      names.push('validateDivision');
    }
    names.push('registerTypedef', 'registerClass', 'registerImportNamespaceSpecifier');
    if (this.projectVersion !== undefined && this.projectVersion !== null) {
      names.push('setProjectVersion');
    }
    const skip = ast ? runtimeImportNames(ast) : new Set();
    header += `import {${names.filter((name) => !skip.has(name)).join(', ')}} from '@runtime-type-inspector/runtime';\n`;
    // Prevent tree-shaking in UMD build so we can always "add a breakpoint here".
    header += "export * from '@runtime-type-inspector/runtime';\n";
    if (this.projectVersion !== undefined && this.projectVersion !== null) {
      header += `setProjectVersion(${JSON.stringify(this.projectVersion)});\n`;
    }
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
      if (nodeIsFunctionLike(parent)) {
        break;
      }
      if (parent.leadingComments) {
        if (parent.type === 'VariableDeclaration') {
          const comments = parent.leadingComments;
          const lastComment = comments[comments.length - 1];
          const isStatementDoc = Boolean(parent.loc && lastComment?.loc &&
            lastComment.loc.end.line + 1 === parent.loc.start.line);
          if (isStatementDoc) {
            const declarator = parents[i + 1];
            if (!declarator || declarator.type !== 'VariableDeclarator' || declarator.init !== node) {
              break;
            }
          }
        }
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
      if (nodeIsFunctionLike(parent)) {
        break;
      }
      if (parent.leadingComments) {
        if (parent.type === 'VariableDeclaration') {
          const comments = parent.leadingComments;
          const lastComment = comments[comments.length - 1];
          const isStatementDoc = Boolean(parent.loc && lastComment?.loc &&
            lastComment.loc.end.line + 1 === parent.loc.start.line);
          if (isStatementDoc) {
            // Docblock directly above the statement: TypeScript-like cascade,
            // only direct declarator initializers inherit it. Functions nested
            // deeper (e.g. inside object literals) do not.
            const declarator = parents[i + 1];
            if (!declarator || declarator.type !== 'VariableDeclarator' || declarator.init !== node) {
              break;
            }
          }
        }
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
    if (ignoredParamsIn(comment) === 'all') {
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
    const templates = parseJSDocTemplates(comment, this.expandType);
    const params = parseJSDoc(comment, this.expandType);
    if (!templates && !params) {
      return;
    }
    return {templates, params};
  }
  /**
   * Reads `@template` bindings from every lexically enclosing scope, outer
   * to inner: classes (declaration or expression, incl. `export` wrappers)
   * and functions with their own `@template` tags. Class templates scope
   * over the constructor and methods, mirroring TypeScript:
   * `new Asset('x', ...)` infers `K` from the constructor's `@param {K}`
   * occurrences. Inner scopes shadow outer names on conflict.
   * @param {Node} node - The function or block node being checked.
   * @returns {Record<string, any>|undefined} Merged scope templates or undefined.
   */
  getScopeTemplates(node) {
    let fnNode = node;
    if (node.type === 'BlockStatement') {
      fnNode = this.parent;
    }
    const anchorIdx = this.parents.findLastIndex(_ => _ === node);
    if (anchorIdx === -1) {
      return;
    }
    let merged;
    for (let i = 0; i <= anchorIdx; i++) {
      const ancestor = this.parents[i];
      if (!ancestor || ancestor === fnNode) {
        // Never inherit the node's own bindings: they merge separately and win.
        continue;
      }
      let templates;
      if (ancestor.type === 'ClassDeclaration' || ancestor.type === 'ClassExpression') {
        templates = this.classTemplatesOf(ancestor);
      } else if (nodeIsFunctionLike(ancestor)) {
        templates = this.functionTemplatesOf(ancestor);
      }
      if (templates) {
        merged = {...merged, ...templates};
      }
    }
    return merged;
  }
  /**
   * Reads the `@template` bindings off one class node.
   * @param {Node} classDecl - The ClassDeclaration or ClassExpression node.
   * @returns {Record<string, any>|undefined} Its templates or undefined.
   */
  classTemplatesOf(classDecl) {
    let leadingComments = classDecl.leadingComments;
    if (!leadingComments) {
      const exportNamed = this.findParentOfType(classDecl, 'ExportNamedDeclaration');
      leadingComments = exportNamed?.leadingComments;
      if (!leadingComments) {
        const exportDefault = this.findParentOfType(classDecl, 'ExportDefaultDeclaration');
        leadingComments = exportDefault?.leadingComments;
      }
      if (!leadingComments && classDecl.type === 'ClassExpression') {
        // `/** @template K */ const Box = class {...}`: the comment lives on
        // the declaration, mirroring function-expression handling.
        const varDecl = this.findParentOfType(classDecl, 'VariableDeclaration');
        leadingComments = varDecl?.leadingComments;
      }
    }
    if (!leadingComments?.length) {
      return;
    }
    const lastComment = leadingComments[leadingComments.length - 1];
    if (lastComment.type !== 'CommentBlock') {
      return;
    }
    return parseJSDocTemplates(lastComment.value, this.expandType);
  }
  /**
   * Reads the `@template` bindings off one enclosing function: its own
   * leading comment, resolving the same `export`/declarator wrappers the
   * node's own JSDoc lookup uses.
   * @param {Node} fnNode - The enclosing function-like node.
   * @returns {Record<string, any>|undefined} Its templates or undefined.
   */
  functionTemplatesOf(fnNode) {
    let leadingComments;
    if (fnNode.type === 'FunctionDeclaration') {
      leadingComments = fnNode.leadingComments ??
        this.findParentOfType(fnNode, 'ExportNamedDeclaration')?.leadingComments;
    } else if (fnNode.type === 'FunctionExpression') {
      leadingComments = this.getLeadingCommentsNodeForFunctionExpression(fnNode)?.leadingComments;
    } else if (fnNode.type === 'ArrowFunctionExpression') {
      leadingComments = this.getLeadingCommentsNodeForArrowFunctionExpression(fnNode)?.leadingComments;
    } else {
      // ObjectMethod, ClassMethod, ClassPrivateMethod: docs sit on the node.
      leadingComments = fnNode.leadingComments;
    }
    if (!leadingComments?.length) {
      return;
    }
    const lastComment = leadingComments[leadingComments.length - 1];
    if (lastComment.type !== 'CommentBlock') {
      return;
    }
    return parseJSDocTemplates(lastComment.value, this.expandType);
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
    const type = nodeIsFunctionLike(node) ? node.type : this.parentType;
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
    if (node.type === 'BlockStatement' && !nodeIsFunctionLike(parent)) {
      return '';
    }
    // Scoped suppression lives here (not in `getJSDoc`, which only knows
    // the bare whole-function form): listed params emit no checks while
    // the rest validate normally. Bare `@ignoreRTI` silences everything,
    // including default-inferred checks.
    const leading = this.getLeadingComment(node);
    const ignored = leading ? ignoredParamsIn(leading) : null;
    if (ignored === 'all') {
      return '';
    }
    const jsdoc = this.getJSDoc(node);
    // return '// ' + JSON.stringify(jsdoc) + '\n';
    const stat = this.getStatsForNode(node);
    if (!jsdoc) {
      // No JSDoc at all: default-value inference is the only
      // source of types. Emit nothing when nothing is inferable.
      const inferred = this.collectDefaultChecks(node, new Set());
      if (!inferred.length) {
        stat.unchecked++;
        return '';
      }
      const loc = this.getName(node);
      if (this.ignoreLocations.includes(loc)) {
        return '// IGNORE RTI TYPE VALIDATIONS, KNOWN ISSUES\n';
      }
      stat.checked++;
      return this.emitDefaultChecks(node, inferred, true);
    }
    const {templates: ownTemplates, params} = jsdoc;
    if (!params) {
      console.warn("This should never happen, please check your input code.", this.getLeadingComment(node), {jsdoc});
      stat.unchecked++;
      return '';
    }
    // Lexically enclosing `@template`s (classes and functions) scope over
    // this node: merge them under method-local templates so `K` in
    // `@param {K}` resolves jointly. Inner scopes shadow outer ones.
    const scopeTemplates = this.getScopeTemplates(node);
    const templates = scopeTemplates ? {...scopeTemplates, ...ownTemplates} : ownTemplates;
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
      if (ignored instanceof Set && ignored.has(nameFancy)) {
        continue;
      }
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
                const t = simplifyTypeToSource(type.elementType).replaceAll('\n', '\n' + spaces);
                newlineBeforeFirst();
                const atLoc = quoteName(loc);
                const atName = quoteName(nameFancy);
                if (templates) {
                  out += `${spaces}if (!inspectTypeWithTemplates(${element.name}, ${t}, ${atLoc}, ${atName}, rtiTemplates)) {\n`;
                } else {
                  out += `${spaces}if (!inspectType(${element.name}, ${t}, ${atLoc}, ${atName})) {\n`;
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
                  const t = simplifyTypeToSource(subType).replaceAll('\n', '\n' + spaces);
                  newlineBeforeFirst();
                  const atLoc = quoteName(loc);
                  const atName = quoteName(nameFancy);
                  if (templates) {
                    out += `${spaces}if (!inspectTypeWithTemplates(${keyName}, ${t}, ${atLoc}, ${atName}, rtiTemplates)) {\n`;
                  } else {
                    out += `${spaces}if (!inspectType(${keyName}, ${t}, ${atLoc}, ${atName})) {\n`;
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
      let t = simplifyTypeToSource(type).replaceAll('\n', '\n' + spaces);
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
      const atLoc = quoteName(loc);
      const atName = quoteName(nameFancy);
      if (templates) {
        out += `${spaces}if (${prevCheck}!inspectTypeWithTemplates(${name}, ${t}, ${atLoc}, ${atName}, rtiTemplates)) {\n`;
      } else {
        out += `${spaces}if (${prevCheck}!inspectType(${name}, ${t}, ${atLoc}, ${atName})) {\n`;
      }
      out += `${spaces}  youCanAddABreakpointHere();\n${spaces}}\n`;
    }
    // Params without JSDoc but with inferable defaults get synthesized
    // optional checks; JSDoc types always win on conflict. Suppressed
    // params stay out of the synthesis pool like documented ones do.
    out += this.emitDefaultChecks(node, this.collectDefaultChecks(node, new Set([...Object.keys(params), ...(ignored instanceof Set ? ignored : [])])), out === '');
    return out;
  }
  /**
   * Collects type checks for undocumented params: inline
   * `/** @type *\/` param comments first, default-value inference second.
   * Only `Identifier` targets missing from `documented` are considered.
   * @param {Node} node - The Babel AST node for which to generate type checks.
   * @param {Set<string>} documented - Parameter names covered by JSDoc.
   * @returns {{name: string, type: any}[]} Checks with optional-annotated types.
   */
  collectDefaultChecks(node, documented) {
    let fnNode = node;
    if (fnNode.type === 'BlockStatement') {
      fnNode = this.parent;
    }
    const {params} = fnNode;
    if (!Array.isArray(params)) {
      return [];
    }
    if (fnNode.type === 'ArrowFunctionExpression' && !this.findParentOfType(fnNode, 'VariableDeclarator')) {
      // Bare callbacks (e.g. `.forEach((x = 0) => ...)`) can't be named,
      // synthesizing checks would spam unnameable-callback warnings.
      return [];
    }
    const checks = [];
    for (const param of params) {
      if (!param) {
        continue;
      }
      const isAssignment = param.type === 'AssignmentPattern';
      const target = isAssignment ? param.left : param;
      if (!target || target.type !== 'Identifier' || documented.has(target.name)) {
        continue;
      }
      // Inline `/** @type *\/` wins over default inference;
      // a default still marks the check optional.
      const inline = parseInlineParamType(param.leadingComments, this.expandType) ??
        parseInlineParamType(target.leadingComments, this.expandType);
      if (inline !== undefined) {
        checks.push({name: target.name, type: annotateOptional(inline, isAssignment)});
        continue;
      }
      if (!isAssignment) {
        continue;
      }
      const inferred = inferTypeFromDefault(param.right);
      if (inferred === undefined) {
        continue;
      }
      checks.push({name: target.name, type: annotateOptional(inferred, true)});
    }
    return checks;
  }
  /**
   * Emits code for checks inferred from default values.
   * @param {Node} node - The Babel AST node for which to generate type checks.
   * @param {{name: string, type: any}[]} checks - Checks to emit.
   * @param {boolean} prefixNewline - Separate from preceding code with newline.
   * @returns {string} A string of code with type check assertions.
   */
  emitDefaultChecks(node, checks, prefixNewline) {
    if (!checks.length) {
      return '';
    }
    const {spaces} = this;
    const atLoc = quoteName(this.getName(node));
    let out = prefixNewline ? '\n' : '';
    for (const {name, type} of checks) {
      const t = simplifyTypeToSource(type).replaceAll('\n', '\n' + spaces);
      out += `${spaces}if (!inspectType(${name}, ${t}, ${atLoc}, '${name}')) {\n`;
      out += `${spaces}  youCanAddABreakpointHere();\n${spaces}}\n`;
    }
    return out;
  }
  /**
   * Renders one key of a qualified name: an Identifier joins raw with the
   * given separator, a plain literal joins bracket-quoted, a computed key
   * stays in source-text brackets. The key node type decides the shape, so
   * no classification of the rendered text is ever needed. Plain display
   * text only: quoting for the emitted literal happens in `quoteName.js`.
   * @example
   * keyPart({type: 'Identifier', name: 'set'}, false, '.'); // '.set'
   * @param {Node} key - The property key node.
   * @param {boolean} computed - Whether the key was computed.
   * @param {string} separator - `.` for object chains, `#` for the leaf of
   * instance members.
   * @returns {string} The segment including its separator.
   */
  keyPart(key, computed, separator) {
    if (!computed && key.type === 'Identifier') {
      return separator + key.name;
    }
    if (!computed && (key.type === 'StringLiteral' || key.type === 'NumericLiteral')) {
      return `[${JSON.stringify(String(key.value))}]`;
    }
    return `[${this.toSource(key)}]`;
  }
  /**
   * Detects the `Object.assign(X.prototype, <child>)` mixin pattern: instance
   * members contributed to `X` from an object literal argument.
   * @param {Node} call - The enclosing CallExpression node.
   * @param {Node} child - The node on the path from the method upward.
   * @returns {string|null} The class name `X`, or null when no match.
   */
  assignPrototypeOwner(call, child) {
    const {callee, arguments: args} = call;
    if (!Array.isArray(args) || args.indexOf(child) < 1) {
      return null;
    }
    if (!callee || callee.type !== 'MemberExpression' || callee.computed) {
      return null;
    }
    const {object, property} = callee;
    if (object.type !== 'Identifier' || object.name !== 'Object' ||
        property.type !== 'Identifier' || property.name !== 'assign') {
      return null;
    }
    const target = args[0];
    if (!target || target.type !== 'MemberExpression' || target.computed) {
      return null;
    }
    if (target.property.type !== 'Identifier' || target.property.name !== 'prototype') {
      return null;
    }
    return this.toSource(target.object);
  }
  /**
   * Checks whether a node sits in a held object literal: an object in the
   * init of a `const o = ...` declarator or the right side of an
   * assignment, or a method or property directly in such a held literal.
   * Everything else fails: returned, passed, array-nested and constructed
   * objects outlive any lexical binding, so naming their methods after one
   * would mislead.
   * @param {Node} node - The ObjectExpression, ObjectProperty or method
   * node to test.
   * @returns {boolean} True for declared bindings.
   */
  bindingHolds(node) {
    const i = this.parents.findLastIndex(_ => _ === node);
    // Ancestors sit below the node in the parents stack (root first).
    const parent = this.parents[i - 1];
    if (!parent) {
      return false;
    }
    if (parent.type === 'ObjectExpression') {
      return this.objectHolds(parent);
    }
    if (parent.type === 'ObjectProperty') {
      return parent.value === node && this.objectHolds(parent);
    }
    if (parent.type === 'VariableDeclarator') {
      return parent.init === node && parent.init.type === 'ObjectExpression';
    }
    if (parent.type === 'AssignmentExpression') {
      return parent.right === node;
    }
    return false;
  }
  /**
   * Checks whether an object literal itself is held: declared in a binding
   * above, or the `Object.assign(X.prototype, {...})` mixin argument whose
   * members resolve to `X#member` one level up.
   * @param {Node} literal - The ObjectExpression node to test.
   * @returns {boolean} True when the literal is a held argument.
   */
  objectHolds(literal) {
    if (this.bindingHolds(literal)) {
      return true;
    }
    const i = this.parents.findLastIndex(_ => _ === literal);
    // Ancestors sit below the node in the parents stack (root first).
    const parent = this.parents[i - 1];
    if (!parent || !Array.isArray(parent.arguments) || !parent.arguments.includes(literal)) {
      return false;
    }
    return parent.type === 'CallExpression' && this.assignPrototypeOwner(parent, literal) !== null;
  }
  /**
   * Walks up from a method, function or class node through pure object
   * composition (`{a: {b() {}}}`) to the owning binding.
   *
   * Scope: the issue asks for two renames (owner-prefixed object methods,
   * dot-joined static members); the walk only keeps those renames honest
   * on hostile input. Returned, passed, array-nested and `new`-constructed
   * literals keep the bare key: the object outlives any lexical binding,
   * so naming it after one would mislead. Likewise only the
   * `Object.assign(X.prototype, ...)` call shape and direct `X.prototype
   * = ...` assignment count as prototype members; every other assignment
   * needs a plain `Identifier` target (`o.x = ...` keeps the chain,
   * `a.b.c = ...` and `this.o.x = ...` stay bare).
   * @param {Node} node - The method, function or class node to qualify.
   * @returns {{owner: string, prefix: string, instance: boolean}|null}
   * Owner plus the already-joined middle path, if any. `instance` marks
   * prototype members, whose leaf joins with `#` instead of `.`.
   */
  locateObjectOwner(node) {
    const idx = this.parents.findLastIndex(_ => _ === node);
    if (idx === -1) {
      return null;
    }
    // Ancestors sit below the node in the parents stack (root first), so
    // the walk descends: the node's own body is above and never visited.
    // Middle segments always join with `.`; only the leaf consults the
    // `instance` flag, so no classification of rendered text is needed.
    // Object literals extend the chain only while a binding holds them
    // (see `bindingHolds`): `const o = {...}` or `o.x = {...}` qualify,
    // `Object.assign(X.prototype, {...})` qualifies as instance members,
    // everything else keeps the bare key.
    let prefix = '';
    let child = node;
    let bound = this.objectHolds(node);
    for (let i = idx - 1; i >= 0; i--) {
      const parent = this.parents[i];
      if (parent.type === 'ObjectExpression') {
        bound = this.objectHolds(parent);
        child = parent;
        continue;
      }
      if (parent.type === 'ObjectProperty') {
        if (parent.value !== child || !bound) {
          return null;
        }
        prefix = this.keyPart(parent.key, parent.computed, '.') + prefix;
        child = parent;
        bound = this.objectHolds(child);
        continue;
      }
      if (parent.type === 'VariableDeclarator') {
        if (parent.init !== child || parent.id.type !== 'Identifier') {
          return null;
        }
        return {owner: this.toSource(parent.id), prefix, instance: false};
      }
      if (parent.type === 'AssignmentExpression') {
        if (parent.right !== child || child.type !== 'ObjectExpression') {
          return null;
        }
        const {left} = parent;
        if (left.type === 'MemberExpression' && !left.computed &&
            left.property.type === 'Identifier' && left.property.name === 'prototype') {
          return {owner: this.toSource(left.object), prefix, instance: true};
        }
        // `o.x = {m() {}}` keeps the declared chain; other shapes
        // (`this.o.x = ...`, `a.b.c = ...`) stay bare: the method outlives
        // any single lexical binding.
        if (left.type === 'Identifier') {
          return {owner: this.toSource(left), prefix, instance: false};
        }
        return null;
      }
      if (parent.type === 'CallExpression') {
        const owner = this.assignPrototypeOwner(parent, child);
        if (owner) {
          return {owner, prefix, instance: true};
        }
        return null;
      }
      // Anything else (functions, classes, calls, blocks) ends the walk:
      // the method outlives any object composition, so the bare name wins.
      return null;
    }
    return null;
  }
  /**
   * Qualifies a leaf key with its owner chain.
   * @example
   * qualifyLeaf({type: 'Identifier', name: 'set'}, false, 'BitPacking', '', false); // 'BitPacking.set'
   * @param {Node} key - The method or property key node.
   * @param {boolean} computed - Whether the key was computed.
   * @param {string} owner - The owning binding name.
   * @param {string} prefix - The already-joined middle path, if any.
   * @param {boolean} instance - Whether the leaf is an instance member.
   * @returns {string} Owner-qualified name like `BitPacking.set`.
   */
  qualifyLeaf(key, computed, owner, prefix, instance) {
    // Middle segments always join with `.`; only the leaf consults the
    // `instance` flag (`ScopeSpace#resolve`, `BitPacking.set`).
    const separator = instance ? '#' : '.';
    return owner + prefix + this.keyPart(key, computed, separator);
  }
  /**
   * Qualifies an object property with its owner chain.
   * @param {Node} property - The ObjectProperty node holding the function.
   * @returns {string} Owner-qualified name or the bare property key.
   */
  getNameForObjectProperty(property) {
    const found = this.locateObjectOwner(property);
    if (found && found.owner) {
      // Prototype mixins (`Object.assign(X.prototype, ...)`) name real
      // instance members (`ScopeSpace#resolve`); other properties keep the
      // declared chain (`object.method`).
      return this.qualifyLeaf(property.key, property.computed, found.owner, found.prefix, found.instance);
    }
    return this.keyPart(property.key, property.computed, '.').slice(1);
  }
  /**
   * @param {Node} node - The Babel AST node.
   * @returns {string} Best possible human-readable name of given node.
   */
  getNameForFunctionExpression(node) {
    // Anonymous `name: function (...)` inside an object: the property key
    // plus the owner chain name it (`object.method`, `ScopeSpace#resolve`).
    const property = this.findParentOfType(node, 'ObjectProperty');
    if (property && property.value === node) {
      return this.getNameForObjectProperty(property);
    }
    // `add = function (...)`: the assignment target names the binding,
    // including `a.b = ...` member paths as written in the source. The
    // statement wrapper may be skipped when comments attach directly to
    // the assignment, so scan for the assignment instead of the statement.
    const assignmentTarget = this.assignmentTargetOf(node);
    if (assignmentTarget) {
      return assignmentTarget;
    }
    const variableDeclarator = this.findParentOfType(node, 'VariableDeclarator');
    if (variableDeclarator && variableDeclarator.id.type === 'Identifier') {
      // e.g. `var ScopeSpace = function (name) {...}` (issue #82)
      return this.toSource(variableDeclarator.id);
    }
    return 'unnamed function expression';
  }
  /**
   * Names the target of `target = function ...`: the source text of the
   * assigned-to side (`add`, `a.b.c`), whatever the statement shape.
   * @param {Node} node - The function node on the assigned path.
   * @returns {string|null} The target name, or null when not assigned.
   */
  assignmentTargetOf(node) {
    const i = this.parents.findLastIndex(_ => _ === node);
    // Ancestors sit below the node in the parents stack (root first), so
    // the assignment sits above the function on the path.
    for (let j = i - 1; j >= 0; j--) {
      const parent = this.parents[j];
      if (parent.type === 'AssignmentExpression' && parent.right === this.parents[j + 1]) {
        return this.toSource(parent.left);
      }
      if (nodeIsFunctionLike(parent)) {
        return null;
      }
    }
    return null;
  }
  /**
   * @param {Node} node - The ClassMethod or ClassPrivateMethod node.
   * @returns {string} Class-qualified name: `C#m` for instance members,
   * `C.m` for static ones, bare `m` when the class stays anonymous.
   */
  getNameForClassMethod(node) {
    const toSource = this.toSource.bind(this);
    const classDecl = this.parents.findLast(_ => _.type === 'ClassDeclaration' || _.type === 'ClassExpression');
    if (!classDecl) {
      return toSource(node.key);
    }
    let prefix = '';
    if (classDecl.id) {
      prefix = toSource(classDecl.id);
    } else if (classDecl.type === 'ClassDeclaration') {
      // `export default class {m() {}}`: no name anywhere, stay bare.
    } else {
      // Anonymous class expression: only a direct `const Name = class {}`
      // binding names it; deeper nesting (properties, call args) stays bare
      // because the borrow chain is not the method owner.
      const declarator = this.parents.findLast(_ => _.type === 'VariableDeclarator');
      if (declarator && declarator.init === classDecl && declarator.id.type === 'Identifier') {
        prefix = toSource(declarator.id);
      }
    }
    if (!prefix) {
      return toSource(node.key);
    }
    // Static members join with a dot (`C.make`), instance members and
    // constructors with a hash (`C#run`, `C#constructor`); private names
    // render their own `#`, so static privates read `C.#q`.
    return prefix + (node.static ? '.' : '#') + toSource(node.key);
  }
  /**
   * @param {Node} node - The ObjectMethod node.
   * @returns {string} Owner-qualified name like `BitPacking.set`, or the
   * bare method name when no owning binding is visible.
   */
  getNameForObjectMethod(node) {
    const found = this.locateObjectOwner(node);
    if (found && found.owner) {
      return this.qualifyLeaf(node.key, node.computed, found.owner, found.prefix, found.instance);
    }
    return this.toSource(node.key);
  }
  /**
   * @param {Node} node - The ArrowFunctionExpression node.
   * @returns {string} Owner-qualified name when the arrow sits in an
   * object or declarator, legacy fallback otherwise.
   */
  getNameForArrowFunction(node) {
    // Arrow as object value (`arrow: (y) => y`): the property key plus the
    // owner chain name it, mirroring function expressions. Bare arrows
    // have no key of their own, so the walk result is already complete.
    const property = this.findParentOfType(node, 'ObjectProperty');
    if (property && property.value === node) {
      return this.getNameForObjectProperty(property);
    }
    const found = this.locateObjectOwner(node);
    if (found && found.owner) {
      return found.owner + found.prefix;
    }
    const parent = this.findParentOfType(node, 'VariableDeclarator');
    if (parent && parent.id.type === 'Identifier') {
      return this.toSource(parent.id);
    }
    return 'getName> missing parent for ' + node.type;
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
    const {type, id} = node;
    switch (type) {
      case 'FunctionDeclaration':
        return toSource(id);
      case 'ClassMethod':
      case 'ClassPrivateMethod':
        return this.getNameForClassMethod(node);
      case 'FunctionExpression':
        if (id) {
          return toSource(id);
        }
        return this.getNameForFunctionExpression(node);
      case 'ArrowFunctionExpression':
        return this.getNameForArrowFunction(node);
      case 'ObjectMethod':
        return this.getNameForObjectMethod(node);
      case 'BinaryExpression':
        const goodNames = ['FunctionDeclaration', 'ClassMethod', 'ClassPrivateMethod'];
        const goodParent = this.parents.findLast(_ => goodNames.includes(_.type));
        if (goodParent) {
          return this.getName(goodParent);
        }
        // top scope
        return `${this.filename}:${node?.loc?.start?.line}`;
      case 'MemberExpression':
        if (node.computed) {
          const memberGoodNames = ['FunctionDeclaration', 'ClassMethod', 'ClassPrivateMethod'];
          const memberGoodParent = this.parents.findLast(_ => memberGoodNames.includes(_.type));
          if (memberGoodParent) {
            return this.getName(memberGoodParent);
          }
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
   * @param {import("@babel/types").MemberExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  MemberExpression(node) {
    const {computed, object, property} = node;
    if (!this.inspectIndexedAccess) {
      return super.MemberExpression(node);
    }
    if (!computed || object.type === 'Super') {
      return super.MemberExpression(node);
    }
    const parent = this.parent;
    if (parent) {
      // `a[i] = ...`, `a[i]++`/`--` and `delete a[i]` are handled by the statement
      // itself, wrapping them here would produce invalid assignment to a call.
      if (parent.type === 'AssignmentExpression' && parent.left === node) {
        return super.MemberExpression(node);
      }
      if (parent.type === 'UpdateExpression' && parent.argument === node) {
        return super.MemberExpression(node);
      }
      if (parent.type === 'UnaryExpression' && parent.operator === 'delete' && parent.argument === node) {
        return super.MemberExpression(node);
      }
      // Destructuring, rest and loop targets are assigned to, never read.
      if (parent.type === 'ArrayPattern') {
        return super.MemberExpression(node);
      }
      if (parent.type === 'RestElement' && parent.argument === node) {
        return super.MemberExpression(node);
      }
      if (parent.type === 'ObjectProperty' && parent.value === node) {
        // `({p: a[i]})` reads but `({p: a[i]} = ...)` writes: bypass inside patterns only.
        const grandparent = this.parents[this.parents.findLastIndex((_) => _ === parent) - 1];
        if (grandparent?.type === 'ObjectPattern') {
          return super.MemberExpression(node);
        }
      }
      if (parent.type === 'AssignmentPattern' && parent.left === node) {
        return super.MemberExpression(node);
      }
      if ((parent.type === 'ForOfStatement' || parent.type === 'ForInStatement') && parent.left === node) {
        return super.MemberExpression(node);
      }
      // Method calls and tags carry their base as `this`; wrapping the callee
      // would silently rebind it to undefined.
      if ((parent.type === 'CallExpression' || parent.type === 'OptionalCallExpression') && parent.callee === node) {
        return super.MemberExpression(node);
      }
      if (parent.type === 'TaggedTemplateExpression' && parent.tag === node) {
        return super.MemberExpression(node);
      }
      // `new a[i](...)` must stay `new (inspectIndexedAccess(...))(...)`:
      // without parens it parses as `(new inspectIndexedAccess(...))(...)`,
      // constructing the wrapper instead of the accessed value.
      if (parent.type === 'NewExpression' && parent.callee === node) {
        const object_ = this.toSource(object);
        const property_ = this.toSource(property);
        const loc = this.getName(node);
        return `(inspectIndexedAccess(${object_}, ${property_}, ${JSON.stringify(loc)}))`;
      }
    }
    const object_ = this.toSource(object);
    const property_ = this.toSource(property);
    const loc = this.getName(node);
    return `inspectIndexedAccess(${object_}, ${property_}, ${JSON.stringify(loc)})`;
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
  /** @type {Record<string, string[]>} */
  typedefTemplates = {};
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
        parseJSDocTypedef(this.typedefs, this.typedefTemplates, warn, comment, this.expandType);
        markTypeofRequirements(comment.value ?? '');
      }
    }
    //console.log("this.typedefs", this.typedefs);
    let out = '';
    for (const name in this.typedefs) {
      const typedef = this.typedefs[name];
      const json = simplifyTypeToSource(typedef);
      const params = this.typedefTemplates[name];
      out += params?.length ? `registerTypedef('${name}', ${json}, ${JSON.stringify(params)});\n` : `registerTypedef('${name}', ${json});\n`;
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
    const {declarations, kind} = node;
    let ret = super.VariableDeclaration(node);
    for (const {id} of declarations) {
      const name = this.toSource(id);
      if (requiredTypeofs[name] === 'missing') {
        // The declaration kind travels along: `const` bindings keep tsc
        // literal types (`typeof MOTION_FREE` is `'free'`), `let`/`var`
        // widen (`typeof count` is `number`), and the runtime checks each
        // accordingly. `kind` is parser vocabulary (`const`/`let`/`var`),
        // never user input, so interpolation is safe.
        ret += `\n${this.spaces}registerVariable('${name}', ${name}, '${kind}');\n`;
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
