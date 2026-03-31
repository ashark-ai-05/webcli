import type { SchemaDefinition, FieldDefinition } from '../core/types.js';
const ROLE_PATTERNS: Record<string, RegExp> = {
  id: /^(id|_id|objectId|uuid|key|pk|slug)$|_id$|Id$/,
  title: /^(title|headline|name|subject|label|display_?name)$/i,
  url: /^(url|link|href|uri|permalink|source)$/i,
  timestamp: /^(created|updated|published|date|time|timestamp|_at)$|_at$|_date$|_time$|At$/,
  score: /^(score|points|upvotes|likes|karma|rating|rank|votes|stars|count)$/i,
  value: /^(price|cost|amount|value|total|balance|current_price)$/i,
  delta: /^(change|diff|delta|gain|loss|percent|pct|growth)$/i,
  author: /^(author|user|creator|owner|by|username|screen_?name|poster)$/i,
  content: /^(content|body|text|description|summary|excerpt|message|bio)$/i,
};
export function detectFieldRole(fieldName: string, sampleValue: unknown): FieldDefinition['role'] {
  for (const [role, pattern] of Object.entries(ROLE_PATTERNS)) { if (pattern.test(fieldName)) return role as FieldDefinition['role']; }
  if (typeof sampleValue === 'string') { if (sampleValue.match(/^https?:\/\//)) return 'url'; if (sampleValue.match(/^\d{4}-\d{2}-\d{2}/)) return 'timestamp'; }
  return 'other';
}
export interface DataArrayResult { path: string; items: Record<string, unknown>[]; }
export function findDataArray(data: unknown, path = '', depth = 0): DataArrayResult | null {
  if (depth > 5) return null;
  if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null) return { path, items: data as Record<string, unknown>[] };
  if (data && typeof data === 'object' && !Array.isArray(data)) { let best: DataArrayResult | null = null; for (const [key, value] of Object.entries(data as Record<string, unknown>)) { const found = findDataArray(value, path ? `${path}.${key}` : key, depth + 1); if (found && (!best || found.items.length > best.items.length)) best = found; } return best; }
  return null;
}
export function inferSchema(items: Record<string, unknown>[]): SchemaDefinition {
  const fields: Record<string, FieldDefinition> = {};
  if (items.length === 0) return { type: 'unknown', entity: 'item', fields };
  for (const [key, value] of Object.entries(items[0])) fields[key] = { role: detectFieldRole(key, value) };
  const roles = new Set(Object.values(fields).map(f => f.role));
  let entity = 'item';
  if (roles.has('value') || roles.has('delta')) entity = 'price';
  else if (roles.has('author') && roles.has('content')) entity = 'post';
  else if (roles.has('title') && roles.has('url')) entity = 'article';
  return { type: 'inferred', entity, fields };
}
