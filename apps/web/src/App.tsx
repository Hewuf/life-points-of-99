import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import YearDetailPage from './pages/YearDetailPage/YearDetailPage';
import LoginPage from './pages/LoginPage/LoginPage';
import { useThemeBootstrap } from './hooks/useTheme';

export default function App() {
  useThemeBootstrap();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/year/:year" element={<YearDetailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
