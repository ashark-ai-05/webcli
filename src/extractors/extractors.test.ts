import { describe, it, expect, vi } from 'vitest';
import { HttpExtractor } from './http.js';
import { parseRss } from './rss.js';
import { extractJsonLd, detectRepeatingElements } from './html.js';
import { ExtractorCascade } from './cascade.js';

describe('HttpExtractor', () => {
  it('detects JSON API', async () => {
    const ext = new HttpExtractor();
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve({ data: [{ id: 1 }] }) });
    const result = await ext.probe('https://api.example.com/items', mockFetch);
    expect(result).not.toBeNull();
    expect(result!.confidence).toBeGreaterThan(0.5);
  });
  it('returns null for HTML', async () => {
    const ext = new HttpExtractor();
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'text/html' }, text: () => Promise.resolve('<html></html>') });
    expect(await ext.probe('https://example.com', mockFetch)).toBeNull();
  });
});

describe('parseRss', () => {
  it('parses RSS 2.0', () => {
    const items = parseRss('<rss><channel><item><title>A</title><link>https://a.com</link><description>Desc</description></item></channel></rss>');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('A');
  });
  it('parses Atom', () => {
    const items = parseRss('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>B</title><link href="https://b.com"/><summary>Sum</summary></entry></feed>');
    expect(items).toHaveLength(1);
    expect(items[0].title).toBe('B');
  });
});

describe('extractJsonLd', () => {
  it('extracts JSON-LD', () => {
    const results = extractJsonLd('<html><head><script type="application/ld+json">{"@type":"Article","headline":"Test"}</script></head></html>');
    expect(results).toHaveLength(1);
    expect(results[0].headline).toBe('Test');
  });
});

describe('detectRepeatingElements', () => {
  it('finds repeating list items', () => {
    const groups = detectRepeatingElements('<html><body><ul><li class="post">A</li><li class="post">B</li><li class="post">C</li></ul></body></html>');
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].count).toBe(3);
  });
});

describe('ExtractorCascade', () => {
  it('returns first high-confidence result', async () => {
    const cascade = new ExtractorCascade([
      { name: 'http', probe: vi.fn().mockResolvedValue({ confidence: 0.9, endpoints: [{ url: 'x', method: 'GET', content_type: 'json' }], auth_required: false, suggested_adapter: {} }) },
      { name: 'rss', probe: vi.fn().mockResolvedValue(null) },
    ]);
    const result = await cascade.probe('https://api.example.com');
    expect(result!.extractor).toBe('http');
  });
  it('returns null when all fail', async () => {
    const cascade = new ExtractorCascade([{ name: 'http', probe: vi.fn().mockResolvedValue(null) }]);
    expect(await cascade.probe('https://empty.com')).toBeNull();
  });
});
