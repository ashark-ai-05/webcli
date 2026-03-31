import { describe, it, expect } from 'vitest';
import { diffSnapshots } from './diff-engine.js';
import { computeNextInterval } from '../scheduler/adaptive.js';

describe('diffSnapshots', () => {
  it('detects added', () => { const d = diffSnapshots([{ id: 1 }], [{ id: 1 }, { id: 2, title: 'B' }], 'id'); expect(d.added).toHaveLength(1); expect(d.removed).toHaveLength(0); });
  it('detects removed', () => { const d = diffSnapshots([{ id: 1 }, { id: 2 }], [{ id: 1 }], 'id'); expect(d.removed).toHaveLength(1); });
  it('detects changed', () => { const d = diffSnapshots([{ id: 1, score: 10 }], [{ id: 1, score: 20 }], 'id'); expect(d.changed).toHaveLength(1); expect(d.changed[0].fields.score).toEqual({ old: 10, new: 20 }); });
  it('reports unchanged', () => { expect(diffSnapshots([{ id: 1 }], [{ id: 1 }], 'id').unchanged_count).toBe(1); });
});
describe('computeNextInterval', () => {
  it('halves on high volatility', () => { expect(computeNextInterval({ currentInterval: 60000, minInterval: 10000, maxInterval: 3600000, changeRatio: 0.6 })).toBe(30000); });
  it('keeps on moderate', () => { expect(computeNextInterval({ currentInterval: 60000, minInterval: 10000, maxInterval: 3600000, changeRatio: 0.2 })).toBe(60000); });
  it('increases on no changes', () => { expect(computeNextInterval({ currentInterval: 60000, minInterval: 10000, maxInterval: 3600000, changeRatio: 0 })).toBe(90000); });
  it('respects min', () => { expect(computeNextInterval({ currentInterval: 15000, minInterval: 10000, maxInterval: 3600000, changeRatio: 0.8 })).toBe(10000); });
  it('respects max', () => { expect(computeNextInterval({ currentInterval: 3000000, minInterval: 10000, maxInterval: 3600000, changeRatio: 0 })).toBe(3600000); });
});
