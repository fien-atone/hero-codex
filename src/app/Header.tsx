import { useNavigate } from 'react-router-dom';
import { Swords, Sun, Moon, PanelLeftClose, PanelLeft, Download, Upload } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useUIStore } from '../stores/uiStore';
import { useCharacterStore } from '../stores/characterStore';
import { exportCharacters, importCharacters, downloadAsFile, readFileAsText } from '../utils/export-import';
import styles from './Header.module.css';

export function Header() {
  const navigate = useNavigate();
  const { theme, toggleTheme, sidebarOpen, toggleSidebar } = useUIStore();
  const { characters, importCharacters: storeImport } = useCharacterStore();

  const handleExport = () => {
    const json = exportCharacters(characters);
    downloadAsFile(json, `dnd-characters-${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await readFileAsText(file);
        const chars = importCharacters(text);
        storeImport(chars);
      } catch (err) {
        alert('Failed to import: ' + (err instanceof Error ? err.message : 'Invalid file'));
      }
    };
    input.click();
  };

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <Button
          variant="ghost"
          size="sm"
          icon={sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        />
        <div className={styles.logo} onClick={() => navigate('/')}>
          <Swords size={22} />
          <span className={styles.title}>D&D Character Manager</span>
        </div>
      </div>

      <div className={styles.right}>
        <Button variant="ghost" size="sm" icon={<Download size={16} />} onClick={handleExport} title="Export all" />
        <Button variant="ghost" size="sm" icon={<Upload size={16} />} onClick={handleImport} title="Import" />
        <Button
          variant="ghost"
          size="sm"
          icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        />
      </div>
    </header>
  );
}
