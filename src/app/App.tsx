import { Routes, Route } from 'react-router-dom';
import { Layout } from './Layout';
import { Dashboard } from '../components/character-list/Dashboard';
import { CharacterSheet } from '../components/character-sheet/CharacterSheet';
import { CharacterCreator } from '../components/character-creator/CharacterCreator';
import { CharacterEditor } from '../components/character-editor/CharacterEditor';

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="character/:id" element={<CharacterSheet />} />
        <Route path="character/:id/edit" element={<CharacterEditor />} />
        <Route path="create" element={<CharacterCreator />} />
      </Route>
    </Routes>
  );
}
