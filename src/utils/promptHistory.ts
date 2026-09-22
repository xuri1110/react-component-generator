export const MAX_PROMPT_HISTORY = 20;

export function addPromptToHistory(
  history: string[],
  prompt: string,
  maxLength: number = MAX_PROMPT_HISTORY
): string[] {
  const trimmed = prompt.trim();
  if (!trimmed) return history;

  const withoutDuplicate = history.filter((p) => p !== trimmed);
  return [trimmed, ...withoutDuplicate].slice(0, maxLength);
}
