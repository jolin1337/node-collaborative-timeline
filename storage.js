const { Item } = require('./timeline');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query('CREATE TABLE IF NOT EXISTS timeline (name varchar, data varchar);');

module.exports = {
  save (items) {
    const clearQuery = 'DELETE FROM timeline WHERE 1=1; ';
    const baseQuery = 'INSERT INTO timeline (name, data) VALUES ';
    const values = [];
    const queries = [];
    Object.keys(items).forEach((key, index) => {
      queries.push(`($${index * 2}, $${index * 2 + 1})`);
      values.push(key);
      values.push(JSON.stringify(items[key]._data));
    });
    return pool.query(clearQuery + baseQuery + queries.join(','), values)
      .catch(err => console.error(err.stack) );
  },
  load () {
    const items = {};
    return pool.query('SELECT * FROM timeline')
      .then(res => {
        res.rows.forEach(item => {
          items[item.name] = new Item(JSON.parse(item.data));
        });
        return items;
      })
      .catch(err => console.error(err.stack) );
  }
};
