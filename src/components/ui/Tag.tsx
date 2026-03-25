import { X } from 'lucide-react';
import styles from './Tag.module.css';

interface TagProps {
  label: string;
  color?: 'default' | 'accent' | 'gold' | 'success' | 'danger' | 'info';
  onRemove?: () => void;
  onClick?: () => void;
  active?: boolean;
  size?: 'sm' | 'md';
}

export function Tag({ label, color = 'default', onRemove, onClick, active, size = 'sm' }: TagProps) {
  const classes = [
    styles.tag,
    styles[color],
    styles[size],
    active && styles.active,
    onClick && styles.clickable,
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} onClick={onClick}>
      {label}
      {onRemove && (
        <button
          className={styles.remove}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
