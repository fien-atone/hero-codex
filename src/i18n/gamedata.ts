// Unified game data localization helper
// Returns localized name for any game entity, with English fallback

import { useI18n } from './index';
import { ABILITY_NAMES_RU, SKILL_NAMES_RU, RACE_NAMES_RU, SUBRACE_NAMES_RU, CLASS_NAMES_RU, SUBCLASS_NAMES_RU, BACKGROUND_NAMES_RU, ALIGNMENT_NAMES_RU, SPELL_SCHOOL_NAMES_RU } from './terms';
import { SPELL_NAMES_RU } from './spells-ru';
import { FEATURE_NAMES_RU } from './features-ru';

const DICTS = {
  ability: ABILITY_NAMES_RU,
  skill: SKILL_NAMES_RU,
  race: RACE_NAMES_RU,
  subrace: SUBRACE_NAMES_RU,
  class: CLASS_NAMES_RU,
  subclass: SUBCLASS_NAMES_RU,
  background: BACKGROUND_NAMES_RU,
  alignment: ALIGNMENT_NAMES_RU,
  spellSchool: SPELL_SCHOOL_NAMES_RU,
  spell: SPELL_NAMES_RU,
  feature: FEATURE_NAMES_RU,
} as const;

type DictType = keyof typeof DICTS;

// Get localized name — works outside React
export function gl(type: DictType, name: string): string {
  const locale = useI18n.getState().locale;
  if (locale === 'en') return name;
  return DICTS[type][name] || name;
}

// Hook version for React components — triggers re-render on locale change
export function useGL() {
  const locale = useI18n((s) => s.locale);
  return (type: DictType, name: string): string => {
    if (locale === 'en') return name;
    return DICTS[type][name] || name;
  };
}

// Localize with both names: "Огненный шар (Fireball)" when in Russian
export function glBoth(type: DictType, name: string): string {
  const locale = useI18n.getState().locale;
  if (locale === 'en') return name;
  const ru = DICTS[type][name];
  return ru ? `${ru}` : name;
}
