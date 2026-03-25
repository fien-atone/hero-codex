export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface ClassEntry {
  name: string;
  source: string;
  subclass?: { name: string; shortName: string; source: string };
  level: number;
}

export interface SpellRef {
  name: string;
  source: string;
  prepared?: boolean;
  favorite?: boolean;
}

export interface SpellSlots {
  total: number;
  used: number;
}

export interface Spellcasting {
  ability: AbilityKey;
  knownSpells: SpellRef[];
  slots: Record<number, SpellSlots>; // spell level → slots
}

export interface EquipmentItem {
  name: string;
  source: string;
  quantity: number;
  equipped: boolean;
  attuned: boolean;
}

export interface Currency {
  cp: number;
  sp: number;
  ep: number;
  gp: number;
  pp: number;
}

export interface HitPoints {
  max: number;
  current: number;
  temp: number;
}

export interface HitDie {
  faces: number;
  total: number;
  used: number;
}

export interface Proficiencies {
  skills: string[];
  tools: string[];
  languages: string[];
  armor: string[];
  weapons: string[];
  savingThrows: AbilityKey[];
}

export interface Feature {
  name: string;
  source: string;
  description: string;
  level?: number;
  className?: string;
  subclassName?: string;
}

export interface Character {
  id: string;
  name: string;
  race: { name: string; source: string; subrace?: string };
  classes: ClassEntry[];
  background: { name: string; source: string };
  alignment: string;

  abilityScores: AbilityScores;
  abilityBonuses?: Partial<AbilityScores>; // from race, feats, etc.

  hitPoints: HitPoints;
  hitDice: HitDie[];

  armorClass: number;
  speed: Record<string, number>;
  initiative?: number;

  proficiencies: Proficiencies;
  expertises: string[];

  features: Feature[];
  feats: Array<{ name: string; source: string }>;

  spellcasting?: Spellcasting;

  equipment: EquipmentItem[];
  currency: Currency;

  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  backstory: string;
  appearance: string;
  notes: string;

  heroicInspiration: boolean;
  avatar?: string; // base64 data URL

  campaign?: string;
  tags: string[];
  favorite: boolean;

  createdAt: string;
  updatedAt: string;
}

// Computed helper
export function getCharacterLevel(char: Character): number {
  return char.classes.reduce((sum, c) => sum + c.level, 0);
}

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function getProficiencyBonus(level: number): number {
  return Math.ceil(level / 4) + 1;
}

export const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
] as const;

export const ABILITY_NAMES: Record<AbilityKey, string> = {
  str: 'Strength',
  dex: 'Dexterity',
  con: 'Constitution',
  int: 'Intelligence',
  wis: 'Wisdom',
  cha: 'Charisma',
};

export const ABILITY_KEYS: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const SKILLS: Record<string, AbilityKey> = {
  acrobatics: 'dex',
  'animal handling': 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  'sleight of hand': 'dex',
  stealth: 'dex',
  survival: 'wis',
};
