import knownSitesData from './known-sites.json';
export interface KnownSiteInfo { name: string; api_base: string; auth: string; docs: string; endpoints: string[]; }
const sites = knownSitesData as Record<string, KnownSiteInfo>;
export function lookupKnownSite(urlStr: string): KnownSiteInfo | null {
  let hostname: string; try { hostname = new URL(urlStr).hostname; } catch { return null; }
  if (sites[hostname]) return sites[hostname];
  const noWww = hostname.replace(/^www\./, '');
  if (sites[noWww]) return sites[noWww];
  const parts = hostname.split('.'); for (let i = 1; i < parts.length; i++) { const d = parts.slice(i).join('.'); if (sites[d]) return sites[d]; }
  return null;
}
