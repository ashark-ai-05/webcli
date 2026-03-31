import type { PipelineContext } from '../../types.js';
import { evalExpr } from '../expressions.js';
export function filterStep(data: unknown[], condition: string, ctx: PipelineContext): unknown[] {
  return data.filter((item, index) => Boolean(evalExpr(condition, { ...ctx, item, index, args: ctx.args })));
}
