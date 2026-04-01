import { describe, it, expect } from 'vitest';
import { ConcurrencyController } from './concurrency.js';

describe('ConcurrencyController', () => {
  it('allows up to max concurrent acquisitions', async () => {
    const ctrl = new ConcurrencyController(2, 0);
    await ctrl.acquire();
    await ctrl.acquire();
    expect(ctrl.getActive()).toBe(2);

    // Third acquire should block -- test with a race
    let thirdAcquired = false;
    const third = ctrl.acquire().then(() => { thirdAcquired = true; });
    await new Promise(r => setTimeout(r, 50));
    expect(thirdAcquired).toBe(false);

    // Release one -- third should now proceed
    await ctrl.release();
    await third;
    expect(thirdAcquired).toBe(true);
    expect(ctrl.getActive()).toBe(2);

    await ctrl.release();
    await ctrl.release();
  });

  it('tracks active count', async () => {
    const ctrl = new ConcurrencyController(5, 0);
    expect(ctrl.getActive()).toBe(0);
    await ctrl.acquire();
    expect(ctrl.getActive()).toBe(1);
    await ctrl.release();
    expect(ctrl.getActive()).toBe(0);
  });
});
