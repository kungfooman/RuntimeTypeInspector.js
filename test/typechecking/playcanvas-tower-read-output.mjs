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

/**
 * Read-path tower: `findComponent`/`findComponents` resolve through the
 * same conditional as the `addComponent` data parameter, so lookups keep
 * their component type when the result flows into the next checked call.
 * Unknown names fall back to the base `Component`. (`Component` is
 * intentionally non-empty: tsc reads an empty base class structurally, so
 * every member would extend it.)
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
class CameraComponent extends Component {
  constructor() {
    super();
    /** @type {number} */

    this._fov = 45;
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
    "fov": "number",
    "_fov": "number"
  }
});
class LightComponent extends Component {
  constructor() {
    super();
    /** @type {number} */

    this._intensity = 1;
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
    this._intensity = value;
  }
}
registerClass(LightComponent);
registerTypedef('LightComponent', {
  "type": "object",
  "properties": {
    "intensity": "number",
    "_intensity": "number"
  }
});
class Entity {
  constructor() {
    this.camera = undefined;
    this.light = undefined;
    this.name = 'x';
  }
  
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
   * @type {string}
   */

  name = 'x';
  
  /**
   * @template {ComponentName | (string & {})} K
   * @param {K} type
   * @returns {(K extends ComponentName ? ComponentMap[K] : Component) | null}
   */

  findComponent(type) {
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
    if (!inspectTypeWithTemplates(type, "K", 'Entity#findComponent', 'type', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    if (type === 'camera') {
      return /** @type {any} */ (new CameraComponent());
    }
    if (type === 'light') {
      return /** @type {any} */ (new LightComponent());
    }
    return /** @type {any} */ (new Component());
  }
  
  /**
   * @template {ComponentName | (string & {})} K
   * @param {K} type
   * @returns {(K extends ComponentName ? ComponentMap[K] : Component)[]}
   */

  findComponents(type) {
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
    if (!inspectTypeWithTemplates(type, "K", 'Entity#findComponents', 'type', rtiTemplates)) {
      youCanAddABreakpointHere();
    }
    if (type === 'camera') {
      return /** @type {any} */ ([new CameraComponent()]);
    }
    if (type === 'light') {
      return /** @type {any} */ ([new LightComponent()]);
    }
    return /** @type {any} */ ([new Component()]);
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
    "light": {
      "type": "union",
      "members": [
        "LightComponent",
        "undefined"
      ],
      "readonly": true
    },
    "name": "string",
    "findComponent": "Function",
    "findComponents": "Function"
  }
});

/**
 * @typedef {{ [K in keyof Entity as NonNullable<Entity[K]> extends Component ? K : never]: NonNullable<Entity[K]> }} ComponentMap
 */


/**
 * @typedef {keyof ComponentMap & string} ComponentName
 */


/**
 * @param {CameraComponent|null} cam
 */


/**
 * @typedef {{ [K in keyof Entity as NonNullable<Entity[K]> extends Component ? K : never]: NonNullable<Entity[K]> }} ComponentMap
 */

/**
 * @typedef {keyof ComponentMap & string} ComponentName
 */

/**
 * @param {CameraComponent|null} cam
 */
function takeCamera(cam) {
  if (!inspectType(cam, {
    "type": "union",
    "members": [
      "CameraComponent",
      "null"
    ],
    "optional": false
  }, 'takeCamera', 'cam')) {
    youCanAddABreakpointHere();
  }
  return cam;
}

/**
 * @param {Component} comp
 */

function takeComponent(comp) {
  if (!inspectType(comp, "Component", 'takeComponent', 'comp')) {
    youCanAddABreakpointHere();
  }
  return comp;
}

/**
 * @param {CameraComponent[]} cams
 */

function takeCameras(cams) {
  if (!inspectType(cams, {
    "type": "array",
    "elementType": "CameraComponent",
    "optional": false
  }, 'takeCameras', 'cams')) {
    youCanAddABreakpointHere();
  }
  return cams;
}
const e = new Entity();
takeCamera(e.findComponent('camera')); // ok: lookup resolves to the component

// Expected: the live lookup never returns null here, so RTI passes the

// instance while tsc rejects the declared `| null`.

 // ok: lookup resolves to the component

// Expected: the live lookup never returns null here, so RTI passes the

// instance while tsc rejects the declared `| null`.
takeComponent(e.findComponent('nope')); // ok

takeCameras(e.findComponents('camera')); // ok: arrays of the mapped component

// @ts-expect-error: a single component is no array of them

 // ok: arrays of the mapped component

// @ts-expect-error: a single component is no array of them
takeCameras(e.findComponent('camera'));
// @ts-expect-error: lights are no cameras

takeCamera(e.findComponent('light'));
// @ts-expect-error: unknown names are no cameras

takeCamera(e.findComponent('nope'));
