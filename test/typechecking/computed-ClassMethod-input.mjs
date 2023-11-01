class Test {
  *[Symbol.iterator]() {
    yield 1;
    yield 2;
    yield 3;
  }
}
const test = new Test();
const ret = [...test];
console.log('ret', ret);
