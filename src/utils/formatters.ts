import type { Entry, EntryObject } from '../types/gamedata';

// Parse 5etools tagged strings like {@damage 1d6}, {@spell fireball}
export function parseTaggedString(text: string): string {
  return text
    .replace(/\{@damage\s+([^}]+)\}/g, '$1')
    .replace(/\{@dice\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@spell\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@item\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@creature\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@condition\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@skill\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@action\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@filter\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@book\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@class\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@race\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@background\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@feat\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@sense\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@atk\s+([^}]+)\}/g, (_, type) => {
      const attacks: string[] = [];
      if (type.includes('m')) attacks.push('Melee');
      if (type.includes('r')) attacks.push('Ranged');
      if (type.includes('w')) attacks.push('Weapon');
      if (type.includes('s')) attacks.push('Spell');
      return attacks.join(' ') + ' Attack';
    })
    .replace(/\{@hit\s+([^}]+)\}/g, (_, mod) => `+${mod}`)
    .replace(/\{@dc\s+([^}]+)\}/g, 'DC $1')
    .replace(/\{@b\s+([^}]+)\}/g, '$1')
    .replace(/\{@i\s+([^}]+)\}/g, '$1')
    .replace(/\{@note\s+([^}]+)\}/g, '$1')
    .replace(/\{@\w+\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1'); // fallback for unknown tags
}

export function renderEntry(entry: Entry): string {
  if (typeof entry === 'string') {
    return parseTaggedString(entry);
  }

  const obj = entry as EntryObject;
  const parts: string[] = [];

  if (obj.name) {
    parts.push(`**${obj.name}.**`);
  }

  if (obj.entries) {
    parts.push(obj.entries.map(renderEntry).join('\n'));
  }

  if (obj.items) {
    parts.push(obj.items.map((item) => `• ${renderEntry(item)}`).join('\n'));
  }

  return parts.join(' ');
}

export function renderEntries(entries: Entry[]): string {
  return entries.map(renderEntry).join('\n\n');
}

export function formatSpeed(speed: number | Record<string, number>): string {
  if (typeof speed === 'number') return `${speed} ft.`;
  return Object.entries(speed)
    .map(([type, value]) => (type === 'walk' ? `${value} ft.` : `${type} ${value} ft.`))
    .join(', ');
}

export function formatAbilityBonuses(ability: Array<Partial<Record<string, number>>>): string {
  if (!ability?.length) return 'None';
  return ability
    .map((a) =>
      Object.entries(a)
        .map(([key, val]) => `${key.toUpperCase()} ${val! >= 0 ? '+' : ''}${val}`)
        .join(', '),
    )
    .join('; ');
}

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function titleCase(s: string): string {
  return s.split(' ').map(capitalize).join(' ');
}
