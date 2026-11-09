/**
 * Reads one template binding to its name and `= default`: a bracketed
 * `[K]`, `[K=V]`, or `[K = V]` splits name from default (whitespace
 * around `=` falls away, like tsc which binds `EventMap` from
 * `[EventMap = any]`), anything else binds whole with an empty default.
 * @example
 * readTemplateBinding('[EventMap = any]');
 * // {name: 'EventMap', default: 'any'}
 * @example
 * readTemplateBinding('[K=Map<A, B>]');
 * // {name: 'K', default: 'Map<A, B>'}
 * @example
 * readTemplateBinding('K');
 * // {name: 'K', default: ''}
 * @param {string} binding - One comma-separated binding from the head.
 * @returns {{name: string, default: string}} Binding name and default.
 */
function readTemplateBinding(binding) {
  const match = binding.match(/^\[\s*([A-Za-z_$][\w$]*)\s*(?:=\s*(.*?))?\s*\]$/);
  if (match) {
    return {name: match[1], default: (match[2] ?? '').trim()};
  }
  return {name: binding, default: ''};
}
export {readTemplateBinding};
