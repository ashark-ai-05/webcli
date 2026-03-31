import { describe, it, expect } from 'vitest';
import { formatOutput } from './output.js';
const data = [{ name: 'Bitcoin', price: 71000, change: '2.1%' }, { name: 'Ethereum', price: 3800, change: '-0.5%' }];
describe('formatOutput', () => {
  it('formats JSON', () => { expect(JSON.parse(formatOutput(data, 'json'))).toEqual(data); });
  it('formats CSV', () => { const lines = formatOutput(data, 'csv', ['name', 'price', 'change']).trim().split('\n'); expect(lines[0]).toBe('name,price,change'); expect(lines[1]).toBe('Bitcoin,71000,2.1%'); });
  it('formats table', () => { const r = formatOutput(data, 'table', ['name', 'price']); expect(r).toContain('Bitcoin'); expect(r).toContain('71000'); });
  it('CSV escapes commas', () => { expect(formatOutput([{ text: 'hello, world' }], 'csv', ['text'])).toContain('"hello, world"'); });
});
