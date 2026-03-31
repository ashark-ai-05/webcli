import type { ProbeResult } from '../core/types.js';
interface ExtractorLike { name: string; probe(url: string, fetchFn?: typeof globalThis.fetch): Promise<ProbeResult | null>; }
export interface CascadeResult { extractor: string; result: ProbeResult; }
const THRESHOLDS: Record<string, number> = { http: 0.7, rss: 0.7, html: 0.5, browser: 0.0 };
export class ExtractorCascade {
  constructor(private extractors: ExtractorLike[]) {}
  async probe(url: string): Promise<CascadeResult | null> {
    let best: CascadeResult | null = null;
    for (const ext of this.extractors) {
      try { const result = await ext.probe(url); if (!result) continue; if (result.confidence >= (THRESHOLDS[ext.name] ?? 0.5)) return { extractor: ext.name, result }; if (!best || result.confidence > best.result.confidence) best = { extractor: ext.name, result }; } catch { continue; }
    }
    return best;
  }
}
