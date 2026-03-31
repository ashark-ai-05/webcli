import Table from 'cli-table3';
import type { OutputFormat } from './types.js';
export function formatOutput(data: unknown[], format: OutputFormat, columns?: string[]): string {
  switch (format) {
    case 'json': return JSON.stringify(data, null, 2);
    case 'csv': return formatCsv(data as Record<string, unknown>[], columns);
    case 'table': return formatTable(data as Record<string, unknown>[], columns);
    default: return JSON.stringify(data, null, 2);
  }
}
function formatCsv(data: Record<string, unknown>[], columns?: string[]): string {
  if (data.length === 0) return '';
  const cols = columns || Object.keys(data[0]);
  const rows = data.map(row => cols.map(col => { const val = String(row[col] ?? ''); return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val.replace(/"/g, '""')}"` : val; }).join(','));
  return [cols.join(','), ...rows].join('\n');
}
function formatTable(data: Record<string, unknown>[], columns?: string[]): string {
  if (data.length === 0) return 'No results.';
  const cols = columns || Object.keys(data[0]);
  const table = new Table({ head: cols });
  for (const row of data) table.push(cols.map(col => String(row[col] ?? '')));
  return table.toString();
}
