import * as cheerio from 'cheerio';
import type { ProbeResult } from '../core/types.js';
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

export function extractJsonLd(html: string): Record<string, unknown>[] {
  const results: Record<string, unknown>[] = [];
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m; while ((m = regex.exec(html))) { try { const p = JSON.parse(m[1]); Array.isArray(p) ? results.push(...p) : results.push(p); } catch {} }
  return results;
}
export interface RepeatingGroup { selector: string; count: number; sampleFields: string[]; }
export function detectRepeatingElements(html: string): RepeatingGroup[] {
  const $ = cheerio.load(html); const groups: RepeatingGroup[] = [];
  $('ul, ol, div, section, main').each((_, parent) => {
    const children = $(parent).children(); if (children.length < 3) return;
    const tags = new Map<string, number>(); children.each((_, child) => { const key = $(child).prop('tagName')?.toLowerCase() || ''; tags.set(key, (tags.get(key) || 0) + 1); });
    for (const [tag, count] of tags) { if (count < 3) continue; const id = $(parent).attr('id'); const cls = $(parent).attr('class')?.split(/\s+/)[0]; const sel = id ? '#' + id + ' > ' + tag : cls ? '.' + cls + ' > ' + tag : ($(parent).prop('tagName')?.toLowerCase() || 'div') + ' > ' + tag; groups.push({ selector: sel, count, sampleFields: [] }); }
  });
  return groups;
}
export class HtmlExtractor {
  readonly name = 'html';
  async probe(url: string, fetchFn: FetchFn = globalThis.fetch): Promise<ProbeResult | null> {
    try {
      const resp = await fetchFn(url, { headers: { 'User-Agent': 'webcli/0.1.0', 'Accept': 'text/html' } }); if (!resp.ok) return null;
      const html = await resp.text(); const $ = cheerio.load(html);
      if ($('body').text().trim().length < 50 && $('script').length > 2) return null;
      const jsonLd = extractJsonLd(html);
      if (jsonLd.length > 0) return { confidence: 0.7, endpoints: [{ url, method: 'GET', content_type: 'text/html+json-ld', sample_response: jsonLd }], auth_required: false, suggested_adapter: { source: { type: 'html', base_url: url, auth: 'none' } } };
      const groups = detectRepeatingElements(html);
      if (groups.length > 0) return { confidence: 0.5, endpoints: [{ url, method: 'GET', content_type: 'text/html', sample_response: groups }], auth_required: false, suggested_adapter: { source: { type: 'html', base_url: url, auth: 'none' } } };
      return null;
    } catch { return null; }
  }
}
