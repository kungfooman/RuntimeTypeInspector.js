registerTypedef('Tint', "Color");
registerTypedef('IfEquals', {
  "type": "condition",
  "checkType": {
    "type": "function",
    "parameters": []
  },
  "extendsType": {
    "type": "function",
    "parameters": []
  },
  "trueType": "A",
  "falseType": "B"
}, ["X","Y","A","B"]);
registerTypedef('WritableKeys', {
  "type": "indexedAccess",
  "index": {
    "type": "keyof",
    "argument": "T"
  },
  "object": {
    "type": "mapping",
    "iterable": {
      "type": "keyof",
      "argument": "T"
    },
    "element": "P",
    "result": {
      "type": "reference",
      "name": "IfEquals",
      "args": [
        {
          "type": "mapping",
          "iterable": "P",
          "element": "Q",
          "result": {
            "type": "indexedAccess",
            "index": "P",
            "object": "T"
          }
        },
        {
          "type": "mapping",
          "iterable": "P",
          "element": "Q",
          "result": {
            "type": "indexedAccess",
            "index": "P",
            "object": "T"
          },
          "readonly": "-"
        },
        "P"
      ]
    },
    "question": "-"
  }
}, ["T"]);
registerTypedef('Box', {
  "type": "object",
  "properties": {
    "a": "number",
    "b": "string"
  }
});
registerTypedef('ReqBox', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": "Box"
  },
  "element": "K",
  "result": {
    "type": "indexedAccess",
    "index": "K",
    "object": "Box"
  },
  "question": "-"
});

/**
 * Modifier identity tower: `WritableKeys` has to keep class-typed, aliased,
 * union and array properties (the `-readonly` comparison must see the same
 * spelling on both sides), while getter-only properties stay out. `-?`
 * keeps base options required.
 */
class Component {

}
registerClass(Component);
class Color {
  constructor() {
    this.r = 0.5;
    this.g = 0.6;
    this.b = 0.9;
    this.a = 1;
  }
}
registerClass(Color);
registerTypedef('Color', {
  "type": "object",
  "properties": {
    "r": "number",
    "g": "number",
    "b": "number",
    "a": "number"
  }
});

/**
 * @typedef {Color} Tint
 */

class CameraComponent extends Component {
  constructor() {
    super();
    /** @type {Color} */

    this._clearColor = new Color();
    /** @type {Tint} */

    this._tint = new Color();
    /** @type {Color|number[]} */

    this._blend = [0, 0, 0, 1];
    /** @type {number} */

    this._fov = 45;
    /** @type {string} */

    this._label = 'camera';
  }
  
  /**
   * @type {Color}
   */

  get clearColor() {
    return this._clearColor;
  }
  
  /**
   * @param {Color} value
   */

  set clearColor(value) {
    this._clearColor = value;
  }
  
  /**
   * @type {Tint}
   */

  get tint() {
    return this._tint;
  }
  
  /**
   * @param {Tint} value
   */

  set tint(value) {
    this._tint = value;
  }
  
  /**
   * @type {Color|number[]}
   */

  get blend() {
    return this._blend;
  }
  
  /**
   * @param {Color|number[]} value
   */

  set blend(value) {
    this._blend = value;
  }
  
  /**
   * @type {number}
   */

  get fov() {
    return this._fov;
  }
  
  /**
   * @param {number} value
   */

  set fov(value) {
    this._fov = value;
  }
  
  /**
   * @type {string}
   */

  get label() {
    return this._label;
  }
}
registerClass(CameraComponent);
registerTypedef('CameraComponent', {
  "type": "object",
  "properties": {
    "clearColor": "Color",
    "tint": "Tint",
    "blend": {
      "type": "union",
      "members": [
        "Color",
        {
          "type": "array",
          "elementType": "number"
        }
      ]
    },
    "fov": "number",
    "label": {
      "type": "string",
      "readonly": true
    },
    "_clearColor": "Color",
    "_tint": "Tint",
    "_blend": {
      "type": "union",
      "members": [
        "Color",
        {
          "type": "array",
          "elementType": "number"
        }
      ]
    },
    "_fov": "number",
    "_label": "string"
  }
});

/**
 * Resolves to `A` when the types `X` and `Y` are identical, otherwise to `B`.
 *
 * @template X
 * @template Y
 * @template [A=X]
 * @template [B=never]
 * @typedef {(<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B} IfEquals
 */


/**
 * @template T
 * @typedef {{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T]} WritableKeys
 */


/**
 * @param {WritableKeys<CameraComponent>} key
 */


/**
 * Resolves to `A` when the types `X` and `Y` are identical, otherwise to `B`.
 *
 * @template X
 * @template Y
 * @template [A=X]
 * @template [B=never]
 * @typedef {(<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? A : B} IfEquals
 */

/**
 * @template T
 * @typedef {{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T]} WritableKeys
 */

/**
 * @param {WritableKeys<CameraComponent>} key
 */
function takeCameraKey(key) {
  if (!inspectType(key, {
    "type": "reference",
    "name": "WritableKeys",
    "args": [
      "CameraComponent"
    ],
    "optional": false
  }, 'takeCameraKey', 'key')) {
    youCanAddABreakpointHere();
  }
  return key;
}
takeCameraKey('clearColor'); // Expected: no issue — writable class-typed prop is a key

takeCameraKey('tint'); // Expected: no issue — aliased class type is a key

takeCameraKey('blend'); // Expected: no issue — union prop is a key

takeCameraKey('fov'); // Expected: no issue

takeCameraKey('label'); // Expected: error — getter-only props aren't writable keys

takeCameraKey('nope'); // Expected: error — unknown key


/**
 * @typedef {{ a: number, b: string }} Box
 */


/**
 * @typedef {{ [K in keyof Box]-?: Box[K] }} ReqBox
 */


/**
 * @param {ReqBox} opts
 */


/**
 * @typedef {{ a: number, b: string }} Box
 */

/**
 * @typedef {{ [K in keyof Box]-?: Box[K] }} ReqBox
 */

/**
 * @param {ReqBox} opts
 */
function takeRequired(opts) {
  if (!inspectType(opts, "ReqBox", 'takeRequired', 'opts')) {
    youCanAddABreakpointHere();
  }
  return opts;
}
takeRequired({
  a: 1,
  b: 's'
}); // Expected: no issue

takeRequired({}); // Expected: error — 'a' and 'b' are required

takeRequired({
  a: 1
}); // Expected: error — 'b' is required

