import { describe, it, expect } from 'vitest';
import { executePipeline } from './executor.js';
import type { PipelineContext, PipelineStep } from '../types.js';
describe('executePipeline', () => {
  const baseCtx: PipelineContext = { args: { limit: 2 }, source: { type: 'api', base_url: 'https://api.example.com', auth: 'none' }, data: null };
  it('select -> map -> limit', async () => {
    const data = { response: { items: [{ title: 'A', score: 10 }, { title: 'B', score: 20 }, { title: 'C', score: 30 }] } };
    const pipeline: PipelineStep[] = [{ select: 'response.items' }, { map: { name: '${{ item.title }}', points: '${{ item.score }}' } }, { limit: '${{ args.limit }}' }];
    expect(await executePipeline(pipeline, baseCtx, data)).toEqual([{ name: 'A', points: 10 }, { name: 'B', points: 20 }]);
  });
  it('filter -> sort', async () => {
    const pipeline: PipelineStep[] = [{ filter: 'item.score > 10' }, { sort: { field: 'score', order: 'desc' } }];
    expect(await executePipeline(pipeline, baseCtx, [{ name: 'C', score: 5 }, { name: 'A', score: 15 }, { name: 'B', score: 25 }])).toEqual([{ name: 'B', score: 25 }, { name: 'A', score: 15 }]);
  });
  it('transform', async () => {
    expect(await executePipeline([{ transform: 'Object.keys(data).map(k => ({ key: k }))' }], baseCtx, { a: 1, b: 2 })).toEqual([{ key: 'a' }, { key: 'b' }]);
  });
  it('rejects unknown steps', async () => {
    await expect(executePipeline([{ unknownStep: 'foo' }] as unknown as PipelineStep[], baseCtx, null)).rejects.toThrow('Unknown pipeline step');
  });
});
