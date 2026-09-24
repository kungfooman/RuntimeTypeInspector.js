handlers[i](x);
[a[0]] = [1];
({
  p: a[0]
} = q);
for (a[0] of [1]) {
  console.log(inspectIndexedAccess(a, 0, "repl.js:5"));
}
const o = {
  [inspectIndexedAccess(a, 0, "repl.js:7")]: 1
};
