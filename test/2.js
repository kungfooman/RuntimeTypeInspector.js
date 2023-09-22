"insert types and eval";
class Vec3 extends Float32Array {
	constructor(x = 0, y = 0, z = 0) {
		super(3);
		this.x = x;
		this.y = y;	
		this.z = z;
	}
	get x() {
		return this[0];
	}
	/**
	 * @type {number}
	 */
	set x(_) {
		this[0] = _;
	}
	get y() {
		return this[1];
	}
	/**
	 * @type {number}
	 */
	set y(_) {
		this[1] = _;
	}
	get z() {
		return this[2];
	}
	/**
	 * @type {number}
	 */
	set z(_) {
		this[2] = _;
	}
}
vec3 = new Vec3(1, 2, 3);
console.log(vec3);
console.clear();
typecheckReset();
statsPrint();
const a = new Vec3(1, 2, 3);
const b = new Vec3(1, 2, "hi");
