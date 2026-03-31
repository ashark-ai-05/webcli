import type { PipelineContext, PipelineStep, SortStepConfig, FetchStepConfig } from '../types.js';
import { selectStep } from './steps/select.js'; import { mapStep } from './steps/map.js'; import { filterStep } from './steps/filter.js';
import { sortStep } from './steps/sort.js'; import { limitStep } from './steps/limit.js'; import { flattenStep } from './steps/flatten.js';
import { dedupeStep } from './steps/dedupe.js'; import { transformStep } from './steps/transform.js'; import { fetchStep } from './steps/fetch.js';

type StepHandler = (data: unknown, config: unknown, ctx: PipelineContext) => unknown | Promise<unknown>;
const STEP_HANDLERS: Record<string, StepHandler> = {
  select: (data, config, ctx) => selectStep(data, config as string, ctx),
  map: (data, config, ctx) => mapStep(data as unknown[], config as Record<string, unknown>, ctx),
  filter: (data, config, ctx) => filterStep(data as unknown[], config as string, ctx),
  sort: (data, config, ctx) => sortStep(data as unknown[], config as SortStepConfig, ctx),
  limit: (data, config, ctx) => limitStep(data as unknown[], config as string | number, ctx),
  flatten: (data, config, ctx) => flattenStep(data as unknown[], config as string, ctx),
  dedupe: (data, config, ctx) => dedupeStep(data as unknown[], config as string, ctx),
  transform: (data, config, ctx) => transformStep(data, config as string, ctx),
  fetch: (data, config, ctx) => fetchStep(data, config as FetchStepConfig, ctx),
};

export async function executePipeline(pipeline: PipelineStep[], ctx: PipelineContext, initialData: unknown = null): Promise<unknown> {
  let data = initialData;
  for (const step of pipeline) {
    const entries = Object.entries(step);
    if (entries.length !== 1) throw new Error(`Invalid pipeline step: expected exactly one key, got ${entries.length}`);
    const [stepName, config] = entries[0];
    const handler = STEP_HANDLERS[stepName];
    if (!handler) throw new Error(`Unknown pipeline step: "${stepName}"`);
    data = await handler(data, config, ctx);
  }
  return data;
}
