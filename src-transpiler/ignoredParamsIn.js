/**
 * Parameter names listed after `@ignoreRTI` in a leading JSDoc comment
 * (`@ignoreRTI vertices` skips only that check; bare `@ignoreRTI` skips
 * the whole function). Names are matched against JSDoc parameter names.
 * Markdown quoting around the tag or names (`` `@ignoreRTI` ``, `"@ignoreRTI"`)
 * is formatting, not a name: quoted tokens are stripped, so a bare tag stays
 * bare no matter how it is quoted for lint or docs.
 * @param {string} text - The comment text.
 * @returns {Set<string>|'all'|null} Ignored names, `'all'`, or nothing.
 * @example
 * ignoredParamsIn('@ignoreRTI vertices'); // Set {'vertices'}
 * ignoredParamsIn('@ignoreRTI'); // 'all'
 */
function ignoredParamsIn(text) {
  const at = text.search(/@ignoreRTI(?![\w$])/);
  if (at === -1) {
    return null;
  }
  const line = text.slice(at).split('\n', 1)[0];
  const names = line.slice('@ignoreRTI'.length).split(/[\s,]+/).map((name) => name.replace(/^[`'"]+|[`'"]+$/g, '')).filter(Boolean);
  return names.length ? new Set(names) : 'all';
}
export {ignoredParamsIn};
