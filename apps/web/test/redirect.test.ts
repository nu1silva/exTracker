import { describe, expect, it } from 'vitest';
import { loginPath, safeNextPath } from '../src/redirect.ts';

describe('safeNextPath', () => {
  it.each([
    ['/', '/'],
    ['/records?x=1', '/records?x=1'],
    ['/records#today', '/records#today'],
  ])('keeps the path %s', (value, expected) => {
    expect(safeNextPath(value)).toBe(expected);
  });

  it.each([
    ['//evil.example', '//evil.example'],
    ['/\\evil.example', '/\\evil.example'],
    ['/\t/evil.example', 'a tab the URL parser drops'],
    ['https://evil.example', 'https://evil.example'],
    ['records', 'a relative path'],
    ['', 'empty'],
    [null, 'missing'],
  ] as const)('gives / for %s (%s)', (value, _label) => {
    expect(safeNextPath(value)).toBe('/');
  });
});

describe('loginPath', () => {
  it('keeps slashes readable and encodes the rest', () => {
    expect(loginPath('/')).toBe('/login?next=/');
    expect(loginPath('/records?x=1&y=2')).toBe('/login?next=/records%3Fx%3D1%26y%3D2');
  });

  it('survives the round trip through ?next=', () => {
    const next = new URLSearchParams(loginPath('/records?x=1&y=2').split('?')[1]).get('next');
    expect(safeNextPath(next)).toBe('/records?x=1&y=2');
  });
});
