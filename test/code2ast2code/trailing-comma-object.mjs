// Keep the trailing comma, it's annotated in the AST like:
// ObjectExpression:
// "extra": {
//   "trailingComma": 115
// }
const test = {
  "zero-shot-image-classification": {
    "default": {
      "model": "Xenova/clip-vit-base-patch32" // no trailing comma
    },
    "type": "multimodal", // trailing comma
  },
};
