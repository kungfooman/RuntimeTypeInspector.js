import * as B from "test-import-validation-b";
/**
 * @param {B.someNumber} val 
 */
function test2(val) {
  console.log("test2 got", {val});
}
test2(123);
// /**
//  * @param {typeof import('./b.js')} val 
//  */
// function test(val) {
//   console.log(val);
// }
// test(B);
// const testVar = {someString: "test"};
// /**
//  * @param {typeof testVar.someString} val 
//  */
// function test3(val) {
//   console.log(val);
// }
// test3('yo');
