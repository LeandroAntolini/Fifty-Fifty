import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UIProvider } from '../contexts/UIContext';
import ProtectedRoute from '../components/ProtectedRoute';
import PublicRoute from '../components/PublicRoute';
import MainLayout from './components/MainLayout';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ImoveisPage from './pages/ImoveisPage';
import ClientesPage from './pages/ClientesPage';
import MatchesPage from './pages/MatchesPage';
import ConexoesPage from './pages/ConexoesPage';
import ChatPage from './pages/ChatPage';
import MetricasPage from './pages/MetricasPage';
import ProfilePage from './pages/ProfilePage';
import ToastProvider from '../components/ToastProvider';
import { NotificationProvider } from '../contexts/NotificationContext';
import AllChatsPage from './pages/AllChatsPage';
import UpdatePasswordPage from '../pages/UpdatePasswordPage';
import UpdateProfilePasswordPage from '../pages/UpdateProfilePasswordPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ScrollToTop from '../components/ScrollToTop';
import SearchCorretorPage from './pages/SearchCorretorPage';
import PlatformStatsPage from './pages/PlatformStatsPage';

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
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="imoveis" element={<ImoveisPage />} />
        <Route path="clientes" element={<ClientesPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="matches/:matchId/chat" element={<ChatPage />} />
        <Route path="chats" element={<AllChatsPage />} />
        <Route path="conexoes" element={<ConexoesPage />} />
        <Route path="metricas" element={<MetricasPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="profile/update-password" element={<UpdateProfilePasswordPage />} />
        <Route path="profile/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="profile/terms-of-service" element={<TermsOfServicePage />} />
        <Route path="search-corretor" element={<SearchCorretorPage />} />
        <Route path="platform-stats" element={<PlatformStatsPage />} />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <ScrollToTop />
      <ToastProvider />
      <AppContent />
    </HashRouter>
  );
};

export default App;