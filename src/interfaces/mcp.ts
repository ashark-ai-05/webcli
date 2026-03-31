import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AdapterRegistry } from '../core/adapter/registry.js';
import { runAdapter } from '../core/runner.js';
import { formatOutput } from '../core/output.js';

export function createMcpServer(registry: AdapterRegistry): McpServer {
  const server = new McpServer({ name: 'webcli', version: '0.1.0' });
  server.tool('webcli_run', 'Run a webcli adapter to extract data from a website', {
    site: z.string().describe('Site name (e.g., hackernews, coingecko)'),
    command: z.string().describe('Command name (e.g., search, prices)'),
    args: z.record(z.string(), z.unknown()).optional().describe('Arguments as key-value pairs'),
    format: z.enum(['json', 'table', 'csv']).optional().describe('Output format'),
  }, async ({ site, command, args, format }) => {
    const adapter = registry.get(site, command);
    if (!adapter) return { content: [{ type: 'text' as const, text: `Adapter not found: ${site}/${command}` }], isError: true };
    try { const result = await runAdapter(adapter, args || {}); return { content: [{ type: 'text' as const, text: formatOutput(result as unknown[], (format || 'json') as 'json' | 'table' | 'csv', adapter.columns) }] }; }
    catch (err) { return { content: [{ type: 'text' as const, text: `Error: ${err instanceof Error ? err.message : String(err)}` }], isError: true }; }
  });
  server.tool('webcli_list', 'List available webcli adapters', { site: z.string().optional().describe('Filter by site') }, async ({ site }) => {
    const adapters = site ? registry.listSite(site) : registry.listAll();
    return { content: [{ type: 'text' as const, text: adapters.map(a => `${a.site}/${a.name} - ${a.description}`).join('\n') || 'No adapters found.' }] };
  });
  server.tool('webcli_schema', 'Get the data schema of an adapter', { site: z.string(), command: z.string() }, async ({ site, command }) => {
    const adapter = registry.get(site, command);
    if (!adapter) return { content: [{ type: 'text' as const, text: `Not found: ${site}/${command}` }], isError: true };
    return { content: [{ type: 'text' as const, text: JSON.stringify(adapter.schema, null, 2) }] };
  });
  return server;
}
export async function startMcpServer(registry: AdapterRegistry): Promise<void> { const server = createMcpServer(registry); await server.connect(new StdioServerTransport()); }
