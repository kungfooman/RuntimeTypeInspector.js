import {trimEndSpaces} from './trimEndSpaces.mjs';
/**
 * @typedef {import("@babel/types").Node} Node
 */
class Stringifier {
  forceCurly = false;
  /** @type {Node[]} */
  parents = [];
  /**
   * @param {Node} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  toSource(node) {
    const {leadingComments, trailingComments} = node;
    // handle this case only temporarily
    if (node === null) {
      // Contexts like: 
      // Object.assign(Channel3d.prototype, {
      //   setPosition: function /*null*/(position) {
      //return '/*null*/';
      return '';
    }
    if (node.type === 'File') {
      this.parents.length = 0;
    }
    this.parents.push(node);
    let out = '';
    let comments = '';
    if (leadingComments) {
      comments += this.mapToSource(leadingComments).join('');
    }
    if (node?.extra?.parenthesized) {
      out += `(${comments}${this.toSource_(node)})`;
    } else {
      out += comments + this.toSource_(node);
    }
    if (trailingComments) {
      for (const trailingComment of trailingComments) {
        out += this.toSource(trailingComment);
      }
    }
    // leadingComments and trailingComments lead to duplicates, not always tho
    //if (node && node.trailingComments) {
    //  out += this.mapToSource(node.trailingComments).join('\n') + '\n';
    //}
    this.parents.pop();
    return out;
  }
  /**
   * @param {Node} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  toSource_(node) {
    if (!node) {
      return '';
    }
    const {type} = node;
    if (type === undefined) {
      console.log("toSource> node without type", node);
    }
    if (this[type]) {
      return this[type](node);
    }
    console.log(node);
    const notOfInterest = ["start", "end", "loc", "type"];
    const ofInterest = Object.keys(node).filter(_ => !notOfInterest.includes(_));
    const props = ofInterest.join(', ');
    const fn = `${type}(node) {\n  const {${props}} = node;\n  return ;\n}`;
    console.warn('TODO ADD METHOD:', fn);
    return `rtiUnhandled("${node.type}");\n`;
  }
  /**
   * Only add { and } when requested (e.g. for Asserter).
   * showAST("if (true) 2;") vs showAST("if (true) {2}")
   * @param {Node} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  toSourceCurly(node) {
    if (!this.forceCurly) {
      return this.toSource(node);
    }
    const {type} = node;
    const needCurly = type != 'BlockStatement' && type != 'EmptyStatement';
    const spaces = this.spaces;
    let out = '';
    if (needCurly) {
      out += ' {\n';
      //out += spaces + `/* toSourceCurly> needCurly=${needCurly} type=${type}
      //parents=${parents.map(_=>_.type).join('->')}*/\n`;
    }
    out += this.toSource(node);
    if (needCurly) {
      out += '\n';
      out += spaces;
      out += '}';
    }
    return out;
  }
  get parent() {
    return this.parents[this.parents.length - 2];
  }
  get parentType() {
    return this.parent?.type;
  }
  get needSpaces() {
    const t = this.parentType;
    return t != "ForStatement"   &&
           t != "ForInStatement" &&
           t != "ForOfStatement";
  }
  /**
   * @param {Node[]} arr
   * @returns {string[]}
   */
  mapToSource(arr) {
    return arr.map(_ => this.toSource(_));
  }
  /**
   * This method is implemented in Asserter.mjs
   * @param {Node} node - The Babel AST node.
   * @returns {string}
   */
  generateTypeChecks(node) {
    const {spaces} = this;
    return `${spaces}/* Stub of Stringifier#generateTypeChecks({type=${node.type}}); */\n`;
  }
  numSpaces = 0;
  /**
   * @returns {string} A string of two spaces per indentation.
   */
  get spaces() {
    return '  '.repeat(this.numSpaces);
  }
  debugSpaces() {
    const {spaces, parents} = this;
    const n = spaces.length;
    const path = parents.map(_ => _.type).join('/');
    return `${spaces}// got ${n} spaces for ${path}\n`;
  }
  /**
   * > await something();
   *
   * @param {import("@babel/types").AwaitExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  AwaitExpression(node) {
    const {argument} = node;
    return `await ${this.toSource(argument)}`;
  }
  /**
   * @param {import("@babel/types").ClassBody} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ClassBody(node) {
    const {body} = node;
    return this.mapToSource(body).join('\n');
  }
  /**
   * @param {import("@babel/types").ClassMethod} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ClassMethod(node) {
    const {static: static_, key, computed, kind, id, generator, async, params, body} = node;
    let out = this.spaces;
    if (generator) {
      out += '*';
    }
    if (id) {
      console.warn('Stringifier#ClassMethod> unhandled id', node);
    }
    if (static_) {
      out += 'static ';
    }
    if (async) {
      out += 'async ';
    }
    if (kind === 'get') {
      out += 'get ';
    } else if (kind === 'set') {
      out += 'set ';
    } else if (kind === 'constructor' || kind === 'method') {
      // Nothing yet.
    } else {
      console.warn("unhandled kind", kind, "for", node);
    }
    let methodName = this.toSource(key);
    if (computed) {
      methodName = `[${methodName}]`;
    }
    out += methodName;
    out += `(${this.mapToSource(params).join(', ')})`;
    out += this.toSource(body);
    return out;
  }
  /**
   * @param {import("@babel/types").ClassExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ClassExpression(node) {
    const {id, superClass, body} = node;
    let out = 'class ';
    if (id !== null) {
      // Babel: strange API, either null or undefined... pick a type, maybe oversight/bug
      out += this.toSource(id) + ' ';
    }
    if (superClass !== null) {
      const s = this.toSource(superClass);
      out += `extends ${s} `;
    }
    const c = this.toSource(body);
    out += `{\n${c}\n}`;
    return out;
  }
  /**
   * @param {import("@babel/types").ClassDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ClassDeclaration(node) {
    const {id, superClass, body, trailingComments, leadingComments} = node;
    const spaces = this.spaces;
    let out = spaces + 'class ' + this.toSource(id);
    if (superClass) {
      out += ` extends ${this.toSource(superClass)}`
    }
    out += ' {\n';
    this.numSpaces++;
    out += this.toSource(body);
    this.numSpaces--;
    out += spaces;
    out += '\n}\n';
    return out;
  }
  /**
   * @param {import("@babel/types").ClassPrivateMethod} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ClassPrivateMethod(node) {
    const {static: static_, key, kind, id, generator, async, params, body} = node;
    let out = this.spaces;
    if (generator) {
      out += '*';
    }
    if (id) {
      console.warn('Stringifier#ClassPrivateMethod> unhandled id', node);
    }
    if (static_) {
      out += 'static ';
    }
    if (async) {
      out += 'async ';
    }
    if (kind === 'get') {
      out += 'get ';
    } else if (kind === 'set') {
      out += 'set ';
    } else if (kind === 'method') {
      // Nothing yet.
    } else {
      console.warn("unhandled kind", kind, "for", node);
    }
    out += this.toSource(key);
    out += `(${this.mapToSource(params).join(', ')})`;
    out += this.toSource(body);
    return out;
  }
  /**
   * > asd;
   * > asd = 1;
   * > static asd;
   * > static asd = 1;
   *
   * @param {import("@babel/types").ClassProperty} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ClassProperty(node) {
    const {key, computed, value, leadingComments} = node;
    const static_ = node.static; // JS keyword is problematic in object destructuring
    const a = this.toSource(key);
    const b = this.toSource(value);
    let out = this.spaces;
    if (static_) {
      out += 'static ';
    }
    if (computed) {
      out += `[${a}]`;
    } else {
      out += a;
    }
    if (b) {
      out += ` = ${b}`;
    }
    out += ';';
    return out;
  }
  /**
   * @param {import("@babel/types").ContinueStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ContinueStatement(node) {
    const {label} = node;
    let out = this.spaces + 'continue';
    if (label) {
      out += ' ' + this.toSource(label);
    }
    out += ';';
    return out;
  }
  /**
   * @param {Node[]} params
   * @returns {string} Stringification of the params.
   */
  FunctionDeclarationParams(params) {
    return '(' + this.mapToSource(params).join(', ') + ')';
  }
  /**
   * @param {import("@babel/types").FunctionDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  FunctionDeclaration(node) {
    const {async, body, generator, id, leadingComments, params} = node;
    let out = '';
    if (this.parentType !== 'ExportNamedDeclaration') {
      out += this.spaces;
    }
    if (async) {
      out += 'async ';
    }
    const asterix = generator ? '*' : '';
    out += 'function' + asterix + ' ' + this.toSource(id) + this.FunctionDeclarationParams(params);
    out += this.toSource(body);
    return out;
  }
  /**
   * @param {import("@babel/types").FunctionExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  FunctionExpression(node) {
    // Leading comments for asd=function(){} are in ExpressionStatement
    const {async, body, generator, id/*, leadingComments*/, params/*, extra*/} = node;
    let out = '';
    if (async) {
      out += 'async ';
    }
    const star = generator ? '*' : '';
    out += 'function' + star + ' ' + this.toSource(id) + this.FunctionDeclarationParams(params);
    out += this.toSource(body);
    return out;
  }
  /**
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
    out += ' => ';
    out += this.toSource(body);
    return out;
  }
  /**
   * @param {import("@babel/types").BigIntLiteral} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  BigIntLiteral(node) {
    const {extra, value} = node;
    return extra.raw;
  }
  /**
   * @param {import("@babel/types").BlockStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  BlockStatement(node) {
    const {body, directives} = node;
    const spaces = this.spaces;
    let out = '';
    out += ' {';
    this.numSpaces++;
    // Handle Directive/DirectiveLiteral like 'use strict';
    if (directives && directives.length) {
      out += '\n';
      out += this.mapToSource(directives).join('\n') + '\n';
    }
    out += this.generateTypeChecks(node);
    if (body.length) {
      if (out.length === 2) { // 2 is ' {'
        out += '\n';
      }
      // out += '/*'+out.length+'*/';
      out += this.mapToSource(body).join('\n') + '\n';
      out += spaces;
    }
    this.numSpaces--;
    out += '}';
    return out;
  }
  /**
   * > 'use strict';
   *
   * @param {import("@babel/types").Directive} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  Directive(node) {
    const {value} = node;
    return this.toSource(value);
  }
  /**
   * > 'use strict';
   *
   * @param {import("@babel/types").DirectiveLiteral} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  DirectiveLiteral(node) {
    const {extra, value} = node;
    const {spaces} = this;
    return `${spaces}${extra.raw};`;
  }
  /**
   * @param {import("@babel/types").ReturnStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ReturnStatement(node) {
    const {argument} = node;
    const {spaces} = this;
    if (!argument) {
      return spaces + 'return;';
    }
    return spaces + 'return ' + this.toSource(argument) + ';';
  }
  /**
   * @param {import("@babel/types").Identifier} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  Identifier(node) {
    return node.name;
  }
  /**
   * @param {import("@babel/types").IfStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  IfStatement(node) {
    const {alternate, consequent, test} = node;
    const spaces = this.spaces;
    let out = '';
    //if (this.parentType !== "IfStatement")
    {
      out += spaces;
    }
    out += `if (${this.toSource(test)})`;
    out += this.toSourceCurly(consequent);
    if (alternate) {
      out += ` else${this.toSourceCurly(alternate)}`;
    }
    return out;
  }
  /**
   * @param {import("@babel/types").LabeledStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  LabeledStatement(node) {
    const {body, label} = node;
    const {spaces} = this;
    let out = '';
    out += spaces + this.toSource(label);
    out += ': \n';
    out += spaces + this.toSource(body);
    return out;
  }
  /**
   * @example
   * ts = require("typescript");
   * ts.createSourceFile("repl.ts", "a = 1", ts.ScriptTarget.Latest);
   * ts.createSourceFile("repl.ts", "!!(a = 1 + 2)", ts.ScriptTarget.Latest);
   * showAST('!!(a = 1)');
   * @param {import("@babel/types").UnaryExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  UnaryExpression(node) {
    let out = '';
    const {argument, operator, prefix} = node;
    if (!prefix) {
      console.warn("Stringifier#UnaryExpression> never considered !prefix", node);
    }
    // Add a space for: typeof/delete/void
    const c = operator.charCodeAt(0);
    let op = operator;
    if (c >= 97 && c <= 122) {
      op += ' ';
    }
    out += op;
    out += this.toSource(argument);
    return out;
  }
  /**
   * @param {import("@babel/types").MemberExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  MemberExpression(node) {
    const {computed, object, property} = node;
    if (computed) {
      return `${this.toSource(object)}[${this.toSource(property)}]`;
    }
    return `${this.toSource(object)}.${this.toSource(property)}`;
  }
  /**
   * @param {import("@babel/types").MetaProperty} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  MetaProperty(node) {
    const {meta, property} = node;
    const lhs = this.toSource(meta);
    const rhs = this.toSource(property);
    return `${lhs}.${rhs}`;
  }
  /**
   * @param {import("@babel/types").ExpressionStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ExpressionStatement(node) {
    const {expression} = node;
    /**
     * Not just a fall-through, adds a semicolon when it has semantic meaning.
     * E.g. invalid:
     * (function() {})()
     * (function() {})()
     */
    return this.spaces + this.toSource(expression) + ';';
  }
  /**
   * @param {import("@babel/types").CallExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  CallExpression(node) {
    const {callee, arguments: args, extra} = node;
    let out = this.toSource(callee);
    out += "(";
    out += this.mapToSource(args).join(', ');
    if (!!extra?.trailingComma) {
      out += ',';
    }
    out += ")";
    return out;
  }
  /**
   * We replicate the exact AST for validation:
   * x = 1;
   * y = {x,}
   * z = {y};
   * @param {import("@babel/types").ObjectExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ObjectExpression(node) {
    const {properties, extra} = node;
    let out = '{';
    if (properties.length) {
      this.numSpaces++;
      const props = this.mapToSource(properties).join(',\n');
      this.numSpaces--;
      out += '\n';
      out += props;
      if (extra?.trailingComma) {
        out += ',';
      }
      out += '\n';
      out += this.spaces;
    }
    out += '}';
    return out;
  }
  /**
   * @param {import("@babel/types").ObjectProperty} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ObjectProperty(node) {
    const {computed, key, method, shorthand, value} = node;
    if (method) {
      console.warn("ObjectProperty> unhandled method property:", {method, shorthand});
    }
    const spaces = this.spaces;
    let left   = this.toSource(key);
    const right  = this.toSource(value);
    let out = spaces;
    if (computed) {
      left = `[${left}]`;
    }
    if (!shorthand) {
      out += left + ': ';
    }
    out += right;
    return out;
  }
  /**
   * @param {import("@babel/types").BooleanLiteral} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  BooleanLiteral(node) {
    return node.value.toString();
  }
  /**
   * @param {import("@babel/types").AssignmentExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  AssignmentExpression(node) {
    const {left, operator, right} = node;
    const left_ = this.toSource(left);
    const right_ = this.toSource(right);
    // operator is for example: = |= &=
    return `${left_} ${operator} ${right_}`;
  }
  /**
   * @param {import("@babel/types").BinaryExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  BinaryExpression(node) {
    const {left, operator, right} = node;
    const left_ = this.toSource(left);
    const right_ = this.toSource(right);
    return `${left_} ${operator} ${right_}`;
  }
  /**
   * @param {import("@babel/types").ThisExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ThisExpression(node) {
    return 'this';
  }
  /**
   * @param {import("@babel/types").ArrayExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ArrayExpression(node) {
    const {elements, extra} = node;
    const e = !!extra?.trailingComma ? ',' : '';
    return '[' + this.mapToSource(elements).join(', ') + e + ']';
  }
  /**
   * @param {import("@babel/types").VariableDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  VariableDeclaration(node) {
    const {declarations, kind} = node;
    let spaces = '';
    let semicolon = '';
    if (this.needSpaces) {
      semicolon = ';';
      spaces = this.spaces;
    }
    return `${spaces}${kind} ${this.mapToSource(declarations).join(', ')}${semicolon}`;
  }
  /**
   * @param {import("@babel/types").VariableDeclarator} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  VariableDeclarator(node) {
    const {id, init} = node;
    if (init) {
      return this.toSource(id) + ' = ' + this.toSource(init);
    }
    return this.toSource(id);
  }
  /**
   * @param {import("@babel/types").ConditionalExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ConditionalExpression(node) {
    const {alternate, consequent, test} = node;
    return `${this.toSource(test)} ? ${this.toSource(consequent)} : ${this.toSource(alternate)}`;
  }
  /**
   * if (...)
   *
   * @param {import("@babel/types").LogicalExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  LogicalExpression(node) {
    const {left, operator, right} = node;
    const l = this.toSource(left);
    const r = this.toSource(right);
    if (l === '') {
      console.warn("LogicalExpression> unhandled empty left", node);
    }
    if (r === '') {
      console.warn("LogicalExpression> unhandled empty right", node);
    }
    return `${l} ${operator} ${r}`;
  }
  /**
   * TODO TEST: can init be undefined in for(;;)
   *
   * @param {import("@babel/types").ForStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ForStatement(node) {
    const {init, test, update, body} = node;
    const spaces = this.spaces;
    const i = this.toSource(init);
    const t = this.toSource(test);
    const u = this.toSource(update);
    const b = this.toSourceCurly(body);
    return `${spaces}for (${i}; ${t}; ${u})${b}`;
  }
  /**
   * showAST("++i")
   *
   * @param {import("@babel/types").UpdateExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  UpdateExpression(node) {
    const {operator, prefix, argument} = node;
    if (prefix) {
      return `${operator}${this.toSource(argument)}`;
    } else {
      return `${this.toSource(argument)}${operator}`;
    }
  }
  /**
   * @param {import("@babel/types").NewExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  NewExpression(node) {
    const {callee, arguments: args_} = node;
    const c = this.toSource(callee);
    const args = this.mapToSource(args_).join(', ');
    return `new ${c}(${args})`;
  }
  /**
   * @example
   * console.log(ast2json(parseSync("`${1} b ${2+3}c`").program.body[0]));
   * @param {import("@babel/types").TemplateLiteral} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  TemplateLiteral(node) {
    const {expressions, quasis} = node;
    let out = '`';
    for (var i=0; i<quasis.length; i++) {
      out += this.toSource(quasis[i]);
      if (expressions[i]) {
        out += '${' + this.toSource(expressions[i]) + '}';
      }
    }
    out += '`';
    return out ;
  }
  /**
   * @param {import("@babel/types").TemplateElement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  TemplateElement(node) {
    const {value} = node;
    return value.raw;
  }
  /**
   * @param {import("@babel/types").PrivateName} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  PrivateName(node) {
    const {id} = node;
    return `#${this.toSource(id)}`;
  }
  /**
   * @param {import("@babel/types").ExportAllDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ExportAllDeclaration(node) {
    return `export * from ${node.source.extra.raw};`;
  }
  /**
   * @param {import("@babel/types").ExportNamedDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ExportNamedDeclaration(node) {
    const {declaration, source, specifiers} = node;
    let out = this.spaces;
    if (specifiers.length) {
      if (!source) {
        //debugger;
      }
      out += 'export {\n';
      // todo: fix spacing system
      out += this.mapToSource(specifiers).map(_ => `  ${this.spaces}${_}`).join(',\n');
      out += '\n';
      out += this.spaces;
      out += '}';
      if (source) {
        out += " from " + this.toSource(source);
      }
      out += ";\n";
    } else if (declaration) {
      out += 'export ' + this.toSource(declaration);
    } else {
      console.warn("ExportNamedDeclaration> unhandled case for", node);
    }
    return out;
  }
  /**
   * @param {import("@babel/types").ExportDefaultDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ExportDefaultDeclaration(node) {
    const {declaration} = node;
    const a = this.toSource(declaration);
    return `export default ${a};`;
  }
  /**
   * @param {import("@babel/types").ExportSpecifier} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ExportSpecifier(node) {
    const {exported, local} = node;
    const left = this.toSource(exported);
    const right = this.toSource(local);
    const {spaces} = this;
    if (left === right) {
      return `${spaces}${left}`;
    }
    // For example:
    // PostEffect: PostEffect$1\n
    // createMesh: createMesh$1\n
    return `${spaces}${right} as ${left}`;
  }
  /**
   * @param {import("@babel/types").Super} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  Super(node) {
    return 'super';
  }
  /**
   * @param {import("@babel/types").ForInStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ForInStatement(node) {
    const {left, right, body} = node;
    const {spaces} = this;
    const l = this.toSource(left);
    const r = this.toSource(right);
    const b = this.toSourceCurly(body);
    return `${spaces}for (${l} in ${r})${b}`;
  }
  /**
   * @param {import("@babel/types").ThrowStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ThrowStatement(node) {
    const {argument} = node;
    const {spaces} = this;
    const arg = this.toSource(argument);
    return `${spaces}throw ${arg};`;
  }
  /**
   * @param {import("@babel/types").WhileStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  WhileStatement(node) {
    const {test, body} = node;
    const {spaces} = this;
    const t = this.toSource(test);
    const b = this.toSourceCurly(body);
    return `${spaces}while (${t})${b}`;
  }
  /**
   * @param {import("@babel/types").BreakStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  BreakStatement(node) {
    const {label} = node;
    let out = this.spaces + 'break';
    if (label) {
      out += ' ' + this.toSource(label);
    }
    out += ';';
    return out;
  }
  /**
   * @param {import("@babel/types").ForOfStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ForOfStatement(node) {
    const {await: await_, left, right, body} = node;
    const {spaces} = this;
    const l = this.toSource(left);
    const r = this.toSource(right);
    const b = this.toSourceCurly(body);
    const a = await_ ? 'await ' : '';
    return `${spaces}for ${a}(${l} of ${r})${b}`;
  }
  /**
   * for (const [a, b] in c)
   * --> [a, b] is the array pattern
   *
   * @param {import("@babel/types").ArrayPattern} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ArrayPattern(node) {
    const {elements} = node;
    const e = this.mapToSource(elements).join(', ');
    return `[${e}]`;
  }
  /**
   * @param {import("@babel/types").SwitchStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  SwitchStatement(node) {
    const {discriminant, cases} = node;
    const {spaces} = this;
    let out = '';
    out += spaces + `switch (${this.toSource(discriminant)}) {\n`;
    out += this.mapToSource(cases).join('\n') + '\n';
    out += spaces + '}';
    return out;
  }
  /**
   * @param {import("@babel/types").SwitchCase} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  SwitchCase(node) {
    const {consequent, test} = node;
    const {spaces} = this;
    const c = this.mapToSource(consequent).join('\n');
    if (test) {
      const t = this.toSource(test);
      return `${spaces}case ${t}:\n${c}`;
    }
    return `${spaces}default:\n${c}`;
  }
  /**
   * @param {import("@babel/types").RegExpLiteral} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  RegExpLiteral(node) {
    // parseSync("/test/gm")
    // todo figure out why it always exposes node.value === undefined... oversight in Babel?
    const {extra, value, pattern, flags} = node;
    return extra.raw;
  }
  /**
   * for (var i=0, n=arr.length; i<n; i++)
   * sequence expression: var i=0, n=arr.length
   *
   * @param {import("@babel/types").SequenceExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  SequenceExpression(node) {
    const {expressions} = node;
    return this.mapToSource(expressions).join(', ');
  }
  /**
   * showAST("if (true);");
   *
   * @param {import("@babel/types").EmptyStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  EmptyStatement(node) {
    return ';';
  }
  /**
   * @param {import("@babel/types").SpreadElement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  SpreadElement(node) {
    const {argument} = node;
    const a = this.toSource(argument);
    return `...${a}`;
  }
  /**
   * @param {import("@babel/types").ObjectMethod} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ObjectMethod(node) {
    // @todo PR in Babel why method/id is a key in node... (seems like a bug/oversight)
    // method === true just indicates kind === 'method'
    const {method, key, computed, kind, id, generator, async, params, body} = node;
    if (id !== null) {
      console.warn("ObjectMethod> id !== null is unhandled", node);
      debugger;
    }
    // if (method) {
    //   console.warn("ObjectMethod> node was a method", node);
    //   debugger;
    // }
    let out = this.spaces;
    if (generator) {
      out += '*';
    }
    if (id) {
      console.warn('Stringifier#ClassMethod> unhandled id', node);
    }
    if (async) {
      out += 'async ';
    }
    if (kind === 'get') {
      out += 'get ';
    } else if (kind === 'set') {
      out += 'set ';
    } else if (kind === 'method') {
      // Nothing yet.
    } else {
      console.warn("unhandled kind", kind, "for", node);
    }
    let methodName = this.toSource(key);
    if (computed) {
      methodName = `[${methodName}]`;
    }
    out += methodName;
    out += `(${this.mapToSource(params).join(', ')})`;
    out += this.toSource(body);
    return out;
  }
  /**
   * E.g. function testComma({x,y,z,}) {}
   * @param {import("@babel/types").ObjectPattern} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ObjectPattern(node) {
    const {properties, extra} = node;
    let out = '{';
    if (properties.length) {
      out += '\n';
      this.numSpaces++;
      out += this.mapToSource(properties).join(',\n');
      this.numSpaces--;
      if (!!extra?.trailingComma) {
        out += ',';
      }
      out += '\n';
      out += this.spaces.slice(2);
    }
    out += '}';
    return out;
  }
  /**
   * > x?.y
   * > x?.y.z
   * > x[y?.z]
   * > x?.[y?.z]
   * > b?.file?.variants[variant]
   *
   * @param {import("@babel/types").OptionalMemberExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  OptionalMemberExpression(node) {
    const {object, computed, property, optional} = node;
    const a = this.toSource(object);
    const b = this.toSource(property);
    // Basically four cases: computed=true/false optional=true/false, 00, 01, 10, 11
    if (!computed && !optional) {
      return `${a}.${b}`;
    } else if (!computed && optional) {
      return `${a}?.${b}`;
    } else if (computed && !optional) {
      return `${a}[${b}]`;
    }
    // Can only be case 4 now (computed && optional):
    return `${a}?.[${b}]`;
  }
  /**
   * > version?.indexOf('$');
   * > version?.indexOf?.('$');
   * > this.passEncoder?.pushDebugGroup(name);
   *
   * @param {import("@babel/types").OptionalCallExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  OptionalCallExpression(node) {
    const {callee, optional, arguments: args} = node;
    const a = this.toSource(callee);
    const b = this.mapToSource(args);
    if (optional) {
      return `${a}?.(${b})`;
    }
    return `${a}(${b})`;
  }
  /**
   * @param {import("@babel/types").DoWhileStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  DoWhileStatement(node) {
    const {body, test, trailingComments} = node;
    const {spaces} = this;
    let out = spaces;
    out += "do ";
    out += this.toSourceCurly(body);
    out += ` while (${this.toSource(test)});`;
    return out;
  }
  /**
   * @param {import("@babel/types").TryStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  TryStatement(node) {
    const {block, handler, finalizer} = node;
    let out = this.spaces;
    const b = this.toSource(block);
    out += `try ${b}`;
    if (handler) {
      out += this.toSource(handler);
    }
    if (finalizer) {
      out += 'finally' + this.toSource(finalizer);
    }
    return out;
  }
  /**
   * @param {import("@babel/types").CatchClause} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  CatchClause(node) {
    const {param, body} = node;
    const b = this.toSource(body);
    if (param) {
      const p = this.toSource(param);
      return ` catch (${p}) ${b}`;
    }
    // Example: try { 1n / 0 } catch {}
    return ` catch ${b}`;
  }
  /**
   * @param {import("@babel/types").RestElement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  RestElement(node) {
    const {argument} = node;
    return `...${this.toSource(argument)}`;
  }
  /**
   * @param {import("@babel/types").DebuggerStatement} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  DebuggerStatement(node) {
    return `${this.spaces}debugger;`;
  }
  /**
   * @param {import("@babel/types").CommentBlock} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  CommentBlock(node) {
    let {value, loc} = node;
    const {spaces, parents} = this;
    const par = parents[parents.length - 3];
    let out = '';
    if (!loc.start.column) {
      out += '\n' + this.spaces;
    } else {
      // out += ' ';
    }
    out += `${spaces}/*`;
    if (value.includes('\n')) {
      // A bit tricky to handle multiline comments,
      // we have to remove the given indentation level.
      value = trimEndSpaces(value.replace(/^\s*\*/gm, '*'))
        .split('\n')
        .filter(_ => _.length) // skip empty lines
        // Skip spaces in first line for /**
        .map((line, i) => (i ? spaces + ' ' : '') + line)
        .join('\n');
      out += `${value}\n${spaces} */`;
    } else {
      out += `${value}*/`;
    }
    if (
      par &&
      par.type === 'BlockStatement' ||
      par.type === 'ObjectExpression' ||
      par.type === 'Program'
    ) {
      return out + '\n';
    }
    return ' ' + out + ' ';
  }
  /**
   * @param {import("@babel/types").CommentLine} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  CommentLine(node) {
    const {value, loc} = node;
    let out = '';
    if (!loc.start.column) {
       out += '\n' + this.spaces;
    } else {
      out += ' ';
    }
    out += `//${value}\n`;
    return out;
  }
  /**
   * @param {import("@babel/types").Import} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  Import(node) {
    return 'import';
  }
  /**
   * @param {import("@babel/types").ImportDeclaration} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ImportDeclaration(node) {
    const {specifiers, source} = node;
    // ImportNamespaceSpecifier: import * as a   from "b";
    // ImportDefaultSpecifier  : import      a   from "b";
    // ImportSpecifier         : import {    a } from "b";
    const a = this.mapToSource(specifiers).join(', ');
    const b = this.toSource(source);
    if (specifiers.length === 0) {
      return `import ${b}`;
    }
    if (specifiers[0].type !== 'ImportSpecifier') {
      return `import ${a} from ${b};`;
    }
    return `import {${a}} from ${b};`;
  }
  /**
   * @param {import("@babel/types").ImportSpecifier} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ImportSpecifier(node) {
    const {imported, local} = node;
    const a = this.toSource(imported);
    const b = this.toSource(local);
    if (a !== b) {
      return `${a} as ${b}`;
    }
    return a;
  }
  /**
   * @param {import("@babel/types").ImportDefaultSpecifier} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ImportDefaultSpecifier(node) {
    const {local} = node;
    return this.toSource(local);
  }
  /**
   * @param {import("@babel/types").ImportNamespaceSpecifier} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  ImportNamespaceSpecifier(node) {
    const {local} = node;
    return `* as ${this.toSource(local)}`;
  }
  /**
   * @param {import("@babel/types").File} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  File(node) {
    return this.toSource(node.program) + '\n';
  }
  /**
   * @param {import("@babel/types").Program} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  Program(node) {
    const {sourceType, interpreter, body, directives} = node;
    let out = '';
    // @todo I would like to keep comments above and below,
    // but below one is currently dropped (does't matter for AST)
    // See: test/typechecking/directive.mjs
    out += this.mapToSource(directives);
    out += this.mapToSource(body).join('\n');
    return out;
  }
  /**
   * @param {import("@babel/types").StringLiteral} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  StringLiteral(node) {
    const {extra} = node;
    // Never experienced this so far, but types are types...
    if (!extra) {
      debugger;
      return '';
    }
    if (typeof extra.raw !== 'string') {
      debugger;
      return '';
    }
    return extra.raw;
  }
  /**
   * @param {import("@babel/types").NumericLiteral} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  NumericLiteral(node) {
    return node.extra.raw;
  }
  /**
   * @param {import("@babel/types").AssignmentPattern} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  AssignmentPattern(node) {
    const {left, right} = node;
    return `${this.toSource(left)} = ${this.toSource(right)}`;
  }
  /**
   * @param {import("@babel/types").NullLiteral} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  NullLiteral(node) {
    return 'null';
  }
  /**
   * @param {import("@babel/types").TaggedTemplateExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  TaggedTemplateExpression(node) {
    const {tag, quasi} = node;
    const t = this.toSource(tag);
    const q = this.toSource(quasi);
    return t + q;
  }
  /**
   * @param {import("@babel/types").YieldExpression} node - The Babel AST node.
   * @returns {string} Stringification of the node.
   */
  YieldExpression(node) {
    const {delegate, argument} = node;
    let keyword = 'yield';
    if (delegate) {
      keyword += '*';
    }
    const a = this.toSource(argument);
    return `${keyword} ${a}`;
  }
}
export {Stringifier};
