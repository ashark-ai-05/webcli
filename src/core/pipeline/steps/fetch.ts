import type { PipelineContext, FetchStepConfig } from '../../types.js';
import { renderTemplate } from '../expressions.js';
type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
export async function fetchStep(_data: unknown, config: FetchStepConfig, ctx: PipelineContext, fetchFn: FetchFn = globalThis.fetch): Promise<unknown> {
  const scope = { args: ctx.args, data: _data };
  let rawUrl = String(renderTemplate(config.url, scope));
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) { const base = ctx.source.base_url.replace(/\/+$/, ''); rawUrl = `${base}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`; }
  const url = new URL(rawUrl);
  if (config.params) { for (const [key, value] of Object.entries(config.params)) url.searchParams.set(key, String(renderTemplate(value, scope))); }
  const headers: Record<string, string> = { 'User-Agent': 'webcli/0.1.0 (+https://github.com/webcli)', 'Accept': 'application/json', ...config.headers };
  const response = await fetchFn(url.toString(), { method: config.method || 'GET', headers });
  if (!response.ok) throw new Error(`Fetch failed: ${response.status} ${response.statusText} for ${url}`);
  const ct = response.headers.get('content-type') || '';
  return ct.includes('json') ? response.json() : response.text();
}
