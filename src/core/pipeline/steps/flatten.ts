import type { PipelineContext } from '../../types.js';
export function flattenStep(data: unknown[], key: string, _ctx: PipelineContext): unknown[] {
  return data.flatMap((item) => { const value = (item as Record<string, unknown>)[key]; return Array.isArray(value) ? value : [value]; });
}
