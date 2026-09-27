// Shift-Enter: convert content of left editor,
//              write result to right editor
// Tip: open F12/DevTools to see errors and warnings
// Press Shift-Enter in right editor to eval result.
import {TypePanel} from '@runtime-type-inspector/runtime';

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string} passwordHash
 */

/**
 * Creates a public profile containing only name and email.
 *
 * @param {Pick<User, 'name' | 'email'>} userInfo - Object containing selected user fields
 * @returns {string} Formatted profile string
 */
function createProfileCard(userInfo) {
  return `${userInfo.name} <${userInfo.email}>`;
}

// Example usage
createProfileCard({
  name: 1,
  email: "a@b.c"
});

/**
 * @typedef {Pick<User, 'id' | 'name'>} UserPreview
 */

/**
 * @param {UserPreview} user
 */
function displayUser(user) {
  console.log(`${user.id}: ${user.name}`);
}

const typePanel = new TypePanel();
Object.assign(window, {typePanel});

