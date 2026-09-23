class Vec3 {
  constructor(x = 0, y = 0, z = 0) {
    if (!inspectType(x, {
      "type": "number",
      "optional": true
    }, 'Vec3#constructor', 'x')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(y, {
      "type": "number",
      "optional": true
    }, 'Vec3#constructor', 'y')) {
      youCanAddABreakpointHere();
    }
    if (!inspectType(z, {
      "type": "number",
      "optional": true
    }, 'Vec3#constructor', 'z')) {
      youCanAddABreakpointHere();
    }
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
registerClass(Vec3);

/**
 * @param {string} name - The name.
 */

function greet(name, size = 10) {
  if (!inspectType(name, "string", 'greet', 'name')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(size, {
    "type": "number",
    "optional": true
  }, 'greet', 'size')) {
    youCanAddABreakpointHere();
  }
  return name + size;
}
const make = (svc = new Service()) => {

if (!inspectType(svc, {
  "type": "Service",
  "optional": true
}, 'make', 'svc')) {
  youCanAddABreakpointHere();
}
  return svc;
};
function skipped(cb) {
  cb.forEach((item = 0) => {
    return item;
  });
}
