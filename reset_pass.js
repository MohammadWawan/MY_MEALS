const { scryptSync, randomBytes } = require("node:crypto");
const Database = require('better-sqlite3');
const path = require('path');

const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

const db = new Database(path.join(__dirname, 'sqlite.db'));
const newHash = hashPassword("123456");

db.prepare('UPDATE user SET password = ? WHERE email = ?').run(newHash, 'kasir@mail.com');
console.log("Password for kasir@mail.com has been reset to 123456");
db.close();
