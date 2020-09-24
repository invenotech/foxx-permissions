'use strict';

function hasRole(req, privilege) {
  let permissions;
  let user;

  const aql = require('@arangodb').aql;
  const { db } = require('@arangodb');

  const hasPrivilege = db._collection('hasPrivilege');
  const hasRole = db._collection('hasRole');
  const privileges = db._collection('privileges');
  const roles = db._collection('roles');

  if (req.session.uid) {
    user = `users/${req.session.uid}`;
  } else {
    user = false;
  }

  if (user) {
    permissions = db
      ._query(
        aql`
        FOR privilege IN ${privileges}
      FILTER privilege.name == ${privilege}
      LET roles = (
        FOR role IN OUTBOUND privilege ${hasPrivilege}
          OPTIONS {
            bfs: true,
            uniqueVertices: 'global'
          }
        FOR user IN OUTBOUND role ${hasRole}
            
          OPTIONS {
            bfs: true,
            uniqueVertices: 'global'
          }
          FILTER user._id == ${user}
          
        RETURN role
      )
      RETURN { roles }`
      )
      .toArray();
  } else {
    req.session.uid = null;
    req.session.data = {};
    const priv = privileges.firstExample({ name: privilege });
    permissions = db
      ._query(
        aql`
        FOR role IN ${roles}
          FILTER role.name == 'guest'
          LET privileges = (
            FOR priv IN INBOUND role ${hasPrivilege}
              OPTIONS {
                bfs: true,
                uniqueVertices: 'global'
              }
              FILTER priv._id == ${priv._id}
            RETURN priv
          )
          RETURN { privileges }
      `
      )
      .toArray();
  }

  return Boolean(permissions.length > 0);
}

module.exports = hasRole;
