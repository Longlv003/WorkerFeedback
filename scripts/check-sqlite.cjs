// Exercise the native binding without opening the survey database.
const path = require('node:path');
const { createRequire } = require('node:module');
const backendRequire = createRequire(path.resolve(__dirname, '../backend/package.json'));

try {
  const Database = backendRequire('better-sqlite3');
  const db = new Database(':memory:');
  try {
    db.exec('CREATE TABLE checks (value INTEGER)');
    db.transaction(() => db.prepare('INSERT INTO checks VALUES (?)').run(1))();
    const row = db.prepare('SELECT value FROM checks').get();
    if (row.value !== 1) throw new Error('SQLite read/write check failed');
    console.log(`SQLite ${backendRequire('better-sqlite3/package.json').version}: OK (in-memory read/write + transaction)`);
  } finally {
    db.close();
  }
} catch (error) {
  console.error(error.message);
  console.error('On native Termux, run npm run setup:termux after installing the documented build tools.');
  process.exitCode = 1;
}
