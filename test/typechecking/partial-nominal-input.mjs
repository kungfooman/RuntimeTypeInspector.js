/**
 * Utilities over classes stay nominal: instances (including subclass instances) satisfy `Partial`/`Required`/`Pick`/`Omit` of their class outright, exactly like the bare class check does, while plain objects still validate structurally so mistyped props stay loud. Every throwing call carries `@ts-expect-error`, so a tsc-strict run is green if and only if each directive is consumed and nothing else errors; `*-errors.json` pins the same sequence for RTI.
 */
class Animal {
  constructor() {
    /** @type {number} */
    this.legs = 0;
  }
}
class Dog extends Animal {
  constructor() {
    super();
    /** @type {string} */
    this.bark = 'woof';
  }
}
/**
 * @param {Partial<Animal>} x
 */
function takePartialAnimal(x) {
  return x;
}
takePartialAnimal(new Animal()); // ok
takePartialAnimal(new Dog()); // ok: subclass instances count nominally
takePartialAnimal({}); // ok
// @ts-expect-error: string is not assignable to number
takePartialAnimal({ legs: 'bad' });
/**
 * @param {Required<Animal>} x
 */
function takeReqAnimal(x) {
  return x;
}
takeReqAnimal(new Animal()); // ok
takeReqAnimal(new Dog()); // ok
/**
 * @typedef {object} Zoo
 * @property {Animal} star
 * @property {number} count
 */
/**
 * @param {Partial<Zoo['star']>} x
 */
function takeStar(x) {
  return x;
}
takeStar(new Animal()); // ok
takeStar(new Dog()); // ok: nominal through indexed access
takeStar({}); // ok
// @ts-expect-error: string is not assignable to number
takeStar({ legs: 'bad' });
/**
 * @param {Pick<Dog, 'bark'>} x
 */
function takePickDog(x) {
  return x;
}
takePickDog(new Dog()); // ok
takePickDog({ bark: 'w' }); // ok
// @ts-expect-error: Animal lacks bark
takePickDog(new Animal());
/**
 * @param {Omit<Dog, 'bark'>} x
 */
function takeOmitDog(x) {
  return x;
}
takeOmitDog(new Dog()); // ok: instances satisfy Omit nominally
takeOmitDog({ legs: 1 }); // ok
// @ts-expect-error: string is not assignable to number
takeOmitDog({ legs: 'x' });
