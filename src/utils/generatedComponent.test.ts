import { describe, it, expect } from 'vitest';
import { reviveGeneratedComponents } from './generatedComponent';

describe('reviveGeneratedComponents', () => {
  it('배열이 아니면 빈 배열을 반환한다', () => {
    expect(reviveGeneratedComponents(undefined)).toEqual([]);
    expect(reviveGeneratedComponents(null)).toEqual([]);
    expect(reviveGeneratedComponents('not-an-array')).toEqual([]);
    expect(reviveGeneratedComponents({})).toEqual([]);
  });

  it('유효한 항목의 createdAt을 Date 인스턴스로 복원한다', () => {
    const raw = [
      { id: '1', prompt: '카드', code: 'const A = () => null;', createdAt: '2024-01-01T00:00:00.000Z' },
    ];

    const result = reviveGeneratedComponents(raw);

    expect(result).toHaveLength(1);
    expect(result[0].createdAt).toBeInstanceOf(Date);
    expect(result[0].createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
    expect(result[0]).toMatchObject({ id: '1', prompt: '카드', code: 'const A = () => null;' });
  });

  it('필수 필드(id/prompt/code)가 없는 항목은 걸러낸다', () => {
    const raw = [
      { id: '1', prompt: '카드', createdAt: '2024-01-01T00:00:00.000Z' },
      { prompt: '카드', code: 'x', createdAt: '2024-01-01T00:00:00.000Z' },
    ];

    expect(reviveGeneratedComponents(raw)).toEqual([]);
  });

  it('createdAt이 유효하지 않은 날짜면 걸러낸다', () => {
    const raw = [{ id: '1', prompt: '카드', code: 'x', createdAt: 'not-a-date' }];

    expect(reviveGeneratedComponents(raw)).toEqual([]);
  });

  it('유효한 항목과 무효한 항목이 섞여 있으면 유효한 것만 순서대로 남긴다', () => {
    const raw = [
      { id: '1', prompt: 'A', code: 'a', createdAt: '2024-01-01T00:00:00.000Z' },
      { id: '2', code: 'b', createdAt: '2024-01-02T00:00:00.000Z' },
      { id: '3', prompt: 'C', code: 'c', createdAt: '2024-01-03T00:00:00.000Z' },
    ];

    const result = reviveGeneratedComponents(raw);

    expect(result.map((c) => c.id)).toEqual(['1', '3']);
  });
});
