const someNumber = 123;
function makeVec3Class() {
    return function() {
        this.x = 1;
        this.y = 2;
        this.z = 3;
    }
}
const Vec3 = makeVec3Class();
export {someNumber, makeVec3Class, Vec3};
