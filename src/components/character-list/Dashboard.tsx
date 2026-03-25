import { useNavigate } from 'react-router-dom';
import { Plus, Star, Trash2, Copy, Pencil } from 'lucide-react';
import { useCharacterStore } from '../../stores/characterStore';
import { mockCharacters } from '../../data/mock-characters';
import { getCharacterLevel } from '../../types/character';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tag } from '../ui/Tag';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const navigate = useNavigate();
  const {
    characters,
    getFilteredCharacters,
    addCharacter,
    deleteCharacter,
    duplicateCharacter,
    toggleFavorite,
  } = useCharacterStore();

  const filtered = getFilteredCharacters();

  const loadMockData = () => {
    for (const char of mockCharacters) {
      if (!characters.find((c) => c.id === char.id)) {
        addCharacter(char);
      }
    }
  };

  if (characters.length === 0) {
    return (
      <div className={styles.welcome}>
        <div className={styles.welcomeContent}>
          <h1>Welcome to D&D Character Manager</h1>
          <p className="text-secondary">
            Manage all your D&D 5e characters in one place. Create, organize, and track your heroes.
          </p>
          <div className={styles.welcomeActions}>
            <Button
              variant="primary"
              size="lg"
              icon={<Plus size={18} />}
              onClick={() => navigate('/create')}
            >
              Create Your First Character
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={loadMockData}
            >
              Load Sample Characters
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h2>Characters ({filtered.length})</h2>
      </div>

      <div className={styles.grid}>
        {filtered.map((char) => {
          const level = getCharacterLevel(char);
          const mainClass = char.classes[0];
          return (
            <Card
              key={char.id}
              hover
              onClick={() => navigate(`/character/${char.id}`)}
              className={styles.charCard}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <h3>{char.name}</h3>
                  <button
                    className={styles.favBtn}
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(char.id); }}
                  >
                    <Star
                      size={16}
                      fill={char.favorite ? 'var(--gold)' : 'none'}
                      color={char.favorite ? 'var(--gold)' : 'var(--text-muted)'}
                    />
                  </button>
                </div>
                <p className={styles.subtitle}>
                  Level {level} {char.race.subrace || char.race.name} {mainClass?.name}
                  {mainClass?.subclass && ` (${mainClass.subclass.shortName})`}
                </p>
              </div>

              <div className={styles.cardStats}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>HP</span>
                  <span className={styles.statValue}>
                    {char.hitPoints.current}/{char.hitPoints.max}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>AC</span>
                  <span className={styles.statValue}>{char.armorClass}</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>Speed</span>
                  <span className={styles.statValue}>{char.speed.walk} ft</span>
                </div>
              </div>

              {char.campaign && (
                <div className={styles.cardTags}>
                  <Tag label={char.campaign} color="accent" size="sm" />
                </div>
              )}

              <div className={styles.cardActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Pencil size={14} />}
                  onClick={(e) => { e.stopPropagation(); navigate(`/character/${char.id}/edit`); }}
                  title="Edit"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Copy size={14} />}
                  onClick={(e) => { e.stopPropagation(); duplicateCharacter(char.id); }}
                  title="Duplicate"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${char.name}?`)) deleteCharacter(char.id);
                  }}
                  title="Delete"
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
