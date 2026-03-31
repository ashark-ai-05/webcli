import { describe, it, expect } from 'vitest';
import { parseAdapter, validateAdapter } from './loader.js';
import { AdapterRegistry } from './registry.js';

const VALID_YAML = `
site: hackernews
name: top
description: Top stories
version: 1
created_by: manual

source:
  type: api
  base_url: https://hacker-news.firebaseio.com/v0
  auth: none

args:
  limit:
    type: number
    default: 10

schema:
  type: feed
  entity: story
  fields:
    id: { role: id }
    title: { role: title }
    score: { role: score }

pipeline:
  - fetch:
      url: /topstories.json
  - limit: 10

columns: [title, score]
`;

describe('parseAdapter', () => {
  it('parses valid YAML', () => { const a = parseAdapter(VALID_YAML); expect(a.site).toBe('hackernews'); expect(a.pipeline).toHaveLength(2); });
});
describe('validateAdapter', () => {
  it('passes for valid', () => { expect(validateAdapter(parseAdapter(VALID_YAML))).toEqual([]); });
  it('fails for missing site', () => { const a = parseAdapter(VALID_YAML); a.site = ''; expect(validateAdapter(a).some(e => e.includes('site'))).toBe(true); });
  it('fails for empty pipeline', () => { const a = parseAdapter(VALID_YAML); a.pipeline = []; expect(validateAdapter(a).some(e => e.includes('pipeline'))).toBe(true); });
  it('fails for >20 steps', () => { const a = parseAdapter(VALID_YAML); a.pipeline = Array(21).fill({ limit: 10 }); expect(validateAdapter(a).some(e => e.includes('20'))).toBe(true); });
});
describe('AdapterRegistry', () => {
  it('registers and gets', () => { const r = new AdapterRegistry(); const a = parseAdapter(VALID_YAML); r.register(a); expect(r.get('hackernews', 'top')).toBe(a); expect(r.get('x', 'y')).toBeUndefined(); });
  it('lists site', () => { const r = new AdapterRegistry(); r.register(parseAdapter(VALID_YAML)); expect(r.listSite('hackernews')).toHaveLength(1); });
  it('lists sites', () => { const r = new AdapterRegistry(); r.register(parseAdapter(VALID_YAML)); expect(r.listSites()).toEqual(['hackernews']); });
});
