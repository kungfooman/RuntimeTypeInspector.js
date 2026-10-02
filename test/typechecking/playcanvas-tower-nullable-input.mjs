/**
 * Nullable-tower edge cases that must behave IDENTICALLY with
 * strictNullChecks on and off (and in RTI, which has no lax mode):
 * `NonNullable` idempotence and precision, conditional distribution over
 * concrete unions, mapped filtering over nullable slots, and keyof never
 * leaking member names. Every throwing call carries `@ts-expect-error`,
 * so a tsc-strict run is green if and only if each directive is consumed
 * and nothing else errors; `*-errors.json` pins the same sequence for
 * RTI. Bare calls must stay silent everywhere.
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
    /** @type {number} */
    this._fov = 45;
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
// 1b. NonNullable around the union is stable in every mode.
/**
 * @typedef {CameraComponent|null} MaybeCamera
 */
/**
 * @typedef {NonNullable<MaybeCamera> extends Component ? "component" : "not-component"} NonNullableMaybeCameraTest
 */
/**
 * @param {NonNullableMaybeCameraTest} value
 */
function acceptNonNullableMaybeCameraResult(value) {
  return value;
}
acceptNonNullableMaybeCameraResult('component');
// 4. Double NonNullable is idempotent.
/**
 * @typedef {NonNullable<NonNullable<CameraComponent|null>|undefined>} DoubleNonNullable
 */
/**
 * @param {keyof DoubleNonNullable} prop
 */
function takeDoubleNonNullableProp(prop) {
  return prop;
}
takeDoubleNonNullableProp('clearColor');
takeDoubleNonNullableProp('fov');
// 'name' is not a camera key.
// @ts-expect-error
takeDoubleNonNullableProp('name');
// 5. NonNullable strips every nullish member, not just the first.
/**
 * @typedef {CameraComponent|null|undefined} TripleNullable
 */
/**
 * @typedef {NonNullable<TripleNullable>} TripleNullableStripped
 */
/**
 * @param {keyof TripleNullableStripped} prop
 */
function takeTripleNullableProp(prop) {
  return prop;
}
takeTripleNullableProp('clearColor');
takeTripleNullableProp('fov');
// 'name' is not a camera key.
// @ts-expect-error
takeTripleNullableProp('name');
// 6. NonNullable removes only null/undefined: false, 0 and "" survive,
// so the whole union still does not extend Component.
/**
 * @typedef {CameraComponent|false|0|""|null|undefined} MixedUnion
 */
/**
 * @typedef {NonNullable<MixedUnion>} MixedUnionStripped
 */
/**
 * @param {MixedUnionStripped extends Component ? "yes" : "no"} value
 */
function acceptMixedUnionResult(value) {
  return value;
}
acceptMixedUnionResult('no');
// 7. A union where only one branch is a Component is not one: catches
// "any member extends" behavior in conditional checks.
/**
 * @typedef {CameraComponent|Color} ComponentUnion
 */
/**
 * @typedef {ComponentUnion extends Component ? "yes" : "no"} ComponentUnionTest
 */
/**
 * @param {ComponentUnionTest} value
 */
function acceptComponentUnionTest(value) {
  return value;
}
acceptComponentUnionTest('no');
// 10. Nullable property extraction followed by NonNullable.
/**
 * @typedef {{
 *   camera: CameraComponent|null,
 *   backupCamera: CameraComponent|undefined,
 *   empty: null,
 *   missing: undefined
 * }} CameraSlots
 */
/**
 * @param {keyof NonNullable<CameraSlots["camera"]>} prop
 */
function takeCameraSlotProp(prop) {
  return prop;
}
takeCameraSlotProp('clearColor');
takeCameraSlotProp('fov');
// 'name' is not a camera key.
// @ts-expect-error
takeCameraSlotProp('name');
// 11. NonNullable on a definitely-null property becomes never. No calls:
// there is no value of that type to pass.
/**
 * @typedef {{ value: null }} OnlyNull
 */
/**
 * @typedef {NonNullable<OnlyNull["value"]>} RemovedEverything
 */
/**
 * @param {keyof RemovedEverything} prop
 */
function takeRemovedEverything(prop) {
  return prop;
}
// 12. Same for a definitely-undefined property.
/**
 * @typedef {{ value: undefined }} OnlyUndefined
 */
/**
 * @typedef {NonNullable<OnlyUndefined["value"]>} RemovedUndefined
 */
/**
 * @param {keyof RemovedUndefined} prop
 */
