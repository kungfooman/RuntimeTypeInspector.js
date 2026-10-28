/**
 * Hostile component-tower parity: dense arrays, instances, snapshots and
 * nullable members validate identically under tsc and RTI; sparse tails,
 * frozen arrays and explicit null document their divergence direction.
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
    void value;
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
    void value;
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
    void value;
  }
}
class Entity {
  constructor() {
    this.element = undefined;
    this.name = 'x';
  }
  /**
   * @type {ElementComponent|undefined}
   * @readonly
   */
  element;
  /**
   * @type {string}
   */
  name = 'x';
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
 * @property {{ anchor?: Vec4 | number[], color?: Color | number[] }} element
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
 * @template {ComponentName | (string & {})} K
 * @param {K} type - Component name.
 * @param {K extends ComponentName ? ComponentOptions<K> : object} [data] - Options.
 * @returns {void}
 */
function case01(type, data) {
}
/**
 * @template {ComponentName | (string & {})} K
 * @param {K} type - Component name.
 * @param {K extends ComponentName ? ComponentOptions<K> : object} [data] - Options.
 * @returns {void}
 */
function case02(type, data) {
}
/**
 * @template {ComponentName | (string & {})} K
 * @param {K} type - Component name.
 * @param {K extends ComponentName ? ComponentOptions<K> : object} [data] - Options.
 * @returns {void}
 */
function case03(type, data) {
}
/**
 * @template {ComponentName | (string & {})} K
 * @param {K} type - Component name.
 * @param {K extends ComponentName ? ComponentOptions<K> : object} [data] - Options.
 * @returns {void}
 */
function case04(type, data) {
}
/**
 * @template {ComponentName | (string & {})} K
 * @param {K} type - Component name.
 * @param {K extends ComponentName ? ComponentOptions<K> : object} [data] - Options.
 * @returns {void}
 */
function case05(type, data) {
}
/**
 * @template {ComponentName | (string & {})} K
 * @param {K} type - Component name.
 * @param {K extends ComponentName ? ComponentOptions<K> : object} [data] - Options.
 * @returns {void}
 */
function case06(type, data) {
}
/**
 * @template {ComponentName | (string & {})} K
 * @param {K} type - Component name.
 * @param {K extends ComponentName ? ComponentOptions<K> : object} [data] - Options.
 * @returns {void}
 */
function case07(type, data) {
}
/**
 * @template {ComponentName | (string & {})} K
 * @param {K} type - Component name.
 * @param {K extends ComponentName ? ComponentOptions<K> : object} [data] - Options.
 * @returns {void}
 */
function case08(type, data) {
}
/** @type {number[]} */
const sparseAnchor = [0, 0, 1, 1];
sparseAnchor.length = 6;
case01('element', {anchor: [0, 0, 1, 1], color: new Color()});
case01('element', {anchor: new Vec4(), color: [0.5, 0.6, 0.9]});
case02('element', {alignment: [0, 0]});
case02('element', {anchor: [0, 'x', 1, 1]});
case02('element', {color: 'red'});
case03('nope', {anything: 1});
case03('nope', 42);
case03('light');
case04(42, {});
case05('element', {anchor: Object.freeze([0, 0, 1, 1])}); // parity-diverges: rti-quieter (frozen arrays pass RTI, tsc rejects readonly)
case06('element', {anchor: sparseAnchor}); // parity-diverges: rti-stricter (holes fail RTI, tsc accepts sparse arrays)
case07('element', {anchor: new Float32Array([0, 0, 1, 1])});
case08('element', {alignment: null}); // parity-diverges: rti-quieter (explicit null passes optional slots, tsc-strict rejects it)
