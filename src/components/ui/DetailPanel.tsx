import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import styles from './DetailPanel.module.css';

interface DetailPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badges?: Array<{ label: string; color?: string }>;
  children: ReactNode;
}

export function DetailPanel({ open, onClose, title, subtitle, badges, children }: DetailPanelProps) {
  if (!open) return null;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{title}</h3>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          {badges && badges.length > 0 && (
            <div className={styles.badges}>
              {badges.map((b, i) => (
                <span key={i} className={styles.badge} style={b.color ? { background: b.color } : undefined}>
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" icon={<X size={16} />} onClick={onClose} />
      </div>
      <div className={styles.body}>
        {children}
      </div>
    </div>
  );
}
