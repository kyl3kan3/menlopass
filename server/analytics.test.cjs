const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { PGlite } = require('@electric-sql/pglite');
const contract = require('../shared/tracking-contract');
const analytics = require('./analytics');
function envelope(name = 'purchase_started') {
  return { id: randomUUID(), name, timestamp: new Date().toISOString(),
    properties: contract.project(name, { productId: 'peri_monthly', attemptId: randomUUID(), price: 5, currency: 'USD' }, ['peri_monthly']),
    context: { sessionId: randomUUID(), appVersion: '1.2.1', buildNumber: '42', platform: 'ios', osVersion: '18.0', runtimeVersion: '1.2.1-native-tracking-1', updateId: 'embedded', buildChannel: 'production', embedded: true } };
}
test('strict contract rejects injected properties, product IDs, invalid prices and malformed context', () => {
  const valid = envelope(); assert.ok(contract.validateEnvelope(valid, ['peri_monthly']));
  for (const [key, value] of Object.entries({ notes: 'health', displayed_price: 'private', productId: 'unknown', price: -1, currency: 'secret', attemptId: 'not-a-uuid' })) {
    const input = structuredClone(valid); input.properties[key] = value;
    assert.equal(Boolean(contract.validateEnvelope(input, ['peri_monthly'])), false, key);
  }
  const extra = structuredClone(valid); extra.context.email = 'private';
  assert.equal(Boolean(contract.validateEnvelope(extra, ['peri_monthly'])), false);
  assert.equal(contract.project('unknown'), null);
  assert.equal(contract.providerEligible(envelope('checkin_confirmed')), false);
  assert.equal(contract.providerEligible({ name: 'screen_viewed', properties: { route: 'appointment-report' } }), false);
  assert.equal('$session_id' in contract.providerProperties(valid), false);
});
test('pseudonym has the same deterministic namespace as mobile and never exposes credential or subscription ID', () => {
  const token = 'a'.repeat(64), id = analytics.hash(token);
  assert.equal(analytics.pseudonym(id), 'peri_' + analytics.hash(`peri:analytics:v1:${id}`));
  assert.equal(analytics.pseudonym(id).includes(token), false);
});
test('SQL transactions deduplicate, persist retry jobs, enforce quotas and erase records with a permanent tombstone', async () => {
  const pg = new PGlite();
  await pg.exec(fs.readFileSync(require('node:path').join(__dirname, 'migrations/001_analytics.sql'), 'utf8'));
  // PGlite runs one connection. These shims only cover SQL behavior; concurrent
  // advisory-lock correctness still requires hosted PostgreSQL acceptance tests.
  await pg.exec(`CREATE FUNCTION pg_advisory_xact_lock(bigint) RETURNS void LANGUAGE SQL AS 'SELECT';
    CREATE FUNCTION pg_try_advisory_xact_lock(bigint) RETURNS boolean LANGUAGE SQL AS 'SELECT true';`);
  const client = { query: (sql, args) => pg.query(sql, args), release() {} };
  const db = { connect: async () => client };
  try {
    const id = analytics.hash('a'.repeat(64)), body = envelope();
    assert.equal(await analytics.accept(id, body, 'ip:test', db), 202);
    assert.equal(await analytics.accept(id, body, 'ip:test', db), 202);
    assert.equal((await pg.query('SELECT * FROM analytics_events')).rows.length, 1);
    assert.equal((await pg.query('SELECT * FROM analytics_jobs')).rows.length, 1);
    await analytics.flush(db, async () => { throw new Error('Provider offline'); });
    const failed = (await pg.query('SELECT * FROM analytics_jobs')).rows[0];
    assert.equal(failed.attempts, 1); assert.equal(failed.id, body.id);
    await pg.query("UPDATE analytics_jobs SET due_at=now()-interval '1 second'");
    const delivered = [];
    await analytics.flush(db, async (job, transaction) => { delivered.push(job.id); await transaction.query('DELETE FROM analytics_jobs WHERE id=$1', [job.id]); });
    assert.deepEqual(delivered, [body.id]);
    await pg.query('UPDATE analytics_limits SET count=300 WHERE bucket=$1', [`install:${id}`]);
    assert.equal(await analytics.accept(id, envelope(), 'ip:test', db), 429);
    assert.equal(await analytics.erase(id, db), 202);
    assert.equal(await analytics.erase(id, db), 202);
    assert.equal((await pg.query('SELECT * FROM analytics_events')).rows.length, 0);
    assert.equal((await pg.query('SELECT * FROM analytics_jobs')).rows.length, 1);
    assert.equal((await pg.query('SELECT kind FROM analytics_jobs')).rows[0].kind, 'erase');
    assert.equal(await analytics.accept(id, envelope(), 'ip:test', db), 410);
    const other = analytics.hash('b'.repeat(64));
    await analytics.accept(other, envelope('checkin_confirmed'), 'ip:other', db);
    assert.equal((await pg.query("SELECT * FROM analytics_jobs WHERE kind='capture'")).rows.length, 0);
  } finally { await pg.close(); }
});
