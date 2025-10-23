import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import {
  LayoutDashboard,
  Home,
  Users,
  ThumbsUp,
  Handshake,
  ChevronLeft,
  User,
  BarChart2,
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import ChatNotificationBell from './ChatNotificationBell';

const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Início',
  '/imoveis': 'Meus Imóveis',
  '/clientes': 'Meus Clientes',
  '/matches': 'Matches',
  '/conexoes': 'Conexões',
  '/metricas': 'Ranking e Métricas',
  '/profile': 'Meu Perfil',
  '/chats': 'Conversas',
  '/profile/privacy-policy': 'Política de Privacidade',
  '/profile/terms-of-service': 'Termos de Serviço',
  '/profile/update-password': 'Atualizar Senha',
  '/search-corretor': 'Buscar Corretor',
};

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { isImovelModalOpen, isClienteModalOpen } = useUI();
  
  const isSpecificChatPage = /^\/matches\/.+\/chat$/.test(location.pathname);
  
  const profileSubPages = [
    '/profile/privacy-policy',
    '/profile/terms-of-service',
    '/profile/update-password',
  ];
  
  // Rotas que devem ter o botão de voltar, mas manter a barra inferior (se não for chat)
  const routesWithBackButtonButKeepNav = ['/search-corretor'];

  const hasBackButton = profileSubPages.includes(location.pathname) || isSpecificChatPage || routesWithBackButtonButKeepNav.includes(location.pathname);
  
  // A barra inferior só deve ser oculta se for uma subpágina de perfil ou a página de chat
  const hideBottomNav = profileSubPages.includes(location.pathname) || isSpecificChatPage;
  
  const getTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard' && user) {
      return `Olá, ${user.corretorInfo.Nome.split(' ')[0]}!`;
    }
    if (isSpecificChatPage) return "Chat da Parceria";
    return pageTitles[path] || 'Meu Perfil';
  };

  const handleProfileClick = () => {
    if (location.pathname === '/profile') {
      // Se estiver na página de perfil, navega para o dashboard (fecha a tela de perfil)
      navigate('/dashboard');
    } else {
      // Caso contrário, navega para a página de perfil
      navigate('/profile');
    }
  };

  const isModalOpen = isImovelModalOpen || isClienteModalOpen;

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-neutral-light">
      <header className="bg-white text-neutral-dark p-4 flex items-center justify-between shadow-md sticky top-0 z-20 border-b">
        <div className="flex-1 flex justify-start">
          {hasBackButton ? (
            <button onClick={() => navigate(-1)} className="text-neutral-dark p-1 -ml-1">
              <ChevronLeft size={28}/>
            </button>
          ) : (
            <button onClick={handleProfileClick} className="text-neutral-dark hover:text-gray-600">
              {user?.corretorInfo.avatar_url ? (
                <img src={user.corretorInfo.avatar_url} alt="Perfil" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <User />
              )}
            </button>
          )}
        </div>
        
        <h1 className="text-xl font-bold whitespace-nowrap px-2 text-center">{getTitle()}</h1>

        <div className="flex-1 flex justify-end items-center space-x-2">
            <NotificationBell />
            <ChatNotificationBell />
        </div>
      </header>
      
      <main className="flex-grow overflow-y-auto p-4 pb-14">
        <Outlet />
      </main>

      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-neutral-DEFAULT shadow-lg z-10">
          <div className="flex justify-around h-14">
            <NavLink to="/dashboard" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
              <LayoutDashboard />
              <span>Início</span>
            </NavLink>
            <NavLink to="/imoveis" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
              <Home />
              <span>Imóveis</span>
            </NavLink>
            <NavLink to="/clientes" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
              <Users />
              <span>Clientes</span>
            </NavLink>
            <NavLink to="/matches" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
              <ThumbsUp />
              <span>Matches</span>
            </NavLink>
            <NavLink to="/conexoes" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
              <Handshake />
              <span>Conexões</span>
            </NavLink>
            <NavLink to="/metricas" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'}`}>
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