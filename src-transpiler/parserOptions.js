/**
 * We use the same options in different places, so it's nice to keep them in sync without
 * changing them in multiple locations.
 * @type {import('@babel/parser').ParserOptions}
 */
const parserOptions = {
  sourceType: 'module',
  createParenthesizedExpressions: true,
  plugins: ['jsx'],
};
export {parserOptions};
