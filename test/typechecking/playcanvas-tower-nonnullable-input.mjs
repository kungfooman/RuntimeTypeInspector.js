/**
 * `NonNullable` key reads: `keyof NonNullable<Holder["camera"]>` denotes the
 * component keys, not the union member names, through single, doubled and
 * `| null` wrappers. A conditional map over a `| null` slot keeps working.
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
/**
 * @typedef {{ camera: CameraComponent|undefined, name: string }} Holder
 */
/**
 * @param {keyof NonNullable<Holder["camera"]>} prop
 */
function takeCameraProp(prop) {
  return prop;
}
takeCameraProp('clearColor');
takeCameraProp('fov');
takeCameraProp('CameraComponent');
takeCameraProp('name');
/**
 * @param {keyof NonNullable<NonNullable<Holder["camera"]>|null>} prop
 */
function takeDeepProp(prop) {
  return prop;
}
takeDeepProp('fov');
/**
 * @typedef {{ camera: CameraComponent|null, name: string }} NullHolder
 */
/**
 * @typedef {{ [K in keyof NullHolder as NonNullable<NullHolder[K]> extends Component ? K : never]: NonNullable<NullHolder[K]> }} NullMap
 */
/**
 * @param {keyof NullMap & string} name
 */
function takeNullName(name) {
  return name;
}
takeNullName('camera');
takeNullName('name');
/**
 * @param {keyof NullMap["camera"]} prop
 */
function takeNullProp(prop) {
  return prop;
}
takeNullProp('fov');
