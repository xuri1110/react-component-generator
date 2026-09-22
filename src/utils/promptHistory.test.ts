import { describe, it, expect } from 'vitest';
import { addPromptToHistory } from './promptHistory';

describe('addPromptToHistory', () => {
  it('빈 히스토리에 프롬프트를 추가하면 그 프롬프트 하나만 남는다', () => {
    expect(addPromptToHistory([], '카드 만들어줘')).toEqual(['카드 만들어줘']);
  });

  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addPromptToHistory(['a', 'b'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it('이미 있는 프롬프트를 다시 추가하면 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addPromptToHistory(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('앞뒤 공백은 제거하고 저장한다', () => {
    expect(addPromptToHistory([], '  카드  ')).toEqual(['카드']);
  });

  it('빈 문자열이나 공백만 있는 프롬프트는 추가하지 않는다', () => {
    expect(addPromptToHistory(['a'], '   ')).toEqual(['a']);
  });

  it('최대 길이를 넘으면 가장 오래된 항목을 제거한다', () => {
    const history = ['a', 'b', 'c'];
    expect(addPromptToHistory(history, 'd', 3)).toEqual(['d', 'a', 'b']);
  });
});
