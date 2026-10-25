const analytics = require('../server/analytics');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!['POST', 'DELETE'].includes(req.method)) return res.status(405).end();
  const match = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
  if (!match) return res.status(401).end();
  if (Number(req.headers['content-length'] || 0) > 8192) return res.status(413).end();
  try {
    const id = analytics.hash(match[1]);
    let status;
    if (req.method === 'DELETE') status = await analytics.erase(id);
    else {
      let body;
      try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
      catch { return res.status(400).end(); }
      if (JSON.stringify(body || {}).length > 8192 || !analytics.validateEnvelope(body, (process.env.ANALYTICS_PRODUCT_IDS || '').split(',').filter(Boolean))) return res.status(400).end();
      status = await analytics.accept(id, body, analytics.ipBucket(req.headers['x-vercel-forwarded-for'] || req.socket?.remoteAddress || 'unknown'));
    }
    // Work stays inside the request lifetime; the durable job survives a timeout.
    if (status === 202) await analytics.flush(undefined, undefined, 1000).catch(() => {});
    return res.status(status).json({ accepted: status === 202 });
  } catch { return res.status(503).json({ error: 'analytics_unavailable' }); }
};
