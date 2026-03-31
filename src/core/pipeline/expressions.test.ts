import { describe, it, expect } from 'vitest';
import { evalExpr, renderTemplate } from './expressions.js';
describe('evalExpr', () => {
  it('evaluates arithmetic', () => { expect(evalExpr('1 + 2', {})).toBe(3); });
  it('accesses args', () => { expect(evalExpr('args.limit', { args: { limit: 10 } })).toBe(10); });
  it('accesses item and index', () => { expect(evalExpr('item.title', { item: { title: 'Hello' }, index: 0 })).toBe('Hello'); expect(evalExpr('index + 1', { item: {}, index: 0 })).toBe(1); });
  it('supports ternary', () => { expect(evalExpr("args.sort === 'date' ? 'by_date' : 'search'", { args: { sort: 'date' } })).toBe('by_date'); });
  it('blocks process', () => { expect(() => evalExpr('process.exit()', {})).toThrow(); });
  it('blocks require', () => { expect(() => evalExpr("require('fs')", {})).toThrow(); });
  it('blocks Function constructor', () => { expect(() => evalExpr("Function('return 1')()", {})).toThrow(); });
});
describe('renderTemplate', () => {
  it('replaces expressions', () => { expect(renderTemplate('Hello ${{ args.name }}!', { args: { name: 'world' } })).toBe('Hello world!'); });
  it('returns raw value for single expression', () => { expect(renderTemplate('${{ args.limit }}', { args: { limit: 20 } })).toBe(20); });
  it('handles multiple expressions', () => { expect(renderTemplate('${{ args.a }}-${{ args.b }}', { args: { a: 'foo', b: 'bar' } })).toBe('foo-bar'); });
  it('passes through plain strings', () => { expect(renderTemplate('plain', {})).toBe('plain'); });
  it('passes through numbers', () => { expect(renderTemplate(42, {})).toBe(42); });
  it('passes through booleans', () => { expect(renderTemplate(true, {})).toBe(true); });
});
