export interface QueuedRequest {
  url: string;
  depth: number;
  metadata?: Record<string, unknown>;
  retries: number;
}

export class RequestQueue {
  private pending: QueuedRequest[] = [];
  private visited = new Set<string>();
  private failed: QueuedRequest[] = [];
  private doneCount = 0;

  add(url: string, depth: number = 0, metadata?: Record<string, unknown>): boolean {
    const normalized = this.normalizeUrl(url);
    if (this.visited.has(normalized)) return false;
    this.visited.add(normalized);
    this.pending.push({ url: normalized, depth, metadata, retries: 0 });
    return true;
  }

  next(): QueuedRequest | null {
    return this.pending.shift() || null;
  }

  markDone(url: string): void { this.doneCount++; }

  markFailed(request: QueuedRequest): void {
    if (request.retries < 3) {
      request.retries++;
      this.pending.push(request);
    } else {
      this.failed.push(request);
    }
  }

  size(): number { return this.pending.length; }
  processed(): number { return this.doneCount; }
  failedCount(): number { return this.failed.length; }
  isEmpty(): boolean { return this.pending.length === 0; }

  private normalizeUrl(url: string): string {
    try {
      const u = new URL(url);
      u.hash = '';
      // Remove trailing slash for consistency
      let path = u.pathname;
      if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
      u.pathname = path;
      // Sort query params for dedup
      u.searchParams.sort();
      return u.toString();
    } catch { return url; }
  }
}
