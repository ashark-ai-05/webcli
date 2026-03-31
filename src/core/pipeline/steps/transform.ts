import vm from 'node:vm';
import type { PipelineContext } from '../../types.js';
const BLOCKED_GLOBALS = ['process', 'require', 'module', 'exports', '__filename', '__dirname', 'globalThis', 'global', 'fetch', 'setTimeout', 'setInterval', 'setImmediate', 'clearTimeout', 'clearInterval', 'clearImmediate', 'eval', 'Function', 'import', 'Buffer'];
export function transformStep(data: unknown, code: string, ctx: PipelineContext): unknown {
  const sandbox: Record<string, unknown> = { data, args: ctx.args, Math, Date, JSON, String, Number, Boolean, Array, Object, parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent };
  for (const name of BLOCKED_GLOBALS) sandbox[name] = undefined;
  const context = vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
  return vm.runInContext(code, context, { timeout: 5000 });
}
