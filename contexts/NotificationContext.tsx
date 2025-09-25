import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import { supabase } from '../src/integrations/supabase/client';

interface NotificationContextType {
  notificationCount: number;
  fetchNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotificationCount(0);
      return;
    }
    try {
      const [unreadMessages, newMatches] = await Promise.all([
        api.getUnreadMessagesCount(user.id),
        api.getNewMatchesCount(user.id)
      ]);
      setNotificationCount(unreadMessages + newMatches);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      setNotificationCount(0);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Fetch initial count
      fetchNotifications();

      // Listen for new messages or when messages are read/deleted
      const messagesChannel = supabase
        .channel(`messages-for-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'messages', filter: `to_corretor_id=eq.${user.id}` },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      // Listen for ANY changes (insert, update) to matches where the user is the property owner
      const matchesAsImovelOwnerChannel = supabase
        .channel(`matches-imovel-owner-for-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'matches', filter: `id_corretor_imovel=eq.${user.id}` },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      // Listen for ANY changes (insert, update) to matches where the user is the client owner
      const matchesAsClienteOwnerChannel = supabase
        .channel(`matches-cliente-owner-for-${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'matches', filter: `id_corretor_cliente=eq.${user.id}` },
          () => {
            fetchNotifications();
          }
        )
        .subscribe();

      // Clean up subscriptions on component unmount
      return () => {
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(matchesAsImovelOwnerChannel);
        supabase.removeChannel(matchesAsClienteOwnerChannel);
      };
    }
  }, [user, fetchNotifications]);

  return (
    <NotificationContext.Provider value={{ notificationCount, fetchNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};