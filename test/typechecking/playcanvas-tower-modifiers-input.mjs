/**
 * Modifier identity tower: `WritableKeys` has to keep class-typed, aliased,
 * union and array properties (the `-readonly` comparison must see the same
 * spelling on both sides), while getter-only properties stay out. `-?`
 * keeps base options required.
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
/**
 * @typedef {Color} Tint
 */
class CameraComponent extends Component {
  constructor() {
    super();
    /** @type {Color} */
    this._clearColor = new Color();
    /** @type {Tint} */
    this._tint = new Color();
    /** @type {Color|number[]} */
    this._blend = [0, 0, 0, 1];
    /** @type {number} */
    this._fov = 45;
    /** @type {string} */
    this._label = 'camera';
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
  /**
   * @type {Tint}
   */
  get tint() {
    return this._tint;
  }
  /**
   * @param {Tint} value
   */
  set tint(value) {
    this._tint = value;
  }
  /**
   * @type {Color|number[]}
   */
  get blend() {
    return this._blend;
  }
  /**
   * @param {Color|number[]} value
   */
  set blend(value) {
    this._blend = value;
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
  /**
   * @type {string}
   */
  get label() {
    return this._label;
  }
}
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
 * @param {WritableKeys<CameraComponent>} key
 */
function takeCameraKey(key) {
  return key;
}
takeCameraKey('clearColor'); // Expected: no issue — writable class-typed prop is a key
takeCameraKey('tint'); // Expected: no issue — aliased class type is a key
takeCameraKey('blend'); // Expected: no issue — union prop is a key
takeCameraKey('fov'); // Expected: no issue
takeCameraKey('label'); // Expected: error — getter-only props aren't writable keys
takeCameraKey('nope'); // Expected: error — unknown key
/**
 * @typedef {{ a: number, b: string }} Box
 */
/**
 * @typedef {{ [K in keyof Box]-?: Box[K] }} ReqBox
 */
/**
 * @param {ReqBox} opts
 */
function takeRequired(opts) {
  return opts;
}
takeRequired({a: 1, b: 's'}); // Expected: no issue
takeRequired({}); // Expected: error — 'a' and 'b' are required
takeRequired({a: 1}); // Expected: error — 'b' is required
