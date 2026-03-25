import type { Character } from '../types/character';

export function exportCharacters(characters: Character[]): string {
  return JSON.stringify(characters, null, 2);
}

export function exportCharacter(character: Character): string {
  return JSON.stringify(character, null, 2);
}

export function importCharacters(json: string): Character[] {
  const data = JSON.parse(json);
  if (Array.isArray(data)) {
    return data.filter(isValidCharacter);
  }
  if (isValidCharacter(data)) {
    return [data];
  }
  throw new Error('Invalid character data format');
}

function isValidCharacter(obj: unknown): obj is Character {
  if (typeof obj !== 'object' || obj === null) return false;
  const c = obj as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.name === 'string' &&
    typeof c.race === 'object' &&
    Array.isArray(c.classes) &&
    typeof c.abilityScores === 'object'
  );
}

export function downloadAsFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
