import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Pencil, Heart, Shield, Footprints, Eye, Swords, Dices, BookOpen, Sparkles, Backpack, Languages, ScrollText, Target, Zap, User, ChevronDown, ChevronRight, Weight, Coins, Sun, Moon, Camera, X } from 'lucide-react';
import { useCharacterStore } from '../../stores/characterStore';
import {
  getCharacterLevel, getModifier, getProficiencyBonus,
  ABILITY_KEYS, ABILITY_NAMES, SKILLS,
} from '../../types/character';
import {
  getEffectiveAbilityScore, getSkillModifier, getSavingThrowModifier,
  getInitiativeBreakdown, getPassivePerception, getSpellSaveDC, getSpellAttackBonus, formatModifier,
} from '../../utils/calculations';
import { loadRaces, loadClasses, loadBackgrounds, loadSpells, loadFeats, loadBaseItems } from '../../data/loaders';
import type { Race, ClassFeatureData, Background, Spell, Feat, Item, Entry } from '../../types/gamedata';
import { Button } from '../ui/Button';
import { Tag } from '../ui/Tag';
import { Card } from '../ui/Card';
import { Tabs } from '../ui/Tabs';
import { DetailPanel } from '../ui/DetailPanel';
import { EntryRenderer } from '../ui/EntryRenderer';
import { SectionHeader } from '../ui/SectionHeader';
import { useDiceStore } from '../../stores/diceStore';
import { RollModal, type RollRequest } from '../ui/RollModal';
import { RestModal } from '../ui/RestModal';
import { capitalize, formatSpeed, formatAbilityBonuses } from '../../utils/formatters';
import styles from './CharacterSheet.module.css';

type DetailView = { type: string; title: string; subtitle?: string; badges?: Array<{ label: string }>; entries: Entry[]; } | null;

