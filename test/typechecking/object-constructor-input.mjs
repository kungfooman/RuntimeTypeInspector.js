/**
 * `ObjectConstructor` accepts constructed values and rejects nullish
 * ones without throwing on the `constructor` read (which used to crash
 * the validator outright). Note the deliberate leniency gap: tsc demands
 * the full static interface (only `Object` itself qualifies below) while
 * RTI checks that a constructor exists at all — so only mutually
 * agreeing calls appear here. Every throwing call carries
 * `@ts-expect-error`, so a tsc-strict run is green if and only if each
 * directive is consumed and nothing else errors; `*-errors.json` pins the
 * same sequence for RTI.
 */
/**
 * @param {ObjectConstructor} ctor - A constructed value.
 */
function takeBuilt(ctor) {
  return ctor;
}
takeBuilt(Object); // ok
// @ts-expect-error: null is not constructed
takeBuilt(null);
// @ts-expect-error: undefined is not constructed
takeBuilt(undefined);
