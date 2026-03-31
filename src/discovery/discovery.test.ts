import { describe, it, expect } from 'vitest';
import { inferSchema, detectFieldRole, findDataArray } from './schema-inference.js';
import { lookupKnownSite } from './known-sites.js';

describe('findDataArray', () => {
  it('finds top-level array', () => { expect(findDataArray([{ id: 1 }])!.items).toHaveLength(1); });
  it('finds nested array', () => { expect(findDataArray({ data: { items: [{ id: 1 }, { id: 2 }] } })!.path).toBe('data.items'); });
  it('returns null for primitives', () => { expect(findDataArray('hello')).toBeNull(); });
});
describe('detectFieldRole', () => {
  it('detects id', () => { expect(detectFieldRole('id', 1)).toBe('id'); });
  it('detects title', () => { expect(detectFieldRole('title', 'Hi')).toBe('title'); });
  it('detects url', () => { expect(detectFieldRole('url', 'https://x.com')).toBe('url'); });
  it('detects timestamp', () => { expect(detectFieldRole('created_at', '2026-01-01')).toBe('timestamp'); });
  it('detects score', () => { expect(detectFieldRole('score', 42)).toBe('score'); });
  it('returns other', () => { expect(detectFieldRole('foobar', 'xyz')).toBe('other'); });
});
describe('inferSchema', () => {
  it('infers from objects', () => { const s = inferSchema([{ id: 1, title: 'Hi', url: 'https://x.com', score: 5 }]); expect(s.fields.id.role).toBe('id'); expect(s.fields.title.role).toBe('title'); });
});
describe('lookupKnownSite', () => {
  it('finds coingecko', () => { expect(lookupKnownSite('https://www.coingecko.com')!.name).toBe('coingecko'); });
  it('finds hackernews', () => { expect(lookupKnownSite('https://news.ycombinator.com')!.name).toBe('hackernews'); });
  it('returns null for unknown', () => { expect(lookupKnownSite('https://unknown.example.com')).toBeNull(); });
});
