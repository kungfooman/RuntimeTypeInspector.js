function isBareShorthand(node) {
  if (node.type !== 'ObjectExpression' && node.type !== 'ObjectPattern') {
    return false;
  }
  if (node.properties.length === 0) {
    return true;
  }
  for (const property of node.properties) {
    if (property.type !== 'Property' || property.computed || property.method) {
      return false;
    }
    if (property.shorthand !== true) {
      return false;
    }
    if (property.key.type !== 'Identifier' || property.value.type !== 'Identifier') {
      return false;
    }
    if (property.key.name !== property.value.name) {
      return false;
    }
  }
  return true;
}
export {isBareShorthand};
