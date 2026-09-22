import type { GeneratedComponent } from '../types';

function isValidEntry(entry: unknown): entry is Record<string, unknown> {
  if (typeof entry !== 'object' || entry === null) return false;
  const { id, prompt, code, createdAt } = entry as Record<string, unknown>;
  return (
    typeof id === 'string' &&
    typeof prompt === 'string' &&
    typeof code === 'string' &&
    typeof createdAt === 'string' &&
    !Number.isNaN(new Date(createdAt).getTime())
  );
}

export function reviveGeneratedComponents(raw: unknown): GeneratedComponent[] {
  if (!Array.isArray(raw)) return [];

  return raw.filter(isValidEntry).map((entry) => ({
    id: entry.id as string,
    prompt: entry.prompt as string,
    code: entry.code as string,
    createdAt: new Date(entry.createdAt as string),
  }));
}
