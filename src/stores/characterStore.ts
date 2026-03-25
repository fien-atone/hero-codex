import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Character } from '../types/character';

interface CharacterFilters {
  search: string;
  campaign: string | null;
  tags: string[];
  favoritesOnly: boolean;
}

interface CharacterStore {
  characters: Character[];
  campaigns: string[];
  allTags: string[];
  filters: CharacterFilters;

  // Actions
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  duplicateCharacter: (id: string) => Character | null;

  toggleFavorite: (id: string) => void;

  setFilter: (filter: Partial<CharacterFilters>) => void;
  clearFilters: () => void;

  addCampaign: (name: string) => void;
  removeCampaign: (name: string) => void;

  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;

  importCharacters: (characters: Character[]) => void;

  getFilteredCharacters: () => Character[];
  getCharacterById: (id: string) => Character | undefined;
  getCharactersByCampaign: () => Record<string, Character[]>;
}

const DEFAULT_FILTERS: CharacterFilters = {
  search: '',
  campaign: null,
  tags: [],
  favoritesOnly: false,
};

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set, get) => ({
      characters: [],
      campaigns: [],
      allTags: [],
      filters: { ...DEFAULT_FILTERS },

      addCharacter: (character) =>
        set((state) => {
          const campaigns = character.campaign && !state.campaigns.includes(character.campaign)
            ? [...state.campaigns, character.campaign]
            : state.campaigns;
          const newTags = character.tags.filter((t) => !state.allTags.includes(t));
          const allTags = newTags.length ? [...state.allTags, ...newTags] : state.allTags;
          return {
            characters: [...state.characters, character],
            campaigns,
            allTags,
          };
        }),

      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c,
          ),
        })),

      deleteCharacter: (id) =>
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
        })),

      duplicateCharacter: (id) => {
        const char = get().characters.find((c) => c.id === id);
        if (!char) return null;
        const newChar: Character = {
          ...structuredClone(char),
          id: crypto.randomUUID(),
          name: `${char.name} (Copy)`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        get().addCharacter(newChar);
        return newChar;
      },

      toggleFavorite: (id) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, favorite: !c.favorite } : c,
          ),
        })),

      setFilter: (filter) =>
        set((state) => ({
          filters: { ...state.filters, ...filter },
        })),

      clearFilters: () => set({ filters: { ...DEFAULT_FILTERS } }),

      addCampaign: (name) =>
        set((state) => ({
          campaigns: state.campaigns.includes(name) ? state.campaigns : [...state.campaigns, name],
        })),

      removeCampaign: (name) =>
        set((state) => ({
          campaigns: state.campaigns.filter((c) => c !== name),
        })),

      addTag: (tag) =>
        set((state) => ({
          allTags: state.allTags.includes(tag) ? state.allTags : [...state.allTags, tag],
        })),

      removeTag: (tag) =>
        set((state) => ({
          allTags: state.allTags.filter((t) => t !== tag),
        })),

      importCharacters: (characters) =>
        set((state) => {
          const existingIds = new Set(state.characters.map((c) => c.id));
          const newChars = characters.filter((c) => !existingIds.has(c.id));
          const allChars = [...state.characters, ...newChars];
          const campaigns = [...new Set(allChars.map((c) => c.campaign).filter(Boolean) as string[])];
          const allTags = [...new Set(allChars.flatMap((c) => c.tags))];
          return { characters: allChars, campaigns, allTags };
        }),

      getFilteredCharacters: () => {
        const { characters, filters } = get();
        return characters.filter((c) => {
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesName = c.name.toLowerCase().includes(search);
            const matchesRace = c.race.name.toLowerCase().includes(search);
            const matchesClass = c.classes.some((cl) => cl.name.toLowerCase().includes(search));
            if (!matchesName && !matchesRace && !matchesClass) return false;
          }
          if (filters.campaign !== null) {
            if (filters.campaign === '__none__') {
              if (c.campaign) return false;
            } else if (c.campaign !== filters.campaign) return false;
          }
          if (filters.tags.length > 0 && !filters.tags.some((t) => c.tags.includes(t))) return false;
          if (filters.favoritesOnly && !c.favorite) return false;
          return true;
        });
      },

      getCharacterById: (id) => get().characters.find((c) => c.id === id),

      getCharactersByCampaign: () => {
        const chars = get().getFilteredCharacters();
        const grouped: Record<string, Character[]> = {};
        for (const c of chars) {
          const key = c.campaign || 'Unsorted';
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push(c);
        }
        return grouped;
      },
    }),
    {
      name: 'dnd-cm-characters',
    },
  ),
);
