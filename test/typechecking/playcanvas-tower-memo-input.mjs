/**
 * Repeated `addComponent` checks with the same component name must share the
 * resolved options shape instead of rebuilding it per call (the scroll-view
 * example spent 161 s resolving the same options tower 260 times). Repeats
 * with good values stay quiet, repeats with bad values still throw, and
 * alternating names never mix their shapes. Every throwing call carries
 * `@ts-expect-error`, so a tsc-strict run is green if and only if each
 * directive is consumed and nothing else errors; `*-errors.json` pins the
 * same sequence for RTI. (`Component` is intentionally non-empty: tsc reads
 * an empty base class structurally, so every member would extend it.)
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
const e = new Entity();
e.addComponent('camera', {clearColor: new Color()});
e.addComponent('camera', {clearColor: new Color()});
// @ts-expect-error: repeat with a bad value still throws
e.addComponent('camera', {clearColor: 'x'});
e.addComponent('light', {intensity: 2});
// @ts-expect-error: wrong type for the other name
e.addComponent('light', {intensity: 'x'});
e.addComponent('camera', {clearColor: new Color()});
e.addComponent('camera');
