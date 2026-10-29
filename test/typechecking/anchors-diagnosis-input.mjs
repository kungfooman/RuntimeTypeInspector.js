/**
 * Anchors replay: an element tower whose system overrides widen
 * anchor/margin (`Vec4 | number[]`) and color (`Color | number[]`) to
 * array literals, while alignment stays a bare `Vec2` with no override
 * (the engine's getter/setter split, which tsc also rejects). Dense
 * arrays satisfy the widened union members and a Color instance matches
 * nominally, so only the alignment call warns. Regression pin for the
 * report-rendering fix: the worker verdict is exactly one failure, and
 * the posted checker-side diagnosis carries exactly that row.
 * (`Component` is intentionally non-empty: tsc reads an empty base class
 * structurally, so every member would extend it.)
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
class Vec2 {
  constructor() {
    this.x = 0;
    this.y = 0;
  }
}
class Vec4 {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 0;
  }
}
class ElementComponent extends Component {
  constructor() {
    super();
    /** @type {Vec4} */
    this._anchor = new Vec4();
    /** @type {Vec4} */
    this._margin = new Vec4();
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
    this._anchor = value;
  }
  /**
   * @type {Vec4}
   */
  get margin() {
    return this._margin;
  }
  /**
   * @param {Vec4 | number[]} value
   */
  set margin(value) {
    this._margin = value;
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
    this._color = value;
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
    this._alignment = value;
  }
}
class Entity {
  constructor() {
    this.element = null;
    this.name = 'x';
  }
  /**
   * @type {ElementComponent|undefined}
   * @readonly
   */
  element;
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
 * @property {{ anchor?: Vec4 | number[], margin?: Vec4 | number[], color?: Color | number[] }} element
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
e.addComponent('element', {anchor: [0, 0, 1, 1], margin: [14, 12, 14, 12], color: new Color()}); // ok
e.addComponent('element', {anchor: [0, 0, 1, 1], margin: [14, 12, 14, 12], color: new Color(), alignment: [0, 0]}); // warns: alignment has no array override
