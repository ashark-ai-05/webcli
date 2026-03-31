import { Command } from 'commander';
import * as fs from 'node:fs';
import * as path from 'node:path';
import chalk from 'chalk';
import { AdapterRegistry } from '../core/adapter/registry.js';
import { loadAdapterFromFile, validateAdapter } from '../core/adapter/loader.js';
import { runAdapter } from '../core/runner.js';
import { formatOutput } from '../core/output.js';
import type { OutputFormat } from '../core/types.js';

export function createCli(registry: AdapterRegistry): Command {
  const program = new Command();
  program.name('webcli').description('Secure, agent-driven web data extraction').version('0.1.0');

  program.command('run <site> <command>').description('Run an adapter')
    .option('-f, --format <format>', 'Output format: table, json, csv', 'table')
    .option('-a, --arg <args...>', 'Arguments as key=value pairs')
    .action(async (site: string, command: string, options: { format: string; arg?: string[] }) => {
      const adapter = registry.get(site, command);
      if (!adapter) { console.error(chalk.red(`Adapter not found: ${site}/${command}`)); process.exit(1); }
      const args = parseArgs(options.arg || []);
      try {
        const result = await runAdapter(adapter, args);
        console.log(formatOutput(result as unknown[], options.format as OutputFormat, adapter.columns));
      } catch (err) { console.error(chalk.red(`Error: ${err instanceof Error ? err.message : String(err)}`)); process.exit(1); }
    });

  program.command('list').description('List available adapters').option('-s, --site <site>', 'Filter by site')
    .action((options: { site?: string }) => {
      const adapters = options.site ? registry.listSite(options.site) : registry.listAll();
      if (adapters.length === 0) { console.log('No adapters found.'); return; }
      for (const a of adapters) console.log(`  ${chalk.cyan(a.site)}/${chalk.green(a.name)} - ${a.description}`);
    });

  program.command('validate <file>').description('Validate a YAML adapter file')
    .action((file: string) => {
      try {
        const adapter = loadAdapterFromFile(file);
        const errors = validateAdapter(adapter);
        if (errors.length === 0) console.log(chalk.green('Valid adapter.'));
        else { console.error(chalk.red('Validation errors:')); errors.forEach(e => console.error(`  - ${e}`)); process.exit(1); }
      } catch (err) { console.error(chalk.red(`Failed to load: ${err instanceof Error ? err.message : String(err)}`)); process.exit(1); }
    });

  return program;
}

function parseArgs(args: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const arg of args) { const i = arg.indexOf('='); if (i === -1) result[arg] = true; else { const k = arg.slice(0, i); const v = arg.slice(i + 1); const n = Number(v); result[k] = isNaN(n) ? v : n; } }
  return result;
}

export function loadBuiltinAdapters(registry: AdapterRegistry, adaptersDir: string): void {
  if (!fs.existsSync(adaptersDir)) return;
  for (const site of fs.readdirSync(adaptersDir)) {
    const siteDir = path.join(adaptersDir, site);
    if (!fs.statSync(siteDir).isDirectory()) continue;
    for (const file of fs.readdirSync(siteDir)) {
      if (!file.endsWith('.yaml') && !file.endsWith('.yml')) continue;
      try { const adapter = loadAdapterFromFile(path.join(siteDir, file)); if (validateAdapter(adapter).length === 0) registry.register(adapter); } catch { /* skip */ }
    }
  }
}
