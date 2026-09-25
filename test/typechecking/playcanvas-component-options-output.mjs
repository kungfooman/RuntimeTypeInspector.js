registerTypedef('EntityShape', {
  "type": "object",
  "properties": {
    "camera": "CameraComponent",
    "light": "LightComponent",
    "name": "string"
  }
});
registerTypedef('ComponentMap', {
  "type": "mapping",
  "iterable": {
    "type": "keyof",
    "argument": "EntityShape"
  },
  "element": "K",
  "result": {
    "type": "reference",
    "name": "NonNullable",
    "args": [
      {
        "type": "indexedAccess",
        "index": "K",
        "object": "EntityShape"
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
          "object": "EntityShape"
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
}, ["C"]);
registerTypedef('ComponentOptionsOverrides', {
  "type": "object",
  "properties": {
    "camera": {
      "type": "object",
      "properties": {
        "fov": {
          "type": "number",
          "optional": true
        }
      }
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
 * Stripped engine classes: only the inheritance chain and the component
 * slots matter here. Property maps come from harvested class shapes, which
 * the Asserter registers next to each class.
 */
class Component {

}
registerClass(Component);
class CameraComponent extends Component {
  constructor() {
    super();
    /** @type {Array<number>} */

    this.clearColor = [0, 0, 0, 1];
  }
}
registerClass(CameraComponent);
registerTypedef('CameraComponent', {
  "type": "object",
  "properties": {
    "clearColor": {
      "type": "array",
      "elementType": "number"
    }
  }
});
class LightComponent extends Component {
  constructor() {
    super();
    this.intensity = 1;
  }
}
registerClass(LightComponent);
registerTypedef('LightComponent', {
  "type": "object",
  "properties": {
    "intensity": "number"
  }
});
class Entity {
  constructor() {
    this.camera = null;
    this.light = null;
  }
  
  /**
   * @template {ComponentName} K
   * @param {K} name
   * @param {ComponentOptions<K>} options
   */

  addComponent(name, options) {
    const rtiTemplates = {
      "K": "ComponentName"
    };
    if (!inspectTypeWithTemplates(name, "K", 'Entity#addComponent', 'name', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    if (!inspectTypeWithTemplates(options, {
      "type": "reference",
      "name": "ComponentOptions",
      "args": [
        "K"
      ],
      "optional": false
    }, 'Entity#addComponent', 'options', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    return [name, options];
  }
}
registerClass(Entity);
registerTypedef('Entity', {
  "type": "object",
  "properties": {
    "addComponent": "Function"
  }
});

/**
 * Minimal stand-in for the component slots on the engine's Entity: which
 * names map to which component classes. The classes above supply the
 * property maps through their harvested shapes.
 *
 * @typedef {{ camera: CameraComponent, light: LightComponent, name: string }} EntityShape
 */


/**
 * The components an {@link Entity} can hold, keyed by name.
 *
 * @typedef {{ [K in keyof EntityShape as NonNullable<EntityShape[K]> extends Component ? K : never]: NonNullable<EntityShape[K]> }} ComponentMap
 */


/**
 * The name of a component, spelled with `& string` on purpose like in the engine.
 *
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
 * The names of the writable properties of `T`.
 *
 * @template T
 * @typedef {{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T]} WritableKeys
 */


/**
 * The names of the properties of component class `C` that
 * {@link Entity#addComponent} accepts as options based on the class alone.
 *
 * @template C
 * @typedef {{ [K in WritableKeys<C>]: K extends 'system' | 'entity' | `_${string}` ? never : NonNullable<C[K]> extends Function ? never : K }[WritableKeys<C>]} ComponentOptionKeys
 */


/**
 * The options derived from component class `C` alone. Base properties stay
 * required so missing options warn; system-level overrides add optionals.
 *
 * @template C
 * @typedef {Pick<C, Extract<ComponentOptionKeys<C>, keyof C>>} ComponentOptionsOf
 */


/**
 * Minimal stand-in for the engine-internal overrides registry: one extra
 * optional property for the camera only, so the merge path is exercised.
 *
 * @typedef {{ camera: { fov?: number } }} ComponentOptionsOverrides
 */


/**
 * @template {ComponentName} K
 * @typedef {K extends keyof ComponentOptionsOverrides ? ComponentOptionsOverrides[K] : {}} ComponentOptionsOverridesOf
 */


/**
 * The options of the component named `K`, merged from its component class
 * with the system-level overrides replacing same-named properties.
 *
 * @template {ComponentName} K
 * @typedef {Omit<ComponentOptionsOf<ComponentMap[K]>, keyof ComponentOptionsOverridesOf<K>> & ComponentOptionsOverridesOf<K>} MergedComponentOptions
 */


/**
 * The options {@link Entity#addComponent} accepts for the component named `K`.
 *
 * @template {ComponentName} K
 * @typedef {{ [P in keyof MergedComponentOptions<K>]: MergedComponentOptions<K>[P] }} ComponentOptions
 */


/**
 * @template {ComponentName} K
 * @param {K} name
 * @param {ComponentOptions<K>} options
 */


/**
 * Minimal stand-in for the component slots on the engine's Entity: which
 * names map to which component classes. The classes above supply the
 * property maps through their harvested shapes.
 *
 * @typedef {{ camera: CameraComponent, light: LightComponent, name: string }} EntityShape
 */

/**
 * The components an {@link Entity} can hold, keyed by name.
 *
 * @typedef {{ [K in keyof EntityShape as NonNullable<EntityShape[K]> extends Component ? K : never]: NonNullable<EntityShape[K]> }} ComponentMap
 */

/**
 * The name of a component, spelled with `& string` on purpose like in the engine.
 *
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
 * The names of the writable properties of `T`.
 *
 * @template T
 * @typedef {{ [P in keyof T]-?: IfEquals<{ [Q in P]: T[P] }, { -readonly [Q in P]: T[P] }, P> }[keyof T]} WritableKeys
 */

/**
 * The names of the properties of component class `C` that
 * {@link Entity#addComponent} accepts as options based on the class alone.
 *
 * @template C
 * @typedef {{ [K in WritableKeys<C>]: K extends 'system' | 'entity' | `_${string}` ? never : NonNullable<C[K]> extends Function ? never : K }[WritableKeys<C>]} ComponentOptionKeys
 */

/**
 * The options derived from component class `C` alone. Base properties stay
 * required so missing options warn; system-level overrides add optionals.
 *
 * @template C
 * @typedef {Pick<C, Extract<ComponentOptionKeys<C>, keyof C>>} ComponentOptionsOf
 */

/**
 * Minimal stand-in for the engine-internal overrides registry: one extra
 * optional property for the camera only, so the merge path is exercised.
 *
 * @typedef {{ camera: { fov?: number } }} ComponentOptionsOverrides
 */

/**
 * @template {ComponentName} K
 * @typedef {K extends keyof ComponentOptionsOverrides ? ComponentOptionsOverrides[K] : {}} ComponentOptionsOverridesOf
 */

/**
 * The options of the component named `K`, merged from its component class
 * with the system-level overrides replacing same-named properties.
 *
 * @template {ComponentName} K
 * @typedef {Omit<ComponentOptionsOf<ComponentMap[K]>, keyof ComponentOptionsOverridesOf<K>> & ComponentOptionsOverridesOf<K>} MergedComponentOptions
 */

/**
 * The options {@link Entity#addComponent} accepts for the component named `K`.
 *
 * @template {ComponentName} K
 * @typedef {{ [P in keyof MergedComponentOptions<K>]: MergedComponentOptions<K>[P] }} ComponentOptions
 */

/**
 * @template {ComponentName} K
 * @param {K} name
 * @param {ComponentOptions<K>} options
 */
function takeOptions(name, options) {
  const rtiTemplates = {
    "K": "ComponentName"
  };
  if (!inspectTypeWithTemplates(name, "K", 'takeOptions', 'name', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  if (!inspectTypeWithTemplates(options, {
    "type": "reference",
    "name": "ComponentOptions",
    "args": [
      "K"
    ],
    "optional": false
  }, 'takeOptions', 'options', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  return [name, options];
}
new Entity().addComponent("camera", {
  clearColor: [0, 0, 0, 1]
}); // ok

new Entity().addComponent("camera", {
  clearColor: "x"
}); // warns: clearColor must be array

new Entity().addComponent("nope", {}); // warns: unknown component name

new Entity().addComponent("light", {
  intensity: 1
}); // ok

new Entity().addComponent("light", {
  intensity: "x"
}); // warns: intensity must be number

new Entity().addComponent("camera", {
  fov: 60
}); // warns: missing required clearColor

takeOptions("camera", {
  clearColor: [0, 0, 0, 1]
}); // ok

takeOptions("camera", {
  clearColor: [0, 0, 0, 1],
  fov: 60
}); // ok: override merged in

takeOptions("camera", {}); // warns: missing required clearColor


/**
 * Engine-shaped conditional data param (reported bug replay): `K extends
 * ComponentName ? ComponentOptions<K> : object` used to decide undecidable
 * and fail every call with data closed, because `extendsCheck` knew unions
 * but neither intersections (`keyof ComponentMap & string`) nor `keyof`.
 *
 * @template {ComponentName | (string & {})} K
 * @param {K} type
 * @param {K extends ComponentName ? ComponentOptions<K> : object} [data]
 */

function addComponentConditional(type, data) {
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
              "type": "object",
              "properties": {}
            }
          ]
        }
      ]
    }
  };
  if (!inspectTypeWithTemplates(type, "K", 'addComponentConditional', 'type', rtiTemplates)) {
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
  }, 'addComponentConditional', 'data', rtiTemplates)) {
    youCanAddABreakpointHere();
  }
  return [type, data];
}
addComponentConditional("camera", {
  clearColor: [0, 0, 0, 1]
}); // ok (warned before fix)

addComponentConditional("camera", {
  clearColor: [0, 0, 0, 1],
  fov: 60
}); // ok

addComponentConditional("camera", {
  clearColor: "x"
}); // warns: clearColor must be array

addComponentConditional("light"); // ok: dataless call skips the condition

addComponentConditional("light", {
  intensity: 1
}); // ok

