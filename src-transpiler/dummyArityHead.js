/**
 * Renders the invocation head that keeps overload arrow arity observable.
 * The stored call list feeds the inspection call, while the prefix keeps
 * wrapping transparent to length, name, async, and generator behavior.
 * @param {object} node - Arrow node to scan for collisions.
 * @param {number} arity - Original required parameter count.
 * @param {boolean} isAsync - Whether the arrow is async.
 * @param {boolean} isGenerator - Whether the arrow is a generator.
 * @returns {{head: string, prefix: string, store: string, callName: string, invocation: string}} Wrapper head.
 * @example
 * import {parse} from '@babel/parser';
 * const ast = parse('(first, second = 1) => first');
 * const arrow = ast.program.body[0].expression;
 * dummyArityHead(arrow, 2, false, false).head; // '(rtiParam0, rtiParam1, ...rtiOverloadRest)'
 */
function dummyArityHead(node, arity, isAsync, isGenerator) {
  const source = JSON.stringify(node);
  let base = 'rtiParam';
  while (source.includes('"name":"' + base + '0"')) {
    base += '_';
  }
  const names = [];
  for (let index = 0; index < arity; index++) {
    names.push(base + index);
  }
  const used = new Set(names);
  let restName = 'rtiOverloadRest';
  while (used.has(restName) || source.includes('"name":"' + restName + '"')) {
    restName += '_';
  }
  used.add(restName);
  let storeName = 'rtiOverloadStore';
  while (used.has(storeName) || source.includes('"name":"' + storeName + '"')) {
    storeName += '_';
  }
  const head = '(' + [...names, '...' + restName].join(', ') + ')';
  const callName = storeName;
  const leading = names.join(', ');
  const separator = names.length ? ', ' : '';
  const store = `const ${callName} = [${leading}${separator}...${restName}];`;
  const asyncMark = isAsync ? 'async ' : '';
  const generatorMark = isGenerator ? ' * ' : '';
  const invocation = `${leading}${separator}...${restName}`;
  const wrapperHead = isAsync ? `async ${head}` : head;
  const prefix = wrapperHead + ' => { ' + store + ' return (' + asyncMark + generatorMark;
  return {head, prefix, store, callName, invocation};
}
export {dummyArityHead};
