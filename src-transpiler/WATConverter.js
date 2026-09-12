import {Stringifier} from './Stringifier.js';
/** @typedef {import("@babel/types").Node} Node */
const CONST_TYPE = {
  f32: 'f32.const',
  f64: 'f64.const',
  i32: 'i32.const',
  i64: 'i64.const',
};
const NEG_OP = {
  f32: 'f32.neg',
  f64: 'f64.neg',
};
const EQZ_OP = {
  f32: 'f32.eqz',
  f64: 'f64.eqz',
  i32: 'i32.eqz',
  i64: 'i64.eqz',
};
const NE_OP = {
  f32: 'f32.ne',
  f64: 'f64.ne',
  i32: 'i32.ne',
  i64: 'i64.ne',
};
const ARITH_OP = {
  f32: {add: 'f32.add', sub: 'f32.sub', mul: 'f32.mul', div: 'f32.div'},
  f64: {add: 'f64.add', sub: 'f64.sub', mul: 'f64.mul', div: 'f64.div'},
  i32: {add: 'i32.add', sub: 'i32.sub', mul: 'i32.mul', div: 'i32.div_s'},
  i64: {add: 'i64.add', sub: 'i64.sub', mul: 'i64.mul', div: 'i64.div_s'},
};
const CMP_OP = {
  f32: {lt: 'f32.lt', gt: 'f32.gt', le: 'f32.le', ge: 'f32.ge', eq: 'f32.eq', ne: 'f32.ne'},
  f64: {lt: 'f64.lt', gt: 'f64.gt', le: 'f64.le', ge: 'f64.ge', eq: 'f64.eq', ne: 'f64.ne'},
  i32: {lt: 'i32.lt_s', gt: 'i32.gt_s', le: 'i32.le_s', ge: 'i32.ge_s', eq: 'i32.eq', ne: 'i32.ne'},
  i64: {lt: 'i64.lt_s', gt: 'i64.gt_s', le: 'i64.le_s', ge: 'i64.ge_s', eq: 'i64.eq', ne: 'i64.ne'},
};
const MATH_OP = {
  f32: {abs: 'f32.abs', sqrt: 'f32.sqrt', min: 'f32.min', max: 'f32.max', floor: 'f32.floor', ceil: 'f32.ceil', trunc: 'f32.trunc'},
  f64: {abs: 'f64.abs', sqrt: 'f64.sqrt', min: 'f64.min', max: 'f64.max', floor: 'f64.floor', ceil: 'f64.ceil', trunc: 'f64.trunc'},
};
const CMP_OPERATORS = ['<', '<=', '>', '>=', '==', '!='];
/**
 * Class for converting a JavaScript AST into WebAssembly Text (WAT).
 */
