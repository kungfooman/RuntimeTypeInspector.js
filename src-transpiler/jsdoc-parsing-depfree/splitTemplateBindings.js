/**
 * Splits one `@template` head into its bindings: each binding starts at a
 * top-level token boundary and runs through balanced brackets. `O, P`
 * binds two (the comma ends the first); `[K=Map<A, B>]` binds one (the
 * inner comma rides the brackets); a space after a complete token ends it,
 * but a space inside brackets (`[EventMap = any]`) never splits. The first
 * binding keeps a leading braced constraint out of the way: a `{...}` run
 * at the head start is the constraint the braced reader already took, so it
 * falls away before the split. Only the first head token binds per
 * binding, so trailing prose (`O, P The types...`) never joins: after the
 * first binding of a bare word list, the rest is prose the caller drops.
 * @example
 * splitTemplateBindings('O, P The obj and props types');
 * // ['O', 'P']
 * @example
 * splitTemplateBindings('[K=Map<A, B>]');
 * // ['[K=Map<A, B>]']
 * @example
 * splitTemplateBindings('{Record<string, any>} [EventMap = any]');
 * // ['[EventMap = any]']
 * @example
 * splitTemplateBindings('[T=Map<any, any>] blah');
 * // ['[T=Map<any, any>]']
 * @param {string} headRaw - The text after the braces.
 * @returns {string[]} One binding per comma-separated name.
 */
function splitTemplateBindings(headRaw) {
  const head = headRaw.trim().replace(/^\{[^{}]*\}\s*/, '');
  if (head.startsWith('[')) {
    let i = 0;
    let level = 0;
    for (const char of head) {
      if (char === '[') {
        level += 1;
      } else if (char === ']') {
        level -= 1;
        if (level === 0) {
          return [head.slice(0, i + 1)];
        }
      }
      i += 1;
    }
    return [head];
  }
  const [first, ...rest] = head.split(',');
  if (first === undefined) {
    return [];
  }
  const lead = first.trim().split(/\s+/)[0] ?? '';
  if (rest.length === 0) {
    return lead === '' ? [] : [lead];
  }
  const bindings = lead === '' ? [] : [lead];
  const second = rest.join(',').trim().split(/\s+/)[0] ?? '';
  if (second !== '') {
    bindings.push(second);
  }
  return bindings;
}
export {splitTemplateBindings};
