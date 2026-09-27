/**
 * Omit over typedefs: known props validate on both sides; excess literal
 * keys are tsc-only (freshness-based excess check has no runtime
 * equivalent: values carry no literal-vs-variable provenance).
 * @typedef {object} Account
 * @property {string} id - System id.
 * @property {string} email - Email.
 * @property {string} role - Role.
 * @property {string} createdAt - Timestamp.
 *
 * @param {Omit<Account, 'id' | 'createdAt'>} payload - Account details.
 * @returns {void}
 */
function case01(payload) {
}
/**
 * @typedef {Readonly<Omit<Account, 'id'>>} PublicAccountView
 *
 * @param {PublicAccountView} account - Read-only view.
 * @returns {void}
 */
function case02(account) {
}
/**
 * @param {Omit<Account, 'id' | 'createdAt'>} payload - Account details.
 * @returns {void}
 */
function case03(payload) {
}
case01({email: "dev@company.com", role: "admin"});
case01({email: "dev@company.com", role: 1});
case02({email: "dev@company.com", role: "admin", createdAt: "now"});
case02({email: 1, role: "admin", createdAt: "now"});
case03({email: "dev@company.com", role: "admin", id: 1});
