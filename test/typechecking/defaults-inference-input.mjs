class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
/**
 * @param {string} name - The name.
 */
function greet(name, size = 10) {
  return name + size;
}
const make = (svc = new Service()) => svc;
function skipped(cb) {
  cb.forEach((item = 0) => item);
}
