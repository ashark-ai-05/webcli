import type { AdapterDefinition } from '../types.js';
export class AdapterRegistry {
  private adapters = new Map<string, AdapterDefinition>();
  private key(site: string, name: string): string { return `${site}/${name}`; }
  register(adapter: AdapterDefinition): void { this.adapters.set(this.key(adapter.site, adapter.name), adapter); }
  get(site: string, name: string): AdapterDefinition | undefined { return this.adapters.get(this.key(site, name)); }
  listSite(site: string): AdapterDefinition[] { return [...this.adapters.values()].filter(a => a.site === site); }
  listSites(): string[] { return [...new Set([...this.adapters.values()].map(a => a.site))].sort(); }
  listAll(): AdapterDefinition[] { return [...this.adapters.values()]; }
}
