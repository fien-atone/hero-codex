import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Star, Plus } from 'lucide-react';
import { useCharacterStore } from '../../stores/characterStore';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { getCharacterLevel } from '../../types/character';
import { useGL } from '../../i18n/gamedata';
import { useT } from '../../i18n';
import styles from './Sidebar.module.css';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { filters, setFilter, getFilteredCharacters } = useCharacterStore();

  const tt = useT();
  const gl = useGL();
  const chars = getFilteredCharacters();

  // Sort: favorites first, then alphabetical
  const sorted = [...chars].sort((a, b) => {
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <aside className={styles.sidebar}>
      {/* Search + Add */}
      <div className={styles.top}>
        <Input
          placeholder={tt('misc.search')}
          icon={<Search size={14} />}
          value={filters.search}
          onChange={(e) => setFilter({ search: e.target.value })}
        />
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => navigate('/create')}
          title="New Character"
        />
      </div>

      {/* Character list */}
      <div className={styles.charList}>
        {sorted.map((char) => {
          const isActive = location.pathname.startsWith(`/character/${char.id}`);
          const level = getCharacterLevel(char);
          return (
            <button
              key={char.id}
              className={`${styles.charItem} ${isActive ? styles.active : ''}`}
              onClick={() => navigate(`/character/${char.id}`)}
            >
              <div className={styles.charInfo}>
                <span className={styles.charName}>
                  {char.favorite && <Star size={11} fill="var(--color-primary)" color="var(--color-primary)" />}
                  {char.name}
                </span>
                <span className={styles.charMeta}>
                  Lvl {level} {gl('race', char.race.subrace || char.race.name)} {gl('class', char.classes[0]?.name || '')}
                </span>
              </div>
            </button>
          );
        })}

        {sorted.length === 0 && (
          <div className={styles.empty}>No characters found</div>
        )}
      </div>
    </aside>
  );
}
