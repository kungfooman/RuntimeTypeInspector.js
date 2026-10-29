registerTypedef('ComponentMap', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": "Entity"
  },
  "element": "K",
  "result": {
    "type": "reference",
    "name": "NonNullable",
    "args": [
      {
        "type": "indexedAccess",
        "index": "K",
        "object": "Entity"
      }
    ]
  },
  "nameType": {
    "type": "condition",
    "checkType": {
      "type": "reference",
      "name": "NonNullable",
      "args": [
        {
          "type": "indexedAccess",
          "index": "K",
          "object": "Entity"
        }
      ]
    },
    "extendsType": "Component",
    "trueType": "K",
    "falseType": "never"
  }
});
registerTypedef('ComponentName', {
  "type": "intersection",
  "members": [
    {
      "type": "keyof",
      "argument": "ComponentMap"
    },
    "string"
  ]
});
registerTypedef('IfEquals', {
  "type": "condition",
  "checkType": {
    "type": "function",
    "parameters": [],
    "ret": {
      "type": "condition",
      "checkType": "T",
      "extendsType": "X",
      "trueType": 1,
      "falseType": 2
    }
  },
  "extendsType": {
    "type": "function",
    "parameters": [],
    "ret": {
      "type": "condition",
      "checkType": "T",
      "extendsType": "Y",
      "trueType": 1,
      "falseType": 2
    }
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
registerTypedef('ComponentOptionKeys', {
  "type": "indexedAccess",
  "index": {
    "type": "reference",
    "name": "WritableKeys",
    "args": [
      "C"
    ]
  },
  "object": {
    "type": "mapping",
    "iterable": {
      "type": "reference",
      "name": "WritableKeys",
      "args": [
        "C"
      ]
    },
    "element": "K",
    "result": {
      "type": "condition",
      "checkType": "K",
      "extendsType": {
        "type": "union",
        "members": [
          "'system'",
          "'entity'",
          {
            "type": "templateLiteral",
            "quasis": [
              "_",
              ""
            ],
            "types": [
              "string"
            ]
          }
        ]
      },
      "trueType": "never",
      "falseType": {
        "type": "condition",
        "checkType": {
          "type": "reference",
          "name": "NonNullable",
          "args": [
            {
              "type": "indexedAccess",
              "index": "K",
              "object": "C"
            }
          ]
        },
        "extendsType": "Function",
        "trueType": "never",
        "falseType": "K"
      }
    }
  }
}, ["C"]);
registerTypedef('ComponentOptionsOf', {
  "type": "reference",
  "name": "Partial",
  "args": [
    {
      "type": "reference",
      "name": "Pick",
      "args": [
        "C",
        {
          "type": "reference",
          "name": "Extract",
          "args": [
            {
              "type": "reference",
              "name": "ComponentOptionKeys",
              "args": [
                "C"
              ]
            },
            {
              "type": "keyof",
              "argument": "C"
            }
          ]
        }
      ]
    }
  ]
}, ["C"]);
registerTypedef('ComponentOptionsOverrides', {
  "type": "object",
  "properties": {
    "element": {
      "type": "object",
      "properties": {
        "anchor": {
          "type": "union",
          "members": [
            "Vec4",
            {
              "type": "array",
              "elementType": "number"
            }
          ],
          "optional": true
        },
        "margin": {
          "type": "union",
          "members": [
            "Vec4",
            {
              "type": "array",
              "elementType": "number"
            }
          ],
          "optional": true
        },
        "color": {
          "type": "union",
          "members": [
            "Color",
            {
              "type": "array",
              "elementType": "number"
            }
          ],
          "optional": true
        }
      },
      "optional": false
    }
  }
});
registerTypedef('ComponentOptionsOverridesOf', {
  "type": "condition",
  "checkType": "K",
  "extendsType": {
    "type": "keyof",
    "argument": "ComponentOptionsOverrides"
  },
  "trueType": {
    "type": "indexedAccess",
    "index": "K",
    "object": "ComponentOptionsOverrides"
  },
  "falseType": {
    "type": "object"
  }
}, ["K"]);
registerTypedef('MergedComponentOptions', {
  "type": "intersection",
  "members": [
    {
      "type": "reference",
      "name": "Omit",
      "args": [
        {
          "type": "reference",
          "name": "ComponentOptionsOf",
          "args": [
            {
              "type": "indexedAccess",
              "index": "K",
              "object": "ComponentMap"
            }
          ]
        },
        {
          "type": "keyof",
          "argument": {
            "type": "reference",
            "name": "ComponentOptionsOverridesOf",
            "args": [
              "K"
            ]
          }
        }
      ]
    },
    {
      "type": "reference",
      "name": "ComponentOptionsOverridesOf",
      "args": [
        "K"
      ]
    }
  ]
}, ["K"]);
registerTypedef('ComponentOptions', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": {
      "type": "reference",
      "name": "MergedComponentOptions",
      "args": [
        "K"
      ]
    }
  },
  "element": "P",
  "result": {
    "type": "indexedAccess",
    "index": "P",
    "object": {
      "type": "reference",
      "name": "MergedComponentOptions",
      "args": [
        "K"
      ]
    }
  }
}, ["K"]);

