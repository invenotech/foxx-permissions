'use strict';
const dd = require('dedent');
const joi = require('joi');

const aql = require('@arangodb').aql;
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
const privileges = db._collection('privileges');

const createRouter = require('@arangodb/foxx/router');
const router = createRouter();

router
  .get(function (req, res) {
    if (!hasRole(req, 'privileges_view')) {
      res.throw(401, `Unathorized`);
    }
    const data = db._query(aql`
      FOR privilege IN ${privileges}        
        SORT privilege.name ASC
        RETURN {
          "_key" : privilege._key,
          "name" : privilege.name,
          "description" : privilege.description
        }`);

    res.send(data);
  }, 'list')
  .response(
    joi.array().items(joi.string().required()).required(),
    'List of all Privileges.'
  )
  .summary('List all Privileges').description(dd`
  Retrieves a list of all Privileges.
`);

module.exports = router;
