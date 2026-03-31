import type { PipelineContext } from '../../types.js';
import { renderTemplate } from '../expressions.js';
export function limitStep(data: unknown[], count: string | number, ctx: PipelineContext): unknown[] {
  const resolved = typeof count === 'string' ? Number(renderTemplate(count, { args: ctx.args })) : count;
  return data.slice(0, resolved);
}
