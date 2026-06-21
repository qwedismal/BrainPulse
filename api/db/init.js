const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

function initDB() {
  const dbPath = process.env.DB_PATH || './brainpulse.db';
  const db = new Database(dbPath);
  
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  
  console.log('✅ Database initialized:', dbPath);
  return db;
}

module.exports = initDB;
