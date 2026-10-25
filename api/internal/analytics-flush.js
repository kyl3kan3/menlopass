const analytics = require('../../server/analytics');
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).end();
  if (!analytics.cronAuthorized(req.headers.authorization)) return res.status(401).end();
  try {
    const processed = await analytics.flush();
    await analytics.database().query("DELETE FROM analytics_limits WHERE day < CURRENT_DATE - 2");
    return res.status(200).json({ processed });
  } catch { return res.status(503).json({ error: 'analytics_unavailable' }); }
};
