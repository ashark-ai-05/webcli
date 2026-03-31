#!/usr/bin/env node
import * as path from 'node:path';
import { AdapterRegistry } from './core/adapter/registry.js';
import { createCli, loadBuiltinAdapters } from './interfaces/cli.js';
import { startMcpServer } from './interfaces/mcp.js';
import { getAdaptersDir } from './utils/config.js';

const registry = new AdapterRegistry();
const builtinDir = path.resolve(import.meta.dirname, '..', 'adapters');
loadBuiltinAdapters(registry, builtinDir);
loadBuiltinAdapters(registry, getAdaptersDir());

if (process.argv.includes('--mcp')) {
  startMcpServer(registry).catch(err => { console.error('MCP server error:', err); process.exit(1); });
} else {
  createCli(registry).parse();
}
