import { useRef, useEffect } from 'react';
import { X, Minus, Plus } from 'lucide-react';
import { useDiceStore, type RollEntry } from '../../stores/diceStore';
import styles from './DiceRoller.module.css';

const DICE = [4, 6, 8, 10, 12, 20, 100] as const;
type Die = typeof DICE[number];

// ── SVG die shapes ──────────────────────────────────────────────────────────

function DieFace({ die, size = 36 }: { die: Die; size?: number }) {
  const s = size;
  const st = { display: 'block' as const };
  switch (die) {
    case 4: return <svg width={s} height={s} viewBox="0 0 512 512" style={st} fill="currentColor"><path d="M240.1 56.5L35.4 310.6 240.1 465.9V56.5zm32 409.2L476.6 310.6 272.1 56.7V465.8zM256 0c7.3 0 14.1 3.3 18.7 8.9l232 288c4.1 5.1 5.9 11.5 5.1 18s-4.1 12.3-9.3 16.2l-232 176c-8.6 6.5-20.4 6.5-29 0l-232-176c-5.2-3.9-8.5-9.8-9.3-16.2s1.1-12.9 5.1-18l232-288C241.9 3.3 248.7 0 256 0z" /></svg>;
    case 6: return <svg width={s} height={s} viewBox="0 0 448 512" style={st} fill="currentColor"><path d="M220.1 35.6L47.9 136.2l176 101.2L400 133l-172-97.5 11.6-20.4L228.1 35.5c-2.5-1.4-5.5-1.4-8 .1zM32 164V366.6c0 2.9 1.6 5.6 4.1 7L208 469.9V265.3L32 164zM240 469.9l171.9-96.3c2.5-1.4 4.1-4.1 4.1-7V160.8L240 265.1V469.9zM203.9 7.9c12.3-7.2 27.5-7.3 39.9-.3L427.7 112c12.5 7.1 20.3 20.4 20.3 34.8V366.6c0 14.5-7.8 27.8-20.5 34.9l-184 103c-12.1 6.8-26.9 6.8-39.1 0l-184-103C7.8 394.4 0 381.1 0 366.6V150.1c0-14.2 7.5-27.4 19.8-34.5L203.9 7.9z" /></svg>;
    case 8: return <svg width={s} height={s} viewBox="0 0 512 512" style={st} fill="currentColor"><path d="M240 51.3L44.3 247.1l195.7 81V51.3zM72.8 293.5L240 460.7v-98L72.8 293.5zM272 460.7L439.2 293.5 272 362.7v98zM467.8 247.1L272 51.3V328.1l195.8-81zM239 7c9.4-9.4 24.6-9.4 33.9 0L505 239c9.4 9.4 9.4 24.6 0 33.9L273 505c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L239 7z" /></svg>;
    case 10: case 100: return <svg width={s} height={s} viewBox="0 0 512 512" style={st} fill="currentColor"><path d="M213.8 84.1L55.6 264.1l92.7-21.8L213.8 84.1zM48.6 298.6L240 463.6V328.6l-83.1-55.4L48.6 298.6zM272 463.6l191.4-165L355.1 273.2 272 328.6V463.6zM456.4 264.1L298.2 84.1l65.4 158.2 92.7 21.8zM256 0c6.9 0 13.5 3 18 8.2l232 264c4.2 4.8 6.4 11.1 5.9 17.5s-3.4 12.3-8.3 16.5l-232 200c-9 7.8-22.3 7.8-31.3 0l-232-200C3.5 302 .5 296 .1 289.7S1.7 277 6 272.2L238 8.2C242.5 3 249.1 0 256 0zm0 300.8L332.2 250 256 65.8 179.8 250 256 300.8z" /></svg>;
    case 12: return <svg width={s} height={s} viewBox="0 0 512 512" style={st} fill="currentColor"><path d="M200.3 32c-2.8 0-5.6 .7-8 2.1L128.7 70.9 256 111.2 383.3 70.9 319.7 34.1c-2.4-1.4-5.2-2.1-8-2.1L200.3 32zM92 92.8c-.8 .9-1.6 1.9-2.2 2.9L34.2 192.2c.6 .5 1.2 1 1.7 1.6l95.8 106.4L240 246.1V139.7L92 92.8zM32 237.3l0 74.4c0 2.8 .7 5.6 2.1 8l55.7 96.5c1.4 2.4 3.4 4.5 5.9 5.9l62.7 36.2-44.5-130L32 237.3zM199.7 480c.2 0 .4 0 .6 0H311.7c.7 0 1.4 0 2.1-.1l50.6-151.8L256 273.9 147.7 328.1l52 151.9zM355 457.5l61.2-35.4c2.4-1.4 4.5-3.4 5.9-5.9l55.7-96.5c1.4-2.4 2.1-5.2 2.1-8V237.3l-81.9 90.9L355 457.5zM477.8 192.2L422.1 95.7c-.6-1.1-1.3-2-2.2-2.9L272 139.7V246.1l108.3 54.1 95.8-106.4c.5-.6 1.1-1.1 1.7-1.6zM176.3 6.4c7.3-4.2 15.6-6.4 24-6.4H311.7c8.4 0 16.7 2.2 24 6.4l96.5 55.7c7.3 4.2 13.4 10.3 17.6 17.6l55.7 96.5c4.2 7.3 6.4 15.6 6.4 24V311.7c0 8.4-2.2 16.7-6.4 24l-55.7 96.5c-4.2 7.3-10.3 13.4-17.6 17.6l-96.5 55.7c-7.3 4.2-15.6 6.4-24 6.4H200.3c-8.4 0-16.7-2.2-24-6.4L79.7 449.8c-7.3-4.2-13.4-10.3-17.6-17.6L6.4 335.7c-4.2-7.3-6.4-15.6-6.4-24V200.3c0-8.4 2.2-16.7 6.4-24L62.2 79.7c4.2-7.3 10.3-13.4 17.6-17.6L176.3 6.4z" /></svg>;
    case 20: return <svg width={s} height={s} viewBox="0 0 512 512" style={st} fill="currentColor"><path d="M217.5 56.4L77.9 140.2l61.4 44.7L217.5 56.4zM64 169.6V320.3l59.2-107.6L64 169.6zM104.8 388L240 469.1V398.8L104.8 388zM272 469.1L407.2 388 272 398.8v70.3zM448 320.3V169.6l-59.2 43L448 320.3zM434.1 140.2L294.5 56.4l78.2 128.4 61.4-44.7zM243.7 3.4c7.6-4.6 17.1-4.6 24.7 0l200 120c7.2 4.3 11.7 12.1 11.7 20.6V368c0 8.4-4.4 16.2-11.7 20.6l-200 120c-7.6 4.6-17.1 4.6-24.7 0l-200-120C36.4 384.2 32 376.4 32 368V144c0-8.4 4.4-16.2 11.7-20.6l200-120zM225.3 365.5L145 239.4 81.9 354l143.3 11.5zM338.9 224H173.1L256 354.2 338.9 224zM256 54.8L172.5 192H339.5L256 54.8zm30.7 310.7L430.1 354 367 239.4 286.7 365.5z" /></svg>;
    default: return <svg width={s} height={s} viewBox="0 0 512 512" style={st} fill="currentColor"><circle cx="256" cy="256" r="240" /></svg>;
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtMod(mod: number): string { return mod > 0 ? `+${mod}` : `${mod}`; }
function entryFormula(e: RollEntry): string {
  const p = e.groups.map((g) => `${g.rolls.length}d${g.die}`);
  if (e.modifier !== 0) p.push(fmtMod(e.modifier));
  return p.join(' + ');
}
function isNat20(e: RollEntry) { return e.groups.length === 1 && e.groups[0].die === 20 && e.groups[0].rolls.length === 1 && e.groups[0].rolls[0] === 20; }
function isNat1(e: RollEntry)  { return e.groups.length === 1 && e.groups[0].die === 20 && e.groups[0].rolls.length === 1 && e.groups[0].rolls[0] === 1; }

const DIE_HEX: Record<Die, string> = { 4: '#fbbf24', 6: '#38bdf8', 8: '#a78bfa', 10: '#34d399', 12: '#fb7185', 20: '#f2ca50', 100: '#fb923c' };

// ── Component ─────────────────────────────────────────────────────────────────

export function DiceRoller() {
  const {
    open, setOpen, pool, modifier, history, expandedIds, animKey,
    addDie, removeDie, clearPool, adjustModifier, setModifier,
    roll, toggleExpand, clearHistory,
  } = useDiceStore();

  const historyRef = useRef<HTMLDivElement>(null);
  const poolEmpty = Object.keys(pool).length === 0;

  useEffect(() => {
    if (historyRef.current) historyRef.current.scrollTop = historyRef.current.scrollHeight;
  }, [history.length]);

  return (
    <>
      {!open && (
        <button className={styles.fab} onClick={() => setOpen(true)} title="Dice Roller">
          <div className={styles.fabIcon}><DieFace die={20} size={32} /></div>
        </button>
      )}

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}

      <div className={`${styles.panel} ${open ? styles.panelOpen : ''}`}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerD20}><DieFace die={20} size={18} /></span>
            <span>Dice Roller</span>
          </div>
          <button className={styles.closeBtn} onClick={() => setOpen(false)}><X size={16} /></button>
        </div>

        {/* History */}
        <div className={styles.historyWrap}>
          <div className={styles.historyBar}>
            <span className={styles.historyLabel}>History</span>
            {history.length > 0 && <button className={styles.clearHistBtn} onClick={clearHistory}>Clear</button>}
          </div>
          <div className={styles.historyScroll} ref={historyRef}>
            {history.length === 0 ? (
              <p className={styles.emptyMsg}>No rolls yet</p>
            ) : (
              <div className={styles.historyList}>
                {[...history].reverse().map((entry, i, arr) => {
                  const isLatest = i === arr.length - 1;
                  const expanded = expandedIds.has(entry.id);
                  const crit = isNat20(entry);
                  const fumble = isNat1(entry);
                  return (
                    <div
                      key={entry.id}
                      className={[styles.entry, isLatest && styles.entryLatest, crit && styles.entryCrit, fumble && styles.entryFumble, !isLatest && styles.entryOld].filter(Boolean).join(' ')}
                      onClick={() => toggleExpand(entry.id)}
                    >
                      <div className={styles.entryTop}>
                        <div>
                          {entry.label && <div className={styles.entryLabel}>{entry.label}</div>}
                          <span className={styles.formula}>{entryFormula(entry)}</span>
                        </div>
                        <span key={isLatest ? animKey : entry.id} className={[styles.total, isLatest && styles.totalBig, crit && styles.totalCrit, fumble && styles.totalFumble].filter(Boolean).join(' ')}>
                          {entry.total}
                        </span>
                      </div>
                      {crit && <p className={styles.critLabel}>★ Critical Hit</p>}
                      {fumble && <p className={styles.fumbleLabel}>Critical Fail</p>}

                      {expanded && (
                        <div className={styles.breakdown}>
                          {entry.groups.map((g) => (
                            <div key={g.die} className={styles.breakRow}>
                              <span className={styles.breakDieIcon} style={{ color: DIE_HEX[g.die] }}><DieFace die={g.die} size={14} /></span>
                              <span className={styles.breakDieLabel} style={{ color: DIE_HEX[g.die] }}>d{g.die}</span>
                              <div className={styles.breakRolls}>
                                {g.rolls.map((v, ri) => (
                                  <span key={ri} className={[styles.breakVal, v === g.die && styles.breakMax, v === 1 && styles.breakMin].filter(Boolean).join(' ')} style={{ color: DIE_HEX[g.die] }}>{v}</span>
                                ))}
                              </div>
                              {g.rolls.length > 1 && <span className={styles.breakSum}>= {g.rolls.reduce((a, b) => a + b, 0)}</span>}
                            </div>
                          ))}
                          {entry.modifier !== 0 && (
                            <div className={styles.breakMod}><span>Mod</span><span className={styles.breakModVal}>{fmtMod(entry.modifier)}</span></div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Die picker + Roll */}
        <div className={styles.rollBlock}>
          <div className={styles.pickerArea}>
            <p className={styles.pickerHint}>Click to add · right-click to remove</p>
            <div className={styles.diceGrid}>
              {DICE.map((d) => {
                const count = pool[d] ?? 0;
                return (
                  <button key={d} className={`${styles.dieBtn} ${count > 0 ? styles.dieBtnActive : ''}`}
                    onClick={() => addDie(d)} onContextMenu={(e) => { e.preventDefault(); if (count > 0) removeDie(d); }}>
                    {count > 0 && <span className={styles.dieBadge}>{count}</span>}
                    <span className={styles.dieShape} style={{ color: count > 0 ? DIE_HEX[d] : undefined }}><DieFace die={d} size={34} /></span>
                    <span className={styles.dieLabel} style={count > 0 ? { color: 'var(--text-primary)' } : undefined}>d{d}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className={styles.divider} />
          <div className={styles.poolArea}>
            <div className={styles.chips}>
              {poolEmpty ? <span className={styles.chipsEmpty}>No dice selected</span> : (
                <>
                  {DICE.filter((d) => (pool[d] ?? 0) > 0).map((d, i) => (
                    <span key={d} className={styles.chipWrap}>
                      {i > 0 && <span className={styles.chipPlus}>+</span>}
                      <button className={styles.chip} style={{ color: DIE_HEX[d], borderColor: DIE_HEX[d] }} onClick={() => removeDie(d)}>
                        {pool[d]}d{d} <X size={10} />
                      </button>
                    </span>
                  ))}
                  <button className={styles.chipsClear} onClick={clearPool}>Clear</button>
                </>
              )}
            </div>
            <div className={styles.modRollRow}>
              <span className={styles.modLabel}>Mod</span>
              <button className={styles.modBtn} onClick={() => adjustModifier(-1)}><Minus size={14} /></button>
              <span className={styles.modValue}>{modifier >= 0 ? `+${modifier}` : modifier}</span>
              <button className={styles.modBtn} onClick={() => adjustModifier(1)}><Plus size={14} /></button>
              {modifier !== 0 && <button className={styles.modReset} onClick={() => setModifier(0)}>reset</button>}
              <button className={styles.rollBtn} disabled={poolEmpty} onClick={roll}>
                <DieFace die={20} size={14} /> Roll
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
