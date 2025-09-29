import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import { supabase } from '../src/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'new_match' | 'new_message' | 'reopen_request';
  message: string;
  link: string;
  timestamp: string;
  isRead: boolean;
  matchId: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const [matchesData, chatsData] = await Promise.all([
        api.getAugmentedMatchesByCorretor(user.id),
        api.getActiveChatsByCorretor(user.id)
      ]);

      const newNotifications: Notification[] = [];

      // Process matches for "new_match" and "reopen_request"
      if (matchesData) {
        matchesData.forEach((match: any) => {
          const isImovelOwner = match.imovel_id_corretor === user.id;
          const isUnreadMatch = (isImovelOwner && !match.viewed_by_corretor_imovel) || (!isImovelOwner && !match.viewed_by_corretor_cliente);

          if (isUnreadMatch) {
            newNotifications.push({
              id: `match-${match.ID_Match}`,
              type: 'new_match',
              message: `Novo match para seu ${isImovelOwner ? 'imóvel' : 'cliente'} com ${match.other_corretor_name}.`,
              link: `/matches`,
              timestamp: match.Match_Timestamp,
              isRead: false,
              matchId: match.ID_Match,
            });
          }

          if (match.Status === 'reabertura_pendente' && match.status_change_requester_id !== user.id) {
            newNotifications.push({
              id: `reopen-${match.ID_Match}`,
              type: 'reopen_request',
              message: `${match.other_corretor_name} solicitou reabrir a conversa.`,
              link: `/matches/${match.ID_Match}/chat`,
              timestamp: match.Match_Timestamp, // Using match timestamp as a fallback
              isRead: false,
              matchId: match.ID_Match,
            });
          }
        });
      }

      // Process chats for "new_message"
      if (chatsData) {
        chatsData.forEach((chat: any) => {
          if (chat.Unread_Count > 0) {
            newNotifications.push({
              id: `chat-${chat.ID_Match}`,
              type: 'new_message',
              message: `Você tem ${chat.Unread_Count} nova(s) mensagem(ns) de ${chat.Other_Corretor_Name}.`,
              link: `/matches/${chat.ID_Match}/chat`,
              timestamp: chat.Last_Message_Timestamp,
              isRead: false,
              matchId: chat.ID_Match,
            });
          }
        });
      }
      
      setNotifications(prev => {
        const readNotifications = prev.filter(n => n.isRead);
        const newMerged = [...newNotifications];

        readNotifications.forEach(readNotif => {
            if (!newMerged.some(newNotif => newNotif.id === readNotif.id)) {
                newMerged.push(readNotif);
            }
        });
        return newMerged;
      });

    } catch (error) {
      console.error("Failed to fetch notifications", error);
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();

      const channel = supabase
        .channel(`notifications-for-${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, fetchNotifications)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchNotifications)
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchNotifications]);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markNotificationAsRead, clearAllNotifications }}>
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