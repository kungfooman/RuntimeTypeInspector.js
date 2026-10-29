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
    if (type === 'camera') {
      return /** @type {any} */ ([new CameraComponent()]);
    }
    if (type === 'light') {
      return /** @type {any} */ ([new LightComponent()]);
    }
    return /** @type {any} */ ([new Component()]);
  }
}
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
  return cam;
}
/**
 * @param {Component} comp
 */
function takeComponent(comp) {
  return comp;
}
/**
 * @param {CameraComponent[]} cams
 */
function takeCameras(cams) {
  return cams;
}
const e = new Entity();
takeCamera(e.findComponent('camera')); // ok: lookup resolves to the component
// Expected: the live lookup never returns null here, so RTI passes the
// instance while tsc rejects the declared `| null`.
takeComponent(e.findComponent('nope')); // ok
takeCameras(e.findComponents('camera')); // ok: arrays of the mapped component
// @ts-expect-error: a single component is no array of them
takeCameras(e.findComponent('camera'));
// @ts-expect-error: lights are no cameras
takeCamera(e.findComponent('light'));
// @ts-expect-error: unknown names are no cameras
takeCamera(e.findComponent('nope'));
