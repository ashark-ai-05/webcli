import type { AdapterDefinition } from './types.js';
import { executePipeline } from './pipeline/executor.js';
export async function runAdapter(adapter: AdapterDefinition, args: Record<string, unknown>, initialData?: unknown): Promise<unknown> {
  const resolvedArgs: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(adapter.args || {})) resolvedArgs[key] = args[key] ?? def.default;
  return executePipeline(adapter.pipeline, { args: resolvedArgs, source: adapter.source, data: null }, initialData ?? null);
}
