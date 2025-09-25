import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUI } from '../contexts/UIContext';
import { useNotifications } from '../contexts/NotificationContext';

// Inline SVGs for icons
const LayoutDashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const ThumbsUpIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a2 2 0 0 1 3 1.88z"/></svg>;
const ParceriasIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>;
const LogOutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const ProfileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="10" r="3"></circle><path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662"></path></svg>;
const MessageSquareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;


const pageTitles: { [key: string]: string } = {
  '/dashboard': 'Dashboard',
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
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { openImovelModal, openClienteModal, isImovelModalOpen, isClienteModalOpen } = useUI();
  const { notificationCount } = useNotifications();
  
  const isSpecificChatPage = /^\/matches\/.+\/chat$/.test(location.pathname);
  
  const hasBackButton = isSpecificChatPage || 
                        location.pathname === '/chats' ||
                        location.pathname === '/profile/privacy-policy' ||
                        location.pathname === '/profile/terms-of-service' ||
                        location.pathname === '/profile/update-password';

  const showFabForImoveis = location.pathname === '/imoveis';
  const showFabForClientes = location.pathname === '/clientes';
  
  const getTitle = () => {
    if (isSpecificChatPage) return "Chat da Parceria";
    const path = location.pathname;
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
    if (location.pathname === '/profile') {
      navigate(-1); // Go back
    } else {
      navigate('/profile');
    }
  };
  
  const isModalOpen = isImovelModalOpen || isClienteModalOpen;
  const hideBottomNav = hasBackButton;

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-neutral-light">
      <header className="bg-primary text-white p-4 flex items-center justify-between shadow-md sticky top-0 z-10">
        {hasBackButton ? (
          <button onClick={() => navigate(-1)} className="text-white p-1">
            <ChevronLeftIcon/>
          </button>
        ) : (
          <button onClick={handleProfileClick} className="text-white hover:text-secondary">
            {user?.corretorInfo.avatar_url ? (
              <img src={user.corretorInfo.avatar_url} alt="Perfil" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <ProfileIcon />
            )}
          </button>
        )}
        <h1 className="text-xl font-bold">{getTitle()}</h1>
        <div className="flex items-center space-x-2">
            <button onClick={() => navigate('/chats')} className="text-white hover:text-secondary p-1">
                <MessageSquareIcon />
            </button>
            <button onClick={logout} className="text-white hover:text-secondary p-1">
              <LogOutIcon/>
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
              <LayoutDashboardIcon />
              <span>Dashboard</span>
            </NavLink>
            <NavLink to="/imoveis" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-sm font-medium ${isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'}`}>
              <HomeIcon />
              <span>Imóveis</span>
            </NavLink>
            <NavLink to="/clientes" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-sm font-medium ${isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'}`}>
              <UserIcon />
              <span>Clientes</span>
            </NavLink>
            <NavLink to="/matches" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-sm font-medium ${isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'}`}>
              <div className="relative">
                <ThumbsUpIcon />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-2.5 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </div>
              <span>Matches</span>
            </NavLink>
            <NavLink to="/parcerias" className={({ isActive }) => `flex flex-col items-center justify-center w-full text-sm font-medium ${isActive ? 'text-primary' : 'text-neutral-dark hover:text-primary'}`}>
              <ParceriasIcon />
              <span>Parcerias</span>
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
};

export default MainLayout;