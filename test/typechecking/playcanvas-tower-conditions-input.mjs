/**
 * Conditional tower over a noisy entity: record, array, method and primitive
 * members are not components, so `ComponentName` rejects them while the
 * `K extends ComponentName ? ... : object` dispatch keeps typing known
 * components.
 */
class Component {}
class Color {
  constructor() {
    this.r = 0.5;
    this.g = 0.6;
    this.b = 0.9;
    this.a = 1;
  }
}
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
}
class LightComponent extends Component {
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
addByName('camera');
addByName('light');
addByName('c');
addByName('tags');
addByName('name');
addByName('nope');
const e = new Entity();
e.addComponent('camera', {clearColor: new Color()});
e.addComponent('light', {intensity: 2});
e.addComponent('camera', {clearColor: 'x'});
