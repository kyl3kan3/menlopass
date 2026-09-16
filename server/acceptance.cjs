// Opt-in live acceptance check. Uses only a fresh synthetic installation.
// Run with the production API URL and server environment loaded.
const assert = require('node:assert/strict');
const { randomBytes, randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const analytics = require('./analytics');
const contract = require('../shared/tracking-contract');
const base = process.env.ANALYTICS_API_URL;
const statePath = path.join(__dirname, '../test-results/analytics-live.json');
async function main() {
  assert.ok(base?.startsWith('https://'), 'Set ANALYTICS_API_URL');
  const db = analytics.database();
  try {
    if (process.argv.includes('--check-erasure')) {
      const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
      const response = await fetch(`${base}/api/internal/analytics-flush`, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` } });
      assert.equal(response.status, 200);
      const jobs = await db.query('SELECT kind, stage, attempts FROM analytics_jobs WHERE installation_id=$1', [state.installationId]);
      console.log(JSON.stringify({ erasure: jobs.rows }));
      assert.equal(jobs.rows[0]?.stage, 'done', 'Provider erasure has not completed');
      const people = await fetch(`https://us.posthog.com/api/projects/${process.env.POSTHOG_PROJECT_ID}/persons/?distinct_id=${state.pseudonym}`, { headers: { Authorization: `Bearer ${process.env.POSTHOG_PERSONAL_API_KEY}` } });
      assert.equal(people.status, 200);
      assert.equal((await people.json()).results.length, 0);
      state.erasureVerifiedAt = new Date().toISOString();
      fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
      return;
    }
    const bearer = randomBytes(32).toString('hex');
    const id = analytics.hash(bearer);
    const headers = { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' };
    const envelope = name => ({ id: randomUUID(), name, timestamp: new Date().toISOString(), properties: contract.project(name), context: {
      sessionId: randomUUID(), appVersion: '1.2.1', buildNumber: 'acceptance', platform: 'ios', osVersion: 'test',
      runtimeVersion: '1.2.1-native-tracking-1', updateId: 'embedded', buildChannel: 'acceptance', embedded: true,
    } });
    const send = body => fetch(`${base}/api/analytics`, { method: 'POST', headers, body: JSON.stringify(body) });
    assert.equal((await fetch(`${base}/api/analytics`, { method: 'POST' })).status, 401);
    assert.equal((await fetch(`${base}/api/internal/analytics-flush`)).status, 401);
    const invalid = envelope('app_launched'); invalid.properties.unapproved = 'synthetic';
    assert.equal((await send(invalid)).status, 400);
    const body = envelope('app_launched');
    const results = await Promise.all(Array.from({ length: 8 }, () => send(body)));
    assert.deepEqual(results.map(r => r.status), Array(8).fill(202));
    assert.equal(Number((await db.query('SELECT count(*) FROM analytics_events WHERE installation_id=$1', [id])).rows[0].count), 1);
    assert.equal(Number((await db.query("SELECT count(*) FROM analytics_jobs WHERE installation_id=$1 AND kind='capture'", [id])).rows[0].count), 0);
    const firstParty = envelope('checkin_confirmed');
    assert.equal((await send(firstParty)).status, 202);
    assert.equal(Number((await db.query('SELECT count(*) FROM analytics_jobs WHERE id=$1', [firstParty.id])).rows[0].count), 0);
    const concurrent = await Promise.all([send(envelope('session_started')), fetch(`${base}/api/analytics`, { method: 'DELETE', headers })]);
    assert.ok([202, 410].includes(concurrent[0].status));
    assert.equal(concurrent[1].status, 202);
    assert.equal((await send(body)).status, 410);
    assert.equal(Number((await db.query('SELECT count(*) FROM analytics_events WHERE installation_id=$1', [id])).rows[0].count), 0);
    assert.equal(Number((await db.query("SELECT count(*) FROM analytics_jobs WHERE installation_id=$1 AND kind='capture'", [id])).rows[0].count), 0);
    const jobs = await db.query('SELECT kind, stage, attempts FROM analytics_jobs WHERE installation_id=$1', [id]);
    assert.equal(jobs.rows[0]?.stage, 'person_pending');
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    const report = { verifiedAt: new Date().toISOString(), api: base, installationId: id, pseudonym: analytics.pseudonym(id), eventId: body.id,
      checks: ['authentication', 'strict validation', 'eight concurrent duplicate requests', 'provider delivery', 'first-party-only exclusion', 'concurrent capture/deletion', 'tombstone rejection'], erasure: jobs.rows };
    fs.writeFileSync(statePath, JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
  } finally { await db.end(); }
}
main().catch(error => { console.error(error.name, error.message); process.exitCode = 1; });
