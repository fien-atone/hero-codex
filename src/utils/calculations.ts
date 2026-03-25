import {
  Character,
  AbilityKey,
  AbilityScores,
  getModifier,
  getCharacterLevel,
  getProficiencyBonus,
  SKILLS,
} from '../types/character';

export interface CalculationBreakdown {
  total: number;
  parts: Array<{ label: string; value: number }>;
}

export function getAbilityModifier(score: number): number {
  return getModifier(score);
}

export function getEffectiveAbilityScore(char: Character, ability: AbilityKey): number {
  const base = char.abilityScores[ability];
  const bonus = char.abilityBonuses?.[ability] ?? 0;
  return base + bonus;
}

export function getAbilityBreakdown(char: Character, ability: AbilityKey): CalculationBreakdown {
  const base = char.abilityScores[ability];
  const bonus = char.abilityBonuses?.[ability] ?? 0;
  const parts: Array<{ label: string; value: number }> = [
    { label: 'Base', value: base },
  ];
  if (bonus !== 0) {
    parts.push({ label: 'Racial/Feat Bonus', value: bonus });
  }
  return { total: base + bonus, parts };
}

export function getSkillModifier(char: Character, skill: string): CalculationBreakdown {
  const ability = SKILLS[skill];
  if (!ability) return { total: 0, parts: [] };

  const abilityScore = getEffectiveAbilityScore(char, ability);
  const abilityMod = getModifier(abilityScore);
  const level = getCharacterLevel(char);
  const profBonus = getProficiencyBonus(level);

  const parts: Array<{ label: string; value: number }> = [
    { label: `${ability.toUpperCase()} mod`, value: abilityMod },
  ];

  const isProficient = char.proficiencies.skills.includes(skill);
  const isExpert = char.expertises.includes(skill);

  if (isExpert) {
    parts.push({ label: 'Expertise', value: profBonus * 2 });
    return { total: abilityMod + profBonus * 2, parts };
  }
  if (isProficient) {
    parts.push({ label: 'Proficiency', value: profBonus });
    return { total: abilityMod + profBonus, parts };
  }

  return { total: abilityMod, parts };
}

export function getSavingThrowModifier(char: Character, ability: AbilityKey): CalculationBreakdown {
  const abilityScore = getEffectiveAbilityScore(char, ability);
  const abilityMod = getModifier(abilityScore);
  const level = getCharacterLevel(char);
  const profBonus = getProficiencyBonus(level);

  const parts: Array<{ label: string; value: number }> = [
    { label: `${ability.toUpperCase()} mod`, value: abilityMod },
  ];

  if (char.proficiencies.savingThrows.includes(ability)) {
    parts.push({ label: 'Proficiency', value: profBonus });
    return { total: abilityMod + profBonus, parts };
  }

  return { total: abilityMod, parts };
}

export function getInitiativeBreakdown(char: Character): CalculationBreakdown {
  const dexScore = getEffectiveAbilityScore(char, 'dex');
  const dexMod = getModifier(dexScore);
  return {
    total: dexMod,
    parts: [{ label: 'DEX mod', value: dexMod }],
  };
}

export function getPassivePerception(char: Character): CalculationBreakdown {
  const perception = getSkillModifier(char, 'perception');
  return {
    total: 10 + perception.total,
    parts: [{ label: 'Base', value: 10 }, ...perception.parts],
  };
}

export function getSpellSaveDC(char: Character): CalculationBreakdown | null {
  if (!char.spellcasting) return null;
  const ability = char.spellcasting.ability;
  const abilityScore = getEffectiveAbilityScore(char, ability);
  const abilityMod = getModifier(abilityScore);
  const level = getCharacterLevel(char);
  const profBonus = getProficiencyBonus(level);

  return {
    total: 8 + profBonus + abilityMod,
    parts: [
      { label: 'Base', value: 8 },
      { label: 'Proficiency', value: profBonus },
      { label: `${ability.toUpperCase()} mod`, value: abilityMod },
    ],
  };
}

export function getSpellAttackBonus(char: Character): CalculationBreakdown | null {
  if (!char.spellcasting) return null;
  const ability = char.spellcasting.ability;
  const abilityScore = getEffectiveAbilityScore(char, ability);
  const abilityMod = getModifier(abilityScore);
  const level = getCharacterLevel(char);
  const profBonus = getProficiencyBonus(level);

  return {
    total: profBonus + abilityMod,
    parts: [
      { label: 'Proficiency', value: profBonus },
      { label: `${ability.toUpperCase()} mod`, value: abilityMod },
    ],
  };
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function calculateMaxHP(
  abilityScores: AbilityScores,
  classes: Array<{ level: number; hitDieFaces: number }>,
): number {
  const conMod = getModifier(abilityScores.con);
  let hp = 0;
  for (const cls of classes) {
    // First level: max hit die + CON
    hp += cls.hitDieFaces + conMod;
    // Subsequent levels: average + CON
    for (let i = 1; i < cls.level; i++) {
      hp += Math.floor(cls.hitDieFaces / 2) + 1 + conMod;
    }
  }
  return Math.max(hp, 1);
}

export const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export const POINT_BUY_COSTS: Record<number, number> = {
  8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9,
};

export const POINT_BUY_TOTAL = 27;
