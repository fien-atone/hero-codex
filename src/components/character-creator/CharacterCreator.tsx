import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Info } from 'lucide-react';
import { useCharacterStore } from '../../stores/characterStore';
import { loadRaces, loadClasses, loadBackgrounds } from '../../data/loaders';
import type { Race, Subrace, ClassData, SubclassData, ClassFeatureData, Background } from '../../types/gamedata';
import type { Character, AbilityScores, AbilityKey } from '../../types/character';
import { ALIGNMENTS, ABILITY_KEYS, ABILITY_NAMES, getModifier } from '../../types/character';
import { STANDARD_ARRAY, formatModifier, calculateMaxHP } from '../../utils/calculations';
import { formatSpeed, formatAbilityBonuses } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { DetailPanel } from '../ui/DetailPanel';
import { EntryRenderer } from '../ui/EntryRenderer';
import styles from './CharacterCreator.module.css';

const STEPS = ['Race', 'Class', 'Abilities', 'Background', 'Details', 'Review'];

// Game data state
interface GameData {
  races: Race[];
  subraces: Subrace[];
  classes: Map<string, {
    cls: ClassData;
    subclasses: SubclassData[];
    features: ClassFeatureData[];
    subclassFeatures: ClassFeatureData[];
  }>;
  backgrounds: Background[];
}

type Draft = {
  raceName: string;
  raceSource: string;
  subrace: string;
  className: string;
  classSource: string;
  subclassName: string;
  abilityScores: AbilityScores;
  abilityMethod: 'standard' | 'manual';
  standardAssignment: Record<string, number>;
  background: string;
  backgroundSource: string;
  name: string;
  alignment: string;
  personalityTraits: string;
  ideals: string;
  bonds: string;
  flaws: string;
};

const DEFAULT_DRAFT: Draft = {
  raceName: '', raceSource: '', subrace: '',
  className: '', classSource: '', subclassName: '',
  abilityScores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
  abilityMethod: 'standard', standardAssignment: {},
  background: '', backgroundSource: '',
  name: '', alignment: '',
  personalityTraits: '', ideals: '', bonds: '', flaws: '',
};

