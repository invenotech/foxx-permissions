'use strict';

/**
 * Initial Collection Setup
 */

/** Document Collections */

/** Roles */
const { db } = require('@arangodb');

if (!db._collection('roles')) {
  db._createDocumentCollection('roles');
}

const roles = db._collection('roles');

roles.ensureIndex({
  type: 'hash',
  unique: true,
  fields: ['name']
});

/** Privileges */

if (!db._collection('privileges')) {
  db._createDocumentCollection('privileges');
}

const privileges = db._collection('privileges');

privileges.ensureIndex({
  type: 'hash',
  unique: true,
  fields: ['name']
});

/** Edge Collections */

/** hasRole */

if (!db._collection('hasRole')) {
  db._createEdgeCollection('hasRole');
}

/** hasPrivilege */

if (!db._collection('hasPrivilege')) {
  db._createEdgeCollection('hasPrivilege');
}

const hasPrivilege = db._collection('hasPrivilege');

/**
 * Initial Roles Creation
 */

if (!roles.firstExample({ name: 'admin' })) {
  roles.save({
    name: 'admin',
    description: 'Administrators - provides full access to all areas'
  });
}

if (!roles.firstExample({ name: 'guest' })) {
  roles.save({
    name: 'guest',
    description: 'Guests - provides limited access to guest areas'
  });
}

if (!roles.firstExample({ name: 'user' })) {
  roles.save({
    name: 'user',
    description: 'Users - provides limited access to user areas'
  });
}

/**
 * Privileges Setup
 */

const privPrivsUpdate = privileges.save({
  name: 'privileges_update',
  description: 'Ability to add, edit, remove Privileges'
});

const privPrivsView = privileges.save({
  name: 'privileges_view',
  description: 'Ability to view Privileges'
});

const privRolePrivsUpdate = privileges.save({
  name: 'role_privileges_update',
  description: 'Ability to add, edit, remove Privileges to/from Roles'
});

const privRolePrivsView = privileges.save({
  name: 'role_privileges_view',
  description: "Ability to view Roles' Privileges"
});

const privRoleUsersUpdate = privileges.save({
  name: 'role_users_update',
  description: 'Ability to add, edit, remove Roles to/from Users'
});

const privRoleUsersView = privileges.save({
  name: 'role_users_view',
  description: "Ability to view Users' Roles"
});

const privRolesUpdate = privileges.save({
  name: 'roles_update',
  description: "Ability to add, edit, or remove Users' Roles"
});

const privRolesView = privileges.save({
  name: 'roles_view',
  description: 'Ability to view Roles'
});

const privUIAdmin = privileges.save({
  name: 'ui_admin',
  description: 'Ability to view Administrator Menu'
});

const privUIDebug = privileges.save({
  name: 'ui_debug',
  description: 'Ability to view Debug Data and Tools'
});

const adminRole = roles.firstExample({ name: 'admin' });

hasPrivilege.save({
  _to: `${adminRole._id}`,
  _from: `${privPrivsUpdate._id}`
});

hasPrivilege.save({
  _to: `${adminRole._id}`,
  _from: `${privPrivsView._id}`
});

hasPrivilege.save({
  _to: `${adminRole._id}`,
  _from: `${privRolePrivsUpdate._id}`
});

hasPrivilege.save({
  _to: `${adminRole._id}`,
  _from: `${privRolePrivsView._id}`
});

hasPrivilege.save({
  _to: `${adminRole._id}`,
  _from: `${privRoleUsersUpdate._id}`
});

hasPrivilege.save({
  _to: `${adminRole._id}`,
  _from: `${privRoleUsersView._id}`
});

hasPrivilege.save({
  _to: `${adminRole._id}`,
  _from: `${privRolesUpdate._id}`
});

hasPrivilege.save({
  _to: `${adminRole._id}`,
  _from: `${privRolesView._id}`
});

hasPrivilege.save({
  _to: `${adminRole._id}`,
  _from: `${privUIAdmin._id}`
});

hasPrivilege.save({
  _to: `${adminRole._id}`,
  _from: `${privUIDebug._id}`
});

console.log(`Migration 1-initial complete`);

module.exports = true;