class WATConverter extends Stringifier {
  /** @type {'f32'|'f64'|'i32'|'i64'} */
  currentType = 'f32';
  /** @type {number[]} */
  loops = [];
  loopCounter = 0;
  /** @type {Object<string, {offset: number, values: number[], isObject: boolean, keys?: Map<string, number>}>} */
  arrays = {};
  /** @type {Object<string, {fields: string[], offsets: Object<string, number>, defaults: Object<string, Node>, methods: Set<string>, size: number}>} */
  classes = {};
  /** @type {Object<string, string>} */
  instances = {};
  /** @type {string|null} */
  currentClass = null;
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
   * Runs a function with a temporarily shifted indentation depth.
   * @param {number} extra - Additional indentation depth.
   * @param {() => string} fn - The function to run.
   * @returns {string} The result of the function.
   */
  atDepth(extra, fn) {
    this.numSpaces += extra;
    const ret = fn();
    this.numSpaces -= extra;
    return ret;
  }
  /**
   * Converts a Program node to WAT.
   * @param {import("@babel/types").Program} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  Program(node) {
    const {body} = node;
    this.registerModuleData(body);
    this.registerClasses(body);
    const classNames = Object.keys(this.classes);
    const {spaces} = this;
    let out = `(module\n`;
    this.numSpaces++;
    const rest = body.filter(stmt => (this.isModuleDataDeclaration(stmt) === false));
    out += this.mapToSource(rest).join('');
    const names = Object.keys(this.arrays);
    if (classNames.length) {
      out += `${this.spaces}(memory (export "m") 512)\n`;
      names.forEach(name => {
        const arr = this.arrays[name];
        out += `${this.spaces}(data (i32.const ${arr.offset}) ${this.f32DataBytes(arr.values)})\n`;
      });
      out += this.allocatorSource();
    } else if (names.length) {
      out += `${this.spaces}(memory (export "m") 1)\n`;
      names.forEach(name => {
        const arr = this.arrays[name];
        out += `${this.spaces}(data (i32.const ${arr.offset}) ${this.f32DataBytes(arr.values)})\n`;
      });
    }
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Registers top-level array/object literals as flat memory data.
   * @param {import("@babel/types").Statement[]} body - Top-level statements.
   */
  registerModuleData(body) {
    let offset = 0;
    body.forEach(stmt => {
      if (stmt.type !== 'VariableDeclaration' || stmt.kind !== 'const') {
        return;
      }
      const decl = stmt.declarations[0];
      if (!decl || decl.id.type !== 'Identifier') {
        return;
      }
      const {init} = decl;
      if (!init) {
        return;
      }
      if (init.type === 'ArrayExpression') {
        const values = init.elements.map(e => (e?.type === 'NumericLiteral' ? e.value : 0.0));
        this.arrays[decl.id.name] = {offset, values, isObject: false};
        offset += values.length * 4;
      } else if (init.type === 'ObjectExpression') {
        /** @type {Map<string, number>} */
        const keys = new Map();
        /** @type {number[]} */
        const values = [];
        init.properties.forEach((prop, i) => {
          if (prop.type !== 'ObjectProperty' || prop.key.type !== 'Identifier' ||
              prop.value.type !== 'NumericLiteral') {
            return;
          }
          keys.set(prop.key.name, i);
          values.push(prop.value.value);
        });
        this.arrays[decl.id.name] = {offset, values, isObject: true, keys};
        offset += values.length * 4;
      }
    });
  }
  /**
   * Checks whether a statement is a module-level array/object constant declaration.
   * @param {import("@babel/types").Statement} stmt - The statement.
   * @returns {boolean} True if the statement is a module-level data declaration.
   */
  isModuleDataDeclaration(stmt) {
    if (stmt.type !== 'VariableDeclaration' || stmt.kind !== 'const') {
      return false;
    }
    const decl = stmt.declarations[0];
    return !!decl && decl.id.type === 'Identifier' && !!this.arrays[decl.id.name];
  }
  /**
   * Serializes the f32 values of an array into raw little-endian bytes for a data segment.
   * @param {number[]} values - The f32 values.
   * @returns {string} The escaped byte string.
   */
  f32DataBytes(values) {
    const bytes = new Uint8Array(new Float32Array(values).buffer);
    let out = '"';
    for (let i = 0; i < bytes.length; i++) {
      out += '\\' + bytes[i].toString(16).padStart(2, '0');
    }
    return out + '"';
  }
  /**
   * Registers top-level class declarations and their instance memory layout.
   * @param {import("@babel/types").Statement[]} body - Top-level statements.
   */
  registerClasses(body) {
    body.forEach(stmt => {
      let decl = stmt;
      if (stmt.type === 'ExportNamedDeclaration' && stmt.declaration) {
        decl = stmt.declaration;
      }
      if (decl.type === 'ClassDeclaration') {
        this.registerClass(decl);
      }
    });
  }
  /**
   * Registers a single class declaration (fields, offsets, defaults, methods).
   * @param {import("@babel/types").ClassDeclaration} node - The class declaration.
   */
  registerClass(node) {
    const {id, body} = node;
    const cls = {
      fields: [],
      offsets: {},
      defaults: {},
      methods: new Set(),
      size: 0,
    };
    body.body.forEach(member => {
      if (member.static) {
        return;
      }
      if (member.type === 'ClassMethod' || member.type === 'MethodDefinition') {
        const name = member.key.type === 'Identifier' ? member.key.name : member.key.value;
        if (member.kind === 'constructor') {
          const methodBody = member.value?.body || member.body;
          if (methodBody) {
            this.collectConstructorFields(methodBody, cls);
          }
        } else {
          cls.methods.add(name);
        }
      } else if (member.type === 'ClassProperty' || member.type === 'PropertyDefinition') {
        const name = member.key.type === 'Identifier' ? member.key.name : member.key.value;
        this.addClassField(cls, name);
        if (member.value) {
          cls.defaults[name] = member.value;
        }
      }
    });
    if (cls.size || cls.methods.size) {
      this.classes[id.name] = cls;
    }
  }
  /**
   * Adds a class field at the next available byte offset.
   * @param {Object} cls - The class layout.
   * @param {string} name - The field name.
   */
  addClassField(cls, name) {
    if (name in cls.offsets) {
      return;
    }
    const index = cls.fields.length;
    cls.offsets[name] = index * 4;
    cls.fields.push(name);
    cls.size = (index + 1) * 4;
  }
  /**
   * Collects class fields assigned in a constructor from `this.name = ...` stores.
   * @param {import("@babel/types").BlockStatement} body - The constructor body.
   * @param {Object} cls - The class layout.
   */
  collectConstructorFields(body, cls) {
    this.walk(body, node => {
      const target = node.type === 'AssignmentExpression' ? node.left :
        node.type === 'UpdateExpression' ? node.argument : null;
      if (!target || target.type !== 'MemberExpression') {
        return;
      }
      const isThis = target.object.type === 'ThisExpression' ||
        (target.object.type === 'Identifier' && target.object.name === 'this');
      if (!isThis) {
        return;
      }
      const name = target.property.type === 'Identifier' ? target.property.name : target.property.value;
      this.addClassField(cls, name);
    });
  }
  /**
   * Walks a Babel node tree, invoking a callback for every node.
   * @param {Node} node - The node to walk.
   * @param {(node: Node) => void} fn - The callback.
   */
  walk(node, fn) {
    if (!node) {
      return;
    }
    fn(node);
    for (const key of Object.keys(node)) {
      if (key === 'leadingComments' || key === 'trailingComments' || key === 'loc' ||
          key === 'start' || key === 'end') {
        continue;
      }
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(c => this.walk(c, fn));
      } else if (child && typeof child.type === 'string') {
        this.walk(child, fn);
      }
    }
  }
  /**
   * Computes the first unused byte, after all module-level array/object data.
   * @returns {number} The heap start offset.
   */
  heapStart() {
    let max = 0;
    Object.values(this.arrays).forEach(arr => {
      const end = arr.offset + arr.values.length * 4;
      if (end > max) {
        max = end;
      }
    });
    return max;
  }
  /**
   * Emits the bump allocator: a heap pointer global and an `$alloc` function.
   * @returns {string} WAT source of the heap global and allocator.
   */
  allocatorSource() {
    const {spaces} = this;
    let out = `${spaces}(global $heapPtr (mut i32) (i32.const ${this.heapStart()}))\n`;
    out += `${spaces}(func $alloc (param $size i32) (result i32)\n`;
    this.numSpaces++;
    out += `${this.spaces}(local $result i32)\n`;
    out += `${this.spaces}(local.set $result (global.get $heapPtr))\n`;
    out += `${this.spaces}(global.set $heapPtr (i32.add (global.get $heapPtr) (local.get $size)))\n`;
    out += `${this.spaces}(local.get $result)\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
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
    } else if (declaration && declaration.type === 'ClassDeclaration') {
      out += this.toSource(declaration);
    } else {
      out += `;; Unsupported ExportNamedDeclaration: ${JSON.stringify(node)}\n`;
    }
    return out;
  }
  /**
   * Extracts the numeric WAT type from JSDoc comments (e.g. `@param {i32} n`).
   * Looks at the function itself and its ancestors, since Babel often attaches
   * the comment to the wrapping ExportNamedDeclaration instead.
   * @param {import("@babel/types").FunctionDeclaration} node - The function declaration.
   * @returns {'f32'|'f64'|'i32'|'i64'} The numeric type.
   */
  getFuncNumericType(node) {
    let comments = node.leadingComments || [];
    if (!comments.length) {
      for (const parent of this.parents) {
        if (parent.leadingComments?.length) {
          comments = parent.leadingComments;
          break;
        }
      }
    }
    const text = comments.map(c => c.value).join('\n');
    const regex = /@(?:param|returns)\s*\{([^}]+)\}/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const found = this.jsTypeToWat(match[1].trim().toLowerCase());
      if (found) {
        return found;
      }
    }
    return 'f32';
  }
  /**
   * Maps a JSDoc type name to a WAT numeric type.
   * @param {string} type - The JSDoc type name.
   * @returns {'f32'|'f64'|'i32'|'i64'|null} The WAT type or null if not numeric.
   */
  jsTypeToWat(type) {
    if (type === 'i32' || type === 'int' || type === 'integer') {
      return 'i32';
    }
    if (type === 'i64' || type === 'long') {
      return 'i64';
    }
    if (type === 'f64' || type === 'double') {
      return 'f64';
    }
    if (type === 'f32' || type === 'float' || type === 'number') {
      return 'f32';
    }
    return null;
  }
  /**
   * Converts a FunctionDeclaration node to WAT.
   * @param {import("@babel/types").FunctionDeclaration} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  FunctionDeclaration(node) {
    const {id, params, body} = node;
    const funcName = id.name;
    const savedType = this.currentType;
    this.currentType = this.getFuncNumericType(node);
    const t = this.currentType;
    const paramList = params.map(param => `(param $${param.name} ${t})`).join(' ');
    const returnType = `(result ${t})`;
    let out = `${this.spaces}(func $${funcName}${paramList ? ' ' + paramList : ''} ${returnType}\n`;
    this.numSpaces++;
    const localNames = this.collectLocalNames(body);
    localNames.forEach(localName => {
      out += `${this.spaces}(local $${localName} ${t})\n`;
    });
    this.parents.push({ type: 'BlockStatement' });
    out += `${this.spaces}(block $exit (result ${t})\n`;
    this.numSpaces++;
    out += body.body.map(statement => this.toSource(statement)).join('');
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.parents.pop();
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.currentType = savedType;
    return out;
  }
  /**
   * Converts a class constructor to a `$<Name>_new` factory that allocates a slot
   * in the bump heap and returns the instance pointer (as f32).
   * @param {import("@babel/types").ClassDeclaration} node - The class declaration.
   * @param {Object} cls - The registered class layout.
   * @returns {string} WAT source of the factory function.
   */
  classConstructorSource(node, cls) {
    const {spaces} = this;
    const {id, body} = node;
    const clsName = id.name;
    const ctor = body.body.find(m => (m.type === 'ClassMethod' || m.type === 'MethodDefinition') &&
    m.kind === 'constructor' && !m.static);
    const savedType = this.currentType;
    this.currentType = 'f32';
    const savedClass = this.currentClass;
    this.currentClass = clsName;
    const ctorParams = ctor ? (ctor.value?.params || ctor.params) : [];
    const paramList = ctorParams.map(p => `(param $${p.name} f32)`).join(' ');
    let out = `${spaces}(func $${clsName}_new${paramList ? ' ' + paramList : ''} (result f32)\n`;
    this.numSpaces++;
    out += `${this.spaces}(local $this f32)\n`;
    if (ctor) {
      const ctorBody = ctor.value?.body || ctor.body;
      const localNames = this.collectLocalNames(ctorBody);
      localNames.forEach(name => {
        out += `${this.spaces}(local $${name} f32)\n`;
      });
    }
    out += `${this.spaces}(local.set $this\n`;
    this.numSpaces++;
    out += `${this.spaces}(f32.convert_i32_u\n`;
    this.numSpaces++;
    out += `${this.spaces}(call $alloc\n`;
    this.numSpaces++;
    out += `${this.spaces}(i32.const ${cls.size})\n`;
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.numSpaces--;
    out += `${this.spaces})\n`;
    cls.fields.forEach(name => {
      if (cls.defaults[name]) {
        out += this.classFieldStoreSource('this', cls.defaults[name], name, cls);
      }
    });
    if (ctor) {
      const ctorBody = ctor.value?.body || ctor.body;
      out += this.mapToSource(ctorBody.body).join('');
    }
    out += `${this.spaces}(local.get $this)\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
    this.currentType = savedType;
    this.currentClass = savedClass;
    return out;
  }
  /**
   * Converts a class method to a `$<Name>_<method>` function taking `$this` first.
   * @param {string} clsName - The class name.
   * @param {import("@babel/types").ClassMethod} method - The method definition.
   * @returns {string} WAT source of the method function.
   */
  classMethodSource(clsName, method) {
    const {spaces} = this;
    const methodName = method.key.type === 'Identifier' ? method.key.name : method.key.value;
    const fnParams = method.value?.params || method.params;
    const fnBody = method.value?.body || method.body;
    const savedType = this.currentType;
    this.currentType = 'f32';
    const paramNames = ['this', ...fnParams.map(p => p.name)];
    const paramList = paramNames.map(name => `(param $${name} f32)`).join(' ');
    let out = `${spaces}(func $${clsName}_${methodName} ${paramList} (result f32)\n`;
    this.numSpaces++;
    const localNames = this.collectLocalNames(fnBody);
    localNames.forEach(name => {
      out += `${this.spaces}(local $${name} f32)\n`;
    });
    out += `${this.spaces}(block $exit (result f32)\n`;
    this.numSpaces++;
    out += this.mapToSource(fnBody.body).join('');
    const last = fnBody.body[fnBody.body.length - 1];
    if (!(last && last.type === 'ReturnStatement')) {
      out += `${this.spaces}(f32.const 0)\n`;
    }
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.currentType = savedType;
    return out;
  }
  /**
   * Converts a ClassDeclaration node to its factory and method functions.
   * @param {import("@babel/types").ClassDeclaration} node - The class declaration.
   * @returns {string} WAT representation of the class.
   */
  ClassDeclaration(node) {
    const clsName = node.id.name;
    const cls = this.classes[clsName];
    const {spaces} = this;
    if (!cls) {
      return `${spaces};; Unsupported class declaration: ${JSON.stringify(node)}\n`;
    }
    let out = this.classConstructorSource(node, cls);
    node.body.body.forEach(member => {
      if ((member.type !== 'ClassMethod' && member.type !== 'MethodDefinition') ||
          member.kind === 'constructor' || member.static) {
        return;
      }
      const savedClass = this.currentClass;
      this.currentClass = clsName;
      out += this.classMethodSource(clsName, member);
      this.currentClass = savedClass;
    });
    return out;
  }
  /**
   * Collects the names of all `let`-declared locals inside a function body.
   * @param {import("@babel/types").BlockStatement} body - The function body.
   * @returns {string[]} Names of the declared locals.
   */
  collectLocalNames(body) {
    /** @type {string[]} */
    const localNames = [];
    const visit = (node) => {
      if (!node) {
        return;
      }
      const {type} = node;
      if (type === 'VariableDeclaration') {
        node.declarations.forEach(decl => {
          if (decl.id.type === 'Identifier' && !localNames.includes(decl.id.name)) {
            localNames.push(decl.id.name);
          }
        });
        return;
      }
      for (const key of Object.keys(node)) {
        if (key === 'leadingComments' || key === 'trailingComments' || key === 'loc' ||
            key === 'start' || key === 'end') {
          continue;
        }
        const child = node[key];
        if (Array.isArray(child)) {
          child.forEach(visit);
        } else if (child && typeof child.type === 'string') {
          visit(child);
        }
      }
    };
    visit(body);
    return localNames;
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
   * Checks whether an expression already produces an i32 boolean test result,
   * so it can be fed to `if`/`br_if` without a truthiness conversion.
   * @param {Node} expr - The expression.
   * @returns {boolean} True if the expression yields an i32 test result.
   */
  isBooleanI32(expr) {
    if (expr.type === 'BinaryExpression') {
      return CMP_OPERATORS.includes(expr.operator);
    }
    if (expr.type === 'UnaryExpression' && expr.operator === '!') {
      return true;
    }
    if (expr.type === 'LogicalExpression') {
      return this.isBooleanI32(expr.left) && this.isBooleanI32(expr.right);
    }
    return false;
  }
  /**
   * Produces a WAT i32 test expression for an arbitrary numeric condition.
   * @param {Node} expr - The condition expression.
   * @returns {string} WAT source that pushes an i32.
   */
  getTestSource(expr) {
    if (this.isBooleanI32(expr)) {
      return this.toSource(expr);
    }
    const {spaces} = this;
    const t = this.currentType;
    let out = `${spaces}(${NE_OP[t]}\n`;
    this.numSpaces++;
    out += this.toSource(expr);
    out += `${this.spaces}(${CONST_TYPE[t]} 0)\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts body statements shared by loops and conditionals.
   * @param {Node} body - The body (BlockStatement or single statement).
   * @returns {string} WAT source of the body.
   */
  bodySource(body) {
    if (body.type === 'BlockStatement') {
      return this.mapToSource(body.body).join('');
    }
    return this.toSource(body);
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
    out += this.getTestSource(test);
    out += `${this.spaces}(then\n`;
    this.numSpaces++;
    out += this.bodySource(consequent);
    this.numSpaces--;
    out += `${this.spaces})\n`;
    if (alternate) {
      out += `${this.spaces}(else\n`;
      this.numSpaces++;
      out += this.bodySource(alternate);
      this.numSpaces--;
      out += `${this.spaces})\n`;
    }
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Registers the current loop as innermost and returns its label names.
   * @param {'while'|'for'|'do'} kind - The loop kind.
   * @param {Node} [update] - The for-loop update expression, regenerated inline at each continue.
   * @returns {{exit: string, top: string, updateSrc: string}} The loop labels.
   */
  pushLoop(kind, update) {
    const id = this.loopCounter++;
    const entry = {
      exit: `$exit${id}`,
      top: `$top${id}`,
      updateSrc: kind === 'for' && update ? this.toSource(update) : '',
    };
    this.loops.push(entry);
    return entry;
  }
  /**
   * Removes the innermost loop from the stack.
   * @returns {{exit: string, top: string, cont: string}|undefined} The popped loop labels.
   */
  popLoop() {
    return this.loops.pop();
  }
  /**
   * Converts a WhileStatement node to WAT.
   * @param {import("@babel/types").WhileStatement} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  WhileStatement(node) {
    const {test, body} = node;
    const {spaces} = this;
    const labels = this.pushLoop('while');
    let out = `${spaces}(block ${labels.exit}\n`;
    this.numSpaces++;
    out += `${this.spaces}(loop ${labels.top}\n`;
    this.numSpaces++;
    out += this.getTestSource(test);
    out += `${this.spaces}(i32.eqz)\n`;
    out += `${this.spaces}(br_if ${labels.exit})\n`;
    out += this.bodySource(body);
    out += `${this.spaces}(br ${labels.top})\n`;
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
    this.popLoop();
    return out;
  }
  /**
   * Converts a ForStatement node to WAT.
   * @param {import("@babel/types").ForStatement} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  ForStatement(node) {
    const {init, test, update, body} = node;
    const {spaces} = this;
    let out = init ? this.toSource(init) : '';
    const labels = this.pushLoop('for', update);
    out += `${spaces}(block ${labels.exit}\n`;
    this.numSpaces++;
    out += `${this.spaces}(loop ${labels.top}\n`;
    this.numSpaces++;
    if (test) {
      out += this.getTestSource(test);
      out += `${this.spaces}(i32.eqz)\n`;
      out += `${this.spaces}(br_if ${labels.exit})\n`;
    }
    out += this.bodySource(body);
    if (labels.updateSrc) {
      out += labels.updateSrc;
    }
    out += `${this.spaces}(br ${labels.top})\n`;
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
    this.popLoop();
    return out;
  }
  /**
   * Converts a DoWhileStatement node to WAT.
   * @param {import("@babel/types").DoWhileStatement} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  DoWhileStatement(node) {
    const {test, body} = node;
    const {spaces} = this;
    const labels = this.pushLoop('do');
    let out = `${spaces}(block ${labels.exit}\n`;
    this.numSpaces++;
    out += `${this.spaces}(loop ${labels.top}\n`;
    this.numSpaces++;
    out += this.bodySource(body);
    out += this.getTestSource(test);
    out += `${this.spaces}(i32.eqz)\n`;
    out += `${this.spaces}(br_if ${labels.exit})\n`;
    out += `${this.spaces}(br ${labels.top})\n`;
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
    this.popLoop();
    return out;
  }
  /**
   * Converts a BreakStatement node to WAT.
   * @param {import("@babel/types").BreakStatement} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  BreakStatement(node) {
    const {spaces} = this;
    if (node.label) {
      return `${spaces}(br $exit) ;; Unsupported labeled break "${node.label.name}"\n`;
    }
    const labels = this.loops[this.loops.length - 1];
    if (labels === undefined) {
      return `${spaces};; Unsupported break outside loop\n`;
    }
    return `${spaces}(br ${labels.exit})\n`;
  }
  /**
   * Converts a ContinueStatement node to WAT.
   * @param {import("@babel/types").ContinueStatement} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  ContinueStatement(node) {
    const {spaces} = this;
    if (node.label) {
      return `${spaces};; Unsupported labeled continue "${node.label.name}"\n`;
    }
    const labels = this.loops[this.loops.length - 1];
    if (labels === undefined) {
      return `${spaces};; Unsupported continue outside loop\n`;
    }
    let out = '';
    if (labels.updateSrc) {
      out += labels.updateSrc;
    }
    out += `${spaces}(br ${labels.top})\n`;
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
      expr = `${this.spaces}(${CONST_TYPE[this.currentType]} 0)\n`;
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
    const {spaces} = this;
    const t = this.currentType;
    if (operator === '%') {
      return this.percentToSource(node);
    }
    let opCode = '';
    if (CMP_OPERATORS.includes(operator)) {
      const opName = ({'<': 'lt', '<=': 'le', '>': 'gt', '>=': 'ge', '==': 'eq', '!=': 'ne'})[operator];
      opCode = CMP_OP[t][opName];
    } else {
      const opName = ({'+': 'add', '-': 'sub', '*': 'mul', '/': 'div'})[operator];
      if (!opName) {
        return `${spaces}(${CONST_TYPE[t]} 0.0) ;; Unsupported operator: ${operator}\n`;
      }
      opCode = ARITH_OP[t][opName];
    }
    let out = `${spaces}(${opCode}\n`;
    this.numSpaces++;
    out += this.toSource(left) + this.toSource(right);
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts a `%` (modulo) expression, emulating float modulo via truncation.
   * @param {import("@babel/types").BinaryExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  percentToSource(node) {
    const {left, right} = node;
    const {spaces} = this;
    const t = this.currentType;
    if (t === 'i32' || t === 'i64') {
      let out = `${spaces}(${t}.rem_s\n`;
      this.numSpaces++;
      out += this.toSource(left) + this.toSource(right);
      this.numSpaces--;
      out += `${spaces})\n`;
      return out;
    }
    const a = ARITH_OP[t];
    const leftDiv = this.atDepth(5, () => this.toSource(left));
    const rightDiv = this.atDepth(5, () => this.toSource(right));
    const leftTop = this.atDepth(1, () => this.toSource(left));
    const rightMul = this.atDepth(2, () => this.toSource(right));
    const indent = n => '  '.repeat(this.numSpaces + n);
    let out = `${spaces}(${a.add}\n`;
    out += leftTop;
    out += `${indent(1)}(${NEG_OP[t]}\n`;
    out += `${indent(2)}(${a.mul}\n`;
    out += `${indent(3)}(${MATH_OP[t].trunc}\n`;
    out += `${indent(4)}(${a.div}\n`;
    out += leftDiv + rightDiv;
    out += `${indent(4)})\n`;
    out += `${indent(3)})\n`;
    out += rightMul;
    out += `${indent(2)})\n`;
    out += `${indent(1)})\n`;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts an UnaryExpression node to WAT.
   * @param {import("@babel/types").UnaryExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  UnaryExpression(node) {
    const {argument, operator} = node;
    const {spaces} = this;
    const t = this.currentType;
    if (operator === '-') {
      if (NEG_OP[t]) {
        let out = `${spaces}(${NEG_OP[t]}\n`;
        this.numSpaces++;
        out += this.toSource(argument);
        this.numSpaces--;
        out += `${spaces})\n`;
        return out;
      }
      let out = `${spaces}(${ARITH_OP[t].sub}\n`;
      this.numSpaces++;
      out += `${this.spaces}(${CONST_TYPE[t]} 0)\n`;
      out += this.toSource(argument);
      this.numSpaces--;
      out += `${spaces})\n`;
      return out;
    }
    if (operator === '!') {
      const op = this.isBooleanI32(argument) ? 'i32.eqz' : EQZ_OP[t];
      let out = `${spaces}(${op}\n`;
      this.numSpaces++;
      out += this.toSource(argument);
      this.numSpaces--;
      out += `${spaces})\n`;
      return out;
    }
    return `${spaces}(${CONST_TYPE[t]} 0.0) ;; Unsupported unary operator: ${operator}\n`;
  }
  /**
   * Converts a VariableDeclaration node to WAT.
   * @param {import("@babel/types").VariableDeclaration} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  VariableDeclaration(node) {
    const {declarations} = node;
    return declarations.map(decl => this.toSource(decl)).join('');
  }
  /**
   * Converts a VariableDeclarator node to WAT.
   * @param {import("@babel/types").VariableDeclarator} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  VariableDeclarator(node) {
    const {id, init} = node;
    const {spaces} = this;
    if (id.type === 'Identifier' && init && init.type === 'NewExpression' &&
        init.callee.type === 'Identifier' && this.classes[init.callee.name]) {
      this.instances[id.name] = init.callee.name;
    }
    let out = `${spaces}(local.set $${id.name}\n`;
    this.numSpaces++;
    if (init) {
      out += this.toSource(init);
    } else {
      out += `${this.spaces}(${CONST_TYPE[this.currentType]} 0) ;; Initialized as zero.\n`;
    }
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts an UpdateExpression node to WAT.
   * @param {import("@babel/types").UpdateExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  UpdateExpression(node) {
    const {argument, operator} = node;
    const {spaces} = this;
    const t = this.currentType;
    if (argument.type !== 'Identifier') {
      return `${spaces}(${CONST_TYPE[t]} 0.0) ;; Unsupported UpdateExpression target ${argument.type}\n`;
    }
    const op = operator === '++' ? ARITH_OP[t].add : ARITH_OP[t].sub;
    let out = `${spaces}(local.set $${argument.name}\n`;
    this.numSpaces++;
    out += `${this.spaces}(${op}\n`;
    this.numSpaces++;
    out += `${this.spaces}(local.get $${argument.name})\n`;
    out += `${this.spaces}(${CONST_TYPE[t]} 1)\n`;
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts an AssignmentExpression node to WAT.
   * @param {import("@babel/types").AssignmentExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  AssignmentExpression(node) {
    const {left, operator, right} = node;
    const {spaces} = this;
    if (operator !== '=') {
      return `${spaces}(${CONST_TYPE[this.currentType]} 0.0) ;; Unsupported assignment operator: ${operator}\n`;
    }
    if (left.type === 'Identifier') {
      let out = `${spaces}(local.set $${left.name}\n`;
      this.numSpaces++;
      out += this.toSource(right);
      this.numSpaces--;
      out += `${spaces})\n`;
      return out;
    }
    if (left.type === 'MemberExpression') {
      const member = left;
      const pointerName = this.instancePointerName(member.object);
      const fieldName = member.property.type === 'Identifier' ? member.property.name : member.property.value;
      if (pointerName) {
        const clsName = this.resolveInstanceClass(member.object, fieldName);
        if (clsName && fieldName in this.classes[clsName].offsets) {
          return this.classFieldStoreSource(pointerName, right, fieldName, this.classes[clsName]);
        }
      }
      const arr = member.object.type === 'Identifier' ? this.arrays[member.object.name] : null;
      if (arr) {
        const indexSrc = this.arrayIndexSource(arr, member);
        let out = `${spaces}(f32.store\n`;
        this.numSpaces++;
        out += this.arrayAddressSource(arr, indexSrc);
        out += this.toSource(right);
        this.numSpaces--;
        out += `${spaces})\n`;
        return out;
      }
      const objectName = member.object.type === 'Identifier' ? member.object.name : member.object.type;
      return `${spaces}(${CONST_TYPE[this.currentType]} 0.0) ;; Unsupported store target ${objectName}\n`;
    }
    return `${spaces}(${CONST_TYPE[this.currentType]} 0.0) ;; Unsupported assignment target ${left.type}\n`;
  }
  /**
   * Produces an i32 source for the element index of an array/object member access.
   * @param {Object} arr - The registered array/object data.
   * @param {import("@babel/types").MemberExpression} member - The member expression.
   * @returns {string} WAT source that pushes the element index.
   */
  arrayIndexSource(arr, member) {
    if (!arr.isObject) {
      if (!member.computed) {
        return `${this.spaces};; Unsupported ${member.object.name}.${member.property.name} on array\n`;
      }
      return this.toI32(member.property);
    }
    const key = member.computed && member.property.type === 'StringLiteral' ?
      member.property.value :
      member.property.name;
    const index = arr.keys.get(key);
    if (index === undefined) {
      return `${this.spaces}; Unknown key "${member.property.name}"\n`;
    }
    return `${this.spaces}(i32.const ${index})\n`;
  }
  /**
   * Converts an arbitrary index expression to an i32 address offset.
   * @param {Node} expr - The index expression.
   * @returns {string} WAT source that pushes an i32 index.
   */
  toI32(expr) {
    const {spaces} = this;
    const t = this.currentType;
    if (t === 'i32') {
      return this.toSource(expr);
    }
    if (t !== 'f32' && t !== 'f64') {
      return `${spaces};; Unsupported index type ${t}\n`;
    }
    const truncExpr = t === 'f32' ? 'i32.trunc_f32_s' : 'i32.trunc_f64_s';
    let out = `${spaces}(${truncExpr}\n`;
    this.numSpaces++;
    out += this.toSource(expr);
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Computes the byte address of `baseOffset + elementIndex * 4`.
   * @param {Object} arr - The registered array/object data.
   * @param {string} indexSrc - The i32 element index source.
   * @returns {string} WAT source that pushes the byte address.
   */
  arrayAddressSource(arr, indexSrc) {
    const {spaces} = this;
    let out = `${spaces}(i32.add\n`;
    this.numSpaces++;
    out += `${this.spaces}(i32.const ${arr.offset})\n`;
    out += `${this.spaces}(i32.mul\n`;
    this.numSpaces++;
    out += indexSrc;
    out += `${this.spaces}(i32.const 4)\n`;
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Returns the WAT local name holding an instance pointer.
   * @param {Node} objectNode - The object expression.
   * @returns {string|null} The local name.
   */
  instancePointerName(objectNode) {
    const isThis = objectNode.type === 'ThisExpression' ||
      (objectNode.type === 'Identifier' && objectNode.name === 'this');
    return isThis ? 'this' : (objectNode.type === 'Identifier' ? objectNode.name : null);
  }
  /**
   * Resolves the class of an instance object from source info.
   * @param {Node} objectNode - The member/call object expression.
   * @param {string} propertyName - The accessed field or method name.
   * @returns {string|null} The class name.
   */
  resolveInstanceClass(objectNode, propertyName) {
    const pointerName = this.instancePointerName(objectNode);
    if (pointerName === 'this') {
      return this.currentClass;
    }
    if (pointerName === null) {
      return null;
    }
    if (this.instances[pointerName]) {
      return this.instances[pointerName];
    }
    if (pointerName in this.arrays) {
      return null;
    }
    const clsNames = Object.keys(this.classes).filter(n => propertyName in this.classes[n].offsets);
    return clsNames.length === 1 ? clsNames[0] : null;
  }
  /**
   * Resolves the class of an instance on whose method a call is dispatched.
   * @param {Node} objectNode - The call object expression.
   * @param {string} methodName - The called method name.
   * @returns {string|null} The class name.
   */
  resolveInstanceMethodClass(objectNode, methodName) {
    const pointerName = this.instancePointerName(objectNode);
    if (pointerName === 'this') {
      return (this.currentClass && this.classes[this.currentClass].methods.has(methodName)) ?
        this.currentClass : null;
    }
    if (pointerName === null) {
      return null;
    }
    if (this.instances[pointerName]) {
      return this.instances[pointerName];
    }
    if (pointerName in this.arrays) {
      return null;
    }
    const clsNames = Object.keys(this.classes).filter(n => this.classes[n].methods.has(methodName));
    return clsNames.length === 1 ? clsNames[0] : null;
  }
  /**
   * Produces the WAT source for the heap byte address of a class field.
   * @param {string} pointerName - The local holding the instance pointer.
   * @param {string} fieldName - The field name.
   * @param {Object} cls - The class layout.
   * @returns {string} WAT source that pushes the byte address.
   */
  classFieldAddressSource(pointerName, fieldName, cls) {
    const {spaces} = this;
    let out = `${spaces}(i32.add\n`;
    this.numSpaces++;
    out += `${this.spaces}(i32.trunc_f32_s\n`;
    this.numSpaces++;
    out += `${this.spaces}(local.get $${pointerName})\n`;
    this.numSpaces--;
    out += `${this.spaces})\n`;
    out += `${this.spaces}(i32.const ${cls.offsets[fieldName]})\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Produces the WAT source for loading a class field from the heap.
   * @param {string} pointerName - The local holding the instance pointer.
   * @param {string} fieldName - The field name.
   * @param {Object} cls - The class layout.
   * @returns {string} WAT source that pushes the field value.
   */
  classFieldLoadSource(pointerName, fieldName, cls) {
    const {spaces} = this;
    let out = `${spaces}(f32.load\n`;
    this.numSpaces++;
    out += this.classFieldAddressSource(pointerName, fieldName, cls);
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Produces the WAT source for storing a value into a class field.
   * @param {string} pointerName - The local holding the instance pointer.
   * @param {Node} valueNode - The value expression.
   * @param {string} fieldName - The field name.
   * @param {Object} cls - The class layout.
   * @returns {string} WAT source that performs the store.
   */
  classFieldStoreSource(pointerName, valueNode, fieldName, cls) {
    const {spaces} = this;
    let out = `${spaces}(f32.store\n`;
    this.numSpaces++;
    out += this.classFieldAddressSource(pointerName, fieldName, cls);
    out += this.toSource(valueNode);
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts a MemberExpression node (array/object element read) to WAT.
   * @param {import("@babel/types").MemberExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  MemberExpression(node) {
    const {object, property} = node;
    const {spaces} = this;
    const pointerName = this.instancePointerName(object);
    const fieldName = property.type === 'Identifier' ? property.name : property.value;
    if (pointerName === 'this') {
      const clsName = this.resolveInstanceClass(object, fieldName);
      if (clsName && fieldName in this.classes[clsName].offsets) {
        return this.classFieldLoadSource('this', fieldName, this.classes[clsName]);
      }
    }
    if (object.type !== 'Identifier') {
      return `${spaces}(f32.const 0.0) ;; Unsupported member access on ${object.type}\n`;
    }
    const arr = this.arrays[object.name];
    if (arr) {
      const indexSrc = this.arrayIndexSource(arr, node);
      let out = `${spaces}(f32.load\n`;
      this.numSpaces++;
      out += this.arrayAddressSource(arr, indexSrc);
      this.numSpaces--;
      out += `${spaces})\n`;
      return out;
    }
    const clsName = this.resolveInstanceClass(object, fieldName);
    if (clsName && fieldName in this.classes[clsName].offsets) {
      return this.classFieldLoadSource(object.name, fieldName, this.classes[clsName]);
    }
    return `${spaces}(f32.const 0.0) ;; Unsupported member access on unknown "${object.name}"\n`;
  }
  /**
   * Converts a ConditionalExpression (ternary) node to WAT.
   * @param {import("@babel/types").ConditionalExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  ConditionalExpression(node) {
    const {test, consequent, alternate} = node;
    const {spaces} = this;
    const t = this.currentType;
    let out = `${spaces}(if (result ${t})\n`;
    this.numSpaces++;
    out += this.getTestSource(test);
    out += `${this.spaces}(then\n`;
    this.numSpaces++;
    out += this.toSource(consequent);
    this.numSpaces--;
    out += `${this.spaces})\n`;
    out += `${this.spaces}(else\n`;
    this.numSpaces++;
    out += this.toSource(alternate);
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts a LogicalExpression node to WAT.
   * @param {import("@babel/types").LogicalExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  LogicalExpression(node) {
    const {left, operator, right} = node;
    const {spaces} = this;
    const resultType = this.isBooleanI32(left) && this.isBooleanI32(right) ? 'i32' : this.currentType;
    const thenOperand = operator === '&&' ? right : left;
    const elseOperand = operator === '&&' ? left : right;
    let out = `${spaces}(if (result ${resultType})\n`;
    this.numSpaces++;
    out += this.getTestSource(left);
    out += `${this.spaces}(then\n`;
    this.numSpaces++;
    out += this.toSource(thenOperand);
    this.numSpaces--;
    out += `${this.spaces})\n`;
    out += `${this.spaces}(else\n`;
    this.numSpaces++;
    out += this.toSource(elseOperand);
    this.numSpaces--;
    out += `${this.spaces})\n`;
    this.numSpaces--;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts an ExpressionStatement node to WAT.
   * @param {import("@babel/types").ExpressionStatement} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  ExpressionStatement(node) {
    const {expression} = node;
    if (expression.type === 'AssignmentExpression' || expression.type === 'UpdateExpression') {
      return this.toSource(expression);
    }
    const {spaces} = this;
    let out = `${spaces}(drop\n`;
    this.numSpaces++;
    out += this.toSource(expression);
    this.numSpaces--;
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
    const t = this.currentType;
    if (node.name === 'this') {
      return `${spaces}(local.get $this)\n`;
    }
    if (t === 'f32' || t === 'f64') {
      if (node.name === 'Infinity') {
        return `${spaces}(${CONST_TYPE[t]} inf)\n`;
      }
      if (node.name === 'NaN') {
        return `${spaces}(${CONST_TYPE[t]} nan)\n`;
      }
    }
    return `${spaces}(local.get $${node.name})\n`;
  }
  /**
   * Converts a NumericLiteral node to WAT.
   * @param {import("@babel/types").NumericLiteral} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  NumericLiteral(node) {
    const {spaces} = this;
    const t = this.currentType;
    const constExpr = CONST_TYPE[t];
    const value = parseFloat(node.value);
    if (isNaN(value)) {
      return `${spaces}(${constExpr} 0.0) ;; Invalid literal value: ${node.value}\n`;
    }
    if (t === 'i32' || t === 'i64') {
      return `${spaces}(${constExpr} ${Math.trunc(value)})\n`;
    }
    return `${spaces}(${constExpr} ${value})\n`;
  }
  /**
   * Converts a CallExpression node to WAT.
   * @param {import("@babel/types").CallExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  CallExpression(node) {
    const {callee, arguments: args} = node;
    const {spaces} = this;
    if (callee.type === 'MemberExpression') {
      const methodName = callee.property.type === 'Identifier' ? callee.property.name : callee.property.value;
      if (callee.object.type === 'Identifier' && callee.object.name === 'Math') {
        const mathOp = MATH_OP[this.currentType]?.[methodName];
        if (!mathOp) {
          return `${spaces}(f32.const 0.0) ;; Unsupported Math.${methodName} for ${this.currentType}\n`;
        }
        let out = `${spaces}(${mathOp}\n`;
        this.numSpaces++;
        out += args.map(arg => this.toSource(arg)).join('');
        this.numSpaces--;
        out += `${spaces})\n`;
        return out;
      }
      const clsName = this.resolveInstanceMethodClass(callee.object, methodName);
      if (clsName) {
        const pointerName = this.instancePointerName(callee.object);
        if (pointerName) {
          let out = `${spaces}(call $${clsName}_${methodName}\n`;
          this.numSpaces++;
          out += `${this.spaces}(local.get $${pointerName})\n`;
          out += args.map(arg => this.toSource(arg)).join('');
          this.numSpaces--;
          out += `${spaces})\n`;
          return out;
        }
      }
    }
    const funcName = callee.name;
    let out = `${spaces}(call $${funcName}\n`;
    this.numSpaces++;
    const argsCode = args.map(arg => this.toSource(arg)).join('');
    this.numSpaces--;
    out += argsCode;
    out += `${spaces})\n`;
    return out;
  }
  /**
   * Converts a NewExpression node to a $<ClassName>_new factory call.
   * @param {import("@babel/types").NewExpression} node - The Babel AST node.
   * @returns {string} WAT representation of the node.
   */
  NewExpression(node) {
    const {callee, arguments: args} = node;
    const {spaces} = this;
    if (!this.classes[callee.name]) {
      return `${spaces}(f32.const 0.0) ;; Unsupported new ${callee.name}\n`;
    }
    let out = `${spaces}(call $${callee.name}_new\n`;
    this.numSpaces++;
    const argsCode = args.map(arg => this.toSource(arg)).join('');
    this.numSpaces--;
    out += argsCode;
    out += `${spaces})\n`;
    return out;
  }
}
export {WATConverter};
