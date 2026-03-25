import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/character-list/Sidebar';
import { Header } from './Header';
import { DiceRoller } from '../components/ui/DiceRoller';
import { useUIStore } from '../stores/uiStore';
import styles from './Layout.module.css';

export function Layout() {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);

  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.body}>
        {sidebarOpen && <Sidebar />}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      <DiceRoller />
    </div>
  );
}
