export type MenoCompassQuickRoute = 'checkin' | 'dossier';

const quickRouteAliases: Record<string, MenoCompassQuickRoute> = {
  checkin: 'checkin',
  'check-in': 'checkin',
  log: 'checkin',
  insights: 'dossier',
  journey: 'dossier',
  dossier: 'dossier',
};

export function quickRouteFromUrl(url: string | null | undefined): MenoCompassQuickRoute | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol.toLowerCase() !== 'menlopass:') return null;
    if (parsed.username || parsed.password || parsed.port) return null;
    const candidate = `${parsed.hostname}${parsed.pathname}`
      .replace(/^\/+|\/+$/g, '')
      .toLowerCase();
    return quickRouteAliases[candidate] ?? null;
  } catch {
    return null;
  }
}
