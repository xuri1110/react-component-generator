import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadJSON, saveJSON } from './storage';

describe('loadJSON', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('키가 없으면 fallback을 반환한다', () => {
    expect(loadJSON('missing-key', 'fallback')).toBe('fallback');
  });

  it('저장된 값이 있으면 파싱해서 반환한다', () => {
    localStorage.setItem('my-key', JSON.stringify({ a: 1 }));
    expect(loadJSON('my-key', {})).toEqual({ a: 1 });
  });

  it('저장된 값이 손상된 JSON이면 fallback을 반환한다', () => {
    localStorage.setItem('bad-key', '{not valid json');
    expect(loadJSON('bad-key', 'fallback')).toBe('fallback');
  });
});

describe('saveJSON', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('값을 JSON으로 직렬화해 저장한다', () => {
    saveJSON('my-key', { a: 1 });
    expect(localStorage.getItem('my-key')).toBe('{"a":1}');
  });

  it('localStorage.setItem이 예외를 던져도 에러를 전파하지 않는다', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    expect(() => saveJSON('my-key', { a: 1 })).not.toThrow();

    spy.mockRestore();
  });
});
