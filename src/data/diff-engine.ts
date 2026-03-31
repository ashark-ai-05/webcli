export interface ChangedItem { id: unknown; fields: Record<string, { old: unknown; new: unknown }>; }
export interface DiffResult { added: Record<string, unknown>[]; removed: Record<string, unknown>[]; changed: ChangedItem[]; unchanged_count: number; }
export function diffSnapshots(prev: Record<string, unknown>[], curr: Record<string, unknown>[], idField: string): DiffResult {
  const prevMap = new Map(prev.map(item => [item[idField], item]));
  const currMap = new Map(curr.map(item => [item[idField], item]));
  const added: Record<string, unknown>[] = []; const removed: Record<string, unknown>[] = []; const changed: ChangedItem[] = []; let unchanged_count = 0;
  for (const [id, currItem] of currMap) { const prevItem = prevMap.get(id); if (!prevItem) { added.push(currItem); continue; } const fields: Record<string, { old: unknown; new: unknown }> = {}; for (const key of new Set([...Object.keys(prevItem), ...Object.keys(currItem)])) { if (key === idField) continue; if (JSON.stringify(prevItem[key]) !== JSON.stringify(currItem[key])) fields[key] = { old: prevItem[key], new: currItem[key] }; } if (Object.keys(fields).length > 0) changed.push({ id, fields }); else unchanged_count++; }
  for (const [id] of prevMap) { if (!currMap.has(id)) removed.push(prevMap.get(id)!); }
  return { added, removed, changed, unchanged_count };
}
