import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Locale = 'en' | 'ru';

interface I18nStore {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
}

export const useI18n = create<I18nStore>()(
  persist(
    (set) => ({
      locale: 'en',
      setLocale: (locale) => set({ locale }),
      toggleLocale: () => set((s) => ({ locale: s.locale === 'en' ? 'ru' : 'en' })),
    }),
    { name: 'dnd-cm-locale' },
  ),
);

// ── UI translations ──

const UI_EN = {
  // Tabs
  'tab.main': 'Main',
  'tab.spellcasting': 'Spellcasting',
  'tab.inventory': 'Inventory',
  'tab.story': 'Story',
  // Sections
  'section.abilityScores': 'Ability Scores',
  'section.savingThrows': 'Saving Throws',
  'section.skills': 'Skills',
  'section.senses': 'Senses',
  'section.proficiencies': 'Proficiencies',
  'section.features': 'Features',
  'section.feats': 'Feats',
  'section.spellSlots': 'Spell Slots',
  'section.equipment': 'Equipment',
  'section.currency': 'Currency',
  'section.carryingCapacity': 'Carrying Capacity',
  'section.identity': 'Identity',
  'section.personality': 'Personality',
  'section.appearance': 'Appearance',
  'section.backstory': 'Backstory',
  'section.notes': 'Notes',
  // Core stats
  'stat.ac': 'AC',
  'stat.hp': 'HP',
  'stat.speed': 'Speed',
  'stat.initiative': 'Initiative',
  'stat.proficiency': 'Proficiency',
  'stat.inspiration': 'Inspiration',
  'stat.passivePerception': 'Passive Perception',
  'stat.passiveInsight': 'Passive Insight',
  'stat.passiveInvestigation': 'Passive Investigation',
  'stat.darkvision': 'Darkvision',
  'stat.normalVision': 'Normal Vision',
  // Actions
  'action.edit': 'Edit',
  'action.shortRest': 'Short Rest',
  'action.longRest': 'Long Rest',
  'action.roll': 'Roll',
  'action.done': 'Done',
  'action.cancel': 'Cancel',
  'action.reroll': 'Reroll (Inspiration)',
  'action.rollAgain': 'Roll Again',
  'action.createCharacter': 'Create Character',
  'action.newCharacter': 'New Character',
  'action.loadSample': 'Load Sample Characters',
  'action.exportAll': 'Export all',
  'action.import': 'Import',
  // Roll modal
  'roll.advantage': 'Advantage',
  'roll.normal': 'Normal',
  'roll.disadvantage': 'Disadvantage',
  'roll.bonusDice': 'Bonus Dice',
  'roll.extraMod': 'Extra Modifier',
  'roll.critical': 'Critical!',
  'roll.criticalFail': 'Critical Fail!',
  'roll.guidance': 'Guidance (d4)',
  'roll.bless': 'Bless (d4)',
  // Rest
  'rest.shortDesc': 'Spend Hit Dice to recover HP.',
  'rest.longDesc': 'After a long rest, you regain:',
  'rest.hpRestored': 'All HP restored',
  'rest.hdRecovered': 'Hit Dice recovered',
  'rest.slotsRestored': 'All spell slots restored',
  'rest.tempReset': 'Temp HP reset to 0',
  'rest.hpHealed': 'HP Healed',
  // Misc
  'misc.prepared': 'Prepared',
  'misc.known': 'Known',
  'misc.level': 'Level',
  'misc.traits': 'Traits',
  'misc.encumbered': 'Encumbered',
  'misc.search': 'Search...',
  'misc.yes': 'Yes',
  'misc.no': 'No',
} as const;

const UI_RU: Record<keyof typeof UI_EN, string> = {
  'tab.main': 'Основное',
  'tab.spellcasting': 'Заклинания',
  'tab.inventory': 'Инвентарь',
  'tab.story': 'История',
  'section.abilityScores': 'Характеристики',
  'section.savingThrows': 'Спасброски',
  'section.skills': 'Навыки',
  'section.senses': 'Чувства',
  'section.proficiencies': 'Владения',
  'section.features': 'Умения',
  'section.feats': 'Черты',
  'section.spellSlots': 'Ячейки заклинаний',
  'section.equipment': 'Снаряжение',
  'section.currency': 'Валюта',
  'section.carryingCapacity': 'Грузоподъёмность',
  'section.identity': 'Личность',
  'section.personality': 'Характер',
  'section.appearance': 'Внешность',
  'section.backstory': 'Предыстория',
  'section.notes': 'Заметки',
  'stat.ac': 'КЗ',
  'stat.hp': 'ОЗ',
  'stat.speed': 'Скорость',
  'stat.initiative': 'Инициатива',
  'stat.proficiency': 'Бонус мастерства',
  'stat.inspiration': 'Вдохновение',
  'stat.passivePerception': 'Пассивное внимание',
  'stat.passiveInsight': 'Пассивная проницат.',
  'stat.passiveInvestigation': 'Пассивный анализ',
  'stat.darkvision': 'Тёмное зрение',
  'stat.normalVision': 'Обычное зрение',
  'action.edit': 'Редактировать',
  'action.shortRest': 'Короткий отдых',
  'action.longRest': 'Длинный отдых',
  'action.roll': 'Бросок',
  'action.done': 'Готово',
  'action.cancel': 'Отмена',
  'action.reroll': 'Перебросить (Вдохновение)',
  'action.rollAgain': 'Бросить снова',
  'action.createCharacter': 'Создать персонажа',
  'action.newCharacter': 'Новый персонаж',
  'action.loadSample': 'Загрузить примеры',
  'action.exportAll': 'Экспорт',
  'action.import': 'Импорт',
  'roll.advantage': 'Преимущество',
  'roll.normal': 'Обычный',
  'roll.disadvantage': 'Помеха',
  'roll.bonusDice': 'Бонусные кости',
  'roll.extraMod': 'Доп. модификатор',
  'roll.critical': 'Критический удар!',
  'roll.criticalFail': 'Критический провал!',
  'roll.guidance': 'Указание (к4)',
  'roll.bless': 'Благословение (к4)',
  'rest.shortDesc': 'Потратьте Кости Хитов для восстановления ОЗ.',
  'rest.longDesc': 'После длинного отдыха вы восстанавливаете:',
  'rest.hpRestored': 'Все ОЗ восстановлены',
  'rest.hdRecovered': 'Кости Хитов восстановлены',
  'rest.slotsRestored': 'Все ячейки заклинаний восстановлены',
  'rest.tempReset': 'Временные ОЗ сброшены',
  'rest.hpHealed': 'ОЗ восстановлено',
  'misc.prepared': 'Подготовлено',
  'misc.known': 'Известно',
  'misc.level': 'Уровень',
  'misc.traits': 'Особенности',
  'misc.encumbered': 'Перегружен',
  'misc.search': 'Поиск...',
  'misc.yes': 'Да',
  'misc.no': 'Нет',
};

type UIKey = keyof typeof UI_EN;
const UI_TRANSLATIONS = { en: UI_EN, ru: UI_RU };

export function t(key: UIKey): string {
  const locale = useI18n.getState().locale;
  return UI_TRANSLATIONS[locale][key] || UI_TRANSLATIONS.en[key] || key;
}

export function useT() {
  const locale = useI18n((s) => s.locale);
  return (key: UIKey): string => {
    return UI_TRANSLATIONS[locale][key] || UI_TRANSLATIONS.en[key] || key;
  };
}
