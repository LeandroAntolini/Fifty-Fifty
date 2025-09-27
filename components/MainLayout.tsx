import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  LayoutDashboard,
  Home,
  Users,
  ThumbsUp,
  Handshake,
  ChevronLeft,
  User,
  MessageSquare,
  BarChart2,
} from 'lucide-react';

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Início',
  '/imoveis': 'Meus Imóveis',
  '/clientes': 'Meus Clientes',
  '/matches': 'Matches',
  '/parcerias': 'Parcerias',
  '/metricas': 'Ranking e Métricas',
  '/profile': 'Meu Perfil',
  '/chats': 'Conversas',
  '/profile/privacy-policy': 'Política de Privacidade',
  '/profile/terms-of-service': 'Termos de Serviço',
  '/profile/update-password': 'Atualizar Senha',
};

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { openImovelModal, openClienteModal, isImovelModalOpen, isClienteModalOpen } = useUI();
  const { notificationCount } = useNotifications();
  
  const isSpecificChatPage = /^\/matches\/.+\/chat$/.test(location.pathname);
  
  const profileSubPages = [
    '/profile/privacy-policy',
    '/profile/terms-of-service',
    '/profile/update-password',
  ];
  const hasBackButton = isSpecificChatPage || profileSubPages.includes(location.pathname);

  const showFabForImoveis = location.pathname === '/imoveis';
  const showFabForClientes = location.pathname === '/clientes';
  
  const getTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard' && user) {
      return `Olá, ${user.corretorInfo.Nome.split(' ')[0]}!`;
    }
    if (isSpecificChatPage) return "Chat da Parceria";
    return pageTitles[path] || 'Meu Perfil';
  };

  const handleFabClick = () => {
    if (showFabForImoveis) {
      openImovelModal();
    } else if (showFabForClientes) {
      openClienteModal();
    }
  };
  
  const handleProfileClick = () => {
    const isProfilePage = location.pathname.startsWith('/profile');
    if (isProfilePage) {
      navigate('/dashboard');
    } else {
      navigate('/profile');
    }
  };

  const handleChatClick = () => {
    if (location.pathname === '/chats' || isSpecificChatPage) {
      navigate('/dashboard');
    } else {
      navigate('/chats');
    }
  };

  const isModalOpen = isImovelModalOpen || isClienteModalOpen;
  const hideBottomNav = hasBackButton || location.pathname === '/chats';

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-neutral-light">
      <header className="bg-primary text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-10">
        <div className="flex-1 flex justify-start">
          {hasBackButton && (
            <button onClick={() => navigate(-1)} className="text-white p-1 -ml-1">
              <ChevronLeft size={28}/>
            </button>
          )}
        </div>
        
        <h1 className="text-xl font-bold whitespace-nowrap px-2 text-center">{getTitle()}</h1>

        <div className="flex-1 flex justify-end items-center space-x-2">
            <button onClick={handleChatClick} className="text-white hover:text-secondary p-1">
                <MessageSquare />
            </button>
            <button onClick={handleProfileClick} className="text-white hover:text-secondary">
              {user?.corretorInfo.avatar_url ? (
                <img src={user.corretorInfo.avatar_url} alt="Perfil" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <User />
              )}
            </button>
        </div>
      </header>
      
      <main className="flex-grow overflow-y-auto p-4 pb-20">
        <Outlet />
      </main>

      {(showFabForImoveis || showFabForClientes) && !isModalOpen && (
        <button
          onClick={handleFabClick}
          className="fixed bottom-20 right-4 bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl font-light z-20"
          aria-label={showFabForImoveis ? "Adicionar Imóvel" : "Adicionar Cliente"}
        >
          +
        </button>
      )}

      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-neutral-DEFAULT shadow-lg z-10">
          <div className="flex justify-around h-16">
            <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-sm font-medium ${isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'}`}>
              <LayoutDashboard />
              <span>Início</span>
            </NavLink>
            <NavLink to="/imoveis" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-sm font-medium ${isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'}`}>
              <Home />
              <span>Imóveis</span>
            </NavLink>
            <NavLink to="/clientes" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-sm font-medium ${isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'}`}>
              <Users />
              <span>Clientes</span>
            </NavLink>
            <NavLink to="/matches" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-sm font-medium ${isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'}`}>
              <div className="relative">
                <ThumbsUp />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </div>
              <span>Matches</span>
            </NavLink>
            <NavLink to="/parcerias" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-sm font-medium ${isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'}`}>
              <Handshake />
              <span>Parcerias</span>
            </NavLink>
            <NavLink to="/metricas" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-sm font-medium ${isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'}`}>
              <BarChart2 />
              <span>Ranking</span>
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
};

export default MainLayout;