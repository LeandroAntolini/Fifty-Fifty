import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ImoveisPage from './pages/ImoveisPage';
import ClientesPage from './pages/ClientesPage';
import MatchesPage from './pages/MatchesPage';
import ParceriasPage from './pages/ParceriasPage';
import ChatPage from './pages/ChatPage';
import MetricasPage from './pages/MetricasPage';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <UIProvider>
                  <MainLayout />
                </UIProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/imoveis" replace />} />
            <Route path="imoveis" element={<ImoveisPage />} />
            <Route path="clientes" element={<ClientesPage />} />
            <Route path="matches" element={<MatchesPage />} />
            <Route path="matches/:matchId/chat" element={<ChatPage />} />
            <Route path="parcerias" element={<ParceriasPage />} />
            <Route path="metricas" element={<MetricasPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;