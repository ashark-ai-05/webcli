import { describe, it, expect, vi } from 'vitest';
import { executeCrawl } from './executor.js';

describe('executeCrawl', () => {
  it('crawls start URLs and extracts data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json', forEach: (cb: (v: string, k: string) => void) => {} },
      clone: function() { return this; },
      json: () => Promise.resolve({ items: [{ id: 1 }, { id: 2 }] }),
      text: () => Promise.resolve(''),
    });

    const result = await executeCrawl({
      startUrls: ['https://api.example.com/items'],
      maxDepth: 0,
      maxPages: 10,
      concurrency: 1,
      delayMs: 0,
      sameDomainOnly: true,
      respectRobots: true,
      extractFn: async (_url, response) => {
        const data = await response.json();
        return (data as { items: unknown[] }).items;
      },
      fetchFn: mockFetch,
    });

    expect(result.data).toEqual([{ id: 1 }, { id: 2 }]);
    expect(result.status.processed).toBe(1);
  });

  it('follows links in HTML pages', async () => {
    const pages: Record<string, string> = {
      'https://example.com/': '<html><body><a href="/page2">P2</a></body></html>',
      'https://example.com/page2': '<html><body><p>Page 2</p></body></html>',
    };
    const mockFetch = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      headers: { get: () => 'text/html', forEach: (cb: (v: string, k: string) => void) => { cb('text/html', 'content-type'); } },
      clone: function() { return { ...this, text: () => Promise.resolve(pages[url] || '') }; },
      text: () => Promise.resolve(pages[url] || ''),
    }));

    const extracted: string[] = [];
    const result = await executeCrawl({
      startUrls: ['https://example.com/'],
      maxDepth: 2,
      maxPages: 10,
      concurrency: 1,
      delayMs: 0,
      sameDomainOnly: true,
      respectRobots: true,
      extractFn: async (url) => { extracted.push(url); return [{ url }]; },
      fetchFn: mockFetch,
    });

    expect(extracted).toContain('https://example.com/');
    expect(extracted).toContain('https://example.com/page2');
    expect(result.status.processed).toBe(2);
  });

  it('respects maxPages limit', async () => {
    const mockFetch = vi.fn().mockImplementation(async (url: string) => ({
      ok: true,
      headers: { get: () => 'text/html', forEach: () => {} },
      clone: function() { return this; },
      text: () => Promise.resolve(`<html><a href="${url}next">Next</a></html>`),
    }));

    const result = await executeCrawl({
      startUrls: ['https://example.com/1'],
      maxDepth: 100,
      maxPages: 3,
      concurrency: 1,
      delayMs: 0,
      sameDomainOnly: true,
      respectRobots: true,
      extractFn: async () => [{ ok: true }],
      fetchFn: mockFetch,
    });

    expect(result.status.processed).toBeLessThanOrEqual(3);
  });

  it('reports progress', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json', forEach: () => {} },
      clone: function() { return this; },
      json: () => Promise.resolve([]),
      text: () => Promise.resolve(''),
    });

    const progress: Array<{ processed: number }> = [];
    await executeCrawl({
      startUrls: ['https://api.example.com/a', 'https://api.example.com/b'],
      maxDepth: 0,
      maxPages: 10,
      concurrency: 1,
      delayMs: 0,
      sameDomainOnly: true,
      respectRobots: true,
      extractFn: async () => [],
      fetchFn: mockFetch,
      onProgress: (s) => progress.push({ processed: s.processed }),
    });

    expect(progress.length).toBe(2);
    expect(progress[1].processed).toBe(2);
  });
});
