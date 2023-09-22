"insert types and eval";
class Test {
  constructor({a, b, c = 2}) {
    this.a = a;
    this.b = b;
    this.c = c;
  }
}
const test = new Test({a: 0, b: 1});
console.clear();
statsPrint();
console.log('test', test);
