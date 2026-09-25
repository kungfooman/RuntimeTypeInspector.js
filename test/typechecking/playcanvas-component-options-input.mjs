/**
 * Stripped engine classes: only the inheritance chain and the component
 * slots matter here. Property maps come from harvested class shapes, which
 * the Asserter registers next to each class.
 */
class Component {}
class CameraComponent extends Component {
  constructor() {
    super();
    /** @type {Array<number>} */
    this.clearColor = [0, 0, 0, 1];
  }
}
class LightComponent extends Component {
  constructor() {
    super();
    this.intensity = 1;
  }
}
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
    return [name, options];
  }
}
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
  return [name, options];
}
new Entity().addComponent("camera", {clearColor: [0, 0, 0, 1]}); // ok
new Entity().addComponent("camera", {clearColor: "x"}); // warns: clearColor must be array
new Entity().addComponent("nope", {}); // warns: unknown component name
new Entity().addComponent("light", {intensity: 1}); // ok
new Entity().addComponent("light", {intensity: "x"}); // warns: intensity must be number
new Entity().addComponent("camera", {fov: 60}); // warns: missing required clearColor
takeOptions("camera", {clearColor: [0, 0, 0, 1]}); // ok
takeOptions("camera", {clearColor: [0, 0, 0, 1], fov: 60}); // ok: override merged in
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
  return [type, data];
}
addComponentConditional("camera", {clearColor: [0, 0, 0, 1]}); // ok (warned before fix)
addComponentConditional("camera", {clearColor: [0, 0, 0, 1], fov: 60}); // ok
addComponentConditional("camera", {clearColor: "x"}); // warns: clearColor must be array
addComponentConditional("light"); // ok: dataless call skips the condition
addComponentConditional("light", {intensity: 1}); // ok
