import type { PipelineContext, SortStepConfig } from '../../types.js';
export function sortStep(data: unknown[], config: SortStepConfig, _ctx: PipelineContext): unknown[] {
  const { field, order = 'asc' } = config;
  const sorted = [...data].sort((a, b) => { const va = (a as Record<string, unknown>)[field]; const vb = (b as Record<string, unknown>)[field]; if (va == null && vb == null) return 0; if (va == null) return 1; if (vb == null) return -1; if (va < vb) return -1; if (va > vb) return 1; return 0; });
  return order === 'desc' ? sorted.reverse() : sorted;
}
