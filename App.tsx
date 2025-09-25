import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
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
import ToastProvider from './components/ToastProvider';
import { NotificationProvider } from './contexts/NotificationContext';
import AllChatsPage from './pages/AllChatsPage';
import UpdatePasswordPage from './pages/UpdatePasswordPage';

const AppContent: React.FC = () => {
  const { isPasswordRecovery } = useAuth();

  if (isPasswordRecovery) {
    return (
      <Routes>
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="*" element={<Navigate to="/update-password" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <UIProvider>
              <NotificationProvider>
                <MainLayout />
              </NotificationProvider>
            </UIProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/imoveis" replace />} />
        <Route path="imoveis" element={<ImoveisPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="matches/:matchId/chat" element={<ChatPage />} />
        <Route path="chats" element={<AllChatsPage />} />
        <Route path="parcerias" element={<ParceriasPage />} />
        <Route path="metricas" element={<MetricasPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider />
      <HashRouter>
        <AppContent />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;