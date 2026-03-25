import type { Entry, EntryObject } from '../../types/gamedata';
import styles from './EntryRenderer.module.css';

interface EntryRendererProps {
  entries: Entry[];
  compact?: boolean;
}

export function EntryRenderer({ entries, compact }: EntryRendererProps) {
  return (
    <div className={`${styles.entries} ${compact ? styles.compact : ''}`}>
      {entries.map((entry, i) => (
        <EntryNode key={i} entry={entry} />
      ))}
    </div>
  );
}

function EntryNode({ entry }: { entry: Entry }) {
  if (typeof entry === 'string') {
    return <p className={styles.text} dangerouslySetInnerHTML={{ __html: parseTaggedText(entry) }} />;
  }

  const obj = entry as EntryObject;

  switch (obj.type) {
    case 'entries':
    case 'section':
      return (
        <div className={styles.block}>
          {obj.name && <h4 className={styles.blockTitle}>{obj.name}</h4>}
          {obj.entries && obj.entries.map((e, i) => <EntryNode key={i} entry={e} />)}
        </div>
      );

    case 'list':
      return (
        <ul className={styles.list}>
          {(obj.items || []).map((item, i) => (
            <li key={i}><EntryNode entry={item} /></li>
          ))}
        </ul>
      );

    case 'table':
      return (
        <div className={styles.tableWrap}>
          {obj.caption && <div className={styles.tableCaption}>{obj.caption}</div>}
          <table className={styles.table}>
            {obj.colLabels && (
              <thead>
                <tr>
                  {obj.colLabels.map((label, i) => (
                    <th key={i} dangerouslySetInnerHTML={{ __html: parseTaggedText(label) }} />
                  ))}
                </tr>
              </thead>
            )}
            {obj.rows && (
              <tbody>
                {obj.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j} dangerouslySetInnerHTML={{ __html: parseTaggedText(String(cell)) }} />
                    ))}
                  </tr>
                ))}
              </tbody>
            )}
          </table>
        </div>
      );

    case 'inset':
    case 'insetReadaloud':
      return (
        <div className={styles.inset}>
          {obj.name && <strong>{obj.name}</strong>}
          {obj.entries && obj.entries.map((e, i) => <EntryNode key={i} entry={e} />)}
        </div>
      );

    case 'quote':
      return (
        <blockquote className={styles.quote}>
          {obj.entries && obj.entries.map((e, i) => <EntryNode key={i} entry={e} />)}
        </blockquote>
      );

    case 'options':
    case 'optfeature':
      return (
        <div className={styles.block}>
          {obj.name && <h4 className={styles.blockTitle}>{obj.name}</h4>}
          {obj.entries && obj.entries.map((e, i) => <EntryNode key={i} entry={e} />)}
        </div>
      );

    case 'abilityDc':
    case 'abilityAttackMod':
      return (
        <div className={styles.formulaBox}>
          {obj.name && <strong>{obj.name}</strong>}
          {obj.entries && obj.entries.map((e, i) => <EntryNode key={i} entry={e} />)}
        </div>
      );

    case 'cell':
      // Table cell with roll info
      if (typeof (obj as any).roll === 'object') {
        const roll = (obj as any).roll;
        return <span>{roll.exact ?? `${roll.min}-${roll.max}`}</span>;
      }
      return <span>{JSON.stringify(obj)}</span>;

    default:
      // Fallback: try to render entries if present
      if (obj.entries) {
        return (
          <div className={styles.block}>
            {obj.name && <h4 className={styles.blockTitle}>{obj.name}</h4>}
            {obj.entries.map((e, i) => <EntryNode key={i} entry={e} />)}
          </div>
        );
      }
      if (obj.items) {
        return (
          <ul className={styles.list}>
            {obj.items.map((item, i) => (
              <li key={i}><EntryNode entry={item} /></li>
            ))}
          </ul>
        );
      }
      // Last resort: render as text
      if (obj.name) return <p className={styles.text}><strong>{obj.name}</strong></p>;
      return null;
  }
}

// Parse 5etools tagged strings to HTML
function parseTaggedText(text: string): string {
  return text
    .replace(/\{@bold\s+([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\{@b\s+([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\{@italic\s+([^}]+)\}/g, '<em>$1</em>')
    .replace(/\{@i\s+([^}]+)\}/g, '<em>$1</em>')
    .replace(/\{@damage\s+([^}]+)\}/g, '<strong>$1</strong>')
    .replace(/\{@dice\s+([^}|]+)(?:\|[^}]*)?\}/g, '<strong>$1</strong>')
    .replace(/\{@hit\s+([^}]+)\}/g, '<strong>+$1</strong>')
    .replace(/\{@dc\s+([^}]+)\}/g, '<strong>DC $1</strong>')
    .replace(/\{@spell\s+([^}|]+)(?:\|[^}]*)?\}/g, '<em class="tag-spell">$1</em>')
    .replace(/\{@item\s+([^}|]+)(?:\|[^}]*)?\}/g, '<em>$1</em>')
    .replace(/\{@creature\s+([^}|]+)(?:\|[^}]*)?\}/g, '<em>$1</em>')
    .replace(/\{@condition\s+([^}|]+)(?:\|[^}]*)?\}/g, '<strong>$1</strong>')
    .replace(/\{@skill\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@action\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@sense\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@filter\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@book\s+([^}|]+)(?:\|[^}]*)?\}/g, '<em>$1</em>')
    .replace(/\{@class\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@race\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@background\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1')
    .replace(/\{@feat\s+([^}|]+)(?:\|[^}]*)?\}/g, '<em>$1</em>')
    .replace(/\{@note\s+([^}]+)\}/g, '<small>($1)</small>')
    .replace(/\{@atk\s+([^}]+)\}/g, (_: string, type: string) => {
      const parts: string[] = [];
      if (type.includes('m')) parts.push('Melee');
      if (type.includes('r')) parts.push('Ranged');
      if (type.includes('w')) parts.push('Weapon');
      if (type.includes('s')) parts.push('Spell');
      return `<em>${parts.join(' ')} Attack:</em>`;
    })
    .replace(/\{@\w+\s+([^}|]+)(?:\|[^}]*)?\}/g, '$1'); // fallback
}
