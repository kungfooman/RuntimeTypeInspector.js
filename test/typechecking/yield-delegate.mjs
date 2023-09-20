function* hello() {
  yield* "hello";
}
const test = hello();
const ret = [...test];
console.log('ret', ret); // ['h', 'e', 'l', 'l', 'o']
