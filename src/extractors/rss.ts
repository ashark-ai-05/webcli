import type { ProbeResult } from '../core/types.js';
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
export interface RssItem { title: string; link: string; description: string; pubDate?: string; }

export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];
  let match;
  const rssRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  while ((match = rssRegex.exec(xml))) items.push({ title: extractTag(match[1], 'title'), link: extractTag(match[1], 'link'), description: extractTag(match[1], 'description'), pubDate: extractTag(match[1], 'pubDate') });
  if (items.length === 0) {
    const atomRegex = /<entry\b[^>]*>([\s\S]*?)<\/entry>/gi;
    while ((match = atomRegex.exec(xml))) { const lm = match[1].match(/<link[^>]*href="([^"]*)"[^>]*\/?>/); items.push({ title: extractTag(match[1], 'title'), link: lm ? lm[1] : '', description: extractTag(match[1], 'summary') || extractTag(match[1], 'content'), pubDate: extractTag(match[1], 'updated') }); }
  }
  return items;
}
function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp('<' + tag + '[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></' + tag + '>|<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>', 'i'));
  return (m?.[1] || m?.[2] || '').trim();
}
const FEED_PATHS = ['/feed', '/rss', '/feed.xml', '/rss.xml', '/atom.xml', '/index.xml'];
export class RssExtractor {
  readonly name = 'rss';
  async probe(url: string, fetchFn: FetchFn = globalThis.fetch): Promise<ProbeResult | null> {
    const base = new URL(url);
    try {
      const htmlResp = await fetchFn(url, { headers: { 'User-Agent': 'webcli/0.1.0' } });
      if (!htmlResp.ok) return null;
      const html = await htmlResp.text();
      const feedMatch = html.match(/<link[^>]*rel=["']alternate["'][^>]*type=["']application\/(rss|atom)\+xml["'][^>]*href=["']([^"']+)["'][^>]*\/?>/i) || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*type=["']application\/(rss|atom)\+xml["'][^>]*\/?>/i);
      if (feedMatch) { const href = feedMatch[2] || feedMatch[1]; const feedUrl = href.startsWith('http') ? href : new URL(href, base.origin).toString(); const feedResp = await fetchFn(feedUrl, { headers: { 'User-Agent': 'webcli/0.1.0' } }); if (feedResp.ok) { const items = parseRss(await feedResp.text()); if (items.length > 0) return { confidence: 0.85, endpoints: [{ url: feedUrl, method: 'GET', content_type: 'application/rss+xml', sample_response: items.slice(0, 3) }], auth_required: false, suggested_adapter: { source: { type: 'rss', base_url: feedUrl, auth: 'none' } } }; } }
      for (const p of FEED_PATHS) { try { const resp = await fetchFn(base.origin + p, { headers: { 'User-Agent': 'webcli/0.1.0' } }); if (!resp.ok) continue; const ct = resp.headers.get('content-type') || ''; if (ct.includes('xml') || ct.includes('rss') || ct.includes('atom')) { const items = parseRss(await resp.text()); if (items.length > 0) return { confidence: 0.85, endpoints: [{ url: base.origin + p, method: 'GET', content_type: 'application/rss+xml', sample_response: items.slice(0, 3) }], auth_required: false, suggested_adapter: { source: { type: 'rss', base_url: base.origin + p, auth: 'none' } } }; } } catch { continue; } }
      return null;
    } catch { return null; }
  }
}
