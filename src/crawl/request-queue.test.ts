import { describe, it, expect } from 'vitest';
import { RequestQueue } from './request-queue.js';

describe('RequestQueue', () => {
  it('adds and retrieves requests in FIFO order', () => {
    const q = new RequestQueue();
    q.add('https://a.com/1');
    q.add('https://a.com/2');
    expect(q.next()!.url).toBe('https://a.com/1');
    expect(q.next()!.url).toBe('https://a.com/2');
  });

  it('deduplicates URLs', () => {
    const q = new RequestQueue();
    expect(q.add('https://a.com/page')).toBe(true);
    expect(q.add('https://a.com/page')).toBe(false);
    expect(q.size()).toBe(1);
  });

  it('normalizes URLs for dedup (trailing slash, hash, param order)', () => {
    const q = new RequestQueue();
    q.add('https://a.com/page/');
    expect(q.add('https://a.com/page')).toBe(false); // Same after normalization
    const q2 = new RequestQueue();
    q2.add('https://a.com/page#section');
    expect(q2.add('https://a.com/page')).toBe(false);
    const q3 = new RequestQueue();
    q3.add('https://a.com/s?b=2&a=1');
    expect(q3.add('https://a.com/s?a=1&b=2')).toBe(false);
  });

  it('retries failed requests up to 3 times', () => {
    const q = new RequestQueue();
    q.add('https://a.com/flaky');
    const req = q.next()!;
    q.markFailed(req); // retry 1
    expect(q.size()).toBe(1);
    const req2 = q.next()!;
    q.markFailed(req2); // retry 2
    const req3 = q.next()!;
    q.markFailed(req3); // retry 3
    const req4 = q.next()!;
    q.markFailed(req4); // exhausted, goes to failed
    expect(q.size()).toBe(0);
    expect(q.failedCount()).toBe(1);
  });

  it('tracks processed count', () => {
    const q = new RequestQueue();
    q.add('https://a.com/1');
    q.add('https://a.com/2');
    q.next();
    q.markDone('https://a.com/1');
    expect(q.processed()).toBe(1);
  });

  it('returns null when empty', () => {
    const q = new RequestQueue();
    expect(q.next()).toBeNull();
    expect(q.isEmpty()).toBe(true);
  });
});