/**
 * Anchors replay: an element tower whose system overrides widen
 * anchor/margin (`Vec4 | number[]`) and color (`Color | number[]`) to
 * array literals, while alignment stays a bare `Vec2` with no override
 * (the engine's getter/setter split, which tsc also rejects). Dense
 * arrays satisfy the widened union members and a Color instance matches
 * nominally, so only the alignment call warns. Regression pin for the
 * report-rendering fix: the worker verdict is exactly one failure, and
 * the posted checker-side diagnosis carries exactly that row.
 * (`Component` is intentionally non-empty: tsc reads an empty base class
 * structurally, so every member would extend it.)
 */
class Component {
  constructor() {
    /** @type {boolean} */
    this.enabled = true;
  }
}
registerClass(Component);
registerTypedef('Component', {
  "type": "object",
  "properties": {
    "enabled": "boolean"
  }
});
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
class Vec2 {
  constructor() {
    this.x = 0;
    this.y = 0;
  }
}
registerClass(Vec2);
registerTypedef('Vec2', {
  "type": "object",
  "properties": {
    "x": "number",
    "y": "number"
  }
});
class Vec4 {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 0;
  }
}
registerClass(Vec4);
registerTypedef('Vec4', {
  "type": "object",
  "properties": {
    "x": "number",
    "y": "number",
    "z": "number",
    "w": "number"
  }
});
class ElementComponent extends Component {
  constructor() {
    super();
    /** @type {Vec4} */

    this._anchor = new Vec4();
    /** @type {Vec4} */

    this._margin = new Vec4();
    /** @type {Color} */

    this._color = new Color();
    /** @type {Vec2} */

    this._alignment = new Vec2();
  }
  
  /**
   * @type {Vec4}
   */

  get anchor() {
    return this._anchor;
  }
  
  /**
   * @param {Vec4 | number[]} value
   */

  set anchor(value) {
    this._anchor = value;
  }
  
  /**
   * @type {Vec4}
   */

  get margin() {
    return this._margin;
  }
  
  /**
   * @param {Vec4 | number[]} value
   */

  set margin(value) {
    this._margin = value;
  }
  
  /**
   * @type {Color}
   */

  get color() {
    return this._color;
  }
  
  /**
   * @param {Color | number[]} value
   */

  set color(value) {
    this._color = value;
  }
  
  /**
   * @type {Vec2}
   */

  get alignment() {
    return this._alignment;
  }
  
  /**
   * @param {Vec2 | number[]} value
   */

  set alignment(value) {
    this._alignment = value;
  }
}
registerClass(ElementComponent);
registerTypedef('ElementComponent', {
  "type": "object",
  "properties": {
    "anchor": "Vec4",
    "margin": "Vec4",
    "color": "Color",
    "alignment": "Vec2",
    "_anchor": "Vec4",
    "_margin": "Vec4",
    "_color": "Color",
    "_alignment": "Vec2"
  }
});
class Entity {
  constructor() {
    this.element = null;
    this.name = 'x';
  }
  
  /**
   * @type {ElementComponent|undefined}
   * @readonly
   */

  element;
  
  /**
   * @type {Object<string, Component>}
   */

  c = {};
  
  /**
   * @type {string}
   */

  name = 'x';
  
  /**
   * @template {ComponentName | (string & {})} K
   * @param {K} type
   * @param {K extends ComponentName ? ComponentOptions<K> : object} [data]
   * @returns {*} comp
   */

