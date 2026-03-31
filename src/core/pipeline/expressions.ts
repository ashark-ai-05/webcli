import vm from 'node:vm';

const BLOCKED_GLOBALS = ['process', 'require', 'module', 'exports', '__filename', '__dirname', 'globalThis', 'global', 'fetch', 'setTimeout', 'setInterval', 'setImmediate', 'clearTimeout', 'clearInterval', 'clearImmediate', 'eval', 'Function', 'import', 'Buffer', 'URL', 'URLSearchParams'];

function createSandboxContext(scope: Record<string, unknown>): vm.Context {
  const sandbox: Record<string, unknown> = { ...scope, Math, Date, JSON, String, Number, Boolean, Array, Object, parseInt, parseFloat, isNaN, isFinite, encodeURIComponent, decodeURIComponent };
  for (const name of BLOCKED_GLOBALS) sandbox[name] = undefined;
  return vm.createContext(sandbox, { codeGeneration: { strings: false, wasm: false } });
}

export function evalExpr(expression: string, scope: Record<string, unknown>): unknown {
  const context = createSandboxContext(scope);
  try { return vm.runInContext(expression, context, { timeout: 1000 }); }
  catch (err) {
    if (err instanceof Error && err.message.includes('is not defined')) throw new Error(`Expression error: ${err.message}`);
    throw new Error(`Expression error in "${expression}": ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function renderTemplate(template: unknown, scope: Record<string, unknown>): unknown {
  if (typeof template !== 'string') return template;
  const singleMatch = template.match(/^\$\{\{((?:(?!\}\}).)*)\}\}$/s);
  if (singleMatch) return evalExpr(singleMatch[1].trim(), scope);
  if (!/\$\{\{/.test(template)) return template;
  return template.replace(/\$\{\{((?:(?!\}\}).)*)\}\}/gs, (_match, expr: string) => String(evalExpr(expr.trim(), scope)));
}
