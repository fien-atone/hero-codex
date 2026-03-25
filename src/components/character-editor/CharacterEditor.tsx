import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Save, ArrowLeft, Trash2, Plus, X, User, Swords, Target, Heart, ScrollText } from 'lucide-react';
import { useCharacterStore } from '../../stores/characterStore';
import type { Character } from '../../types/character';
import { ABILITY_KEYS, ABILITY_NAMES, ALIGNMENTS, getModifier } from '../../types/character';
import { formatModifier } from '../../utils/calculations';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { SectionHeader } from '../ui/SectionHeader';
import styles from './CharacterEditor.module.css';

export function CharacterEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getCharacterById = useCharacterStore((s) => s.getCharacterById);
  const updateCharacter = useCharacterStore((s) => s.updateCharacter);
  const deleteCharacter = useCharacterStore((s) => s.deleteCharacter);

  const original = getCharacterById(id!);
  const [char, setChar] = useState<Character | null>(null);

  useEffect(() => {
    if (original) {
      setChar(structuredClone(original));
    }
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!char) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <h2>Character not found</h2>
        <Button variant="primary" onClick={() => navigate('/')}>Back</Button>
      </div>
    );
  }

  const update = (partial: Partial<Character>) => {
    setChar((c) => c ? { ...c, ...partial } : c);
  };

  const handleSave = () => {
    if (!char) return;
    updateCharacter(char.id, { ...char, updatedAt: new Date().toISOString() });
    navigate(`/character/${char.id}`);
  };

  const handleDelete = () => {
    if (confirm(`Delete ${char.name}? This cannot be undone.`)) {
      deleteCharacter(char.id);
      navigate('/');
    }
  };

  return (
    <div className={styles.editor}>
      <div className={styles.header}>
        <Button
          variant="ghost"
          icon={<ArrowLeft size={16} />}
          onClick={() => navigate(`/character/${char.id}`)}
        >
          Cancel
        </Button>
        <h2>Edit: {char.name}</h2>
        <div className={styles.headerActions}>
          <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="primary" icon={<Save size={16} />} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>

      <div className={styles.form}>
        {/* Basic Info */}
        <Card>
          <SectionHeader icon={<User size={14} />} title="Basic Info" />
          <div className={styles.grid2}>
            <Input label="Name" value={char.name} onChange={(e) => update({ name: e.target.value })} />
            <Select
              label="Alignment"
              value={char.alignment}
              onChange={(e) => update({ alignment: e.target.value })}
              options={ALIGNMENTS.map((a) => ({ value: a, label: a }))}
            />
            <Input label="Race" value={char.race.name} onChange={(e) => update({ race: { ...char.race, name: e.target.value } })} />
            <Input label="Subrace" value={char.race.subrace || ''} onChange={(e) => update({ race: { ...char.race, subrace: e.target.value || undefined } })} />
            <Input label="Campaign" value={char.campaign || ''} onChange={(e) => update({ campaign: e.target.value || undefined })} />
          </div>
        </Card>

        {/* Classes */}
        <Card>
          <SectionHeader icon={<Swords size={14} />} title="Classes" />
          {char.classes.map((cls, i) => (
            <div key={i} className={styles.classRow}>
              <Input
                label="Class"
                value={cls.name}
                onChange={(e) => {
                  const classes = [...char.classes];
                  classes[i] = { ...classes[i], name: e.target.value };
                  update({ classes });
                }}
              />
              <Input
                label="Level"
                type="number"
                min={1}
                max={20}
                value={cls.level}
                onChange={(e) => {
                  const classes = [...char.classes];
                  classes[i] = { ...classes[i], level: Number(e.target.value) };
                  update({ classes });
                }}
                style={{ width: 80 }}
              />
              <Input
                label="Subclass"
                value={cls.subclass?.shortName || ''}
                onChange={(e) => {
                  const classes = [...char.classes];
                  classes[i] = {
                    ...classes[i],
                    subclass: e.target.value ? { name: e.target.value, shortName: e.target.value, source: 'PHB' } : undefined,
                  };
                  update({ classes });
                }}
              />
              {char.classes.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<X size={14} />}
                  onClick={() => update({ classes: char.classes.filter((_, j) => j !== i) })}
                  style={{ marginTop: 20 }}
                />
              )}
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => update({ classes: [...char.classes, { name: '', source: 'PHB', level: 1 }] })}
          >
            Add Multiclass
          </Button>
        </Card>

        {/* Ability Scores */}
        <Card>
          <SectionHeader icon={<Target size={14} />} title="Ability Scores" />
          <div className={styles.abilityGrid}>
            {ABILITY_KEYS.map((key) => (
              <div key={key} className={styles.abilityEdit}>
                <label>{ABILITY_NAMES[key]}</label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={char.abilityScores[key]}
                  onChange={(e) => update({
                    abilityScores: { ...char.abilityScores, [key]: Number(e.target.value) },
                  })}
                  style={{ width: 70 }}
                />
                <span className={styles.modDisplay}>
                  {formatModifier(getModifier(char.abilityScores[key] + (char.abilityBonuses?.[key] || 0)))}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Combat */}
        <Card>
          <SectionHeader icon={<Heart size={14} />} title="Combat" />
          <div className={styles.grid3}>
            <Input
              label="AC"
              type="number"
              value={char.armorClass}
              onChange={(e) => update({ armorClass: Number(e.target.value) })}
            />
            <Input
              label="Max HP"
              type="number"
              value={char.hitPoints.max}
              onChange={(e) => update({
                hitPoints: { ...char.hitPoints, max: Number(e.target.value), current: Math.min(char.hitPoints.current, Number(e.target.value)) },
              })}
            />
            <Input
              label="Current HP"
              type="number"
              value={char.hitPoints.current}
              onChange={(e) => update({
                hitPoints: { ...char.hitPoints, current: Number(e.target.value) },
              })}
            />
            <Input
              label="Temp HP"
              type="number"
              value={char.hitPoints.temp}
              onChange={(e) => update({
                hitPoints: { ...char.hitPoints, temp: Number(e.target.value) },
              })}
            />
            <Input
              label="Walk Speed"
              type="number"
              value={char.speed.walk || 30}
              onChange={(e) => update({ speed: { ...char.speed, walk: Number(e.target.value) } })}
            />
          </div>
        </Card>

        {/* Flavor */}
        <Card>
          <SectionHeader icon={<ScrollText size={14} />} title="Personality & Backstory" />
          <div className={styles.grid1}>
            <Input label="Personality Traits" value={char.personalityTraits} onChange={(e) => update({ personalityTraits: e.target.value })} />
            <Input label="Ideals" value={char.ideals} onChange={(e) => update({ ideals: e.target.value })} />
            <Input label="Bonds" value={char.bonds} onChange={(e) => update({ bonds: e.target.value })} />
            <Input label="Flaws" value={char.flaws} onChange={(e) => update({ flaws: e.target.value })} />
            <div>
              <label className={styles.fieldLabel}>Backstory</label>
              <textarea
                className={styles.textarea}
                value={char.backstory}
                onChange={(e) => update({ backstory: e.target.value })}
                rows={4}
              />
            </div>
            <div>
              <label className={styles.fieldLabel}>Notes</label>
              <textarea
                className={styles.textarea}
                value={char.notes}
                onChange={(e) => update({ notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
