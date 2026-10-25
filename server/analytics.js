const { Pool } = require('pg');
const { createHash, createHmac, randomUUID, timingSafeEqual } = require('node:crypto');
const { validateEnvelope, providerEligible, providerProperties } = require('../shared/tracking-contract');
const hash = value => createHash('sha256').update(value).digest('hex');
const pseudonym = id => 'peri_' + hash(`peri:analytics:v1:${id}`);
let pool;
function database() {
  if (!process.env.DATABASE_URL) throw new Error('Database not configured');
  return pool ||= new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 5000, statement_timeout: 10000 });
}
async function transaction(action, db = database()) {
  const client = await db.connect();
  try { await client.query('BEGIN'); const result = await action(client); await client.query('COMMIT'); return result; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
async function lock(client, id) { await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))', [id]); }
async function limit(client, bucket, max) {
  const result = await client.query(`INSERT INTO analytics_limits(bucket, count) VALUES($1, 1)
    ON CONFLICT(bucket, day) DO UPDATE SET count = analytics_limits.count + 1 RETURNING count`, [bucket]);
  return result.rows[0].count <= max;
}
async function accept(id, envelope, ipBucket, db) {
  return transaction(async client => {
    await lock(client, id);
    await client.query('INSERT INTO analytics_installations(id) VALUES($1) ON CONFLICT DO NOTHING', [id]);
    const installation = await client.query('SELECT deleted_at FROM analytics_installations WHERE id=$1', [id]);
    if (installation.rows[0].deleted_at) return 410;
    const existing = await client.query('SELECT installation_id FROM analytics_events WHERE id=$1', [envelope.id]);
    if (existing.rows.length) return existing.rows[0].installation_id === id ? 202 : 409;
    if (!await limit(client, `install:${id}`, 300) || !await limit(client, ipBucket, 3000)) return 429;
    await client.query('INSERT INTO analytics_events(id, installation_id, envelope) VALUES($1,$2,$3)', [envelope.id, id, envelope]);
    if (providerEligible(envelope)) await client.query('INSERT INTO analytics_jobs(id, installation_id, kind, envelope) VALUES($1,$2,\'capture\',$3)', [envelope.id, id, envelope]);
    return 202;
  }, db);
}
async function erase(id, db) {
  return transaction(async client => {
    await lock(client, id);
    await client.query(`INSERT INTO analytics_installations(id, deleted_at) VALUES($1, now())
      ON CONFLICT(id) DO UPDATE SET deleted_at = COALESCE(analytics_installations.deleted_at, now())`, [id]);
    await client.query('DELETE FROM analytics_jobs WHERE installation_id=$1 AND kind=\'capture\'', [id]);
    await client.query('DELETE FROM analytics_events WHERE installation_id=$1', [id]);
    await client.query('DELETE FROM analytics_limits WHERE bucket=$1', [`install:${id}`]);
    await client.query(`INSERT INTO analytics_jobs(id, installation_id, kind) VALUES($1,$2,'erase') ON CONFLICT DO NOTHING`, [randomUUID(), id]);
    return 202;
  }, db);
}
function providerConfig() {
  const host = process.env.POSTHOG_HOST;
  if (!['https://us.i.posthog.com', 'https://eu.i.posthog.com'].includes(host) || !process.env.POSTHOG_API_KEY) throw new Error('Provider not configured');
  return { host, key: process.env.POSTHOG_API_KEY, api: host.replace('.i.', '.') };
}
async function jsonRequest(url, options) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Provider request failed');
  // PostHog deletion can succeed with an empty 200/202 response, not just 204.
  const body = await response.text();
  return body.trim() ? JSON.parse(body) : null;
}
async function deliver(job, client) {
  const config = providerConfig();
  const distinct_id = pseudonym(job.installation_id);
  const capture = data => jsonRequest(`${config.host}/i/v0/e/`, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: config.key, ...data }) });
  if (job.kind === 'capture') {
    await capture({ uuid: job.id, event: `menocompass.${job.envelope.name}`, timestamp: job.envelope.timestamp,
      properties: { ...providerProperties(job.envelope), distinct_id } });
    await client.query('DELETE FROM analytics_jobs WHERE id=$1', [job.id]);
    return;
  }
  const token = process.env.POSTHOG_PERSONAL_API_KEY;
  const project = process.env.POSTHOG_PROJECT_ID;
  if (!token || !/^\d+$/.test(project || '')) throw new Error('Erasure not configured');
  if (job.stage === 'pending') {
    // Personless events require a temporary empty person before provider erasure.
    await capture({ uuid: job.id, event: '$identify', properties: { distinct_id, $set: {}, $process_person_profile: true, $geoip_disable: true } });
    await client.query("UPDATE analytics_jobs SET stage='person_pending', due_at=now()+interval '10 minutes' WHERE id=$1", [job.id]);
    return;
  }
  const base = `${config.api}/api/projects/${project}/persons/`;
  const headers = { Authorization: `Bearer ${token}` };
  const people = await jsonRequest(`${base}?distinct_id=${encodeURIComponent(distinct_id)}`, { headers });
  if (!Array.isArray(people.results)) throw new Error('Invalid provider response');
  if (!people.results.length && job.stage !== 'deleting') throw new Error('Waiting for provider identity');
  await client.query("UPDATE analytics_jobs SET stage='deleting' WHERE id=$1", [job.id]);
  for (const person of people.results) {
    if (!/^[a-f0-9-]{36}$/i.test(person.id)) throw new Error('Invalid provider identity');
    await jsonRequest(`${base}${person.id}/?delete_events=true&delete_recordings=true`, { method: 'DELETE', headers });
  }
  await client.query("UPDATE analytics_jobs SET stage='done', envelope=NULL WHERE id=$1", [job.id]);
}
async function flush(db = database(), delivery = deliver, budget = 20000) {
  const started = Date.now(); let processed = 0;
  while (processed < 100 && Date.now() - started < budget) {
    const found = await transaction(async client => {
      // Row locks are transaction-scoped leases and release on serverless termination.
      const result = await client.query("SELECT * FROM analytics_jobs WHERE stage <> 'done' AND due_at <= now() ORDER BY due_at LIMIT 1 FOR UPDATE SKIP LOCKED");
      const job = result.rows[0]; if (!job) return false;
      const acquired = await client.query('SELECT pg_try_advisory_xact_lock(hashtextextended($1, 0)) AS locked', [job.installation_id]);
      if (!acquired.rows[0].locked) return false;
      // Deletion takes the same lock. No accepted capture may run after its tombstone.
      const state = await client.query('SELECT deleted_at FROM analytics_installations WHERE id=$1', [job.installation_id]);
      if (job.kind === 'capture' && state.rows[0].deleted_at) await client.query('DELETE FROM analytics_jobs WHERE id=$1', [job.id]);
      else {
        try { await delivery(job, client); }
        catch { await client.query("UPDATE analytics_jobs SET attempts=attempts+1, due_at=now()+($2 * interval '1 second') WHERE id=$1", [job.id, Math.min(86400, 60 * 2 ** Math.min(job.attempts, 10))]); }
      }
      return true;
    }, db);
    if (!found) break;
    processed++;
  }
  return processed;
}
function cronAuthorized(value) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !value) return false;
  const a = Buffer.from(value), b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && timingSafeEqual(a, b);
}
module.exports = { hash, pseudonym, validateEnvelope, accept, erase, flush, database, cronAuthorized,
  ipBucket: ip => { if (!process.env.ANALYTICS_RATE_SECRET) throw new Error('Rate limiter not configured');
    return 'ip:' + createHmac('sha256', process.env.ANALYTICS_RATE_SECRET).update(`${new Date().toISOString().slice(0,10)}:${ip}`).digest('hex'); } };
