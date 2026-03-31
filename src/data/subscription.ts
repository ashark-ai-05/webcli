import * as fs from 'node:fs';
import * as path from 'node:path';
import yaml from 'js-yaml';
import { getSubscriptionsPath, ensureDir } from '../utils/config.js';
export interface Subscription { id: string; adapter: string; args: Record<string, unknown>; schedule: { mode: 'adaptive' | 'fixed' | 'cron'; min_interval: string; max_interval: string; current_interval: string; }; notify: { on: 'change' | 'always' | 'threshold'; threshold?: { field: string; change_percent: number }; }; retention: { max_snapshots: number; max_age: string; }; }
export class SubscriptionManager {
  private filePath: string;
  constructor(filePath?: string) { this.filePath = filePath || getSubscriptionsPath(); ensureDir(path.dirname(this.filePath)); }
  load(): Subscription[] { if (!fs.existsSync(this.filePath)) return []; const data = yaml.load(fs.readFileSync(this.filePath, 'utf-8')) as { subscriptions?: Subscription[] }; return data?.subscriptions || []; }
  save(subs: Subscription[]): void { fs.writeFileSync(this.filePath, yaml.dump({ subscriptions: subs }, { lineWidth: -1 })); }
  add(sub: Subscription): void { const subs = this.load(); const i = subs.findIndex(s => s.id === sub.id); if (i >= 0) subs[i] = sub; else subs.push(sub); this.save(subs); }
  remove(id: string): boolean { const subs = this.load(); const f = subs.filter(s => s.id !== id); if (f.length === subs.length) return false; this.save(f); return true; }
  get(id: string): Subscription | undefined { return this.load().find(s => s.id === id); }
}
