import type { PipelineContext } from '../../types.js';
import { renderTemplate } from '../expressions.js';
export function mapStep(data: unknown[], template: Record<string, unknown>, ctx: PipelineContext): unknown[] {
  return data.map((item, index) => { const scope = { ...ctx, item, index, args: ctx.args }; const result: Record<string, unknown> = {}; for (const [key, value] of Object.entries(template)) result[key] = renderTemplate(value, scope); return result; });
}
