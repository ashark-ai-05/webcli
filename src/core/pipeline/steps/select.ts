import type { PipelineContext } from '../../types.js';
export function selectStep(data: unknown, path: string, _ctx: PipelineContext): unknown {
  const keys = path.split('.'); let current: unknown = data;
  for (const key of keys) { if (current == null || typeof current !== 'object') return undefined; current = (current as Record<string, unknown>)[key]; }
  return current;
}
