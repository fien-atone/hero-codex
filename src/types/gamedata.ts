// Types matching 5etools JSON schema

export interface GameDataRef {
  name: string;
  source: string;
}

// Entries can be strings or rich objects
export type Entry = string | EntryObject;

export interface EntryObject {
  type: string;
  name?: string;
  entries?: Entry[];
  items?: Entry[];
  caption?: string;
  colLabels?: string[];
  colStyles?: string[];
  rows?: string[][];
}

// === RACES ===
export interface Race {
  name: string;
  source: string;
  page?: number;
  size?: string[];
  speed?: number | { walk?: number; fly?: number; swim?: number; climb?: number; burrow?: number };
  ability?: Array<Partial<Record<string, number>>>;
  darkvision?: number;
  traitTags?: string[];
  languageProficiencies?: Array<Record<string, boolean | number>>;
  skillProficiencies?: Array<Record<string, boolean>>;
  entries?: Entry[];
  srd?: boolean;
  basicRules?: boolean;
  _copy?: { name: string; source: string };
}

export interface Subrace {
  name: string;
  source: string;
  raceName: string;
  raceSource: string;
  ability?: Array<Partial<Record<string, number>>>;
  entries?: Entry[];
  speed?: number | Record<string, number>;
  darkvision?: number;
  skillProficiencies?: Array<Record<string, boolean>>;
  _copy?: { name: string; source: string };
}

export interface RacesData {
  race: Race[];
  subrace?: Subrace[];
}

// === CLASSES ===
export interface ClassData {
  name: string;
  source: string;
  page?: number;
  srd?: boolean;
  basicRules?: boolean;
  hd: { number: number; faces: number };
  proficiency: string[];
  startingProficiencies: {
    armor?: string[];
    weapons?: string[];
    tools?: Array<string | { choose?: { from: string[]; count: number } }>;
    skills?: Array<{ choose?: { from: string[]; count: number } }>;
  };
  startingEquipment?: {
    additionalFromBackground?: boolean;
    default?: string[];
    defaultData?: Array<Record<string, string[]>>;
  };
  multiclassing?: {
    requirements?: Record<string, number>;
    proficienciesGained?: {
      armor?: string[];
      weapons?: string[];
      skills?: Array<{ choose?: { from: string[]; count: number } }>;
    };
  };
  classFeatures?: Array<string | { classFeature: string; gainSubclassFeature?: boolean }>;
  subclassTitle?: string;
  spellcastingAbility?: string;
  casterProgression?: string;
  cantripProgression?: number[];
  spellsKnownProgression?: number[];
}

export interface SubclassData {
  name: string;
  shortName: string;
  source: string;
  className: string;
  classSource: string;
  subclassFeatures?: Array<string>;
}

export interface ClassFeatureData {
  name: string;
  source: string;
  className: string;
  classSource: string;
  level: number;
  entries: Entry[];
}

export interface ClassFileData {
  class: ClassData[];
  subclass: SubclassData[];
  classFeature: ClassFeatureData[];
  subclassFeature: ClassFeatureData[];
}

// === SPELLS ===
export interface Spell {
  name: string;
  source: string;
  page?: number;
  srd?: boolean;
  level: number; // 0 = cantrip
  school: string; // V, C, A, T, D, N, I, E
  time: Array<{ number: number; unit: string }>;
  range: {
    type: string;
    distance?: { type: string; amount?: number };
  };
  components: {
    v?: boolean;
    s?: boolean;
    m?: string | { text: string; cost?: number; consume?: boolean };
  };
  duration: Array<{
    type: string;
    duration?: { type: string; amount: number };
    concentration?: boolean;
  }>;
  entries: Entry[];
  entriesHigherLevel?: Entry[];
  damageInflict?: string[];
  savingThrow?: string[];
  spellAttack?: string[];
  conditionInflict?: string[];
  areaTags?: string[];
  miscTags?: string[];
  classes?: { fromClassList?: GameDataRef[] };
}

export interface SpellsData {
  spell: Spell[];
}

// === BACKGROUNDS ===
export interface Background {
  name: string;
  source: string;
  page?: number;
  srd?: boolean;
  basicRules?: boolean;
  skillProficiencies?: Array<Record<string, boolean>>;
  languageProficiencies?: Array<Record<string, boolean | number>>;
  toolProficiencies?: Array<Record<string, boolean>>;
  startingEquipment?: Array<Record<string, unknown[]>>;
  entries?: Entry[];
  _copy?: { name: string; source: string };
}

export interface BackgroundsData {
  background: Background[];
}

// === FEATS ===
export interface Feat {
  name: string;
  source: string;
  page?: number;
  srd?: boolean;
  prerequisite?: Array<Record<string, unknown>>;
  ability?: Array<Partial<Record<string, number>>>;
  skillProficiencies?: Array<Record<string, boolean>>;
  entries?: Entry[];
  _versions?: unknown[];
}

export interface FeatsData {
  feat: Feat[];
}

// === ITEMS ===
export interface Item {
  name: string;
  source: string;
  page?: number;
  srd?: boolean;
  type?: string;
  rarity?: string;
  weight?: number;
  value?: number;
  ac?: number;
  dmg1?: string;
  dmg2?: string;
  dmgType?: string;
  property?: string[];
  range?: string;
  weaponCategory?: string;
  baseItem?: string;
  wondrous?: boolean;
  reqAttune?: string | boolean;
  entries?: Entry[];
  _copy?: { name: string; source: string };
}

export interface ItemsData {
  item: Item[];
  itemGroup?: Item[];
}

// School code mapping
export const SPELL_SCHOOLS: Record<string, string> = {
  A: 'Abjuration',
  C: 'Conjuration',
  D: 'Divination',
  E: 'Enchantment',
  V: 'Evocation',
  I: 'Illusion',
  N: 'Necromancy',
  T: 'Transmutation',
};

export const SOURCE_NAMES: Record<string, string> = {
  PHB: "Player's Handbook",
  DMG: "Dungeon Master's Guide",
  MM: "Monster Manual",
  XGE: "Xanathar's Guide to Everything",
  TCE: "Tasha's Cauldron of Everything",
  MPMM: "Mordenkainen Presents: Monsters of the Multiverse",
  EEPC: "Elemental Evil Player's Companion",
  SCAG: "Sword Coast Adventurer's Guide",
  VGM: "Volo's Guide to Monsters",
  MTF: "Mordenkainen's Tome of Foes",
  GGR: "Guildmasters' Guide to Ravnica",
  AI: "Acquisitions Incorporated",
  ERLW: "Eberron: Rising from the Last War",
  EGW: "Explorer's Guide to Wildemount",
  FTD: "Fizban's Treasury of Dragons",
  SCC: "Strixhaven: A Curriculum of Chaos",
};
