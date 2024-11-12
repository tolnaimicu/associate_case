var sqlite3 = require('sqlite3');
var mkdirp = require('mkdirp');

mkdirp.sync('./var/db');

var db = new sqlite3.Database('./var/db/todos.db');

db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS todos ( \
    id INTEGER PRIMARY KEY, \
    title TEXT NOT NULL, \
    completed INTEGER, \
    created_at TEXT DATETIME CURRENT_TIMESTAMP, \
    updated_at DATETIME, \
    synchronized INTEGER \
  )");



  db.all("PRAGMA table_info(todos)", function(err, columns) {
    if (err) {
      console.error("Failed to retrieve table information:", err);
      return;
    }
  
    if (Array.isArray(columns)) {
      // Check if the 'created_at' column exists
      const hasCreatedAt = columns.some(col => col.name === 'created_at');
      if (!hasCreatedAt) {
        db.run(`ALTER TABLE todos ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
          if (err) console.error("Error adding created_at column:", err);
          else console.log("Successfully added created_at column.");
        });
      }
  
      // Check if the 'updated_at' column exists
      const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
      if (!hasUpdatedAt) {
        db.run(`ALTER TABLE todos ADD COLUMN updated_at DATETIME`, (err) => {
          if (err) console.error("Error adding updated_at column:", err);
          else console.log("Successfully added updated_at column.");
        });
      }


      const hasSync = columns.some(col => col.name === 'synchronized');
      if (!hasSync) {
        db.run(`ALTER TABLE todos ADD COLUMN synchronized INTEGER`, (err) => {
          if (err) console.error("Error adding synchronized column:", err);
          else console.log("Successfully added synchronized column.");
        });
      }
    } else {
      console.error("Unexpected format for table info:", columns);
    }
    
  });


});

module.exports = db;
