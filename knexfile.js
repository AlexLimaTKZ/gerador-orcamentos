const path = require('path');

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.join(__dirname, 'data', 'orcamentos.db')
    },
    migrations: {
      directory: path.join(__dirname, 'data', 'migrations')
    },
    useNullAsDefault: true
  }
};