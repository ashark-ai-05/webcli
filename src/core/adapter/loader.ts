import yaml from 'js-yaml';
import * as fs from 'node:fs';
import type { AdapterDefinition } from '../types.js';

export function parseAdapter(yamlContent: string): AdapterDefinition {
  return yaml.load(yamlContent) as unknown as AdapterDefinition;
}
export function loadAdapterFromFile(filePath: string): AdapterDefinition {
  return parseAdapter(fs.readFileSync(filePath, 'utf-8'));
}
const VALID_SOURCE_TYPES = ['api', 'rss', 'html', 'browser'];
const VALID_AUTH_TYPES = ['none', 'api_key', 'oauth', 'browser_session'];
const VALID_STEP_NAMES = ['fetch', 'rss', 'browse', 'select', 'transform', 'map', 'filter', 'sort', 'limit', 'flatten', 'dedupe'];
export function validateAdapter(adapter: AdapterDefinition): string[] {
  const errors: string[] = [];
  if (!adapter.site || typeof adapter.site !== 'string') errors.push('site is required and must be a string');
  if (!adapter.name || typeof adapter.name !== 'string') errors.push('name is required and must be a string');
  if (!adapter.source?.type || !VALID_SOURCE_TYPES.includes(adapter.source.type)) errors.push(`source.type must be one of: ${VALID_SOURCE_TYPES.join(', ')}`);
  if (adapter.source?.auth && !VALID_AUTH_TYPES.includes(adapter.source.auth)) errors.push(`source.auth must be one of: ${VALID_AUTH_TYPES.join(', ')}`);
  if (!Array.isArray(adapter.pipeline) || adapter.pipeline.length === 0) errors.push('pipeline is required and must be a non-empty array');
  if (Array.isArray(adapter.pipeline) && adapter.pipeline.length > 20) errors.push('pipeline exceeds max depth of 20 steps');
  if (Array.isArray(adapter.pipeline)) { for (const step of adapter.pipeline) { const keys = Object.keys(step); if (keys.length !== 1) errors.push(`step must have one key, got: ${keys.join(', ')}`); else if (!VALID_STEP_NAMES.includes(keys[0])) errors.push(`unknown step: "${keys[0]}"`); } }
  return errors;
}
