'use strict';
const dd = require('dedent');
const joi = require('joi');

const aql = require('@arangodb').aql;
const { db } = require('@arangodb');
const sessions = module.context.dependencies.sessions;
const _hasRole = require('../hasRole');

module.context.use(sessions);

const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const hasPrivilege = db._collection('hasPrivilege');
const hasRole = db._collection('hasRole');
const privileges = db._collection('privileges');
const roles = db._collection('roles');
const users = db._collection('users');

const createRouter = require('@arangodb/foxx/router');
const router = createRouter();

router
  .get(
    '/:_key/privileges',
    function (req, res) {
      if (!_hasRole(req, 'role_privileges_view')) {
        res.throw(401, `Unathorized`);
      }
      const { _key } = req.pathParams;
      const data = db._query(aql`
      FOR role IN ${roles}
        FILTER role._key == ${_key}
        LET privileges = (
          FOR priv IN INBOUND role ${hasPrivilege}
            OPTIONS {
              bfs: true,
              uniqueVertices: 'global'
            }
          RETURN priv
        )
        
        RETURN MERGE ( { role, privileges })`);

      res.send(data);
    },
    'list'
  )
  .pathParam('_key', joi.string().required(), 'Role Id')
  .response(
    joi.array().items(joi.string().required()).required(),
    "List of a role's privileges."
  )
  .summary('List privileges').description(dd`
  Retrieves a list of a role's privileges.
`);

router
  .post(':role/privilege/:privilege', function (req, res) {
    if (!_hasRole(req, 'role_privileges_update')) {
      res.throw(401, `Unathorized`);
    }
    const { privilege, role } = req.pathParams;

    hasPrivilege.save({
      _to: `roles/${role}`,
      _from: `privileges/${privilege}`
    });
    res.status(200, `Role Privilege Created`);
  })
  .pathParam('role')
  .pathParam('privilege');

router
  .delete(':role/privilege/:privilege', function (req, res) {
    if (!_hasRole(req, 'role_privileges_update')) {
      res.throw(401, `Unathorized`);
    }
    const { privilege, role } = req.pathParams;

    const priv = hasPrivilege.firstExample({
      _to: `roles/${role}`,
      _from: `privileges/${privilege}`
    });

    hasPrivilege.remove({ _key: priv._key });
    res.status(200, `Role Privilege Deleted`);
  })
  .pathParam('role')
  .pathParam('privilege');

router
  .get(
    '/:_key/users',
    function (req, res) {
      if (!_hasRole(req, 'role_users_view')) {
        res.throw(401, `Unathorized`);
      }
      const { _key } = req.pathParams;
      const data = db._query(aql`
      FOR role IN ${roles}
        FILTER role._key == ${_key}
        LET users = (
          FOR user IN OUTBOUND role ${hasRole}
            OPTIONS {
              bfs: true,
              uniqueVertices: 'global'
            }
          RETURN user
        )
        
        RETURN MERGE ( { role, users })`);

      res.send(data);
    },
    'list'
  )
  .pathParam('_key', joi.string().required(), 'Role Id')
  .response(
    joi.array().items(joi.string().required()).required(),
    "List of a role's privileges."
  )
  .summary('List privileges').description(dd`
  Retrieves a list of a role's privileges.
`);

router
  .post(':role/user/:user', function (req, res) {
    if (!_hasRole(req, 'role_users_update')) {
      res.throw(401, `Unathorized`);
    }
    const { role, user } = req.pathParams;

    if (
      !hasRole.firstExample({
        _to: `users/${user}`,
        _from: `roles/${role}`
      })
    ) {
      hasRole.save({
        _to: `users/${user}`,
        _from: `roles/${role}`
      });
      res.status(200, `Role User Created`);
    }
  })
  .pathParam('role')
  .pathParam('user');

router
  .delete(':role/user/:user', function (req, res) {
    if (!_hasRole(req, 'role_users_update')) {
      res.throw(401, `Unathorized`);
    }
    const { role, user } = req.pathParams;

    const roleUser = hasRole.firstExample({
      _to: `users/${user}`,
      _from: `roles/${role}`
    });

    hasRole.remove({ _key: roleUser._key });
    res.status(200, `Role User Deleted`);
  })
  .pathParam('role')
  .pathParam('user');

router
  .post('/', function (req, res) {
    if (!_hasRole(req, 'roles_update')) {
      res.throw(401, `Unathorized`);
    }
    const { name, description } = req.body;

    if (!roles.firstExample({ name })) {
      roles.save({
        name,
        description
      });
      res.status(200, `Role Created`);
    } else {
      res.throw(409, `Role Exists`);
    }
  })
  .body(
    joi
      .object({
        name: joi.string().required(),
        description: joi.string().required()
      })
      .required()
  );

router
  .put('/:_key', function (req, res) {
    if (!_hasRole(req, 'roles_update')) {
      res.throw(401, `Unathorized`);
    }
    const { _key } = req.pathParams;
    const { name, description } = req.body;

    if (roles.firstExample({ _key })) {
      roles.update(_key, {
        name,
        description
      });
      res.status(200, `Role Updated`);
    } else {
      res.throw(400, `Invalid Role Id: ${_key}`);
    }
  })
  .pathParam('_key')
  .body(
    joi
      .object({
        name: joi.string().required(),
        description: joi.string().required()
      })
      .required()
  );

router
  .get(
    ':_key',
    function (req, res) {
      if (!_hasRole(req, 'roles_view')) {
        res.throw(401, `Unathorized`);
      }
      const { _key } = req.pathParams;
      let role;
      try {
        role = roles.document(_key);
      } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
          throw httpError(HTTP_NOT_FOUND, e.message);
        }
        throw e;
      }
      res.send(role);
    },
    'detail'
  )
  .pathParam('_key')
  .summary('Fetch a Role ID').description(dd`
  Retrieves a Role by ID.
`);

module.exports = router;