export function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const char = useCharacterStore((s) => s.getCharacterById(id!));
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const [detail, setDetail] = useState<DetailView>(null);
  const [activeTab, setActiveTab] = useState('main');
  const [expandedFeatures, setExpandedFeatures] = useState<Set<number>>(new Set());
  const [rollRequest, setRollRequest] = useState<RollRequest | null>(null);
  const [restType, setRestType] = useState<'short' | 'long' | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(false);

  const [raceData, setRaceData] = useState<Race | null>(null);
  const [classFeatures, setClassFeatures] = useState<ClassFeatureData[]>([]);
  const [backgroundData, setBackgroundData] = useState<Background | null>(null);
  const [spellsData, setSpellsData] = useState<Spell[]>([]);
  const [featsData, setFeatsData] = useState<Feat[]>([]);
  const [baseItems, setBaseItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!char) return;
    loadRaces().then(({ races }) => { const r = races.find((r) => r.name === char.race.name && r.source === char.race.source); if (r) setRaceData(r); });
    loadClasses().then((m) => {
      const cls0 = char.classes[0];
      if (!cls0) return;
      const d = m.get(cls0.name.toLowerCase());
      if (!d) return;
      const lvl = cls0.level || 1;
      // class features + subclass features for matching subclass
      const cf = d.features.filter((f) => f.level <= lvl);
      const scf = cls0.subclass
        ? d.subclassFeatures.filter((f) =>
            f.level <= lvl &&
            ((f as any).subclassShortName === cls0.subclass?.shortName || (f as any).subclassShortName === cls0.subclass?.name)
          )
        : [];
      // merge and sort by level
      setClassFeatures([...cf, ...scf].sort((a, b) => a.level - b.level));
    });
    loadBackgrounds().then((bgs) => { const bg = bgs.find((b) => b.name === char.background.name); if (bg) setBackgroundData(bg); });
    loadSpells().then(setSpellsData);
    loadFeats().then(setFeatsData);
    loadBaseItems().then(setBaseItems);
  }, [char?.id]); // eslint-disable-line

  if (!char) return <div className={styles.notFound}><h2>Character not found</h2><Button variant="primary" onClick={() => navigate('/')}>Back</Button></div>;

  const level = getCharacterLevel(char);
  const profBonus = getProficiencyBonus(level);
  const initiative = getInitiativeBreakdown(char);
  const passivePerception = getPassivePerception(char);
  const spellDC = getSpellSaveDC(char);
  const spellAttack = getSpellAttackBonus(char);
  const quickRoll = useDiceStore((s) => s.quickRoll);

  // ── Roll helpers — open RollModal instead of instant roll ──
  const openRoll = (req: RollRequest) => setRollRequest(req);
  const rollAbilityCheck = (k: string) => { const mod = getModifier(getEffectiveAbilityScore(char, k as any)); openRoll({ label: `${ABILITY_NAMES[k as keyof typeof ABILITY_NAMES]} Check`, dice: { 20: 1 }, modifier: mod }); };
  const rollSave = (k: string) => { const s = getSavingThrowModifier(char, k as any); openRoll({ label: `${ABILITY_NAMES[k as keyof typeof ABILITY_NAMES]} Save`, dice: { 20: 1 }, modifier: s.total }); };
  const rollSkill = (sk: string) => { const r = getSkillModifier(char, sk); openRoll({ label: `${capitalize(sk)} Check`, dice: { 20: 1 }, modifier: r.total }); };
  const rollInitiative = () => openRoll({ label: 'Initiative', dice: { 20: 1 }, modifier: initiative.total });
  const rollSpellAttack = () => { if (spellAttack) openRoll({ label: 'Spell Attack', dice: { 20: 1 }, modifier: spellAttack.total }); };

  const handleHPChange = (delta: number) => {
    updateCharacter(char.id, { hitPoints: { ...char.hitPoints, current: Math.max(0, Math.min(char.hitPoints.max, char.hitPoints.current + delta)) } });
  };

  // ── Detail helpers ──
  const showRaceDetail = () => { if (!raceData) return; setDetail({ type: 'race', title: raceData.name, subtitle: `Source: ${raceData.source}`, badges: [...(raceData.size ? [{ label: raceData.size.join('/') }] : []), ...(raceData.speed ? [{ label: `Speed: ${formatSpeed(raceData.speed)}` }] : []), ...(raceData.darkvision ? [{ label: `DV ${raceData.darkvision}ft` }] : [])], entries: [...(raceData.ability ? [{ type: 'entries', name: 'Ability Score Increase', entries: [formatAbilityBonuses(raceData.ability)] }] as Entry[] : []), ...(raceData.entries || [])] }); };
  const showBackgroundDetail = () => { if (!backgroundData?.entries) return; setDetail({ type: 'background', title: backgroundData.name, subtitle: `Source: ${backgroundData.source}`, entries: backgroundData.entries }); };

  const parseDice = (t: string): Partial<Record<4|6|8|10|12|20|100, number>> | null => { const m = t.match(/(\d+)d(\d+)/); if (!m) return null; const s = parseInt(m[2]) as any; if (![4,6,8,10,12,20,100].includes(s)) return null; return { [s]: parseInt(m[1]) }; };
  const extractSpellDamage = (sp: Spell) => { const t = JSON.stringify(sp.entries || []); const m = t.match(/\{@damage\s+(\d+d\d+)\}/) || t.match(/(\d+d(?:4|6|8|10|12|20))/); if (m) { const d = parseDice(m[1]); if (d) return { dice: d, text: m[1] }; } return null; };
  const rollSpellDamage = (name: string) => { const sp = spellsData.find((s) => s.name === name); if (!sp) return; const d = extractSpellDamage(sp); if (d) quickRoll({ label: `${name} Damage`, dice: d.dice, modifier: 0 }); };

  const showSpellDetail = (name: string) => {
    const spell = spellsData.find((s) => s.name === name);
    if (!spell) return;
    const schools: Record<string, string> = { A: 'Abjuration', C: 'Conjuration', D: 'Divination', E: 'Enchantment', V: 'Evocation', I: 'Illusion', N: 'Necromancy', T: 'Transmutation' };
    const lvl = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
    const conc = spell.duration?.[0]?.concentration ? ' (Conc.)' : '';
    const comp = [spell.components.v && 'V', spell.components.s && 'S', spell.components.m && 'M'].filter(Boolean).join(', ');
    setDetail({ type: 'spell', title: spell.name, subtitle: `${lvl} ${schools[spell.school] || spell.school}${conc}`, badges: [{ label: comp }, ...(spell.damageInflict?.map((d) => ({ label: d })) || [])], entries: [...(spell.entries || []), ...(spell.entriesHigherLevel || [])] });
  };

  // ── Tabs config ──
  const tabs = [
    { id: 'main', label: 'Main', icon: <Target size={14} /> },
    { id: 'spells', label: 'Spellcasting', icon: <Zap size={14} />, hidden: !char.spellcasting },
    { id: 'inventory', label: 'Inventory', icon: <Backpack size={14} /> },
    { id: 'story', label: 'Story', icon: <ScrollText size={14} /> },
  ];

  return (
    <div className={styles.sheetWrap}>
      <div className={styles.sheet}>
        {/* ── Header ── */}
        <div className={styles.header}>
          {/* Avatar */}
          <div className={styles.avatarArea}>
            {char.avatar ? (
              <img
                src={char.avatar}
                alt={char.name}
                className={styles.avatar}
                onClick={() => setAvatarPreview(true)}
              />
            ) : (
              <label className={styles.avatarEmpty} title="Upload avatar">
                <Camera size={18} />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => updateCharacter(char.id, { avatar: reader.result as string });
                    reader.readAsDataURL(file);
                  }}
                />
              </label>
            )}
          </div>

          <div className={styles.headerInfo}>
            <h1>{char.name}</h1>
            <p className={styles.subtitle}>
              Level {level} {char.race.subrace || char.race.name}{' '}
              {char.classes.map((c) => `${c.name}${c.subclass ? ` (${c.subclass.shortName})` : ''} ${c.level}`).join(' / ')}
            </p>
            <div className={styles.tags}>
              {char.campaign && <Tag label={char.campaign} color="accent" />}
              <Tag label={char.race.subrace || char.race.name} color="info" onClick={raceData ? showRaceDetail : undefined} />
              <Tag label={char.alignment} color="default" />
              <Tag label={char.background.name} color="gold" onClick={backgroundData?.entries ? showBackgroundDetail : undefined} />
            </div>
          </div>

          <div className={styles.headerActions}>
            <Button variant="ghost" size="sm" icon={<Sun size={14} />} onClick={() => setRestType('short')} title="Short Rest">Short Rest</Button>
            <Button variant="ghost" size="sm" icon={<Moon size={14} />} onClick={() => setRestType('long')} title="Long Rest">Long Rest</Button>
            <Button variant="secondary" size="sm" icon={<Pencil size={14} />} onClick={() => navigate(`/character/${char.id}/edit`)}>Edit</Button>
          </div>
        </div>

        {/* ── Tabs ── */}
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

        {/* ════════════════ TAB: Main ════════════════ */}
        {activeTab === 'main' && (
          <>
          {/* Core Stats Bar — order: Inspiration, Prof, Initiative, AC, HP+Temp+HD, Speed */}
          <div className={styles.coreStats}>
            <Card
              className={`${styles.coreStat} ${styles.rollable}`}
              onClick={() => updateCharacter(char.id, { heroicInspiration: !char.heroicInspiration })}
              title="Toggle Heroic Inspiration"
            >
              <div className={styles.coreIcon} style={char.heroicInspiration ? { color: 'var(--color-primary)' } : { opacity: 0.3 }}>
                <Sparkles size={18} />
              </div>
              <div className={styles.coreValue} style={char.heroicInspiration ? {} : { opacity: 0.3 }}>{char.heroicInspiration ? 'Yes' : 'No'}</div>
              <div className={styles.coreLabel}>Inspiration</div>
            </Card>
            <Card className={styles.coreStat}>
              <div className={styles.coreIcon}><Dices size={18} /></div>
              <div className={styles.coreValue}>+{profBonus}</div>
              <div className={styles.coreLabel}>Proficiency</div>
            </Card>
            <Card className={`${styles.coreStat} ${styles.rollable}`} onClick={rollInitiative} title="Roll Initiative">
              <div className={styles.coreIcon}><Swords size={18} /></div>
              <div className={styles.coreValue}>{formatModifier(initiative.total)}</div>
              <div className={styles.coreLabel}>Initiative</div>
            </Card>
            <Card className={styles.coreStat}>
              <div className={styles.coreIcon}><Shield size={18} /></div>
              <div className={styles.coreValue}>{char.armorClass}</div>
              <div className={styles.coreLabel}>AC</div>
            </Card>
            <Card className={styles.coreStatWide}>
              <div className={styles.coreIcon}><Heart size={18} /></div>
              <div className={styles.hpBlock}>
                <div className={styles.hpRow}>
                  <button className={styles.hpBtn} onClick={() => handleHPChange(-1)}>-</button>
                  <input
                    type="number"
                    className={styles.hpInput}
                    value={char.hitPoints.current}
                    onChange={(e) => {
                      const v = Math.max(0, Math.min(char.hitPoints.max, Number(e.target.value) || 0));
                      updateCharacter(char.id, { hitPoints: { ...char.hitPoints, current: v } });
                    }}
                  />
                  <span className={styles.hpSep}>/</span>
                  <span className={styles.hpMax}>{char.hitPoints.max}</span>
                  <button className={styles.hpBtn} onClick={() => handleHPChange(1)}>+</button>
                </div>
                <div className={styles.hpMeta}>
                  <span className={styles.coreLabel}>HP</span>
                  <span className={styles.hpTemp}>
                    Temp:
                    <input
                      type="number"
                      className={styles.hpTempInput}
                      value={char.hitPoints.temp}
                      onChange={(e) => updateCharacter(char.id, { hitPoints: { ...char.hitPoints, temp: Math.max(0, Number(e.target.value) || 0) } })}
                    />
                  </span>
                  <span className={styles.hpHd}>
                    {char.hitDice.map((hd) => `${hd.total - hd.used}d${hd.faces}`).join(' + ')}
                  </span>
                </div>
              </div>
            </Card>
            <Card className={styles.coreStat}>
              <div className={styles.coreIcon}><Footprints size={18} /></div>
              <div className={styles.coreValue}>{Object.entries(char.speed).map(([t, v]) => t === 'walk' ? `${v}ft` : `${t} ${v}ft`).join(', ')}</div>
              <div className={styles.coreLabel}>Speed</div>
            </Card>
          </div>
          <div className={styles.columns3}>
            {/* ── Col 1: Abilities, Saves, Proficiencies ── */}
            <div className={styles.col}>
              <Card>
                <SectionHeader icon={<Target size={14} />} title="Ability Scores" />
                <div className={styles.abilityGrid}>
                  {ABILITY_KEYS.map((key) => {
                    const score = getEffectiveAbilityScore(char, key);
                    return (
                      <div key={key} className={`${styles.abilityBox} ${styles.rollable}`} onClick={() => rollAbilityCheck(key)} title={`Roll ${ABILITY_NAMES[key]} check`}>
                        <span className={styles.abilityLabel}>{key.toUpperCase()}</span>
                        <span className={styles.abilityMod}>{formatModifier(getModifier(score))}</span>
                        <span className={styles.abilityScore}>{score}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <SectionHeader icon={<Shield size={14} />} title="Saving Throws" />
                <div className={styles.saveList}>
                  {ABILITY_KEYS.map((key) => {
                    const save = getSavingThrowModifier(char, key);
                    const prof = char.proficiencies.savingThrows.includes(key);
                    return (
                      <div key={key} className={`${styles.saveRow} ${prof ? styles.proficient : ''} ${styles.rollable}`} onClick={() => rollSave(key)}>
                        <span className={styles.profDot}>{prof ? '\u25C9' : '\u25CB'}</span>
                        <span className={styles.saveValue}>{formatModifier(save.total)}</span>
                        <span className={styles.saveName}>{ABILITY_NAMES[key]}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card>
                <SectionHeader icon={<Languages size={14} />} title="Proficiencies" />
                <div className={styles.profSection}>
                  {char.proficiencies.armor.length > 0 && <div><strong>Armor:</strong> {char.proficiencies.armor.join(', ')}</div>}
                  {char.proficiencies.weapons.length > 0 && <div><strong>Weapons:</strong> {char.proficiencies.weapons.join(', ')}</div>}
                  {char.proficiencies.tools.length > 0 && <div><strong>Tools:</strong> {char.proficiencies.tools.join(', ')}</div>}
                  {char.proficiencies.languages.length > 0 && <div><strong>Languages:</strong> {char.proficiencies.languages.join(', ')}</div>}
                </div>
              </Card>
            </div>

            {/* ── Col 2: Senses + Skills ── */}
            <div className={styles.col}>
              <Card>
                <SectionHeader icon={<Eye size={14} />} title="Senses" />
                <div className={styles.sensesList}>
                  <div className={styles.senseRow}>
                    <span className={styles.senseLabel}>Passive Perception</span>
                    <span className={styles.senseValue}>{passivePerception.total}</span>
                  </div>
                  <div className={styles.senseRow}>
                    <span className={styles.senseLabel}>Passive Insight</span>
                    <span className={styles.senseValue}>{10 + getSkillModifier(char, 'insight').total}</span>
                  </div>
                  <div className={styles.senseRow}>
                    <span className={styles.senseLabel}>Passive Investigation</span>
                    <span className={styles.senseValue}>{10 + getSkillModifier(char, 'investigation').total}</span>
                  </div>
                  {raceData?.darkvision ? (
                    <div className={styles.senseRow}>
                      <span className={styles.senseLabel}>Darkvision</span>
                      <span className={styles.senseValue}>{raceData.darkvision} ft</span>
                    </div>
                  ) : (
                    <div className={styles.senseRow}>
                      <span className={styles.senseLabel}>Normal Vision</span>
                      <span className={styles.senseValue}></span>
                    </div>
                  )}
                </div>
              </Card>
              <Card>
                <SectionHeader icon={<Sparkles size={14} />} title="Skills" />
                <div className={styles.skillList}>
                  {Object.entries(SKILLS).sort().map(([skill, ability]) => {
                    const result = getSkillModifier(char, skill);
                    const prof = char.proficiencies.skills.includes(skill);
                    const expert = char.expertises.includes(skill);
                    return (
                      <div key={skill} className={`${styles.skillRow} ${prof ? styles.proficient : ''} ${styles.rollable}`} onClick={() => rollSkill(skill)}>
                        <span className={styles.profDot}>{expert ? '\u25C9\u25C9' : prof ? '\u25C9' : '\u25CB'}</span>
                        <span className={styles.skillValue}>{formatModifier(result.total)}</span>
                        <span className={styles.skillName}>{capitalize(skill)}</span>
                        <span className={styles.skillAbility}>{ability.toUpperCase()}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>

            {/* ── Col 3: Features ── */}
            <div className={styles.col}>
              {/* Class Features — first, most important */}
              <Card>
                <SectionHeader icon={<BookOpen size={14} />} title={`${char.classes[0]?.name || 'Class'} Features`} />
                <div className={styles.featureList}>
                  {classFeatures.length > 0
                    ? classFeatures.map((f, i) => {
                        const isOpen = expandedFeatures.has(i);
                        const isSubclass = !!(f as any).subclassShortName;
                        const subName = (f as any).subclassShortName;
                        return (
                          <div key={i} className={`${styles.feature} ${styles.clickable} ${isSubclass ? styles.subclassFeature : ''}`}
                            onClick={() => setExpandedFeatures((prev) => { const n = new Set(prev); isOpen ? n.delete(i) : n.add(i); return n; })}>
                            <div className={styles.featureName}>
                              <span className={styles.featureChevron}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                              {f.name}
                              {isSubclass && <span className={styles.subclassBadge}>{subName}</span>}
                              <span className={styles.featureLevel}>Lvl {f.level}</span>
                            </div>
                            {isOpen && f.entries && (
                              <div className={styles.featureBody} onClick={(e) => e.stopPropagation()}>
                                <EntryRenderer entries={f.entries} compact />
                              </div>
                            )}
                          </div>
                        );
                      })
                    : char.features.map((f, i) => {
                        const isOpen = expandedFeatures.has(i);
                        return (
                          <div key={i} className={`${styles.feature} ${styles.clickable}`}
                            onClick={() => setExpandedFeatures((prev) => { const n = new Set(prev); isOpen ? n.delete(i) : n.add(i); return n; })}>
                            <div className={styles.featureName}>
                              <span className={styles.featureChevron}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                              {f.name}
                            </div>
                            {isOpen && (
                              <div className={styles.featureBody}>
                                <p>{f.description}</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                  }
                  {char.feats.length > 0 && (
                    <>
                      <div style={{ marginTop: 12 }}>
                        <SectionHeader icon={<Sparkles size={14} />} title="Feats" />
                      </div>
                      {char.feats.map((feat) => {
                        const featData = featsData.find((fd) => fd.name === feat.name);
                        const featIdx = 10000 + char.feats.indexOf(feat); // unique key offset
                        const isOpen = expandedFeatures.has(featIdx);
                        return (
                          <div key={feat.name} className={`${styles.feature} ${styles.clickable}`}
                            onClick={() => setExpandedFeatures((prev) => { const n = new Set(prev); isOpen ? n.delete(featIdx) : n.add(featIdx); return n; })}>
                            <div className={styles.featureName}>
                              <span className={styles.featureChevron}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                              {feat.name}
                              {featData?.ability && (
                                <span className={styles.featureLevel}>
                                  {featData.ability.map((a) => Object.entries(a).map(([k, v]) => `${k.toUpperCase()} +${v}`).join(', ')).join('; ')}
                                </span>
                              )}
                            </div>
                            {isOpen && featData?.entries && (
                              <div className={styles.featureBody} onClick={(e) => e.stopPropagation()}>
                                {featData.prerequisite && (
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, fontStyle: 'italic' }}>
                                    Prerequisite: {featData.prerequisite.map((p) => Object.values(p).join(', ')).join('; ')}
                                  </p>
                                )}
                                <EntryRenderer entries={featData.entries} compact />
                              </div>
                            )}
                            {isOpen && !featData && (
                              <div className={styles.featureBody}>
                                <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Feat data not found in loaded sources.</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              </Card>

              {/* Race Traits */}
              {raceData?.entries && raceData.entries.filter((e): e is { type: string; name: string; entries: Entry[] } => typeof e === 'object' && 'name' in e).length > 0 && (
                <Card>
                  <SectionHeader icon={<User size={14} />} title={`${raceData.name} Traits`} />
                  <div className={styles.featureList}>
                    {raceData.entries.filter((e): e is { type: string; name: string; entries: Entry[] } => typeof e === 'object' && 'name' in e).map((trait, i) => {
                      const rIdx = 20000 + i;
                      const isOpen = expandedFeatures.has(rIdx);
                      return (
                        <div key={i} className={`${styles.feature} ${styles.clickable} ${styles.raceFeature}`}
                          onClick={() => setExpandedFeatures((prev) => { const n = new Set(prev); isOpen ? n.delete(rIdx) : n.add(rIdx); return n; })}>
                          <div className={styles.featureName}>
                            <span className={styles.featureChevron}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                            {trait.name}
                            <span className={styles.raceBadge}>{raceData!.name}</span>
                          </div>
                          {isOpen && trait.entries && (
                            <div className={styles.featureBody} onClick={(e) => e.stopPropagation()}>
                              <EntryRenderer entries={trait.entries} compact />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Background Feature */}
              {backgroundData?.entries && backgroundData.entries.filter((e): e is { type: string; name: string; entries: Entry[] } => typeof e === 'object' && 'entries' in e).length > 0 && (
                <Card>
                  <SectionHeader icon={<ScrollText size={14} />} title={`${backgroundData.name}`} />
                  <div className={styles.featureList}>
                    {backgroundData.entries.filter((e): e is { type: string; name: string; entries: Entry[] } => typeof e === 'object' && 'entries' in e).map((entry, i) => {
                      const bIdx = 30000 + i;
                      const isOpen = expandedFeatures.has(bIdx);
                      return (
                        <div key={i} className={`${styles.feature} ${styles.clickable}`}
                          onClick={() => setExpandedFeatures((prev) => { const n = new Set(prev); isOpen ? n.delete(bIdx) : n.add(bIdx); return n; })}>
                          <div className={styles.featureName}>
                            <span className={styles.featureChevron}>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</span>
                            {entry.name || 'Feature'}
                          </div>
                          {isOpen && entry.entries && (
                            <div className={styles.featureBody} onClick={(e) => e.stopPropagation()}>
                              <EntryRenderer entries={entry.entries} compact />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </div>
          </div>
          </>
        )}

        {/* ════════════════ TAB: Spellcasting ════════════════ */}
        {activeTab === 'spells' && char.spellcasting && (() => {
          const sc = char.spellcasting;
          // Determine spell level for each known spell from 5etools data
          const spellsByLevel = new Map<number, typeof sc.knownSpells>();
          for (const spell of sc.knownSpells) {
            const spData = spellsData.find((s) => s.name === spell.name);
            const lvl = spData?.level ?? 0;
            if (!spellsByLevel.has(lvl)) spellsByLevel.set(lvl, []);
            spellsByLevel.get(lvl)!.push(spell);
          }
          const sortedLevels = Array.from(spellsByLevel.keys()).sort((a, b) => a - b);

          // Classes that prepare spells
          const preparerClasses = ['cleric', 'druid', 'paladin', 'wizard'];
          const canPrepare = char.classes.some((c) => preparerClasses.includes(c.name.toLowerCase()));

          const togglePrepared = (spellName: string) => {
            const updated = sc.knownSpells.map((s) =>
              s.name === spellName ? { ...s, prepared: !s.prepared } : s
            );
            updateCharacter(char.id, { spellcasting: { ...sc, knownSpells: updated } });
          };

          const castSpell = (_spellName: string, slotLevel: number) => {
            const slot = sc.slots[slotLevel];
            if (!slot || slot.used >= slot.total) return;
            const newSlots = { ...sc.slots, [slotLevel]: { ...slot, used: slot.used + 1 } };
            updateCharacter(char.id, { spellcasting: { ...sc, slots: newSlots } });
          };

          const availableSlotLevels = Object.entries(sc.slots)
            .filter(([, s]) => s.total > 0 && s.used < s.total)
            .map(([l]) => Number(l));

          return (
            <div>
              {/* Spell Stats */}
              <div className={styles.spellStats}>
                {spellDC && (
                  <div className={styles.spellStat}>
                    <span className={styles.spellStatLabel}>Save DC</span>
                    <span className={styles.spellStatValue}>{spellDC.total}</span>
                  </div>
                )}
                {spellAttack && (
                  <div className={`${styles.spellStat} ${styles.rollable}`} onClick={rollSpellAttack} title="Roll Spell Attack">
                    <span className={styles.spellStatLabel}>Attack</span>
                    <span className={styles.spellStatValue}>{formatModifier(spellAttack.total)}</span>
                  </div>
                )}
                <div className={styles.spellStat}>
                  <span className={styles.spellStatLabel}>Ability</span>
                  <span className={styles.spellStatValue}>{sc.ability.toUpperCase()}</span>
                </div>
                {canPrepare && (
                  <div className={styles.spellStat}>
                    <span className={styles.spellStatLabel}>Prepared</span>
                    <span className={styles.spellStatValue}>{sc.knownSpells.filter((s) => s.prepared).length}</span>
                  </div>
                )}
              </div>

              {/* Spell Slots */}
              <Card style={{ marginBottom: 16 }}>
                <SectionHeader icon={<Dices size={14} />} title="Spell Slots" />
                <div className={styles.slots}>
                  {Object.entries(sc.slots).filter(([, s]) => s.total > 0).map(([lvl, slot]) => (
                    <div key={lvl} className={styles.slotRow}>
                      <span className={styles.slotLevel}>Lvl {lvl}</span>
                      <div className={styles.slotDots}>
                        {Array.from({ length: slot.total }, (_, i) => (
                          <span key={i} className={`${styles.slotDot} ${i < slot.used ? styles.used : ''}`}
                            onClick={() => {
                              const newSlots = { ...sc.slots };
                              const c = newSlots[Number(lvl)];
                              newSlots[Number(lvl)] = { ...c, used: i < c.used ? i : i + 1 };
                              updateCharacter(char.id, { spellcasting: { ...sc, slots: newSlots } });
                            }} />
                        ))}
                      </div>
                      <span className={styles.slotCount}>{slot.total - slot.used}/{slot.total}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Spells grouped by level */}
              {sortedLevels.map((lvl) => {
                const spells = spellsByLevel.get(lvl)!;
                const levelLabel = lvl === 0 ? 'Cantrips' : `Level ${lvl}`;
                return (
                  <Card key={lvl} style={{ marginBottom: 12 }}>
                    <SectionHeader icon={<Zap size={14} />} title={`${levelLabel} (${spells.length})`} />
                    <div className={styles.spellList}>
                      {spells.map((spell) => {
                        const sp = spellsData.find((s) => s.name === spell.name);
                        const dmg = sp ? extractSpellDamage(sp) : null;
                        return (
                          <div key={spell.name} className={`${styles.spellItem} ${styles.clickable}`} onClick={() => showSpellDetail(spell.name)}>
                            <span className={styles.spellLeft}>
                              {/* Prepared toggle */}
                              {canPrepare && lvl > 0 && (
                                <button
                                  className={`${styles.prepareBtn} ${spell.prepared ? styles.prepared : ''}`}
                                  onClick={(e) => { e.stopPropagation(); togglePrepared(spell.name); }}
                                  title={spell.prepared ? 'Unprepare' : 'Prepare'}
                                />
                              )}
                              <span style={!canPrepare || lvl === 0 || spell.prepared ? {} : { opacity: 0.4 }}>
                                {spell.name}
                              </span>
                            </span>
                            <span className={styles.spellActions}>
                              {/* Cast from slot */}
                              {lvl > 0 && availableSlotLevels.some((sl) => sl >= lvl) && (
                                <span className={styles.castBtns}>
                                  {availableSlotLevels.filter((sl) => sl >= lvl).map((sl) => (
                                    <button
                                      key={sl}
                                      className={styles.castBtn}
                                      onClick={(e) => { e.stopPropagation(); castSpell(spell.name, sl); }}
                                      title={`Cast using level ${sl} slot`}
                                    >
                                      {sl}
                                    </button>
                                  ))}
                                </span>
                              )}
                              {dmg && (
                                <button className={styles.rollDmgBtn} onClick={(e) => { e.stopPropagation(); rollSpellDamage(spell.name); }} title={`Roll ${dmg.text}`}>
                                  <Dices size={11} /> {dmg.text}
                                </button>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          );
        })()}

        {/* ════════════════ TAB: Inventory ════════════════ */}
        {activeTab === 'inventory' && (() => {
          const strScore = getEffectiveAbilityScore(char, 'str');
          const carryCapacity = strScore * 15;
          // Calculate total weight from baseItems lookup
          const totalWeight = char.equipment.reduce((sum, eq) => {
            const bi = baseItems.find((i) => i.name === eq.name);
            return sum + (bi?.weight || 0) * eq.quantity;
          }, 0);
          const weightPct = Math.min(100, (totalWeight / carryCapacity) * 100);
          const encumbered = totalWeight > carryCapacity;

          return (
            <div>
              {/* Currency — on top */}
              <Card style={{ marginBottom: 16 }}>
                <SectionHeader icon={<Coins size={14} />} title="Currency" />
                <div className={styles.currencyGrid}>
                  {(['pp', 'gp', 'ep', 'sp', 'cp'] as const).map((coin) => (
                    <div key={coin} className={styles.coinBox}>
                      <span className={styles.coinValue}>{char.currency[coin]}</span>
                      <span className={styles.coinLabel}>{coin.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Carrying Capacity */}
              <Card style={{ marginBottom: 16 }}>
                <SectionHeader icon={<Weight size={14} />} title="Carrying Capacity" />
                <div className={styles.weightBar}>
                  <div className={styles.weightFill} style={{ width: `${weightPct}%`, background: encumbered ? 'var(--color-error)' : 'var(--color-primary)' }} />
                </div>
                <div className={styles.weightInfo}>
                  <span>{totalWeight.toFixed(1)} lb / {carryCapacity} lb</span>
                  {encumbered && <Tag label="Encumbered" color="danger" size="sm" />}
                </div>
              </Card>

              {/* Equipment */}
              <Card>
                <SectionHeader icon={<Backpack size={14} />} title={`Equipment (${char.equipment.length})`} />
                {char.equipment.length === 0 ? (
                  <p className="text-muted">No equipment.</p>
                ) : (
                  <>
                    {/* Table header */}
                    <div className={styles.equipHeader}>
                      <span className={styles.equipColName}>Item</span>
                      <span className={styles.equipColQty}>Qty</span>
                      <span className={styles.equipColWeight}>Weight</span>
                      <span className={styles.equipColStatus}>Status</span>
                    </div>
                    <div className={styles.equipList}>
                      {char.equipment.map((item, i) => {
                        const bi = baseItems.find((b) => b.name === item.name);
                        const itemWeight = bi?.weight || 0;
                        return (
                          <div key={i} className={styles.equipRow}>
                            <span className={styles.equipColName}>
                              {item.equipped && <span className={styles.equippedDot} />}
                              {item.name}
                            </span>
                            <span className={styles.equipColQty}>{item.quantity}</span>
                            <span className={styles.equipColWeight}>{itemWeight > 0 ? `${(itemWeight * item.quantity).toFixed(1)}` : '—'}</span>
                            <span className={styles.equipColStatus}>
                              {item.equipped && <Tag label="E" color="success" size="sm" />}
                              {item.attuned && <Tag label="A" color="accent" size="sm" />}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </Card>
            </div>
          );
        })()}

        {/* ════════════════ TAB: Story ════════════════ */}
        {activeTab === 'story' && (
          <div className={styles.storyTab}>
            {/* Identity */}
            <Card style={{ marginBottom: 16 }}>
              <SectionHeader icon={<User size={14} />} title="Identity" />
              <div className={styles.storyGrid}>
                <div className={styles.storyField}>
                  <span className={styles.storyLabel}>Race</span>
                  <span className={styles.storyValue} onClick={raceData ? showRaceDetail : undefined} style={raceData ? { cursor: 'pointer', color: 'var(--color-primary)' } : undefined}>
                    {char.race.subrace || char.race.name}
                  </span>
                </div>
                <div className={styles.storyField}>
                  <span className={styles.storyLabel}>Class</span>
                  <span className={styles.storyValue}>{char.classes.map((c) => `${c.name} ${c.level}`).join(' / ')}</span>
                </div>
                <div className={styles.storyField}>
                  <span className={styles.storyLabel}>Background</span>
                  <span className={styles.storyValue} onClick={backgroundData?.entries ? showBackgroundDetail : undefined} style={backgroundData?.entries ? { cursor: 'pointer', color: 'var(--color-primary)' } : undefined}>
                    {char.background.name}
                  </span>
                </div>
                <div className={styles.storyField}>
                  <span className={styles.storyLabel}>Alignment</span>
                  <span className={styles.storyValue}>{char.alignment}</span>
                </div>
              </div>
            </Card>

            {/* Personality */}
            <Card style={{ marginBottom: 16 }}>
              <SectionHeader icon={<Heart size={14} />} title="Personality" />
              <div className={styles.personalityGrid}>
                {[
                  { label: 'Personality Traits', value: char.personalityTraits },
                  { label: 'Ideals', value: char.ideals },
                  { label: 'Bonds', value: char.bonds },
                  { label: 'Flaws', value: char.flaws },
                ].map(({ label, value }) => value ? (
                  <div key={label} className={styles.personalityBlock}>
                    <span className={styles.personalityLabel}>{label}</span>
                    <p className={styles.personalityText}>{value}</p>
                  </div>
                ) : null)}
              </div>
            </Card>

            {/* Appearance */}
            {char.appearance && (
              <Card style={{ marginBottom: 16 }}>
                <SectionHeader icon={<Eye size={14} />} title="Appearance" />
                <p className={styles.storyText}>{char.appearance}</p>
              </Card>
            )}

            {/* Backstory */}
            {char.backstory && (
              <Card style={{ marginBottom: 16 }}>
                <SectionHeader icon={<ScrollText size={14} />} title="Backstory" />
                <p className={styles.storyText}>{char.backstory}</p>
              </Card>
            )}

            {/* Notes */}
            {char.notes && (
              <Card>
                <SectionHeader icon={<BookOpen size={14} />} title="Notes" />
                <p className={styles.storyText} style={{ fontStyle: 'italic' }}>{char.notes}</p>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Detail panel */}
      {detail && (
        <DetailPanel open onClose={() => setDetail(null)} title={detail.title} subtitle={detail.subtitle} badges={detail.badges}>
          <EntryRenderer entries={detail.entries} />
        </DetailPanel>
      )}

      {/* Rest modal */}
      {restType && (
        <RestModal
          type={restType}
          char={char}
          onApply={(updates) => updateCharacter(char.id, updates)}
          onClose={() => setRestType(null)}
        />
      )}

      {/* Avatar preview */}
      {avatarPreview && char.avatar && (
        <div className={styles.avatarOverlay} onClick={() => setAvatarPreview(false)}>
          <img src={char.avatar} alt={char.name} className={styles.avatarFull} />
          <button className={styles.avatarClose}><X size={20} /></button>
        </div>
      )}

      {/* Roll modal */}
      <RollModal
        request={rollRequest}
        hasInspiration={char.heroicInspiration}
        onClose={() => setRollRequest(null)}
        onUseInspiration={() => updateCharacter(char.id, { heroicInspiration: false })}
      />
    </div>
  );
}
