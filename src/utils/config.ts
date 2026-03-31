import * as path from 'node:path';
import * as os from 'node:os';
import * as fs from 'node:fs';

function getHomeDir(): string { return process.env.HOME || process.env.USERPROFILE || os.homedir(); }
export function getConfigDir(): string {
  if (process.platform === 'win32') return path.join(process.env.APPDATA || path.join(getHomeDir(), 'AppData', 'Roaming'), 'webcli');
  return path.join(getHomeDir(), '.webcli');
}
export function getDataDir(): string { return path.join(getConfigDir(), 'data'); }
export function getAdaptersDir(): string { return path.join(getConfigDir(), 'adapters'); }
export function getSubscriptionsPath(): string { return path.join(getConfigDir(), 'subscriptions.yaml'); }
export function ensureDir(dir: string): void { fs.mkdirSync(dir, { recursive: true }); }
