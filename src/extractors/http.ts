import type { ProbeResult } from '../core/types.js';
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
export class HttpExtractor {
  readonly name = 'http';
  async probe(url: string, fetchFn: FetchFn = globalThis.fetch): Promise<ProbeResult | null> {
    try {
      const resp = await fetchFn(url, { method: 'GET', headers: { 'User-Agent': 'webcli/0.1.0', 'Accept': 'application/json, text/html' } });
      if (!resp.ok) return null;
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('json')) return null;
      const data = await resp.json();
      const hasArray = findDataArray(data);
      return { confidence: hasArray ? 0.9 : 0.7, endpoints: [{ url, method: 'GET', content_type: ct, sample_response: data }], auth_required: false, suggested_adapter: { source: { type: 'api', base_url: new URL(url).origin, auth: 'none' } } };
    } catch { return null; }
  }
}
function findDataArray(obj: unknown, depth = 0): boolean {
  if (depth > 5) return false;
  if (Array.isArray(obj) && obj.length > 0 && typeof obj[0] === 'object') return true;
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) { for (const v of Object.values(obj as Record<string, unknown>)) { if (findDataArray(v, depth + 1)) return true; } }
  return false;
}
