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
    },
    "camera": {
      "type": "object",
      "properties": {
        "clearColor": {
          "type": "union",
          "members": [
            "Color",
            {
              "type": "array",
              "elementType": "number"
            }
          ],
          "optional": true
        },
        "batchGroupId": {
          "type": "union",
          "members": [
            "number",
            "null"
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
 * Hostile component tower: every component family plus the exotic values
 * production throws at it. Dense arrays satisfy `Vec | number[]` unions,
 * class instances and tagged snapshots match nominally, `number | null`
 * takes both, frozen arrays pass (they are real arrays), and the unknown
 * component name falls through to the `object` false branch. What warns:
 * mistyped scalars, holes in arrays (RTI rejects sparse tails), typed
 * arrays (no `instanceof Array`), explicit null into non-nullable slots,
 * undefined into required data, unknown options, and wrong nominal tags.
 * Three deliberate divergences from tsc carry `// Expected:` notes: an
 * explicit null into an optional-without-`|null` slot and a frozen array
 * into `number[]` pass RTI but fail tsc-strict, while a sparse tail fails
 * RTI but passes tsc. (`Component` is intentionally non-empty: tsc reads
 * an empty base class structurally, so every member would extend it.)
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
class TintedVec4 extends Vec4 {
  constructor() {
    super();
    /** @type {number} */

    this.tint = 0;
  }
}
registerClass(TintedVec4);
registerTypedef('TintedVec4', {
  "type": "object",
  "properties": {
    "tint": "number"
  }
});
class ElementComponent extends Component {
  constructor() {
    super();
    /** @type {Vec4} */

    this._anchor = new Vec4();
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
    void value;
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
    void value;
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
    void value;
  }
}
registerClass(ElementComponent);
registerTypedef('ElementComponent', {
  "type": "object",
  "properties": {
    "anchor": "Vec4",
    "color": "Color",
    "alignment": "Vec2",
    "_anchor": "Vec4",
    "_color": "Color",
    "_alignment": "Vec2"
  }
});
class CameraComponent extends Component {
  constructor() {
    super();
    /** @type {Color} */

    this._clearColor = new Color();
    /** @type {number} */

    this._fov = 45;
  }
  
  /**
   * @type {Color}
   */

  get clearColor() {
    return this._clearColor;
  }
  
  /**
   * @param {Color | number[]} value
   */

  set clearColor(value) {
    void value;
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
    void value;
  }
}
registerClass(CameraComponent);
registerTypedef('CameraComponent', {
  "type": "object",
  "properties": {
    "clearColor": "Color",
    "fov": "number",
    "_clearColor": "Color",
    "_fov": "number"
  }
});
class LightComponent extends Component {
  constructor() {
    super();
    /** @type {number} */

    this._intensity = 1;
    /** @type {string} */

    this._shape = 'omni';
  }
  
  /**
   * @type {number}
   */

  get intensity() {
    return this._intensity;
  }
  
  /**
   * @param {number} value
   */

  set intensity(value) {
    void value;
  }
  
  /**
   * @type {string}
   */

  get shape() {
    return this._shape;
  }
  
  /**
   * @param {string} value
   */

  set shape(value) {
    void value;
  }
}
registerClass(LightComponent);
registerTypedef('LightComponent', {
  "type": "object",
  "properties": {
    "intensity": "number",
    "shape": "string",
    "_intensity": "number",
    "_shape": "string"
  }
});
class Entity {
  constructor() {
    this.element = undefined;
    this.camera = undefined;
    this.light = undefined;
    this.name = 'x';
  }
  
  /**
   * @type {ElementComponent|undefined}
   * @readonly
   */

  element;
  
  /**
   * @type {CameraComponent|undefined}
   * @readonly
   */

  camera;
  
  /**
   * @type {LightComponent|undefined}
   * @readonly
   */

  light;
  
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
    "camera": {
      "type": "union",
      "members": [
        "CameraComponent",
        "undefined"
      ],
      "readonly": true
    },
    "light": {
      "type": "union",
      "members": [
        "LightComponent",
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
 * @property {{ anchor?: Vec4 | number[], color?: Color | number[] }} element
 * @property {{ clearColor?: Color | number[], batchGroupId?: number | null }} camera
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
 * @property {{ anchor?: Vec4 | number[], color?: Color | number[] }} element
 * @property {{ clearColor?: Color | number[], batchGroupId?: number | null }} camera
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
// Dense arrays satisfy the widened unions; instances match nominally.

e.addComponent('element', {
  anchor: [0, 0, 1, 1],
  color: new Color()
}); // ok

e.addComponent('element', {
  anchor: new Vec4(),
  color: [0.5, 0.6, 0.9]
}); // ok

e.addComponent('element', {
  anchor: new TintedVec4()
}); // ok: subclass instances satisfy base slots

e.addComponent('camera', {
  clearColor: new Color(),
  fov: 60
}); // ok

e.addComponent('camera', {
  clearColor: [0.5, 0.6, 0.9, 1],
  batchGroupId: null
}); // ok

e.addComponent('camera', {
  batchGroupId: 3
}); // ok: nullable takes a number

e.addComponent('light', {
  intensity: 2,
  shape: 'spot'
}); // ok

// Unknown names fall through to the object false branch; dataless is fine.

 // ok

// Unknown names fall through to the object false branch; dataless is fine.
e.addComponent('nope', {
  anything: 1
}); // ok

e.addComponent('light'); // ok

// @ts-expect-error: alignment has no array override in the tower

 // ok

// @ts-expect-error: alignment has no array override in the tower
e.addComponent('element', {
  alignment: [0, 0]
});
// @ts-expect-error: anchor elements must be numbers

e.addComponent('element', {
  anchor: [0, 'x', 1, 1]
});
// @ts-expect-error: color must be a Color or an array

e.addComponent('element', {
  color: 'red'
});
// @ts-expect-error: fov must be a number

e.addComponent('camera', {
  fov: 'x'
});
// @ts-expect-error: intensity must be a number

e.addComponent('light', {
  intensity: 'x'
});
// @ts-expect-error: batchGroupId must be a number or null

e.addComponent('camera', {
  batchGroupId: 'x'
});
// Base options are Partial, so every slot is optional and explicit null

// passes optional slots (engine compat): same leniency as fov below.

// Expected: RTI passes explicit null into optional slots, tsc-strict rejects it.


// Base options are Partial, so every slot is optional and explicit null

// passes optional slots (engine compat): same leniency as fov below.

// Expected: RTI passes explicit null into optional slots, tsc-strict rejects it.
e.addComponent('light', {
  intensity: null
}); // ok

e.addComponent('light', undefined); // ok: dataless-equivalent, the wrapper is optional

// @ts-expect-error: unknown options never match

 // ok: dataless-equivalent, the wrapper is optional

// @ts-expect-error: unknown options never match
e.addComponent('camera', {
  fovv: 60
});
// @ts-expect-error: non-object data never matches the false branch

e.addComponent('nope', 42);
// @ts-expect-error: non-string names never infer

e.addComponent(42, {});
/** @type {number[]} */

const frozen = Object.freeze([0, 0, 1, 1]);
// Expected: frozen arrays pass RTI (real arrays) but tsc rejects readonly into number[].

e.addComponent('element', {
  anchor: frozen
});
/** @type {number[]} */

const sparse = [0, 0, 1, 1];
sparse.length = 6;
// Expected: holes fail RTI element checks while tsc accepts sparse arrays as number[].

e.addComponent('element', {
  anchor: sparse
});
// @ts-expect-error: typed arrays are no instanceof Array

e.addComponent('element', {
  anchor: new Float32Array([0, 0, 1, 1])
});
// Expected: explicit null passes optional slots (engine compat), tsc-strict rejects it.

e.addComponent('camera', {
  fov: null
});
