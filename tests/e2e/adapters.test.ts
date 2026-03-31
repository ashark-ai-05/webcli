import { describe, it, expect } from 'vitest';
import { loadAdapterFromFile, validateAdapter } from '../../src/core/adapter/loader.js';
import { runAdapter } from '../../src/core/runner.js';
import * as path from 'node:path';
const ADAPTERS_DIR = path.resolve(import.meta.dirname, '../../adapters');

describe('hackernews search (e2e)', () => {
  it('validates and returns live results', async () => {
    const adapter = loadAdapterFromFile(path.join(ADAPTERS_DIR, 'hackernews', 'search.yaml'));
    expect(validateAdapter(adapter)).toEqual([]);
    const result = await runAdapter(adapter, { query: 'typescript', limit: 3 }) as Record<string, unknown>[];
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(3);
    expect(result[0]).toHaveProperty('title');
    expect(result[0]).toHaveProperty('score');
  }, 15000);
});

describe('coingecko prices (e2e)', () => {
  it('returns live Bitcoin price', async () => {
    const adapter = loadAdapterFromFile(path.join(ADAPTERS_DIR, 'coingecko', 'prices.yaml'));
    expect(validateAdapter(adapter)).toEqual([]);
    const result = await runAdapter(adapter, { coins: 'bitcoin', currency: 'usd' }) as Record<string, unknown>[];
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('bitcoin');
    expect(typeof result[0].price).toBe('number');
  }, 15000);
});

describe('bluesky search (e2e)', () => {
  it('returns search results', async () => {
    const adapter = loadAdapterFromFile(path.join(ADAPTERS_DIR, 'bluesky', 'search.yaml'));
    expect(validateAdapter(adapter)).toEqual([]);
    const result = await runAdapter(adapter, { query: 'typescript', limit: 3 }) as Record<string, unknown>[];
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('handle');
  }, 15000);
});
