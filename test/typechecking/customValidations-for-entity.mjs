import {customValidations} from '@runtime-type-inspector/runtime';
class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  toString() {
    return `[${this.x}, ${this.y}, ${this.z}]`;
  }
}
class Entity {
  /**
   * @param {string} [name] - The name.
   */
  constructor(name = "Untitled") {
    this.name = name;
  }
}
console.log("customValidations", customValidations);
customValidations.length = 0;
customValidations.push((value, expect, loc, name, critical, warn) => {
  if (value instanceof Vec3) {
    if (isNaN(value.x)) {
      warn("x is NaN");
      return false;
    }
  }
  return true;
});
const entity1 = new Entity("test");
console.log("entity1", entity1);
const entity2 = new Entity(new Vec3(NaN, 2, 3));
console.log("entity2", entity2);
