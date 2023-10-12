import { parseJSDoc } from "../src-transpiler/parseJSDoc.mjs";
/**
 * @param {string} aStr - JSDoc comment in string form.
 * @param {object} b - Parsed JSDoc comment.
 */
function compareJSDoc(aStr, b) {
    const a = parseJSDoc(aStr);
    if (JSON.stringify(a) !== JSON.stringify(b)) {
        console.warn(a, '!==', b);
    }
}
compareJSDoc(`
/**
 * Post-processes the outputs of the model (for object detection).
 * @param {Object} outputs The outputs of the model that must be post-processed
 * @param {Tensor} outputs.logits The logits
 * @param {Tensor} outputs.pred_boxes The predicted boxes.
 * @return {Object[]} An array of objects containing the post-processed outputs.
 */`, {
 });
