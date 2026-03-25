import { create } from 'zustand';

type Die = 4 | 6 | 8 | 10 | 12 | 20 | 100;

export interface DieGroup {
  die: Die;
  rolls: number[];
}

export interface RollEntry {
  id: string;
  label?: string;        // e.g. "Athletics", "Fireball Damage", "Initiative"
  groups: DieGroup[];
  modifier: number;
  total: number;
  ts: number;
}

export interface QuickRollRequest {
  label: string;
  dice: Partial<Record<Die, number>>;  // e.g. { 20: 1 } for d20, { 6: 8 } for 8d6
  modifier: number;
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

const DICE_ORDER: Die[] = [4, 6, 8, 10, 12, 20, 100];

interface DiceStore {
  open: boolean;
  pool: Partial<Record<Die, number>>;
  modifier: number;
  history: RollEntry[];
  expandedIds: Set<string>;
  animKey: number;

  setOpen: (open: boolean) => void;
  addDie: (die: Die) => void;
  removeDie: (die: Die) => void;
  clearPool: () => void;
  setModifier: (mod: number) => void;
  adjustModifier: (delta: number) => void;
  toggleExpand: (id: string) => void;
  clearHistory: () => void;

  // Core roll from current pool
  roll: () => void;

  // Quick roll — opens panel, rolls immediately, shows result
  quickRoll: (request: QuickRollRequest) => void;
}

export const useDiceStore = create<DiceStore>((set, get) => ({
  open: false,
  pool: {},
  modifier: 0,
  history: [],
  expandedIds: new Set(),
  animKey: 0,

  setOpen: (open) => set({ open }),

  addDie: (die) => set((s) => ({ pool: { ...s.pool, [die]: (s.pool[die] ?? 0) + 1 } })),

  removeDie: (die) => set((s) => {
    const count = (s.pool[die] ?? 1) - 1;
    const pool = { ...s.pool };
    if (count <= 0) delete pool[die];
    else pool[die] = count;
    return { pool };
  }),

  clearPool: () => set({ pool: {}, modifier: 0 }),

  setModifier: (mod) => set({ modifier: mod }),
  adjustModifier: (delta) => set((s) => ({ modifier: s.modifier + delta })),

  toggleExpand: (id) => set((s) => {
    const next = new Set(s.expandedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    return { expandedIds: next };
  }),

  clearHistory: () => set({ history: [], expandedIds: new Set() }),

  roll: () => {
    const { pool, modifier } = get();
    const poolKeys = DICE_ORDER.filter((d) => (pool[d] ?? 0) > 0);
    if (poolKeys.length === 0) return;

    const groups: DieGroup[] = poolKeys.map((d) => ({
      die: d,
      rolls: Array.from({ length: pool[d]! }, () => rollDie(d)),
    }));
    const sum = groups.reduce((a, g) => a + g.rolls.reduce((x, y) => x + y, 0), 0);
    const entry: RollEntry = {
      id: `${Date.now()}-${Math.random()}`,
      groups,
      modifier,
      total: sum + modifier,
      ts: Date.now(),
    };

    set((s) => ({
      animKey: s.animKey + 1,
      expandedIds: new Set([...s.expandedIds, entry.id]),
      history: [entry, ...s.history].slice(0, 50),
    }));
  },

  quickRoll: (request) => {
    const { label, dice, modifier: mod } = request;
    const groups: DieGroup[] = DICE_ORDER
      .filter((d) => (dice[d] ?? 0) > 0)
      .map((d) => ({
        die: d,
        rolls: Array.from({ length: dice[d]! }, () => rollDie(d)),
      }));
    const sum = groups.reduce((a, g) => a + g.rolls.reduce((x, y) => x + y, 0), 0);
    const entry: RollEntry = {
      id: `${Date.now()}-${Math.random()}`,
      label,
      groups,
      modifier: mod,
      total: sum + mod,
      ts: Date.now(),
    };

    set((s) => ({
      open: true,
      animKey: s.animKey + 1,
      expandedIds: new Set([...s.expandedIds, entry.id]),
      history: [entry, ...s.history].slice(0, 50),
    }));
  },
}));
