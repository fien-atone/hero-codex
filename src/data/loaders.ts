import type {
  Race,
  Subrace,
  ClassData,
  SubclassData,
  ClassFeatureData,
  Spell,
  Background,
  Feat,
  Item,
} from '../types/gamedata';

// Lazy-loaded caches
let racesCache: { races: Race[]; subraces: Subrace[] } | null = null;
let classesCache: Map<string, {
  cls: ClassData;
  subclasses: SubclassData[];
  features: ClassFeatureData[];
  subclassFeatures: ClassFeatureData[];
}> | null = null;
let spellsCache: Spell[] | null = null;
let backgroundsCache: Background[] | null = null;
let featsCache: Feat[] | null = null;
let itemsCache: Item[] | null = null;

export async function loadRaces(): Promise<{ races: Race[]; subraces: Subrace[] }> {
  if (racesCache) return racesCache;
  const data: any = await import('../data/5etools/races.json');
  racesCache = {
    races: (data.race || []).filter((r: any) => !r._copy) as Race[],
    subraces: (data.subrace || []).filter((s: any) => !s._copy) as Subrace[],
  };
  return racesCache!;
}

export async function loadClasses(): Promise<Map<string, {
  cls: ClassData;
  subclasses: SubclassData[];
  features: ClassFeatureData[];
  subclassFeatures: ClassFeatureData[];
}>> {
  if (classesCache) return classesCache;

  const classFiles = [
    'barbarian', 'bard', 'cleric', 'druid', 'fighter', 'monk',
    'paladin', 'ranger', 'rogue', 'sorcerer', 'warlock', 'wizard',
  ];

  classesCache = new Map();

  const imports = classFiles.map(async (name) => {
    const mod: any = await import(`../data/5etools/class/class-${name}.json`);
    // Dynamic JSON import: data may be in mod.default or as named exports
    // "class" is a reserved word so access via bracket notation
    const data = mod.default || mod;
    const cls = (data['class'] || [])[0] as ClassData;
    if (cls) {
      classesCache!.set(cls.name.toLowerCase(), {
        cls,
        subclasses: (data.subclass || data['subclass'] || []) as SubclassData[],
        features: (data.classFeature || data['classFeature'] || []) as ClassFeatureData[],
        subclassFeatures: (data.subclassFeature || data['subclassFeature'] || []) as ClassFeatureData[],
      });
    }
  });

  await Promise.all(imports);
  return classesCache;
}

export async function loadSpells(): Promise<Spell[]> {
  if (spellsCache) return spellsCache;
  const [phb, xge]: any[] = await Promise.all([
    import('../data/5etools/spells/spells-phb.json'),
    import('../data/5etools/spells/spells-xge.json'),
  ]);
  spellsCache = [...(phb.spell || []), ...(xge.spell || [])] as Spell[];
  return spellsCache;
}

export async function loadBackgrounds(): Promise<Background[]> {
  if (backgroundsCache) return backgroundsCache;
  const data: any = await import('../data/5etools/backgrounds.json');
  backgroundsCache = (data.background || []).filter((b: any) => !b._copy) as Background[];
  return backgroundsCache;
}

export async function loadFeats(): Promise<Feat[]> {
  if (featsCache) return featsCache;
  const data: any = await import('../data/5etools/feats.json');
  featsCache = data.feat as Feat[];
  return featsCache;
}

export async function loadItems(): Promise<Item[]> {
  if (itemsCache) return itemsCache;
  const data: any = await import('../data/5etools/items.json');
  itemsCache = (data.item || []).filter((i: any) => !i._copy) as Item[];
  return itemsCache;
}

// Base items (weapons, armor, gear with weights)
let baseItemsCache: Item[] | null = null;

export async function loadBaseItems(): Promise<Item[]> {
  if (baseItemsCache) return baseItemsCache;
  const data: any = await import('../data/5etools/items-base.json');
  baseItemsCache = (data.baseitem || []) as Item[];
  return baseItemsCache;
}

// Helper to get PHB-only races (most commonly used)
export function filterPHBRaces(races: Race[]): Race[] {
  return races.filter((r) => r.source === 'PHB');
}

// Helper to get spells for a specific class
export function getSpellsForClass(spells: Spell[], className: string): Spell[] {
  return spells.filter(
    (s) => s.classes?.fromClassList?.some((c) => c.name.toLowerCase() === className.toLowerCase()),
  );
}
