import { useState, useCallback } from 'react';
import { Dices, RotateCcw, ChevronUp, ChevronDown, Minus, Plus, Sparkles } from 'lucide-react';
import { useDiceStore, type RollEntry } from '../../stores/diceStore';
import { Button } from './Button';
import styles from './RollModal.module.css';

type RollMode = 'normal' | 'advantage' | 'disadvantage';

export interface RollRequest {
  label: string;
  dice: Partial<Record<4 | 6 | 8 | 10 | 12 | 20 | 100, number>>;
  modifier: number;
}

interface RollModalProps {
  request: RollRequest | null;
  hasInspiration: boolean;
  onClose: () => void;
  onUseInspiration: () => void;
}

function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function RollModal({ request, hasInspiration, onClose, onUseInspiration }: RollModalProps) {
  const [mode, setMode] = useState<RollMode>('normal');
  const [extraMod, setExtraMod] = useState(0);
  const [bonusDice, setBonusDice] = useState<Record<string, number>>({}); // label → die size
  const [result, setResult] = useState<RollEntry | null>(null);
  const [advRolls, setAdvRolls] = useState<[number, number] | null>(null); // for showing both d20 rolls
  const [rerolled, setRerolled] = useState(false);

  const resetState = useCallback(() => {
    setMode('normal');
    setExtraMod(0);
    setBonusDice({});
    setResult(null);
    setAdvRolls(null);
    setRerolled(false);
  }, []);

  if (!request) return null;

  const isD20Roll = request.dice[20] === 1 && Object.keys(request.dice).length === 1;
  const totalMod = request.modifier + extraMod;

  const handleRoll = () => {
    const groups: { die: number; rolls: number[] }[] = [];
    let total = 0;

    // Main dice
    for (const [sides, count] of Object.entries(request.dice)) {
      const s = Number(sides);
      const c = count as number;
      if (c <= 0) continue;

      if (s === 20 && isD20Roll && mode !== 'normal') {
        // Advantage/Disadvantage: roll 2d20, take best/worst
        const r1 = rollDie(20);
        const r2 = rollDie(20);
        const chosen = mode === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
        setAdvRolls([r1, r2]);
        groups.push({ die: 20, rolls: [chosen] });
        total += chosen;
      } else {
        const rolls = Array.from({ length: c }, () => rollDie(s));
        groups.push({ die: s, rolls });
        total += rolls.reduce((a, b) => a + b, 0);
      }
    }

    // Bonus dice
    for (const [, die] of Object.entries(bonusDice)) {
      if (die > 0) {
        const r = rollDie(die);
        groups.push({ die, rolls: [r] });
        total += r;
      }
    }

    total += totalMod;

    const entry: RollEntry = {
      id: `${Date.now()}-${Math.random()}`,
      label: request.label + (mode !== 'normal' ? ` (${mode === 'advantage' ? 'Adv' : 'Dis'})` : ''),
      groups: groups as any,
      modifier: totalMod,
      total,
      ts: Date.now(),
    };

    setResult(entry);
  };

  const handleReroll = () => {
    if (!hasInspiration || rerolled) return;
    onUseInspiration();
    setRerolled(true);
    handleRoll(); // re-execute the roll
  };

  const handleConfirm = () => {
    if (result) {
      // Push to dice roller history directly
      useDiceStore.getState().quickRoll({
        label: result.label || request.label,
        dice: {},
        modifier: 0,
      });
      // Actually, let's just add to history manually
      const store = useDiceStore.getState();
      store.setOpen(true);
    }
    resetState();
    onClose();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const fmtMod = (m: number) => (m >= 0 ? `+${m}` : `${m}`);

  // Is this a nat 20 or nat 1?
  const isNat20 = isD20Roll && result && result.groups[0]?.rolls[0] === 20;
  const isNat1 = isD20Roll && result && result.groups[0]?.rolls[0] === 1;

  return (
    <div className={styles.backdrop} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <Dices size={18} />
          <span className={styles.title}>{request.label}</span>
        </div>

        {!result ? (
          <>
            {/* Roll info */}
            <div className={styles.formula}>
              {Object.entries(request.dice).map(([s, c]) => `${c}d${s}`).join(' + ')}
              {totalMod !== 0 && ` ${fmtMod(totalMod)}`}
              {Object.entries(bonusDice).filter(([, d]) => d > 0).map(([, d]) => ` + 1d${d}`).join('')}
            </div>

            {/* Advantage / Disadvantage */}
            {isD20Roll && (
              <div className={styles.modeRow}>
                {(['disadvantage', 'normal', 'advantage'] as RollMode[]).map((m) => (
                  <button
                    key={m}
                    className={`${styles.modeBtn} ${mode === m ? styles.modeBtnActive : ''} ${m === 'advantage' ? styles.modeAdv : m === 'disadvantage' ? styles.modeDis : ''}`}
                    onClick={() => setMode(m)}
                  >
                    {m === 'advantage' && <ChevronUp size={14} />}
                    {m === 'disadvantage' && <ChevronDown size={14} />}
                    {m === 'advantage' ? 'Advantage' : m === 'disadvantage' ? 'Disadvantage' : 'Normal'}
                  </button>
                ))}
              </div>
            )}

            {/* Bonus dice */}
            {isD20Roll && (
              <div className={styles.bonusSection}>
                <span className={styles.bonusLabel}>Bonus Dice</span>
                <div className={styles.bonusBtns}>
                  <button
                    className={`${styles.bonusBtn} ${bonusDice['Guidance'] ? styles.bonusBtnActive : ''}`}
                    onClick={() => setBonusDice((p) => p['Guidance'] ? { ...p, Guidance: 0 } : { ...p, Guidance: 4 })}
                  >
                    Guidance (d4)
                  </button>
                  <button
                    className={`${styles.bonusBtn} ${bonusDice['Bless'] ? styles.bonusBtnActive : ''}`}
                    onClick={() => setBonusDice((p) => p['Bless'] ? { ...p, Bless: 0 } : { ...p, Bless: 4 })}
                  >
                    Bless (d4)
                  </button>
                </div>
              </div>
            )}

            {/* Extra modifier */}
            <div className={styles.modSection}>
              <span className={styles.modLabel}>Extra Modifier</span>
              <div className={styles.modControls}>
                <button className={styles.modBtn} onClick={() => setExtraMod((m) => m - 1)}><Minus size={14} /></button>
                <span className={styles.modValue}>{fmtMod(extraMod)}</span>
                <button className={styles.modBtn} onClick={() => setExtraMod((m) => m + 1)}><Plus size={14} /></button>
                {extraMod !== 0 && <button className={styles.modReset} onClick={() => setExtraMod(0)}>reset</button>}
              </div>
            </div>

            {/* Roll button */}
            <button className={styles.rollBtn} onClick={handleRoll}>
              <Dices size={18} /> Roll
            </button>
          </>
        ) : (
          <>
            {/* Result */}
            <div className={styles.resultArea}>
              <div className={`${styles.resultTotal} ${isNat20 ? styles.resultCrit : ''} ${isNat1 ? styles.resultFumble : ''}`}>
                {result.total}
              </div>
              {isNat20 && <p className={styles.critText}>Critical!</p>}
              {isNat1 && <p className={styles.fumbleText}>Critical Fail!</p>}

              {/* Show both d20 rolls for advantage/disadvantage */}
              {advRolls && (
                <div className={styles.advRolls}>
                  <span className={result.groups[0]?.rolls[0] === advRolls[0] ? styles.advChosen : styles.advDiscarded}>{advRolls[0]}</span>
                  <span className={styles.advSep}>/</span>
                  <span className={result.groups[0]?.rolls[0] === advRolls[1] ? styles.advChosen : styles.advDiscarded}>{advRolls[1]}</span>
                  <span className={styles.advLabel}>{mode === 'advantage' ? 'took highest' : 'took lowest'}</span>
                </div>
              )}

              {/* Breakdown */}
              <div className={styles.resultBreakdown}>
                {result.groups.map((g, i) => (
                  <span key={i}>{g.rolls.join('+')} (d{g.die})</span>
                ))}
                {result.modifier !== 0 && <span>{fmtMod(result.modifier)} mod</span>}
              </div>
            </div>

            {/* Actions */}
            <div className={styles.resultActions}>
              {hasInspiration && !rerolled && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Sparkles size={14} />}
                  onClick={handleReroll}
                >
                  Reroll (Inspiration)
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                icon={<RotateCcw size={14} />}
                onClick={() => { setResult(null); setAdvRolls(null); }}
              >
                Roll Again
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirm}>
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