function takeRemovedUndefined(prop) {
  return prop;
}
// 13. Nested nullable object property, stripped level by level.
/**
 * @typedef {{
 *   camera: {
 *     component: CameraComponent|null
 *   }|null
 * }} NestedHolder
 */
/**
 * @typedef {NonNullable<NestedHolder["camera"]>} NestedCamera
 */
/**
 * @typedef {NonNullable<NestedCamera["component"]>} NestedComponent
 */
/**
 * @param {keyof NestedComponent} prop
 */
function takeNestedComponentProp(prop) {
  return prop;
}
takeNestedComponentProp('clearColor');
takeNestedComponentProp('fov');
// 'name' is not a camera key.
// @ts-expect-error
takeNestedComponentProp('name');
// 14. Deep nesting with null introduced at every level.
/**
 * @typedef {{
 *   camera: ({
 *     component: (CameraComponent|null)|undefined
 *   }|null)|undefined
 * }} DeepNullableHolder
 */
/**
 * @typedef {NonNullable<
 *   NonNullable<
 *     DeepNullableHolder["camera"]
 *   >["component"]
 * >} DeepCameraComponent
 */
/**
 * @param {keyof DeepCameraComponent} prop
 */
function takeDeepCameraProp(prop) {
  return prop;
}
takeDeepCameraProp('clearColor');
takeDeepCameraProp('fov');
// 'name' is not a camera key.
// @ts-expect-error
takeDeepCameraProp('name');
// 15. Mapped filtering keeps optional slots; the value is NonNullable.
/**
 * @typedef {{
 *   camera: CameraComponent|null,
 *   name: string|null,
 *   optionalCamera?: CameraComponent
 * }} OptionalNullMapSource
 */
/**
 * @typedef {{
 *   [K in keyof OptionalNullMapSource
 *     as NonNullable<OptionalNullMapSource[K]> extends Component ? K : never]:
 *     NonNullable<OptionalNullMapSource[K]>
 * }} OptionalNullMap
 */
/**
 * @param {keyof OptionalNullMap & string} name
 */
function takeOptionalNullName(name) {
  return name;
}
takeOptionalNullName('camera');
takeOptionalNullName('optionalCamera');
// 'name' is a string slot, not a component.
// @ts-expect-error
takeOptionalNullName('name');
// 16. Optional property through NonNullable key reads.
/**
 * @typedef {{
 *   camera?: CameraComponent
 * }} OptionalCamera
 */
/**
 * @typedef {OptionalCamera["camera"]} OptionalCameraValue
 */
/**
 * @typedef {NonNullable<OptionalCameraValue>} OptionalCameraNonNull
 */
/**
 * @param {keyof OptionalCameraNonNull} prop
 */
function takeOptionalCameraProp(prop) {
  return prop;
}
takeOptionalCameraProp('clearColor');
takeOptionalCameraProp('fov');
// 18. Required nullable and optional component slots both survive.
/**
 * @typedef {{
 *   required: CameraComponent|null,
 *   optional?: CameraComponent
 * }} RequiredAndOptional
 */
/**
 * @typedef {{
 *   [K in keyof RequiredAndOptional
 *     as NonNullable<RequiredAndOptional[K]> extends Component ? K : never]:
 *     NonNullable<RequiredAndOptional[K]>
 * }} RequiredAndOptionalMap
 */
/**
 * @param {keyof RequiredAndOptionalMap & string} name
 */
function takeRequiredOptionalName(name) {
  return name;
}
takeRequiredOptionalName('required');
takeRequiredOptionalName('optional');
// 19. keyof after NonNullable exposes instance members only.
/**
 * @typedef {NonNullable<CameraComponent|null>} CameraInstance
 */
/**
 * @param {keyof CameraInstance} key
 */
function takeInstanceKey(key) {
  return key;
}
takeInstanceKey('clearColor');
takeInstanceKey('fov');
// A type name is not a key.
// @ts-expect-error
takeInstanceKey('CameraComponent');
// 'name' is not a camera key.
// @ts-expect-error
takeInstanceKey('name');
// 21. Instance intersection with null strips to the instance keys.
/**
 * @typedef {(CameraComponent & {})|null} IntersectedNullable
 */
/**
 * @typedef {NonNullable<IntersectedNullable>} IntersectedNonNull
 */
/**
 * @param {keyof IntersectedNonNull} prop
 */
function takeIntersectedProp(prop) {
  return prop;
}
takeIntersectedProp('clearColor');
takeIntersectedProp('fov');
// 22. Parenthesization of nullable unions is transparent.
/**
 * @typedef {((CameraComponent|null)|undefined)} ParenthesizedNullable
 */
