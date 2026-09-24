registerTypedef('User', {
  "type": "object",
  "properties": {
    "id": "string",
    "name": "string",
    "email": "string",
    "role": {
      "type": "union",
      "members": [
        "'admin'",
        "'user'",
        "'guest'"
      ],
      "optional": false
    }
  }
});
registerTypedef('UserPreview', {
  "type": "reference",
  "name": "Pick",
  "args": [
    "User",
    {
      "type": "union",
      "members": [
        "'name'",
        "'email'"
      ]
    }
  ]
});
registerTypedef('CreateUserPayload', {
  "type": "reference",
  "name": "Omit",
  "args": [
    "User",
    "'id'"
  ]
});
registerTypedef('EventType', {
  "type": "union",
  "members": [
    "'click'",
    "'hover'",
    "'scroll'",
    "'focus'"
  ]
});
registerTypedef('MouseEventType', {
  "type": "reference",
  "name": "Extract",
  "args": [
    "EventType",
    {
      "type": "union",
      "members": [
        "'click'",
        "'hover'"
      ]
    }
  ]
});

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {'admin' | 'user' | 'guest'} role
 */

// -----------------------------------------------------------------------------

// 1. Partial: Makes all properties in a type optional

// -----------------------------------------------------------------------------

/**
 * Updates a user profile. Accepts any combination of user properties.
 *
 * @param {string} id
 * @param {Partial<User>} updates
 * @returns {void}
 */
function updateUser(id, updates) {
  if (!inspectType(id, "string", 'updateUser', 'id')) {
    youCanAddABreakpointHere();
  }
  if (!inspectType(updates, {
    "type": "reference",
    "name": "Partial",
    "args": [
      "User"
    ],
    "optional": false
  }, 'updateUser', 'updates')) {
    youCanAddABreakpointHere();
  }
}
// -----------------------------------------------------------------------------

// 2. Pick: Selects only a specific set of properties from a type

// -----------------------------------------------------------------------------


/**
 * Creates a minimal user preview containing only name and email.
 *
 * @typedef {Pick<User, 'name' | 'email'>} UserPreview
 */


/**
 * @param {UserPreview} preview
 */


// -----------------------------------------------------------------------------

// 2. Pick: Selects only a specific set of properties from a type

// -----------------------------------------------------------------------------

/**
 * Creates a minimal user preview containing only name and email.
 *
 * @typedef {Pick<User, 'name' | 'email'>} UserPreview
 */

/**
 * @param {UserPreview} preview
 */
function displayPreview(preview) {
  if (!inspectType(preview, "UserPreview", 'displayPreview', 'preview')) {
    youCanAddABreakpointHere();
  }
  console.log(preview.name, preview.email);
}
// -----------------------------------------------------------------------------

// 3. Omit: Constructs a type by picking all properties and then removing keys

// -----------------------------------------------------------------------------


/**
 * Payload for creating a new user (excludes auto-generated 'id').
 *
 * @typedef {Omit<User, 'id'>} CreateUserPayload
 */


/**
 * @param {CreateUserPayload} payload
 */


// -----------------------------------------------------------------------------

// 3. Omit: Constructs a type by picking all properties and then removing keys

// -----------------------------------------------------------------------------

/**
 * Payload for creating a new user (excludes auto-generated 'id').
 *
 * @typedef {Omit<User, 'id'>} CreateUserPayload
 */

/**
 * @param {CreateUserPayload} payload
 */
function createUser(payload) {
  if (!inspectType(payload, "CreateUserPayload", 'createUser', 'payload')) {
    youCanAddABreakpointHere();
  }
}
// -----------------------------------------------------------------------------

// 4. Extract: Extracts types from a union that are assignable to another type

// -----------------------------------------------------------------------------


/**
 * @typedef {'click' | 'hover' | 'scroll' | 'focus'} EventType
 */


/**
 * Filter down to only mouse interaction events.
 *
 * @typedef {Extract<EventType, 'click' | 'hover'>} MouseEventType
 */


/**
 * @param {MouseEventType} event - Only accepts 'click' or 'hover'
 */


// -----------------------------------------------------------------------------

// 4. Extract: Extracts types from a union that are assignable to another type

// -----------------------------------------------------------------------------

/**
 * @typedef {'click' | 'hover' | 'scroll' | 'focus'} EventType
 */

/**
 * Filter down to only mouse interaction events.
 *
 * @typedef {Extract<EventType, 'click' | 'hover'>} MouseEventType
 */

/**
 * @param {MouseEventType} event - Only accepts 'click' or 'hover'
 */
function handleMouseEvent(event) {
  if (!inspectType(event, "MouseEventType", 'handleMouseEvent', 'event')) {
    youCanAddABreakpointHere();
  }
  console.log('Mouse event triggered:', event);
}
// -----------------------------------------------------------------------------

// Positive calls: no warnings expected

// -----------------------------------------------------------------------------


// -----------------------------------------------------------------------------

// Positive calls: no warnings expected

// -----------------------------------------------------------------------------
updateUser("1", {
  name: "Alice"
}); // ok: partial update

updateUser("1", {}); // ok: all properties optional

updateUser("1", {
  name: "Alice",
  email: "a@b.com",
  role: "admin"
}); // ok: full update

displayPreview({
  name: "Alice",
  email: "a@b.com"
}); // ok

createUser({
  name: "kungfooman",
  email: "lama12345@gmail.com",
  role: "admin"
}); // ok

createUser({
  id: "7",
  name: "n",
  email: "e",
  role: "guest"
}); // ok: id allowed, just not required

handleMouseEvent("click"); // ok

handleMouseEvent("hover"); // ok

// -----------------------------------------------------------------------------

// Negative calls: each must warn

// -----------------------------------------------------------------------------

 // ok

// -----------------------------------------------------------------------------

// Negative calls: each must warn

// -----------------------------------------------------------------------------
updateUser(1, {}); // warns: id must be string

updateUser("1", {
  email: 1
}); // warns: email must be string

displayPreview({
  name: "Alice"
}); // warns: missing required email

displayPreview({
  name: "Alice",
  email: 1
}); // warns: email must be string

createUser({
 // warns: missing required role
  name: "kungfooman",
  email: "lama12345@gmail.com"
});
createUser({
  name: "n",
  email: "e",
  role: "superadmin"
}); // warns: role not in union

handleMouseEvent("scroll"); // warns: not a mouse event

handleMouseEvent("focus"); // warns: not a mouse event

handleMouseEvent(123); // warns: event must be string

