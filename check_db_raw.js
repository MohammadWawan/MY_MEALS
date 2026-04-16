const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'sqlite.db'));
const rows = db.prepare('SELECT email, password FROM user').all();
console.log(JSON.stringify(rows, null, 2));
db.close();
