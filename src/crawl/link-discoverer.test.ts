import { describe, it, expect } from 'vitest';
import { discoverLinks, discoverApiPagination } from './link-discoverer.js';

describe('discoverLinks', () => {
  const config = { sameDomainOnly: true, maxDepth: 3, respectRobots: true };

  it('extracts same-domain links from HTML', () => {
    const html = `<html><body>
      <a href="/page1">P1</a>
      <a href="/page2">P2</a>
      <a href="https://other.com/x">External</a>
    </body></html>`;
    const result = discoverLinks(html, 'https://example.com', config);
    expect(result.links).toEqual([
      'https://example.com/page1',
      'https://example.com/page2',
    ]);
  });

  it('skips javascript: and mailto: links', () => {
    const html = `<a href="javascript:void(0)">JS</a><a href="mailto:a@b.com">Email</a><a href="/ok">OK</a>`;
    const result = discoverLinks(html, 'https://example.com', config);
    expect(result.links).toEqual(['https://example.com/ok']);
  });

  it('filters by follow pattern', () => {
    const html = `<a href="/blog/post1">P1</a><a href="/about">About</a><a href="/blog/post2">P2</a>`;
    const result = discoverLinks(html, 'https://example.com', { ...config, followPattern: '/blog/*' });
    expect(result.links).toEqual([
      'https://example.com/blog/post1',
      'https://example.com/blog/post2',
    ]);
  });

  it('detects rel=next pagination', () => {
    const html = `<a href="/page/1">1</a><a href="/page/2" rel="next">Next</a>`;
    const result = discoverLinks(html, 'https://example.com', config);
    expect(result.paginationNext).toBe('https://example.com/page/2');
  });

  it('deduplicates links', () => {
    const html = `<a href="/same">A</a><a href="/same">B</a>`;
    const result = discoverLinks(html, 'https://example.com', config);
    expect(result.links).toEqual(['https://example.com/same']);
  });
});

describe('discoverApiPagination', () => {
  it('detects Link header pagination', () => {
    const headers = { 'link': '<https://api.example.com/items?page=2>; rel="next"' };
    expect(discoverApiPagination({}, headers, 'https://api.example.com')).toBe('https://api.example.com/items?page=2');
  });

  it('detects next_page_url in JSON', () => {
    const data = { items: [], next_page_url: 'https://api.example.com/items?page=3' };
    expect(discoverApiPagination(data, {}, 'https://api.example.com')).toBe('https://api.example.com/items?page=3');
  });

  it('returns null when no pagination found', () => {
    expect(discoverApiPagination({ items: [] }, {}, 'https://api.example.com')).toBeNull();
  });
});
