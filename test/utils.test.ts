import { describe, test, expect } from '@jest/globals';
import { compareVersion, matchVersions } from '../src/utils.js';

describe('versions', () => {
  test('version should compare with same digit', () => {
    expect(compareVersion('2021.5', '2021.6')).toBe(-1);
    expect(compareVersion('2021.6', '2021.5')).toBe(1);
    expect(compareVersion('2021.5', '2021.5')).toBe(0);
    expect(compareVersion('2021.6', '2022.5')).toBe(-1);
    expect(compareVersion('2022.5', '2021.6')).toBe(1);
    expect(compareVersion('2021.10', '2021.10')).toBe(0);
    expect(compareVersion('2021.11', '2021.12')).toBe(-1);
    expect(compareVersion('2021.12', '2021.11')).toBe(1);
  });

  test('version should compare with different digits', () => {
    expect(compareVersion('2021.5', '2021.10')).toBe(-1);
    expect(compareVersion('2021.10', '2021.5')).toBe(1);
    expect(compareVersion('2021.10', '2021.010')).toBe(0);
    expect(compareVersion('02021.5', '2021.05')).toBe(0);
    expect(compareVersion('02021.10', '2022.10')).toBe(-1);
    expect(compareVersion('12021.10', '2022.10')).toBe(1);
  });

  const fakeVersions = ['2021.5', '2021.7', '2022.3', '2022.10', '2023.11'].map(id => ({
    id,
    mods: [],
  }));

  test('version should match exact', () => {
    expect(matchVersions('2021.5', fakeVersions).id).toBe('2021.5');
    expect(matchVersions('2021.7', fakeVersions).id).toBe('2021.7');
    expect(matchVersions('2022.3', fakeVersions).id).toBe('2022.3');
    expect(matchVersions('2022.10', fakeVersions).id).toBe('2022.10');
    expect(matchVersions('2023.11', fakeVersions).id).toBe('2023.11');
  });

  test('version should match smaller', () => {
    expect(matchVersions('2021.6', fakeVersions).id).toBe('2021.5');
    expect(matchVersions('2021.8', fakeVersions).id).toBe('2021.7');
    expect(matchVersions('2022.2', fakeVersions).id).toBe('2021.7');
    expect(matchVersions('2022.9', fakeVersions).id).toBe('2022.3');
    expect(matchVersions('2022.11', fakeVersions).id).toBe('2022.10');
    expect(matchVersions('2023.10', fakeVersions).id).toBe('2022.10');
    expect(matchVersions('2023.12', fakeVersions).id).toBe('2023.11');
    expect(matchVersions('9999.99', fakeVersions).id).toBe('2023.11');
  });

  test('very small version should match first', () => {
    expect(matchVersions('2021.4', fakeVersions).id).toBe('2021.5');
  });
});
