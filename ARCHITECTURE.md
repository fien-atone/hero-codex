# Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Browser                                │
│  localStorage ←→ Zustand Stores ←→ React Components            │
│                     ↑                                           │
│              5etools JSON (lazy loaded, cached)                 │
└─────────────────────────────────────────────────────────────────┘
```

No backend. All data lives in the browser. 5etools JSON files are bundled as static assets and loaded on demand via dynamic `import()`.

## Directory Structure

```
src/
├── app/                          # App shell
│   ├── App.tsx                   # Router setup
│   ├── Layout.tsx                # Sidebar + main area + DiceRoller FAB
│   ├── Header.tsx                # Top bar: logo, export/import, theme toggle
│   └── *.module.css
│
├── components/
│   ├── ui/                       # Reusable primitives
│   │   ├── Button                # Variants: primary/secondary/ghost/danger/success
│   │   ├── Card                  # Surface container with optional hover/active
│   │   ├── Input / Select        # Form controls with label typography
│   │   ├── Tag                   # Pill badges (accent/gold/success/danger/info)
│   │   ├── Tabs                  # Tab navigation with icons
│   │   ├── Modal                 # Generic modal with backdrop
│   │   ├── DetailPanel           # Fixed right-side panel for 5etools content
│   │   ├── SectionHeader         # [icon] TITLE ──── pattern
│   │   ├── EntryRenderer         # Renders 5etools rich entries (text, lists, tables)
│   │   ├── DiceRoller            # FAB + slide-in panel with SVG dice
│   │   ├── RollModal             # Pre-roll dialog: advantage, bonuses, inspiration
│   │   └── RestModal             # Short/Long rest mechanics
│   │
│   ├── character-sheet/          # Character view (play mode)
│   │   └── CharacterSheet        # Tabbed: Main | Spellcasting | Inventory | Story
│   │
│   ├── character-creator/        # Step-by-step wizard
│   │   └── CharacterCreator      # 6 steps with 5etools data + DetailPanel
│   │
│   ├── character-editor/         # Free-form editing
│   │   └── CharacterEditor       # All fields editable
│   │
│   └── character-list/           # Dashboard + sidebar
│       ├── Dashboard             # Character cards grid, welcome screen
│       └── Sidebar               # Search + add button, flat alphabetical list
│
├── data/
│   ├── 5etools/                  # Static JSON data (copied from 5etools repo)
│   │   ├── races.json            # 134 races + 98 subraces
│   │   ├── class/class-*.json    # 12 PHB classes with features
│   │   ├── spells/spells-*.json  # PHB + XGE spells
│   │   ├── backgrounds.json      # 101 backgrounds
│   │   ├── feats.json            # 108 feats
│   │   ├── items.json            # 1640 magic items
│   │   └── items-base.json       # 124 base items (weapons, armor, gear)
│   ├── loaders.ts                # Async loaders with in-memory cache
│   └── mock-characters.ts        # 5 sample characters
│
├── stores/                       # Zustand stores (persisted)
│   ├── characterStore.ts         # Characters CRUD, filters
│   ├── uiStore.ts                # Theme, sidebar state
│   └── diceStore.ts              # Dice pool, roll history, quickRoll API
│
├── types/
│   ├── character.ts              # Character interface + helpers
│   └── gamedata.ts               # 5etools data types
│
├── utils/
│   ├── calculations.ts           # Modifiers, proficiency, AC, HP, spell DC
│   ├── formatters.ts             # 5etools tag parser, text formatting
│   └── export-import.ts          # JSON export/import, file download
│
├── index.css                     # Design tokens (CSS variables), reset, theme
└── main.tsx                      # Entry point, theme init
```

## Data Flow

### Character Data
```
User action → Zustand store (characterStore)
                  ↓
            localStorage (auto-persisted via zustand/persist)
                  ↓
            React components re-render
```

### 5etools Game Data
```
Component mounts → useEffect calls loader
                       ↓
               loaders.ts: check cache → dynamic import() → parse → cache
                       ↓
               Component setState with loaded data
```

### Dice Rolling
```
User clicks skill/save/etc → RollModal opens (advantage, bonuses)
                                  ↓
                            User clicks "Roll"
                                  ↓
                            Result shown in RollModal (with reroll option)
                                  ↓
                            "Done" → result pushed to diceStore history
                                  ↓
                            DiceRoller panel shows in history
```

## Character Model

```typescript
Character {
  id, name, race, classes[], background, alignment,
  abilityScores, abilityBonuses?,
  hitPoints { max, current, temp },
  hitDice[], armorClass, speed,
  proficiencies { skills, tools, languages, armor, weapons, savingThrows },
  expertises[], features[], feats[],
  spellcasting? { ability, knownSpells[], slots{} },
  equipment[], currency,
  personality (traits, ideals, bonds, flaws), backstory, appearance, notes,
  heroicInspiration, avatar? (base64),
  campaign?, favorite,
  createdAt, updatedAt
}
```

## Design System

### Colors (Dark Theme)
| Role | Color | Usage |
|------|-------|-------|
| Primary | `#f2ca50` (Aged Gold) | Accents, headers, buttons, active states |
| Secondary | `#7bd6d1` (Teal) | Success, healing, nat20, prepared spells |
| Tertiary | `#d0c8ff` (Violet) | Subclass badges, info tags |
| Error | `#ffb4ab` | Damage, nat1, delete actions |
| Surfaces | `#0d0e12` → `#343439` | 6-level depth hierarchy |
| On-surface | `#e3e2e8` / `#d0c5af` | Primary / secondary text |

### Typography
- **Headlines**: Georgia/Noto Serif — character names, roll results, section titles
- **Labels**: Inter 9-10px, `uppercase`, `letter-spacing: 0.18em` — all metadata
- **Body**: Inter 14px — descriptions, entries

### Components
- Sharp corners (`border-radius: 2-4px`), rounded pills for tags
- Gold gradient buttons (`from-primary to-primary-container`)
- Section headers: `[icon] TITLE ────` with `::after` gold line
- Cards: subtle gold border (`rgba(242,202,80,0.12)`)
- Accordion features: chevron + expand body with gold left border
