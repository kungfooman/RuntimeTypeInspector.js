/**
 * :see-no-evil:
 * @param {Set<any>} set 
 * @param {any} val 
 */
function setAdd(set, val) {
  set.add(val);
}
/**
 * @param {Set<number>} data
 */
function test(data) {
  console.log("test>", ...data);
}
const data = new Set([1, 2]);
setAdd(data, '3');
test(data);