/**
 * @typedef {NonNullable<ParenthesizedNullable>} ParenthesizedNonNull
 */
/**
 * @param {keyof ParenthesizedNonNull} prop
 */
function takeParenthesizedProp(prop) {
  return prop;
}
takeParenthesizedProp('clearColor');
takeParenthesizedProp('fov');
// 24. NonNullable stays idempotent after a mapped type.
/**
 * @typedef {{
 *   camera: CameraComponent|null
 * }} OneCameraMap
 */
/**
 * @typedef {NonNullable<OneCameraMap["camera"]>} FirstStrip
 */
/**
 * @typedef {NonNullable<FirstStrip>} SecondStrip
 */
/**
 * @param {keyof SecondStrip} prop
 */
function takeSecondStripProp(prop) {
  return prop;
}
takeSecondStripProp('clearColor');
takeSecondStripProp('fov');
// 25. Union of nullable component slots, including a base-class slot.
/**
 * @typedef {{
 *   camera: CameraComponent|null,
 *   other: Component|null
 * }} MultipleComponents
 */
/**
 * @typedef {{
 *   [K in keyof MultipleComponents
 *     as NonNullable<MultipleComponents[K]> extends Component ? K : never]:
 *     NonNullable<MultipleComponents[K]>
 * }} MultipleComponentsMap
 */
/**
 * @param {keyof MultipleComponentsMap & string} name
 */
function takeMultipleComponentName(name) {
  return name;
}
takeMultipleComponentName('camera');
takeMultipleComponentName('other');
// Unknown slot.
// @ts-expect-error
takeMultipleComponentName('missing');
// 26. A union where only one branch is a Component is not one.
/**
 * @typedef {CameraComponent|string|null} MixedComponentString
 */
/**
 * @typedef {MixedComponentString extends Component ? "yes" : "no"} MixedComponentStringTest
 */
/**
 * @param {MixedComponentStringTest} value
 */
function acceptMixedComponentStringTest(value) {
  return value;
}
acceptMixedComponentStringTest('no');
// 27. Manual null/undefined union check agrees with NonNullable.
/**
 * @typedef {CameraComponent|null|undefined} ManualNullable
 */
/**
 * @typedef {ManualNullable extends null|undefined ? "empty" : "nonempty"} ManualNullCheck
 */
/**
 * @typedef {NonNullable<ManualNullable> extends CameraComponent ? "camera" : "other"} EquivalentNonNullCheck
 */
/**
 * @param {ManualNullCheck} value
 */
function acceptManualNullCheck(value) {
  return value;
}
/**
 * @param {EquivalentNonNullCheck} value
 */
function acceptEquivalentNonNullCheck(value) {
  return value;
}
acceptManualNullCheck('nonempty');
acceptEquivalentNonNullCheck('camera');
// 29. Property access through a nullable indexed access.
/**
 * @typedef {{
 *   holder: Holder|null
 * }} WrappedHolder
 */
/**
 * @typedef {NonNullable<WrappedHolder["holder"]>["camera"]} WrappedCamera
 */
/**
 * @typedef {NonNullable<WrappedCamera>} WrappedCameraNonNull
 */
/**
 * @param {keyof WrappedCameraNonNull} prop
 */
function takeWrappedCameraProp(prop) {
  return prop;
}
takeWrappedCameraProp('clearColor');
takeWrappedCameraProp('fov');
// 30. Class name, property name and instance property stay distinct.
/**
 * @param {keyof CameraComponent} key
 */
function takeOnlyActualCameraKeys(key) {
  return key;
}
takeOnlyActualCameraKeys('clearColor');
takeOnlyActualCameraKeys('fov');
// A type name is not a key.
// @ts-expect-error
takeOnlyActualCameraKeys('CameraComponent');
// 'name' is not a camera key.
// @ts-expect-error
takeOnlyActualCameraKeys('name');
// 28. Never-valued slots are kept, not dropped: `never extends Component`
// holds, so the map is not empty. Silent in every configuration (no
// directives: there is nothing to throw).
/**
 * @typedef {{ value: null, other: undefined }} NothingUseful
 */
/**
 * @typedef {{
 *   [K in keyof NothingUseful
 *     as NonNullable<NothingUseful[K]> extends Component ? K : never]:
 *     NothingUseful[K]
 * }} EmptyComponentMap
 */
/**
 * @param {keyof EmptyComponentMap & string} key
 */
function takeEmptyComponentKey(key) {
  return key;
}
takeEmptyComponentKey('value');
takeEmptyComponentKey('other');
