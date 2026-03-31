import * as fs from 'node:fs';
import * as path from 'node:path';
import { getDataDir, ensureDir } from '../utils/config.js';
import { diffSnapshots, type DiffResult } from './diff-engine.js';
export class SnapshotStore {
  private baseDir: string;
  constructor(site: string, name: string) { this.baseDir = path.join(getDataDir(), site, name); ensureDir(path.join(this.baseDir, 'snapshots')); ensureDir(path.join(this.baseDir, 'diff')); }
  save(data: Record<string, unknown>[]): string { const ts = new Date().toISOString().replace(/[:.]/g, '-'); const p = path.join(this.baseDir, 'snapshots', `${ts}.json`); fs.writeFileSync(p, JSON.stringify(data, null, 2)); const latest = path.join(this.baseDir, 'latest.json'); if (fs.existsSync(latest)) fs.unlinkSync(latest); fs.symlinkSync(p, latest); return p; }
  getLatest(): Record<string, unknown>[] | null { const p = path.join(this.baseDir, 'latest.json'); if (!fs.existsSync(p)) return null; return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  saveDiff(diff: DiffResult): string { const ts = new Date().toISOString().replace(/[:.]/g, '-'); const p = path.join(this.baseDir, 'diff', `${ts}.diff.json`); fs.writeFileSync(p, JSON.stringify(diff, null, 2)); return p; }
  diffWithLatest(newData: Record<string, unknown>[], idField: string): DiffResult | null { const prev = this.getLatest(); if (!prev) return null; return diffSnapshots(prev, newData, idField); }
}
