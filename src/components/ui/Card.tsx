import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  active?: boolean;
}

export function Card({ children, padding = 'md', hover, active, className, ...props }: CardProps) {
  const classes = [
    styles.card,
    styles[`pad-${padding}`],
    hover && styles.hover,
    active && styles.active,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}
