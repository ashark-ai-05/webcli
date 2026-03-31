import { describe, it, expect } from 'vitest';
import { transformStep } from './transform.js';
import type { PipelineContext } from '../../types.js';
const ctx: PipelineContext = { args: {}, source: { type: 'api', base_url: '', auth: 'none' }, data: null };
describe('transform', () => {
  it('transforms data', () => { expect(transformStep({ a: 1, b: 2 }, 'Object.entries(data).map(([k, v]) => ({ key: k, value: v }))', ctx)).toEqual([{ key: 'a', value: 1 }, { key: 'b', value: 2 }]); });
  it('accesses args', () => { expect(transformStep([1, 2, 3], 'data.map(x => x * args.multiplier)', { ...ctx, args: { multiplier: 10 } })).toEqual([10, 20, 30]); });
  it('blocks fetch', () => { expect(() => transformStep({}, "fetch('http://evil.com')", ctx)).toThrow(); });
  it('blocks process', () => { expect(() => transformStep({}, 'process.exit(1)', ctx)).toThrow(); });
  it('blocks require', () => { expect(() => transformStep({}, "require('fs')", ctx)).toThrow(); });
  it('times out', () => { expect(() => transformStep({}, 'while(true){}', ctx)).toThrow(); }, 10000);
});
