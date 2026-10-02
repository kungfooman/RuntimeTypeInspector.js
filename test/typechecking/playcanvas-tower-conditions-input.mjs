/**
 * Conditional tower over a noisy entity: record, array, method and primitive
 * members are not components, so `ComponentName` rejects them while the
 * `K extends ComponentName ? ... : object` dispatch keeps typing known
 * components. (`Component` is intentionally non-empty: tsc reads an empty
 * base class structurally, so every member would extend it.)
 */
class Component {
  constructor() {
    /** @type {boolean} */
    this.enabled = true;
  }
}
class Color {
  constructor() {
    this.r = 0.5;
    this.g = 0.6;
    this.b = 0.9;
    this.a = 1;
  }
}
class CameraComponent extends Component {
  constructor() {
    super();
    /** @type {Color} */
    this._clearColor = new Color();
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
   * @type {Array<string>}
   */
  tags = [];
  /**
   * @type {string}
   */
  name = 'x';
  /**
   * @template {ComponentName | (string & {})} K
   * @param {K} type
   * @param {K extends ComponentName ? OptionsByName[K] : object} [data]
   * @returns {*} comp
   */
  addComponent(type, data) {
    return [type, data];
  }
}
/**
 * @typedef {{ [K in keyof Entity as NonNullable<Entity[K]> extends Component ? K : never]: NonNullable<Entity[K]> }} ComponentMap
 */
/**
 * @typedef {keyof ComponentMap & string} ComponentName
 */
/**
 * @typedef {{ camera: { clearColor: Color }, light: { intensity: number } }} OptionsByName
 */
/**
 * @param {ComponentName} name
 */
function addByName(name) {
  return name;
}
addByName('camera'); // Expected: no issue
addByName('light'); // Expected: no issue
addByName('c'); // Expected: error — a record, not a component
addByName('tags'); // Expected: error — an array, not a component
addByName('name'); // Expected: error — not a component
addByName('nope'); // Expected: error — unknown component
const e = new Entity();
e.addComponent('camera', {clearColor: new Color()}); // Expected: no issue
e.addComponent('light', {intensity: 2}); // Expected: no issue
e.addComponent('camera', {clearColor: 'x'}); // Expected: error — clearColor must be a Color
