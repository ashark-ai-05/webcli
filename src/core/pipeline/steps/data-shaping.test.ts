import { describe, it, expect } from 'vitest';
import { selectStep } from './select.js'; import { mapStep } from './map.js'; import { filterStep } from './filter.js';
import { sortStep } from './sort.js'; import { limitStep } from './limit.js'; import { flattenStep } from './flatten.js'; import { dedupeStep } from './dedupe.js';
import type { PipelineContext } from '../../types.js';
const ctx: PipelineContext = { args: {}, source: { type: 'api', base_url: '', auth: 'none' }, data: null };
describe('select', () => {
  it('extracts nested path', () => { expect(selectStep({ response: { data: { items: [1, 2, 3] } } }, 'response.data.items', ctx)).toEqual([1, 2, 3]); });
  it('returns undefined for missing', () => { expect(selectStep({ a: 1 }, 'b.c', ctx)).toBeUndefined(); });
});
describe('map', () => {
  it('reshapes items', () => { expect(mapStep([{ name: 'Alice', score: 100 }, { name: 'Bob', score: 200 }], { user: '${{ item.name }}', points: '${{ item.score * 2 }}' }, ctx)).toEqual([{ user: 'Alice', points: 200 }, { user: 'Bob', points: 400 }]); });
  it('provides index', () => { expect(mapStep([{ x: 'a' }], { rank: '${{ index + 1 }}' }, ctx)).toEqual([{ rank: 1 }]); });
});
describe('filter', () => { it('keeps matching', () => { expect(filterStep([{ score: 10 }, { score: 50 }, { score: 30 }], 'item.score > 20', ctx)).toEqual([{ score: 50 }, { score: 30 }]); }); });
describe('sort', () => {
  it('ascending', () => { expect(sortStep([{ v: 3 }, { v: 1 }, { v: 2 }], { field: 'v' }, ctx)).toEqual([{ v: 1 }, { v: 2 }, { v: 3 }]); });
  it('descending', () => { expect(sortStep([{ v: 1 }, { v: 3 }, { v: 2 }], { field: 'v', order: 'desc' }, ctx)).toEqual([{ v: 3 }, { v: 2 }, { v: 1 }]); });
});
describe('limit', () => {
  it('caps count', () => { expect(limitStep([1, 2, 3, 4, 5], 3, ctx)).toEqual([1, 2, 3]); });
  it('expression limit', () => { expect(limitStep([1, 2, 3, 4, 5], '${{ args.limit }}', { ...ctx, args: { limit: 2 } })).toEqual([1, 2]); });
});
describe('flatten', () => { it('flattens arrays', () => { expect(flattenStep([{ id: 1, tags: ['a', 'b'] }, { id: 2, tags: ['c'] }], 'tags', ctx)).toEqual(['a', 'b', 'c']); }); });
describe('dedupe', () => { it('removes duplicates', () => { expect(dedupeStep([{ id: 1, name: 'a' }, { id: 2, name: 'b' }, { id: 1, name: 'dup' }], 'id', ctx)).toEqual([{ id: 1, name: 'a' }, { id: 2, name: 'b' }]); }); });
