# D&D Character Manager

Local D&D 5e character manager built with React + TypeScript + Vite.

## Commands

- `npm run dev` — start dev server
- `npm run build` — build for production (runs `tsc -b && vite build`)
- `npx tsc --noEmit` — type check only

## Architecture

### Tech Stack
- React 18, TypeScript, Vite
- Zustand (state management + localStorage persistence)
- React Router (client-side routing)
- CSS Modules (styling, no Tailwind)
- Lucide React (icons)
- No backend, no API — all data in localStorage

### Data
- 5etools JSON files in `src/data/5etools/` — races, classes (per-file), spells, backgrounds, feats, items, items-base
- Loaded lazily via dynamic `import()` in `src/data/loaders.ts`, cached in memory
- `items-base.json` contains basic weapons/armor/gear with weights; `items.json` has magic items
- All 5etools entries use tagged strings (`{@damage 1d6}`, `{@spell fireball}`) — parsed by `EntryRenderer`

### Stores (Zustand, persisted to localStorage)
- `characterStore` — characters CRUD, filters, campaigns
- `uiStore` — theme (dark/light), sidebar, view mode
- `diceStore` — dice roller pool, history, roll mechanics (shared across components)

### Key Types
- `Character` in `src/types/character.ts` — full character model with abilities, HP, spells, equipment, features, avatar (base64)
- `Race`, `ClassData`, `Spell`, `Background`, `Feat`, `Item` in `src/types/gamedata.ts` — 5etools data types

### Routing
- `/` — Dashboard (character cards grid)
- `/character/:id` — Character Sheet (tabbed: Main, Spellcasting, Inventory, Story)
- `/character/:id/edit` — Character Editor
- `/create` — Character Creator (6-step wizard)

### Character Sheet Tabs
- **Main** — core stats bar (Inspiration, Proficiency, Initiative, AC, HP with input + temp + hit dice, Speed), 3-column layout: (Abilities + Saves + Senses + Proficiencies) | (Skills) | (Class Features accordion + Race Traits + Background)
- **Spellcasting** — grouped by spell level, prepared toggle for preparing classes, cast-from-slot buttons, damage roll integration
- **Inventory** — currency on top, carrying capacity bar (STR×15), equipment table with qty/weight/status
- **Story** — identity, personality (4-block grid), appearance, backstory, notes

### Interactive Features
- **RollModal** — opens before any d20 roll: advantage/disadvantage selector, Guidance/Bless bonus dice, extra modifier, then shows result with nat20/nat1 detection. Reroll with Heroic Inspiration (spends it)
- **DiceRoller** — FAB button (d20 SVG, spins on hover), slide-in panel with 7 die types (SVG shapes), pool builder, modifier, roll history with expandable breakdowns, crit detection
- **RestModal** — Short Rest (choose hit dice to spend, roll healing, warlock slot recovery) and Long Rest (full HP, half hit dice, all slots)
- **Features accordion** — class features + subclass features (violet badge) from 5etools with in-place expand via EntryRenderer. Feats with full 5etools descriptions. Race traits (teal badge). Background entries.
- **DetailPanel** — fixed right-side panel for race/background/spell details from 5etools

### Design System
- Inspired by arcane-ledger: dark theme with Aged Gold (#f2ca50) primary, Teal (#7bd6d1) secondary, Violet (#d0c8ff) tertiary
- Sharp corners (2-4px radius), uppercase label typography (9-10px, tracking 0.18em)
- CSS variables in `src/index.css`, both dark and light themes
- SectionHeader component: `[icon] TITLE ────` pattern with gold line

### Conventions
- One component per file, CSS Module alongside (`.module.css`)
- 5etools data accessed via async loaders in `src/data/loaders.ts` — never import JSON directly in components
- All game calculations in `src/utils/calculations.ts` with `CalculationBreakdown` for transparency
- Tags/campaigns exist in Character model but removed from UI (user preference)
