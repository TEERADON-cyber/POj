const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'postal.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) return console.error('Failed to open DB', err);
  console.log('Connected to SQLite database at', dbPath);
});

// Enable foreign keys
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');
  // Initialize schema if needed
  try {
    const schema = require('fs').readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schema, (e) => {
      if (e) return console.error('Failed to initialize schema', e);
      console.log('Database schema ensured');
      // Seed admin account after schema is ready
      const seedAdmin = require('./seed');
      seedAdmin();
    });
  } catch (ex) {
    console.error('Could not read schema.sql', ex);
  }
});

module.exports = db;
