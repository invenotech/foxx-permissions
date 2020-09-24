'use strict';

const hasRole = require('./hasRole');

module.context.use('/privilege', require('./routes/privilege'), 'privilege');
module.context.use('/privileges', require('./routes/privileges'), 'privileges');
module.context.use('/role', require('./routes/role'), 'role');
module.context.use('/roles', require('./routes/roles'), 'roles');

module.exports = hasRole;
