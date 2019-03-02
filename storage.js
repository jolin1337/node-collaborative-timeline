const { Item } = require('./timeline');
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.query('CREATE TABLE IF NOT EXISTS timeline (name varchar, data varchar);');

module.exports = {
  save (items) {
    const clearQuery = 'DELETE FROM timeline WHERE 1=1;';
    const baseQuery = 'INSERT INTO timeline(name, data) VALUES ';
    const values = [];
    const queries = [];
    const itemKeys = Object.keys(items);
    if (itemKeys.length === 0) {
      console.log("No timelines to store");
      return;
    }
    itemKeys.forEach((key, index) => {
      queries.push(`($${index * 2}, $${index * 2 + 1})`);
      values.push(key);
      values.push(JSON.stringify(items[key]._data));
    });
    const insertQuery = baseQuery + queries.join(',');
    console.log(items, insertQuery);
    // Note since we are using two different calls to pool here
    // there is a small window of an empty table
    return pool.query(clearQuery)
      .then(() => pool.query(insertQuery, values))
      .catch(err => console.error("Error while saving data", err.stack) );
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
      .catch(err => console.error("Error while loading data", err.stack) );
  }
};
