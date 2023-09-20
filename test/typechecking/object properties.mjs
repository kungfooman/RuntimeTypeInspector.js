const key = 'abc';
const a = {key: '123'};
const b = {[key]: '123'}; // computed ObjectProperty
const c = {[100]: 123}; // computed ObjectProperty
const d = {100: 123};
console.log('a', a);
console.log('b', b);
console.log('c', c);
console.log('d', d);
