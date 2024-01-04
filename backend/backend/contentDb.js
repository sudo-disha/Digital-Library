const mysql = require('mysql2/promise');

const contentDb = {
  config: {
    host: '10.10.61.161',
    user: 'disha',
    password: '',
    database: 'content_db', // Your content database name
  },

  async execute(sql, values = []) {
    try {
      const connection = await mysql.createConnection(this.config);

      const [results] = await connection.execute(sql, values);

      connection.end();

      return results;
    } catch (err) {
      throw err;
    }
  },
};

module.exports = contentDb;
