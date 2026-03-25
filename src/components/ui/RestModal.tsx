import { useState } from 'react';
import { Moon, Sun, Heart, Dices } from 'lucide-react';
import type { Character } from '../../types/character';
import { getCharacterLevel, getModifier } from '../../types/character';
import { getEffectiveAbilityScore } from '../../utils/calculations';
import { Button } from './Button';
import styles from './RestModal.module.css';

type RestType = 'short' | 'long';

interface RestModalProps {
  type: RestType;
  char: Character;
  onApply: (updates: Partial<Character>) => void;
  onClose: () => void;
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function RestModal({ type, char, onApply, onClose }: RestModalProps) {
  const level = getCharacterLevel(char);
  const conMod = getModifier(getEffectiveAbilityScore(char, 'con'));

  // Short rest: choose how many hit dice to spend
  const [hdToSpend, setHdToSpend] = useState<number[]>(char.hitDice.map(() => 0));
  const [hpRolled, setHpRolled] = useState<number | null>(null);
  const [rolled, setRolled] = useState(false);

  // Long rest summary
  const halfHd = Math.max(1, Math.floor(level / 2));
  const hdRecoverable = char.hitDice.map((hd) => Math.min(hd.used, halfHd));

  const handleShortRestRoll = () => {
    let totalHealed = 0;
    const newHitDice = char.hitDice.map((hd, i) => {
      const spend = hdToSpend[i];
      if (spend <= 0) return hd;
      for (let j = 0; j < spend; j++) {
        totalHealed += Math.max(1, rollDie(hd.faces) + conMod);
      }
      return { ...hd, used: hd.used + spend };
    });

    setHpRolled(totalHealed);
    setRolled(true);

    const newCurrent = Math.min(char.hitPoints.max, char.hitPoints.current + totalHealed);
    onApply({
      hitPoints: { ...char.hitPoints, current: newCurrent },
      hitDice: newHitDice,
      // Warlock: restore pact slots (all slots restore on short rest)
      ...(char.classes.some((c) => c.name.toLowerCase() === 'warlock') && char.spellcasting ? {
        spellcasting: {
          ...char.spellcasting,
          slots: Object.fromEntries(
            Object.entries(char.spellcasting.slots).map(([lvl, s]) => [lvl, { ...s, used: 0 }])
          ),
        },
      } : {}),
    });
  };

  const handleLongRest = () => {
    const newHitDice = char.hitDice.map((hd, i) => ({
      ...hd,
      used: Math.max(0, hd.used - hdRecoverable[i]),
    }));

    onApply({
      hitPoints: { ...char.hitPoints, current: char.hitPoints.max, temp: 0 },
      hitDice: newHitDice,
      // Restore all spell slots
      ...(char.spellcasting ? {
        spellcasting: {
          ...char.spellcasting,
          slots: Object.fromEntries(
            Object.entries(char.spellcasting.slots).map(([lvl, s]) => [lvl, { ...s, used: 0 }])
          ),
        },
      } : {}),
    });
    onClose();
  };

  const totalHdAvailable = char.hitDice.reduce((s, hd) => s + (hd.total - hd.used), 0);
  const totalToSpend = hdToSpend.reduce((s, v) => s + v, 0);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {type === 'short' ? <Sun size={20} /> : <Moon size={20} />}
          <h3>{type === 'short' ? 'Short Rest' : 'Long Rest'}</h3>
        </div>

        {type === 'long' ? (
          <div className={styles.body}>
            <p className={styles.desc}>After a long rest, you regain:</p>
            <div className={styles.restList}>
              <div className={styles.restItem}>
                <Heart size={14} />
                <span>All HP restored to <strong>{char.hitPoints.max}</strong></span>
              </div>
              <div className={styles.restItem}>
                <Dices size={14} />
                <span>Hit Dice recovered: <strong>{hdRecoverable.map((r, i) => `${r}d${char.hitDice[i].faces}`).join(' + ')}</strong> (half level, min 1)</span>
              </div>
              {char.spellcasting && (
                <div className={styles.restItem}>
                  <span>All spell slots restored</span>
                </div>
              )}
              <div className={styles.restItem}>
                <span>Temp HP reset to 0</span>
              </div>
            </div>
            <div className={styles.actions}>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant="primary" icon={<Moon size={14} />} onClick={handleLongRest}>Take Long Rest</Button>
            </div>
          </div>
        ) : (
          <div className={styles.body}>
            {!rolled ? (
              <>
                <p className={styles.desc}>
                  Spend Hit Dice to recover HP. You have <strong>{totalHdAvailable}</strong> hit dice available.
                  Each die heals <strong>die + {conMod >= 0 ? '+' : ''}{conMod} CON</strong> (min 1).
                </p>

                {char.hitDice.map((hd, i) => {
                  const available = hd.total - hd.used;
                  return (
                    <div key={i} className={styles.hdRow}>
                      <span className={styles.hdLabel}>d{hd.faces}</span>
                      <span className={styles.hdAvail}>{available} available</span>
                      <div className={styles.hdControls}>
                        <button className={styles.hdBtn} disabled={hdToSpend[i] <= 0}
                          onClick={() => setHdToSpend((p) => { const n = [...p]; n[i]--; return n; })}>-</button>
                        <span className={styles.hdCount}>{hdToSpend[i]}</span>
                        <button className={styles.hdBtn} disabled={hdToSpend[i] >= available}
                          onClick={() => setHdToSpend((p) => { const n = [...p]; n[i]++; return n; })}>+</button>
                      </div>
                    </div>
                  );
                })}

                {char.classes.some((c) => c.name.toLowerCase() === 'warlock') && (
                  <p className={styles.note}>Warlock spell slots will be restored.</p>
                )}

                <div className={styles.actions}>
                  <Button variant="ghost" onClick={onClose}>Cancel</Button>
                  <Button variant="primary" icon={<Dices size={14} />} disabled={totalToSpend === 0}
                    onClick={handleShortRestRoll}>
                    Roll {totalToSpend > 0 ? `${totalToSpend} Hit Dice` : ''}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.rollResult}>
                  <span className={styles.healedLabel}>HP Healed</span>
                  <span className={styles.healedValue}>+{hpRolled}</span>
                  <span className={styles.healedTotal}>
                    {Math.min(char.hitPoints.max, char.hitPoints.current)} / {char.hitPoints.max}
                  </span>
                </div>
                <div className={styles.actions}>
                  <Button variant="primary" onClick={onClose}>Done</Button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