  addComponent(type, data) {
    const rtiTemplates = {
      "K": {
        "type": "union",
        "members": [
          "ComponentName",
          {
            "type": "intersection",
            "members": [
              "string",
              {
                "type": "object"
              }
            ]
          }
        ]
      }
    };
    if (!inspectTypeWithTemplates(type, "K", 'Entity#addComponent', 'type', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    if (!inspectTypeWithTemplates(data, {
      "type": "condition",
      "checkType": "K",
      "extendsType": "ComponentName",
      "trueType": {
        "type": "reference",
        "name": "ComponentOptions",
        "args": [
          "K"
        ]
      },
      "falseType": {
        "type": "object",
        "properties": {}
      },
      "optional": true
    }, 'Entity#addComponent', 'data', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    return [type, data];
  }
}
registerClass(Entity);
registerTypedef('Entity', {
  "type": "object",
  "properties": {
    "element": {
      "type": "union",
      "members": [
        "ElementComponent",
        "undefined"
      ],
      "readonly": true
    },
    "c": {
      "type": "record",
      "key": "string",
      "val": "Component"
    },
    "name": "string",
    "addComponent": "Function"
  }
});

/**
 * @typedef {{ [K in keyof Entity as NonNullable<Entity[K]> extends Component ? K : never]: NonNullable<Entity[K]> }} ComponentMap
 */


/**
 * @typedef {keyof ComponentMap & string} ComponentName
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
 * @template C
 * @typedef {{ [K in WritableKeys<C>]: K extends 'system' | 'entity' | `_${string}` ? never : NonNullable<C[K]> extends Function ? never : K }[WritableKeys<C>]} ComponentOptionKeys
 */


/**
 * @template C
 * @typedef {Partial<Pick<C, Extract<ComponentOptionKeys<C>, keyof C>>>} ComponentOptionsOf
 */


/**
 * @typedef {object} ComponentOptionsOverrides
 * @property {{ anchor?: Vec4 | number[], margin?: Vec4 | number[], color?: Color | number[] }} element
 */


/**
 * @template {ComponentName} K
 * @typedef {K extends keyof ComponentOptionsOverrides ? ComponentOptionsOverrides[K] : {}} ComponentOptionsOverridesOf
 */


/**
 * @template {ComponentName} K
 * @typedef {Omit<ComponentOptionsOf<ComponentMap[K]>, keyof ComponentOptionsOverridesOf<K>> & ComponentOptionsOverridesOf<K>} MergedComponentOptions
 */


/**
 * @template {ComponentName} K
 * @typedef {{ [P in keyof MergedComponentOptions<K>]: MergedComponentOptions<K>[P] }} ComponentOptions
 */


/**
 * @typedef {{ [K in keyof Entity as NonNullable<Entity[K]> extends Component ? K : never]: NonNullable<Entity[K]> }} ComponentMap
 */

/**
 * @typedef {keyof ComponentMap & string} ComponentName
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
 * @template C
 * @typedef {{ [K in WritableKeys<C>]: K extends 'system' | 'entity' | `_${string}` ? never : NonNullable<C[K]> extends Function ? never : K }[WritableKeys<C>]} ComponentOptionKeys
 */

/**
 * @template C
 * @typedef {Partial<Pick<C, Extract<ComponentOptionKeys<C>, keyof C>>>} ComponentOptionsOf
 */

/**
 * @typedef {object} ComponentOptionsOverrides
 * @property {{ anchor?: Vec4 | number[], margin?: Vec4 | number[], color?: Color | number[] }} element
 */

/**
 * @template {ComponentName} K
 * @typedef {K extends keyof ComponentOptionsOverrides ? ComponentOptionsOverrides[K] : {}} ComponentOptionsOverridesOf
 */

/**
 * @template {ComponentName} K
 * @typedef {Omit<ComponentOptionsOf<ComponentMap[K]>, keyof ComponentOptionsOverridesOf<K>> & ComponentOptionsOverridesOf<K>} MergedComponentOptions
 */

/**
 * @template {ComponentName} K
 * @typedef {{ [P in keyof MergedComponentOptions<K>]: MergedComponentOptions<K>[P] }} ComponentOptions
 */
const e = new Entity();
e.addComponent('element', {
  anchor: [0, 0, 1, 1],
  margin: [14, 12, 14, 12],
  color: new Color()
}); // ok

e.addComponent('element', {
  anchor: [0, 0, 1, 1],
  margin: [14, 12, 14, 12],
  color: new Color(),
  alignment: [0, 0]
}); // warns: alignment has no array override

