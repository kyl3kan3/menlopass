export type MenoCompassQuickRoute = 'checkin' | 'journey';

const quickRouteAliases: Record<string, MenoCompassQuickRoute> = {
  checkin: 'checkin',
  'check-in': 'checkin',
  insights: 'journey',
  journey: 'journey',
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
