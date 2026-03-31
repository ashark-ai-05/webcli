import type { PipelineContext } from '../../types.js';
export function dedupeStep(data: unknown[], key: string, _ctx: PipelineContext): unknown[] {
  const seen = new Set<unknown>(); return data.filter((item) => { const value = (item as Record<string, unknown>)[key]; if (seen.has(value)) return false; seen.add(value); return true; });
}
