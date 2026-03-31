import { describe, it, expect } from 'vitest';
import { runAdapter } from './runner.js';
import type { AdapterDefinition } from './types.js';
describe('runAdapter', () => {
  it('executes pipeline and returns data', async () => {
    const adapter: AdapterDefinition = {
      site: 'test', name: 'simple', description: 'Test', version: 1, created_by: 'manual',
      source: { type: 'api', base_url: 'https://example.com', auth: 'none' },
      args: {}, schema: { type: 'test', entity: 'item', fields: {} },
      pipeline: [{ select: 'items' }, { limit: 2 }], columns: ['id', 'name'],
    };
    const result = await runAdapter(adapter, {}, { items: [{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 3, name: 'c' }] });
    expect(result).toEqual([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]);
  });
});
