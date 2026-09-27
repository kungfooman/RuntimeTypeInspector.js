/**
 * @typedef {Object} Article
 * @property {string} id
 * @property {string} title
 * @property {string} content
 * @property {string[]} tags
 * @property {'draft' | 'published'} status
 */

/**
 * Applies partial updates to an article.
 *
 * @param {string} articleId
 * @param {Partial<Article>} patch - Any combination of article fields to update
 */
function updateArticle(articleId, patch) {
  // e.g., patch can be just { title: "New Title" } or { status: "published" }
  return { id: articleId, ...patch };
}

// Example usage — updating only title and status
updateArticle("art_9042", {
  title: "Advanced JSDoc Patterns",
  status: "published"
});


/**
 * @typedef {Partial<Article>} ArticleDraft
 */

/**
 * Saves an incomplete draft state.
 *
 * @param {ArticleDraft} draft
 */
function saveDraft(draft) {
  // Works with any subset of properties
}
