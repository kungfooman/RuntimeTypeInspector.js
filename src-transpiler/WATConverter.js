import {Stringifier} from './Stringifier.js';
/**
 * @typedef {import("@babel/types").Node} Node
 */
/**
 * Class for converting a JavaScript AST into WebAssembly Text (WAT).
 */
class WATConverter extends Stringifier {
  /**
   * Converts a Babel AST node to WAT source.
   * @param {Node} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  toSource(node) {
    if (node === null) {
      return '';
    }
    const { leadingComments, trailingComments } = node;
    if (node.type === 'File') {
      this.parents.length = 0;
    }
    this.parents.push(node);
    let out = '';
    if (leadingComments) {
      out += this.leadingCommentsToSource(leadingComments);
    }
    out += this.toSource_(node);
    if (trailingComments) {
      out += this.trailingCommentsToSource(trailingComments);
    }
    this.parents.pop();
    return out;
  }
  /**
   * Internal method to convert a node to WAT.
   * @param {Node} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  toSource_(node) {
    if (!node) {
      return '';
    }
    const {type} = node;
    if (this[type]) {
      return this[type](node);
    }
    console.warn(`TODO ADD METHOD: ${type}`);
    return `;; Unhandled node type: ${type}\n`;
  }
  /**
   * Converts leading comments to WAT.
   * @param {import("@babel/types").Comment[]} comments - The comment nodes.
   * @returns {string} WAT representation of comments.
   */
  leadingCommentsToSource(comments) {
    return comments.map(comment => this.commentToSource(comment, 'leading')).join('');
  }
  /**
   * Converts trailing comments to WAT.
   * @param {import("@babel/types").Comment[]} comments - The comment nodes.
   * @returns {string} WAT representation of comments.
   */
  trailingCommentsToSource(comments) {
    return comments.map(comment => this.commentToSource(comment, 'trailing')).join('');
  }
  /**
   * Converts a comment to WAT.
   * @param {import("@babel/types").Comment} comment - The comment node.
   * @param {'leading' | 'trailing'} pos - The position of the comment.
   * @returns {string} WAT representation of the comment.
   */
  commentToSource(comment, pos) {
    if (comment.type === 'CommentBlock') {
      return this.CommentBlock(comment);
    } else if (comment.type === 'CommentLine') {
      return this.CommentLine(comment);
    }
    console.warn("Unknown comment type", comment);
    return '';
  }
  /**
   * Converts a CommentBlock to WAT.
   * @param {import("@babel/types").CommentBlock} node - The comment node.
   * @returns {string} WAT representation of the comment.
   */
  CommentBlock(node) {
    const {loc, value} = node;
    if (this.lastCommentBlockIndex === loc.start.index) {
      return '';
    }
    this.lastCommentBlockIndex = loc.start.index;
    const spaces = this.spaces;
    let out = '';
    const dedicatedLine = spaces.length === loc.start.column;
    if (dedicatedLine) {
      out += spaces;
    }
    const multiLine = loc.start.line !== loc.end.line;
    if (multiLine) {
      out += '\n' + spaces;
    }
    out += ';;' + value.replace(/\n\s*\*/g, '\n' + spaces + ';;') + '\n';
    if (!dedicatedLine) {
      out += ' ';
    }
    return out;
  }
  /**
   * Converts a CommentLine to WAT.
   * @param {import("@babel/types").CommentLine} node - The comment node.
   * @returns {string} WAT representation of the comment.
   */
  CommentLine(node) {
    const {value, loc} = node;
    if (this.lastCommentLineIndex === loc.start.index) {
      return '';
    }
    this.lastCommentLineIndex = loc.start.index;
    const spaces = this.spaces;
    const dedicatedLine = spaces.length === loc.start.column;
    let out = dedicatedLine ? '\n' + spaces : ' ';
    out += `;;${value}\n`;
    return out;
  }
  /**
   * Converts a Program node to WAT.
   * @param {import("@babel/types").Program} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  Program(node) {
    const {body} = node;
    let out = `(module\n`;
    this.numSpaces++;
    out += this.mapToSource(body).join('');
    this.numSpaces--;
    out += `)\n`;
    return out;
  }
  /**
   * Converts an ExportNamedDeclaration node to WAT.
   * @param {import("@babel/types").ExportNamedDeclaration} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  ExportNamedDeclaration(node) {
    const {declaration} = node;
    let out = '';
    if (declaration && declaration.type === 'FunctionDeclaration') {
      out += this.toSource(declaration);
      const funcName = declaration.id.name;
      out += `${this.spaces}(export "${funcName}" (func $${funcName}))\n`;
    } else {
      out += `;; Unsupported ExportNamedDeclaration: ${JSON.stringify(node)}\n`;
    }
    return out;
  }
  /**
   * Converts a FunctionDeclaration node to WAT.
   * @param {import("@babel/types").FunctionDeclaration} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  FunctionDeclaration(node) {
    const {id, params, body} = node;
    const funcName = id.name;
    const paramList = params.map(param => `(param $${param.name} f32)`).join(' ');
    const returnType = '(result f32)';
    let out = `${this.spaces}(func $${funcName} ${paramList} ${returnType}\n`;
    this.numSpaces++;
    this.parents.push({ type: 'BlockStatement' });
    out += `${this.spaces}(block $exit (result f32)\n`;
    this.numSpaces++;
    out += body.body.map(statement => this.toSource(statement)).join('');
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.parents.pop();
    this.numSpaces--;
    out += `${this.spaces})\n`;
    return out;
  }
  /**
   * Converts a BlockStatement node to WAT.
   * @param {import("@babel/types").BlockStatement} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  BlockStatement(node) {
    const {body} = node;
    return this.mapToSource(body).join('');
  }
  /**
   * Converts an IfStatement node to WAT.
   * @param {import("@babel/types").IfStatement} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  IfStatement(node) {
    const {test, consequent, alternate} = node;
    const {spaces} = this;
    let out = `${spaces}(if\n`;
    this.numSpaces++;
    const testCode = this.toSource(test);
    out += testCode;
    out += `${this.spaces}(then\n`;
    this.numSpaces++;
    const consequentCode = consequent.type === 'BlockStatement' ?
      consequent.body.map(s => this.toSource(s)).join('') :
      this.toSource(consequent);
    this.numSpaces--;
    out += consequentCode;
    out += `${this.spaces})\n`;
    if (alternate) {
      out += `${this.spaces}(else\n`;
      this.numSpaces++;
      const alternateCode = alternate.type === 'BlockStatement' ?
        alternate.body.map(s => this.toSource(s)).join('') :
        this.toSource(alternate);
      this.numSpaces--;
      out += alternateCode;
      out += `${this.spaces})\n`;
    }
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts a ReturnStatement node to WAT.
   * @param {import("@babel/types").ReturnStatement} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  ReturnStatement(node) {
    const {argument} = node;
    const {spaces} = this;
    let out = `${spaces}(return\n`;
    this.numSpaces++;
    let expr = '';
    if (!argument) {
      expr = `${this.spaces}(f32.const 0.0)\n`;
    } else {
      expr = this.toSource(argument);
    }
    out += expr;
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts a BinaryExpression node to WAT.
   * @param {import("@babel/types").BinaryExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  BinaryExpression(node) {
    const {left, operator, right} = node;
    const spaces = this.spaces;
    let opCode = '';
    switch (operator) {
      case '+':
        opCode = 'f32.add';
        break;
      case '-':
        opCode = 'f32.sub';
        break;
      case '*':
        opCode = 'f32.mul';
        break;
      case '/':
        opCode = 'f32.div';
        break;
      case '<=':
        opCode = 'f32.le';
        break;
      default:
        return `${spaces}(f32.const 0.0) ;; Unsupported operator: ${operator}\n`;
    }
    let out = `${spaces}(${opCode}\n`;
    this.numSpaces++;
    const leftCode = this.toSource(left);
    const rightCode = this.toSource(right);
    this.numSpaces--;
    out += leftCode + rightCode;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts an Identifier node to WAT.
   * @param {import("@babel/types").Identifier} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  Identifier(node) {
    const {spaces} = this;
    return `${spaces}(local.get $${node.name})\n`;
  }
  /**
   * Converts a NumericLiteral node to WAT.
   * @param {import("@babel/types").NumericLiteral} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  NumericLiteral(node) {
    const {spaces} = this;
    const value = parseFloat(node.value);
    if (isNaN(value)) {
      return `${spaces}(f32.const 0.0) ;; Invalid literal value: ${node.value}\n`;
    }
    return `${spaces}(f32.const ${value})\n`;
  }
  /**
   * Converts a CallExpression node to WAT.
   * @param {import("@babel/types").CallExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  CallExpression(node) {
    const {callee, arguments: args} = node;
    const spaces = this.spaces;
    const funcName = callee.name;
    let out = `${spaces}(call $${funcName}\n`;
    this.numSpaces++;
    const argsCode = args.map(arg => this.toSource(arg)).join('');
    this.numSpaces--;
    out += argsCode;
    out += `${spaces})\n`;
    return out;
  }
}
export {WATConverter};
