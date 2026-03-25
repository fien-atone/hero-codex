# Hero Codex

Local D&D 5e character manager. Manage multiple characters with rich game data from 5etools.

## Setup

```bash
npm install
```

### Game Data

Download [5etools-2014-src](https://github.com/5etools-mirror-3/5etools-2014-src) and copy the needed files:

```bash
mkdir -p src/data/5etools/class src/data/5etools/spells

cp <5etools>/data/races.json src/data/5etools/
cp <5etools>/data/backgrounds.json src/data/5etools/
cp <5etools>/data/feats.json src/data/5etools/
cp <5etools>/data/items.json src/data/5etools/
cp <5etools>/data/items-base.json src/data/5etools/
cp <5etools>/data/skills.json src/data/5etools/

for c in barbarian bard cleric druid fighter monk paladin ranger rogue sorcerer warlock wizard; do
  cp <5etools>/data/class/class-$c.json src/data/5etools/class/
done

cp <5etools>/data/spells/spells-phb.json src/data/5etools/spells/
cp <5etools>/data/spells/spells-xge.json src/data/5etools/spells/
```

### Run

```bash
npm run dev
```

## Tech Stack

React 18 · TypeScript · Vite · Zustand · CSS Modules · Lucide React

No backend — all data in localStorage.

See [ARCHITECTURE.md](ARCHITECTURE.md) for full details.
