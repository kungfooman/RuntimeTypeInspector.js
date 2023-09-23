/**
 * Stack an array of tensors along a specified dimension.
 * @param {Tensor[]} tensors The array of tensors to stack.
 * @param {number} dim The dimension to stack along.
 * @returns {Tensor} The stacked tensor.
 */
export function stack(tensors, dim = 0) {
    // This requires: this.findParentOfTypeWithPredicate(node, 'ExportNamedDeclaration', isFunc);
    // Otherwise it picks up the JSDoc from stack()
    return cat(tensors.map(t => t.unsqueeze(dim)), dim);
}
/**
 * @param {{priority: number}} a - First object with priority property.
 * @param {{priority: number}} b - Second object with priority property.
 * @returns {number} A number indicating the relative position.
 * @ignore
 */
const cmpPriority = (a, b) => a.priority - b.priority;
/**
 * @param {Array<{priority: number}>} arr - Array to be sorted in place where each element contains
 * an object with at least a priority property.
 * @returns {Array<{priority: number}>} In place sorted array.
 * @ignore
 */
export const sortPriority = arr => arr.sort(cmpPriority);
