import { describe, it, expect } from 'vitest';
import { validatePromptLength, MAX_PROMPT_LENGTH } from './promptValidation';

describe('validatePromptLength', () => {
  it('빈 문자열이면 유효하다 (null 반환)', () => {
    expect(validatePromptLength('')).toBeNull();
  });

  it('500자 이하이면 유효하다 (null 반환)', () => {
    expect(validatePromptLength('a'.repeat(MAX_PROMPT_LENGTH))).toBeNull();
  });

  it('500자를 초과하면 에러 메시지를 반환한다', () => {
    const result = validatePromptLength('a'.repeat(MAX_PROMPT_LENGTH + 1));
    expect(result).not.toBeNull();
    expect(result).toContain(String(MAX_PROMPT_LENGTH));
  });

  it('501자일 때 현재 글자 수를 에러 메시지에 포함한다', () => {
    const result = validatePromptLength('a'.repeat(501));
    expect(result).toContain('501');
  });
});
