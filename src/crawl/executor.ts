import { RequestQueue, type QueuedRequest } from './request-queue.js';
import { discoverLinks, discoverApiPagination, type LinkDiscoveryConfig } from './link-discoverer.js';
import { ConcurrencyController } from './concurrency.js';

export interface CrawlConfig {
  startUrls: string[];
  followPattern?: string;
  maxDepth: number;
  maxPages: number;
  concurrency: number;
  delayMs: number;
  sameDomainOnly: boolean;
  respectRobots: boolean;
  extractFn: (url: string, response: Response) => Promise<unknown[]>;
  fetchFn?: (url: string, init?: RequestInit) => Promise<Response>;
  onProgress?: (status: CrawlStatus) => void;
}

export interface CrawlStatus {
  processed: number;
  pending: number;
  failed: number;
  active: number;
  results: number;
}

export interface CrawlResult {
  data: unknown[];
  status: CrawlStatus;
  failedUrls: string[];
}

export async function executeCrawl(config: CrawlConfig): Promise<CrawlResult> {
  const queue = new RequestQueue();
  const controller = new ConcurrencyController(config.concurrency, config.delayMs);
  const fetchFn = config.fetchFn || globalThis.fetch;
  const allResults: unknown[] = [];
  const failedUrls: string[] = [];

  // Seed the queue
  for (const url of config.startUrls) {
    queue.add(url, 0);
  }

  const linkConfig: LinkDiscoveryConfig = {
    followPattern: config.followPattern,
    sameDomainOnly: config.sameDomainOnly,
    maxDepth: config.maxDepth,
    respectRobots: config.respectRobots,
  };

  while (!queue.isEmpty() && queue.processed() < config.maxPages) {
    const request = queue.next();
    if (!request) break;
    if (request.depth > config.maxDepth) { queue.markDone(request.url); continue; }

    await controller.acquire();

    try {
      const response = await fetchFn(request.url, {
        headers: {
          'User-Agent': 'webcli/0.1.0 (+https://github.com/webcli)',
          'Accept': 'text/html, application/json',
        },
      });

      if (!response.ok) {
        queue.markFailed(request);
        continue;
      }

      // Extract data from this page
      const pageData = await config.extractFn(request.url, response.clone());
      allResults.push(...pageData);

      // Discover links for further crawling
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('html')) {
        const html = await response.text();
        const discovered = discoverLinks(html, request.url, linkConfig);
        for (const link of discovered.links) {
          if (queue.processed() + queue.size() < config.maxPages) {
            queue.add(link, request.depth + 1);
          }
        }
        if (discovered.paginationNext) {
          queue.add(discovered.paginationNext, request.depth);
        }
      } else if (contentType.includes('json')) {
        const data = await response.json();
        const headers: Record<string, string> = {};
        response.headers.forEach((v, k) => { headers[k] = v; });
        const nextPage = discoverApiPagination(data, headers, request.url);
        if (nextPage && !nextPage.startsWith('__cursor__:')) {
          queue.add(nextPage, request.depth);
        }
      }

      queue.markDone(request.url);
    } catch {
      queue.markFailed(request);
    } finally {
      await controller.release();
    }

    // Progress callback
    if (config.onProgress) {
      config.onProgress({
        processed: queue.processed(),
        pending: queue.size(),
        failed: queue.failedCount(),
        active: controller.getActive(),
        results: allResults.length,
      });
    }
  }

  return {
    data: allResults,
    status: {
      processed: queue.processed(),
      pending: queue.size(),
      failed: queue.failedCount(),
      active: 0,
      results: allResults.length,
    },
    failedUrls,
  };
}
