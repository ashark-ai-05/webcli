import { describe, it, expect, vi } from 'vitest';
import { fetchStep } from './fetch.js';
import type { PipelineContext } from '../../types.js';
describe('fetch step', () => {
  it('constructs URL from base_url', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve({ data: [1, 2, 3] }) });
    const ctx: PipelineContext = { args: {}, source: { type: 'api', base_url: 'https://api.example.com/v1', auth: 'none' }, data: null };
    const result = await fetchStep(null, { url: '/items', params: { page: 1 } }, ctx, mockFetch);
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/v1/items?page=1', expect.objectContaining({ headers: expect.objectContaining({ 'User-Agent': expect.stringContaining('webcli') }) }));
    expect(result).toEqual({ data: [1, 2, 3] });
  });
  it('uses absolute URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve([1]) });
    await fetchStep(null, { url: 'https://api.example.com/data' }, { args: {}, source: { type: 'api', base_url: 'https://other.com', auth: 'none' }, data: null }, mockFetch);
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', expect.anything());
  });
  it('renders templates in params', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true, headers: { get: () => 'application/json' }, json: () => Promise.resolve({}) });
    await fetchStep(null, { url: '/search', params: { q: '${{ args.query }}', limit: '${{ args.limit }}' } }, { args: { query: 'ts', limit: 5 }, source: { type: 'api', base_url: 'https://api.example.com', auth: 'none' }, data: null }, mockFetch);
    expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/search?q=ts&limit=5', expect.anything());
  });
  it('throws on non-OK', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: 'Not Found' });
    await expect(fetchStep(null, { url: '/x' }, { args: {}, source: { type: 'api', base_url: 'https://api.example.com', auth: 'none' }, data: null }, mockFetch)).rejects.toThrow('404');
  });
});
