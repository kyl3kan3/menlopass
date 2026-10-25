const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { database } = require('./analytics');
(async () => {
  const pool = database();
  try { await pool.query(readFileSync(join(__dirname, 'migrations/001_analytics.sql'), 'utf8')); console.log('Analytics migration applied.'); }
  finally { await pool.end(); }
})().catch(() => { console.error('Analytics migration failed. Check database configuration and migration permissions.'); process.exitCode = 1; });
