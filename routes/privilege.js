'use strict';
const dd = require('dedent');
const joi = require('joi');

const { db } = require('@arangodb');
const sessions = module.context.dependencies.sessions;
const hasRole = require('../hasRole');

module.context.use(sessions);

const httpError = require('http-errors');
const status = require('statuses');
const errors = require('@arangodb').errors;

const ARANGO_NOT_FOUND = errors.ERROR_ARANGO_DOCUMENT_NOT_FOUND.code;
const ARANGO_DUPLICATE = errors.ERROR_ARANGO_UNIQUE_CONSTRAINT_VIOLATED.code;
const ARANGO_CONFLICT = errors.ERROR_ARANGO_CONFLICT.code;
const HTTP_NOT_FOUND = status('not found');
const HTTP_CONFLICT = status('conflict');

const roles = db._collection('roles');
const hasPrivilege = db._collection('hasPrivilege');
const privileges = db._collection('privileges');

const createRouter = require('@arangodb/foxx/router');
const router = createRouter();

router
  .post('/', function (req, res) {
    if (!hasRole(req, 'privileges_update')) {
      res.throw(401, `Unathorized`);
    }
    const { name, description } = req.body;

    if (!privileges.firstExample({ name })) {
      privileges.save({
        name,
        description
      });
      res.status(200, `Privilege Created`);
    } else {
      res.throw(409, `Privilege Exists`);
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
    if (!hasRole(req, 'privileges_update')) {
      res.throw(401, `Unathorized`);
    }
    const { _key } = req.pathParams;
    const { name, description } = req.body;

    if (privileges.firstExample({ _key })) {
      privileges.update(_key, {
        name,
        description
      });
      res.status(200, `Privilege Updated`);
    } else {
      res.throw(400, `Invalid Privilege Id: ${_key}`);
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
  .delete('/:_key', function (req, res) {
    if (!hasRole(req, 'privileges_delete')) {
      res.throw(401, `Unathorized`);
    }
    const { _key } = req.pathParams;

    if (privileges.firstExample({ _key })) {
      privileges.remove(_key);
      res.status(200, `Privilege Updated`);
    } else {
      res.throw(400, `Invalid Privilege Id: ${_key}`);
    }
  })
  .pathParam('_key');

router
  .get(
    ':_key',
    function (req, res) {
      if (!hasRole(req, 'privileges_view')) {
        res.throw(401, `Unathorized`);
      }
      const { _key } = req.pathParams;
      let privilege;
      try {
        privilege = privileges.document(_key);
      } catch (e) {
        if (e.isArangoError && e.errorNum === ARANGO_NOT_FOUND) {
          throw httpError(HTTP_NOT_FOUND, e.message);
        }
        throw e;
      }
      res.send(privilege);
    },
    'detail'
  )
  .pathParam('_key')
  .summary('Fetch a Privilege ID').description(dd`
  Retrieves a Privilege by ID.
`);

module.exports = router;
