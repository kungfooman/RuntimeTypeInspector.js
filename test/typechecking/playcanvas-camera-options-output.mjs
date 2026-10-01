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
    "camera": {
      "type": "object",
      "properties": {
        "calculateProjection": {
          "type": "Function",
          "optional": true
        },
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
 * Faithful engine replay: `ComponentOptions` tower over the real `Entity`
 * class (component slots plus record, array and method members), a
 * class-typed component property (`clearColor: Color`), `Partial`-based
 * base options, system overrides accepting arrays, and the conditional
 * `addComponent` data parameter. Passing a `Color` instance used to fail
 * with `validateIndexedAccess: unresolvable indexed access` and a spurious
 * `calculateProjection` complaint.
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
class CameraComponent extends Component {
  
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
}
registerClass(CameraComponent);
registerTypedef('CameraComponent', {
  "type": "object",
  "properties": {
    "clearColor": "Color",
    "fov": "number"
  }
});
class Entity {
  
  /**
   * @type {CameraComponent|undefined}
   * @readonly
   */
  camera;
  
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
    "camera": {
      "type": "union",
      "members": [
        "CameraComponent",
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
 * @property {{ calculateProjection?: Function, clearColor?: Color | number[] }} camera
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
 * @property {{ calculateProjection?: Function, clearColor?: Color | number[] }} camera
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
e.addComponent('camera', {
  clearColor: new Color()
}); // ok

e.addComponent('camera', {
  clearColor: [0.5, 0.6, 0.9, 1],
  fov: 60
}); // ok

e.addComponent('camera', {}); // ok: base and overrides are all optional

e.addComponent('camera', {
  clearColor: 'x'
}); // warns: clearColor must be Color or array

e.addComponent('camera', {
  fov: 'x'
}); // warns: fov must be number

e.addComponent('camera', {
  nope: 1
}); // warns: unknown option

