import * as cheerio from 'cheerio';

export interface LinkDiscoveryConfig {
  followPattern?: string;        // glob-like pattern for which URLs to follow
  sameDomainOnly: boolean;       // default true
  maxDepth: number;              // max crawl depth
  respectRobots: boolean;        // honor robots.txt nofollow
}

export interface DiscoveredLinks {
  links: string[];
  paginationNext: string | null;  // detected "next page" URL
}

export function discoverLinks(
  html: string,
  baseUrl: string,
  config: LinkDiscoveryConfig,
): DiscoveredLinks {
  const $ = cheerio.load(html);
  const base = new URL(baseUrl);
  const links: string[] = [];
  let paginationNext: string | null = null;

  // Extract all <a href> links
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) return;

    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(href, baseUrl).toString();
    } catch { return; }

    // Same domain check
    if (config.sameDomainOnly) {
      try {
        const linkDomain = new URL(absoluteUrl).hostname;
        if (linkDomain !== base.hostname) return;
      } catch { return; }
    }

    // Follow pattern check (simple glob: * matches any chars)
    if (config.followPattern) {
      const regex = new RegExp('^' + config.followPattern.replace(/\*/g, '.*') + '$');
      const path = new URL(absoluteUrl).pathname;
      if (!regex.test(path) && !regex.test(absoluteUrl)) return;
    }

    links.push(absoluteUrl);
  });

  // Detect pagination: look for rel="next", aria-label="next", or common patterns
  const nextLink = $('a[rel="next"]').attr('href')
    || $('link[rel="next"]').attr('href')
    || $('a[aria-label="Next"]').attr('href')
    || $('a[aria-label="next"]').attr('href')
    || $('a:contains("Next")').filter((_, el) => $(el).text().trim() === 'Next' || $(el).text().trim() === 'Next >' || $(el).text().trim() === 'next').attr('href');

  if (nextLink) {
    try {
      paginationNext = new URL(nextLink, baseUrl).toString();
    } catch {}
  }

  // Deduplicate
  const unique = [...new Set(links)];
  return { links: unique, paginationNext };
}

// Parse API pagination from JSON response + headers
export function discoverApiPagination(
  responseData: unknown,
  responseHeaders: Record<string, string>,
  baseUrl: string,
): string | null {
  // Check Link header (GitHub-style)
  const linkHeader = responseHeaders['link'] || responseHeaders['Link'];
  if (linkHeader) {
    const nextMatch = linkHeader.match(/<([^>]+)>;\s*rel="next"/);
    if (nextMatch) return nextMatch[1];
  }

  // Check common JSON pagination fields
  if (responseData && typeof responseData === 'object') {
    const data = responseData as Record<string, unknown>;
    const nextUrl = data.next_page_url || data.nextPageUrl || data.next || data.nextPage;
    if (typeof nextUrl === 'string' && nextUrl.startsWith('http')) return nextUrl;

    const nextCursor = data.next_cursor || data.cursor || data.after;
    if (nextCursor && typeof nextCursor === 'string') {
      // Return cursor value -- caller needs to construct URL
      return `__cursor__:${nextCursor}`;
    }
  }

  return null;
}
