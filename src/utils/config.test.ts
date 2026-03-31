import { describe, it, expect } from 'vitest';
import { getConfigDir, getDataDir, getAdaptersDir } from './config.js';
import * as path from 'node:path';
describe('config', () => {
  it('returns a config directory under home', () => { const dir = getConfigDir(); expect(dir).toContain('webcli'); expect(path.isAbsolute(dir)).toBe(true); });
  it('returns data dir under config dir', () => { expect(getDataDir()).toBe(path.join(getConfigDir(), 'data')); });
  it('returns adapters dir under config dir', () => { expect(getAdaptersDir()).toBe(path.join(getConfigDir(), 'adapters')); });
});