export function CharacterCreator() {
  const navigate = useNavigate();
  const addCharacter = useCharacterStore((s) => s.addCharacter);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({ ...DEFAULT_DRAFT });
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);

  // Detail panel state
  const [detailItem, setDetailItem] = useState<{
    type: 'race' | 'class' | 'background';
    key: string;
  } | null>(null);

  // Load game data
  useEffect(() => {
    async function load() {
      const [racesData, classesData, backgroundsData] = await Promise.all([
        loadRaces(), loadClasses(), loadBackgrounds(),
      ]);
      setGameData({
        races: racesData.races,
        subraces: racesData.subraces,
        classes: classesData,
        backgrounds: backgroundsData,
      });
      setLoading(false);
    }
    load();
  }, []);

  const update = useCallback((partial: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...partial }));
  }, []);

  if (loading || !gameData) {
    return <div className={styles.loading}>Loading game data...</div>;
  }

  // Filter to PHB + common sources for cleaner UX
  const mainRaces = gameData.races.filter((r) =>
    ['PHB', 'MPMM', 'VGM'].includes(r.source) && r.entries
  );
  const selectedRace = mainRaces.find((r) => r.name === draft.raceName && r.source === draft.raceSource);
  const raceSubraces = selectedRace
    ? gameData.subraces.filter((s) => s.raceName === draft.raceName && s.raceSource === draft.raceSource)
    : [];

  const classEntries = Array.from(gameData.classes.values()).filter((c) => c.cls.source === 'PHB');
  const selectedClassData = gameData.classes.get(draft.className.toLowerCase());

  const mainBackgrounds = gameData.backgrounds.filter((b) =>
    ['PHB', 'SCAG'].includes(b.source) && b.entries
  );
  const canGoNext = () => {
    switch (step) {
      case 0: return !!draft.raceName;
      case 1: return !!draft.className;
      case 2: return true;
      case 3: return !!draft.background;
      case 4: return !!draft.name;
      default: return true;
    }
  };

  const handleCreate = () => {
    if (!selectedRace || !selectedClassData) return;
    const cls = selectedClassData.cls;

    const scores = draft.abilityMethod === 'standard'
      ? ABILITY_KEYS.reduce((acc, key) => {
          acc[key] = draft.standardAssignment[key] || 10;
          return acc;
        }, {} as AbilityScores)
      : draft.abilityScores;

    const abilityBonuses: Partial<AbilityScores> = {};
    if (selectedRace.ability) {
      for (const bonus of selectedRace.ability) {
        for (const [key, val] of Object.entries(bonus)) {
          if (ABILITY_KEYS.includes(key as AbilityKey)) {
            abilityBonuses[key as AbilityKey] = (abilityBonuses[key as AbilityKey] || 0) + (val as number);
          }
        }
      }
    }

    const maxHP = calculateMaxHP(
      {
        ...scores,
        con: scores.con + (abilityBonuses.con || 0),
      } as AbilityScores,
      [{ level: 1, hitDieFaces: cls.hd.faces }],
    );

    const speedVal = typeof selectedRace.speed === 'number'
      ? { walk: selectedRace.speed }
      : (selectedRace.speed as Record<string, number>) || { walk: 30 };

    const char: Character = {
      id: crypto.randomUUID(),
      name: draft.name,
      race: { name: draft.raceName, source: draft.raceSource, subrace: draft.subrace || undefined },
      classes: [{
        name: draft.className,
        source: cls.source,
        subclass: draft.subclassName ? {
          name: draft.subclassName,
          shortName: draft.subclassName,
          source: cls.source,
        } : undefined,
        level: 1,
      }],
      background: { name: draft.background, source: draft.backgroundSource },
      alignment: draft.alignment || 'True Neutral',
      abilityScores: scores,
      abilityBonuses,
      hitPoints: { max: maxHP, current: maxHP, temp: 0 },
      hitDice: [{ faces: cls.hd.faces, total: 1, used: 0 }],
      armorClass: 10 + getModifier(scores.dex + (abilityBonuses.dex || 0)),
      speed: speedVal,
      proficiencies: {
        skills: [],
        tools: [],
        languages: ['Common'],
        armor: cls.startingProficiencies?.armor || [],
        weapons: cls.startingProficiencies?.weapons || [],
        savingThrows: (cls.proficiency || []) as AbilityKey[],
      },
      expertises: [],
      features: [],
      feats: [],
      spellcasting: cls.spellcastingAbility ? {
        ability: cls.spellcastingAbility as AbilityKey,
        knownSpells: [],
        slots: {},
      } : undefined,
      equipment: [],
      currency: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
      personalityTraits: draft.personalityTraits,
      ideals: draft.ideals,
      bonds: draft.bonds,
      flaws: draft.flaws,
      backstory: '',
      appearance: '',
      notes: '',
      tags: [],
      favorite: false,
      heroicInspiration: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addCharacter(char);
    navigate(`/character/${char.id}`);
  };

  // Render detail panel content
  const renderDetail = () => {
    if (!detailItem) return null;

    if (detailItem.type === 'race') {
      const race = mainRaces.find((r) => `${r.name}|${r.source}` === detailItem.key);
      if (!race) return null;
      const subs = gameData.subraces.filter((s) => s.raceName === race.name && s.raceSource === race.source);
      return (
        <DetailPanel
          open
          onClose={() => setDetailItem(null)}
          title={race.name}
          subtitle={`Source: ${race.source}`}
          badges={[
            ...(race.size ? [{ label: race.size.join('/') }] : []),
            ...(race.speed ? [{ label: `Speed: ${formatSpeed(race.speed)}` }] : []),
            ...(race.darkvision ? [{ label: `Darkvision: ${race.darkvision} ft` }] : []),
          ]}
        >
          {race.ability && (
            <div className={styles.detailSection}>
              <h4 className={styles.detailLabel}>Ability Score Increase</h4>
              <p>{formatAbilityBonuses(race.ability)}</p>
            </div>
          )}
          {race.entries && (
            <div className={styles.detailSection}>
              <h4 className={styles.detailLabel}>Traits</h4>
              <EntryRenderer entries={race.entries} />
            </div>
          )}
          {subs.length > 0 && (
            <div className={styles.detailSection}>
              <h4 className={styles.detailLabel}>Subraces ({subs.length})</h4>
              {subs.map((sub) => (
                <div key={sub.name} className={styles.subItem}>
                  <strong>{sub.name}</strong>
                  {sub.ability && <p className={styles.detailMuted}>{formatAbilityBonuses(sub.ability)}</p>}
                  {sub.entries && <EntryRenderer entries={sub.entries} compact />}
                </div>
              ))}
            </div>
          )}
        </DetailPanel>
      );
    }

    if (detailItem.type === 'class') {
      const data = gameData.classes.get(detailItem.key);
      if (!data) return null;
      const { cls, subclasses, features } = data;
      // Group features by level
      const featuresByLevel = new Map<number, ClassFeatureData[]>();
      for (const f of features) {
        const list = featuresByLevel.get(f.level) || [];
        list.push(f);
        featuresByLevel.set(f.level, list);
      }

      return (
        <DetailPanel
          open
          onClose={() => setDetailItem(null)}
          title={cls.name}
          subtitle={`Hit Die: d${cls.hd.faces} | Source: ${cls.source}`}
          badges={[
            { label: `Saves: ${cls.proficiency.map((s) => s.toUpperCase()).join(', ')}` },
            ...(cls.spellcastingAbility ? [{ label: `Spellcaster (${cls.spellcastingAbility.toUpperCase()})` }] : []),
          ]}
        >
          {/* Proficiencies */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailLabel}>Starting Proficiencies</h4>
            {cls.startingProficiencies?.armor && (
              <p><strong>Armor:</strong> {cls.startingProficiencies.armor.join(', ')}</p>
            )}
            {cls.startingProficiencies?.weapons && (
              <p><strong>Weapons:</strong> {cls.startingProficiencies.weapons.join(', ')}</p>
            )}
            {cls.startingProficiencies?.skills?.map((sk, i) => (
              <p key={i}>
                <strong>Skills:</strong> Choose {sk.choose?.count} from {sk.choose?.from.join(', ')}
              </p>
            ))}
          </div>

          {/* Subclasses */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailLabel}>
              {cls.subclassTitle || 'Subclasses'} ({subclasses.length})
            </h4>
            <div className={styles.subList}>
              {subclasses.filter((s) => s.source === 'PHB' || s.source === 'XGE').map((sub) => (
                <span key={sub.shortName} className={styles.subTag}>{sub.name}</span>
              ))}
            </div>
          </div>

          {/* Features by level */}
          <div className={styles.detailSection}>
            <h4 className={styles.detailLabel}>Class Features</h4>
            {Array.from(featuresByLevel.entries())
              .sort(([a], [b]) => a - b)
              .map(([level, feats]) => (
                <div key={level} className={styles.levelBlock}>
                  <div className={styles.levelHeader}>Level {level}</div>
                  {feats.map((f, i) => (
                    <div key={i} className={styles.featureBlock}>
                      <strong>{f.name}</strong>
                      {f.entries && <EntryRenderer entries={f.entries} compact />}
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </DetailPanel>
      );
    }

    if (detailItem.type === 'background') {
      const bg = mainBackgrounds.find((b) => `${b.name}|${b.source}` === detailItem.key);
      if (!bg) return null;
      return (
        <DetailPanel
          open
          onClose={() => setDetailItem(null)}
          title={bg.name}
          subtitle={`Source: ${bg.source}`}
          badges={[
            ...(bg.skillProficiencies
              ? [{ label: `Skills: ${bg.skillProficiencies.map((sp) => Object.keys(sp).filter(k => k !== 'choose').join(', ')).join('; ')}` }]
              : []),
          ]}
        >
          {bg.skillProficiencies && (
            <div className={styles.detailSection}>
              <h4 className={styles.detailLabel}>Skill Proficiencies</h4>
              <p>{bg.skillProficiencies.map((sp) => Object.keys(sp).filter(k => (sp as any)[k] === true).join(', ')).join('; ')}</p>
            </div>
          )}
          {bg.languageProficiencies && (
            <div className={styles.detailSection}>
              <h4 className={styles.detailLabel}>Languages</h4>
              <p>{bg.languageProficiencies.map((lp) =>
                Object.entries(lp).map(([k, v]) => typeof v === 'number' ? `${v} of your choice` : k).join(', ')
              ).join('; ')}</p>
            </div>
          )}
          {bg.toolProficiencies && (
            <div className={styles.detailSection}>
              <h4 className={styles.detailLabel}>Tool Proficiencies</h4>
              <p>{bg.toolProficiencies.map((tp) => Object.keys(tp).join(', ')).join('; ')}</p>
            </div>
          )}
          {bg.entries && (
            <div className={styles.detailSection}>
              <h4 className={styles.detailLabel}>Description</h4>
              <EntryRenderer entries={bg.entries} />
            </div>
          )}
        </DetailPanel>
      );
    }

    return null;
  };

  return (
    <div className={styles.creatorWrap}>
      <div className={styles.creator}>
        {/* Step indicator */}
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`${styles.step} ${i === step ? styles.active : ''} ${i < step ? styles.done : ''}`}
              onClick={() => i < step && setStep(i)}
            >
              <span className={styles.stepNum}>{i < step ? '\u2713' : i + 1}</span>
              <span className={styles.stepLabel}>{s}</span>
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className={styles.content}>
          {/* Step 0: Race */}
          {step === 0 && (
            <div>
              <h2>Choose a Race</h2>
              <p className="text-secondary" style={{ marginBottom: 16 }}>
                Your race determines physical traits, ability bonuses, and special features. Click <Info size={14} style={{ verticalAlign: 'middle' }} /> for full details.
              </p>
              <div className={styles.optionGrid}>
                {mainRaces.map((race) => {
                  const key = `${race.name}|${race.source}`;
                  const isSelected = draft.raceName === race.name && draft.raceSource === race.source;
                  return (
                    <Card
                      key={key}
                      hover
                      active={isSelected}
                      onClick={() => update({
                        raceName: race.name,
                        raceSource: race.source,
                        subrace: '',
                      })}
                      className={styles.optionCard}
                    >
                      <div className={styles.cardHeader}>
                        <h3>{race.name}</h3>
                        <button
                          className={styles.infoBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailItem({ type: 'race', key });
                          }}
                          title="View details"
                        >
                          <Info size={16} />
                        </button>
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {race.ability ? formatAbilityBonuses(race.ability) : 'Flexible'}
                      </p>
                      <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {race.speed ? `Speed: ${formatSpeed(race.speed)}` : ''}
                        {race.size ? ` | ${race.size.join('/')}` : ''}
                        {race.darkvision ? ` | DV ${race.darkvision}ft` : ''}
                      </p>
                    </Card>
                  );
                })}
              </div>
              {raceSubraces.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Select
                    label="Subrace"
                    value={draft.subrace}
                    onChange={(e) => update({ subrace: e.target.value })}
                    options={raceSubraces.map((s) => ({ value: s.name, label: s.name }))}
                    placeholder="Choose subrace..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 1: Class */}
          {step === 1 && (
            <div>
              <h2>Choose a Class</h2>
              <p className="text-secondary" style={{ marginBottom: 16 }}>
                Your class defines combat abilities, skills, and playstyle. Click <Info size={14} style={{ verticalAlign: 'middle' }} /> for features and progression.
              </p>
              <div className={styles.optionGrid}>
                {classEntries.map(({ cls, subclasses }) => {
                  const isSelected = draft.className === cls.name;
                  return (
                    <Card
                      key={cls.name}
                      hover
                      active={isSelected}
                      onClick={() => update({ className: cls.name, classSource: cls.source, subclassName: '' })}
                      className={styles.optionCard}
                    >
                      <div className={styles.cardHeader}>
                        <h3>{cls.name}</h3>
                        <button
                          className={styles.infoBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailItem({ type: 'class', key: cls.name.toLowerCase() });
                          }}
                          title="View details"
                        >
                          <Info size={16} />
                        </button>
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                        Hit Die: d{cls.hd.faces} | Saves: {cls.proficiency.map((s) => s.toUpperCase()).join(', ')}
                      </p>
                      {cls.spellcastingAbility && (
                        <p className="text-muted" style={{ fontSize: '0.8rem' }}>
                          Spellcaster ({cls.spellcastingAbility.toUpperCase()})
                        </p>
                      )}
                      <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                        {subclasses.filter((s) => s.source === 'PHB').length} PHB subclasses
                      </p>
                    </Card>
                  );
                })}
              </div>
              {selectedClassData && selectedClassData.subclasses.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Select
                    label={selectedClassData.cls.subclassTitle || 'Subclass'}
                    value={draft.subclassName}
                    onChange={(e) => update({ subclassName: e.target.value })}
                    options={selectedClassData.subclasses
                      .filter((s) => ['PHB', 'XGE', 'TCE'].includes(s.source))
                      .map((s) => ({ value: s.shortName, label: `${s.name} (${s.source})` }))}
                    placeholder="Choose subclass (optional at level 1)..."
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Abilities */}
          {step === 2 && (
            <div>
              <h2>Set Ability Scores</h2>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <Button
                  variant={draft.abilityMethod === 'standard' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => update({ abilityMethod: 'standard' })}
                >
                  Standard Array
                </Button>
                <Button
                  variant={draft.abilityMethod === 'manual' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => update({ abilityMethod: 'manual' })}
                >
                  Manual Entry
                </Button>
              </div>

              {draft.abilityMethod === 'standard' ? (
                <div>
                  <p className="text-secondary" style={{ marginBottom: 12 }}>
                    Assign the values {STANDARD_ARRAY.join(', ')} to your abilities.
                  </p>
                  <div className={styles.abilityAssign}>
                    {ABILITY_KEYS.map((key) => {
                      const usedValues = Object.entries(draft.standardAssignment)
                        .filter(([k]) => k !== key)
                        .map(([, v]) => v);
                      const available = STANDARD_ARRAY.filter((v) => !usedValues.includes(v));
                      const raceBonus = getRaceBonus(selectedRace, key);
                      return (
                        <div key={key} className={styles.abilityRow}>
                          <span className={styles.abilityLabel}>{ABILITY_NAMES[key]}</span>
                          <Select
                            value={String(draft.standardAssignment[key] || '')}
                            onChange={(e) => {
                              update({
                                standardAssignment: { ...draft.standardAssignment, [key]: Number(e.target.value) },
                              });
                            }}
                            options={[
                              ...(draft.standardAssignment[key]
                                ? [{ value: String(draft.standardAssignment[key]), label: String(draft.standardAssignment[key]) }]
                                : []),
                              ...available
                                .filter((v) => v !== draft.standardAssignment[key])
                                .map((v) => ({ value: String(v), label: String(v) })),
                            ]}
                            placeholder="--"
                          />
                          {raceBonus !== 0 && <span className={styles.bonusLabel}>+{raceBonus}</span>}
                          <span className={styles.modPreview}>
                            {draft.standardAssignment[key]
                              ? formatModifier(getModifier(draft.standardAssignment[key] + raceBonus))
                              : '--'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={styles.abilityAssign}>
                  {ABILITY_KEYS.map((key) => {
                    const raceBonus = getRaceBonus(selectedRace, key);
                    return (
                      <div key={key} className={styles.abilityRow}>
                        <span className={styles.abilityLabel}>{ABILITY_NAMES[key]}</span>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={draft.abilityScores[key]}
                          onChange={(e) => update({
                            abilityScores: { ...draft.abilityScores, [key]: Number(e.target.value) },
                          })}
                          style={{ width: 80 }}
                        />
                        {raceBonus !== 0 && <span className={styles.bonusLabel}>+{raceBonus}</span>}
                        <span className={styles.modPreview}>
                          {formatModifier(getModifier(draft.abilityScores[key] + raceBonus))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedRace?.ability && (
                <div className={styles.raceBonuses}>
                  <strong>Racial bonuses ({selectedRace.name}):</strong>{' '}
                  {formatAbilityBonuses(selectedRace.ability)}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Background */}
          {step === 3 && (
            <div>
              <h2>Choose a Background</h2>
              <p className="text-secondary" style={{ marginBottom: 16 }}>
                Your background provides proficiencies, equipment, and a feature. Click <Info size={14} style={{ verticalAlign: 'middle' }} /> for full description.
              </p>
              <div className={styles.optionGrid}>
                {mainBackgrounds.map((bg) => {
                  const key = `${bg.name}|${bg.source}`;
                  const isSelected = draft.background === bg.name && draft.backgroundSource === bg.source;
                  const skills = bg.skillProficiencies
                    ?.map((sp) => Object.keys(sp).filter((k) => (sp as any)[k] === true).join(', '))
                    .join('; ');
                  return (
                    <Card
                      key={key}
                      hover
                      active={isSelected}
                      onClick={() => update({ background: bg.name, backgroundSource: bg.source })}
                      className={styles.optionCard}
                    >
                      <div className={styles.cardHeader}>
                        <h4>{bg.name}</h4>
                        <button
                          className={styles.infoBtn}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailItem({ type: 'background', key });
                          }}
                          title="View details"
                        >
                          <Info size={14} />
                        </button>
                      </div>
                      {skills && (
                        <p className="text-muted" style={{ fontSize: '0.8rem' }}>Skills: {skills}</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Details */}
          {step === 4 && (
            <div>
              <h2>Character Details</h2>
              <div className={styles.detailsForm}>
                <Input
                  label="Character Name"
                  value={draft.name}
                  onChange={(e) => update({ name: e.target.value })}
                  placeholder="Enter character name..."
                  autoFocus
                />
                <Select
                  label="Alignment"
                  value={draft.alignment}
                  onChange={(e) => update({ alignment: e.target.value })}
                  options={ALIGNMENTS.map((a) => ({ value: a, label: a }))}
                  placeholder="Choose alignment..."
                />
                <Input label="Personality Traits" value={draft.personalityTraits} onChange={(e) => update({ personalityTraits: e.target.value })} placeholder="I always have a plan..." />
                <Input label="Ideals" value={draft.ideals} onChange={(e) => update({ ideals: e.target.value })} placeholder="What drives you?" />
                <Input label="Bonds" value={draft.bonds} onChange={(e) => update({ bonds: e.target.value })} placeholder="What connects you?" />
                <Input label="Flaws" value={draft.flaws} onChange={(e) => update({ flaws: e.target.value })} placeholder="What is your weakness?" />
              </div>
            </div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <div>
              <h2>Review Your Character</h2>
              <Card padding="lg" className={styles.review}>
                <h3>{draft.name || 'Unnamed Hero'}</h3>
                <p>
                  Level 1 {draft.subrace || draft.raceName} {draft.className}
                  {draft.subclassName && ` (${draft.subclassName})`}
                </p>
                <p>Background: {draft.background} | Alignment: {draft.alignment || 'Unaligned'}</p>

                <div className={styles.reviewStats}>
                  {ABILITY_KEYS.map((key) => {
                    const base = draft.abilityMethod === 'standard'
                      ? (draft.standardAssignment[key] || 10)
                      : draft.abilityScores[key];
                    const bonus = getRaceBonus(selectedRace, key);
                    const total = base + bonus;
                    return (
                      <div key={key} className={styles.reviewStat}>
                        <span>{key.toUpperCase()}</span>
                        <strong>{total}</strong>
                        <span className="text-muted">{formatModifier(getModifier(total))}</span>
                      </div>
                    );
                  })}
                </div>

                {selectedClassData && (
                  <p className="text-secondary" style={{ marginTop: 12, fontSize: '0.85rem' }}>
                    Hit Die: d{selectedClassData.cls.hd.faces} | Saves: {selectedClassData.cls.proficiency.map((s) => s.toUpperCase()).join(', ')}
                    {selectedClassData.cls.spellcastingAbility && ` | Spellcasting: ${selectedClassData.cls.spellcastingAbility.toUpperCase()}`}
                  </p>
                )}
              </Card>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={styles.nav}>
          <Button
            variant="ghost"
            onClick={() => step > 0 ? setStep(step - 1) : navigate('/')}
            icon={<ChevronLeft size={16} />}
          >
            {step > 0 ? 'Back' : 'Cancel'}
          </Button>
          <div className={styles.navRight}>
            {step < STEPS.length - 1 ? (
              <Button
                variant="primary"
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
                iconRight={<ChevronRight size={16} />}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="success"
                onClick={handleCreate}
                disabled={!draft.name}
                icon={<Check size={16} />}
              >
                Create Character
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {renderDetail()}
    </div>
  );
}

// Helper: get racial ability bonus for a given key
function getRaceBonus(race: Race | undefined, key: AbilityKey): number {
  if (!race?.ability) return 0;
  let total = 0;
  for (const bonus of race.ability) {
    if (key in bonus) {
      total += (bonus as any)[key] as number;
    }
  }
  return total;
}
