// Shift-Enter: convert content of left editor,
//              write result to right editor
// Tip: open F12/DevTools to see errors and warnings
// Press Shift-Enter in right editor to eval result.
import {TypePanel} from '@runtime-type-inspector/runtime';


/**
 * @typedef {Object} Account
 * @property {string} id
 * @property {string} email
 * @property {string} role
 * @property {string} createdAt
 */

/**
 * Creates a new account payload, omitting system-managed properties.
 *
 * @param {Omit<Account, 'id' | 'createdAt'>} payload - Account details without generated fields
 * @returns {Account} The persisted account record
 */
function createAccount(payload) {
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...payload
  };
}

// Example usage — TypeScript/IDE flags an error if you pass 'id' or 'createdAt'
const newAccount = createAccount({
  email: "dev@company.com",
  role: "admin",
  id: 1 // warns
});


const data2 = {
  email: "dev2@company.com",
  role: "admin2",
  id: 2 // this won't warn in TSC because of provenence!
};

// Example usage — TypeScript/IDE flags an error if you pass 'id' or 'createdAt'
const newAccount2 = createAccount(data2);

/**
 * Read-only view of account details, excluding sensitive attributes.
 *
 * @typedef {Readonly<Omit<Account, 'id'>>} PublicAccountView
 */

/**
 * @param {PublicAccountView} account
 */
function renderAccountCard(account) {
  // account.role = 'guest'; // Error: Cannot assign to read-only property
  console.log(`${account.email} (${account.role})`);
}


const typePanel = new TypePanel();
Object.assign(window, { typePanel});

