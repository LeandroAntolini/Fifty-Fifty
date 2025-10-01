import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import { supabase } from '../src/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'new_match' | 'new_message' | 'reopen_request' | 'match_update';
  message: string;
  link: string;
  timestamp: string;
  isRead: boolean;
  matchId: string;
}

interface NotificationContextType {
  generalNotifications: Notification[];
  chatNotifications: Notification[];
  generalUnreadCount: number;
  chatUnreadCount: number;
  fetchNotifications: () => void;
  markAllNotificationsForMatchAsRead: (matchId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [generalNotifications, setGeneralNotifications] = useState<Notification[]>([]);
  const [chatNotifications, setChatNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setGeneralNotifications([]);
      setChatNotifications([]);
      return;
    }
    try {
      const [matchesData, chatsData] = await Promise.all([
        api.getAugmentedMatchesByCorretor(user.id),
        api.getActiveChatsByCorretor(user.id)
      ]);

      const newGeneralNotifs: Notification[] = [];
      const newChatNotifs: Notification[] = [];

      if (matchesData) {
        matchesData.forEach((match: any) => {
          const isImovelOwner = match.imovel_id_corretor === user.id;
          const isUnreadMatch = (isImovelOwner && !match.viewed_by_corretor_imovel) || (!isImovelOwner && !match.viewed_by_corretor_cliente);

          if (isUnreadMatch) {
            newGeneralNotifs.push({
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
            newChatNotifs.push({
              id: `reopen-${match.ID_Match}`,
              type: 'reopen_request',
              message: `${match.other_corretor_name} solicitou reabrir a conversa.`,
              link: `/matches/${match.ID_Match}/chat`,
              timestamp: match.Match_Timestamp, // Ideally, this would be an 'updated_at' timestamp
              isRead: false,
              matchId: match.ID_Match,
            });
          }

          const isOtherUserAction = match.status_change_requester_id && match.status_change_requester_id !== user.id;
          const isStatusChangeUnread = isImovelOwner ? !match.status_change_viewed_by_imovel : !match.status_change_viewed_by_cliente;

          if (isOtherUserAction && isStatusChangeUnread) {
              if (match.Status === 'convertido') {
                  newGeneralNotifs.push({
                      id: `converted-${match.ID_Match}`,
                      type: 'match_update',
                      message: `Sua parceria com ${match.other_corretor_name} foi concluída com sucesso!`,
                      link: `/parcerias`,
                      timestamp: new Date().toISOString(),
                      isRead: false,
                      matchId: match.ID_Match,
                  });
              } else if (match.Status === 'fechado') {
                  newGeneralNotifs.push({
                      id: `closed-${match.ID_Match}`,
                      type: 'match_update',
                      message: `O match com ${match.other_corretor_name} foi fechado.`,
                      link: `/matches`,
                      timestamp: new Date().toISOString(),
                      isRead: false,
                      matchId: match.ID_Match,
                  });
              }
          }
        });
      }

      if (chatsData) {
        chatsData.forEach((chat: any) => {
          if (chat.Unread_Count > 0) {
            newChatNotifs.push({
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
      
      setGeneralNotifications(newGeneralNotifs);
      setChatNotifications(newChatNotifs);

    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      const matchesChannel = supabase
        .channel(`notifications-matches-for-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'matches',
            filter: `or(id_corretor_imovel.eq.${user.id},id_corretor_cliente.eq.${user.id})`,
          },
          fetchNotifications
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'matches',
            filter: `or(id_corretor_imovel.eq.${user.id},id_corretor_cliente.eq.${user.id})`,
          },
          fetchNotifications
        )
        .subscribe();

      const messagesChannel = supabase
        .channel(`notifications-messages-for-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `to_corretor_id=eq.${user.id}`,
          },
          fetchNotifications
        )
        .subscribe();

      return () => {
        supabase.removeChannel(matchesChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, [user, fetchNotifications]);

  const markAllNotificationsForMatchAsRead = (matchId: string) => {
    setGeneralNotifications(prev => prev.map(n => (n.matchId === matchId ? { ...n, isRead: true } : n)));
    setChatNotifications(prev => prev.map(n => (n.matchId === matchId ? { ...n, isRead: true } : n)));
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    
    setGeneralNotifications([]);
    setChatNotifications([]);

    const unreadChatMatchIds = new Set<string>(chatNotifications.filter(n => !n.isRead).map(n => n.matchId));
    const unreadGeneralMatchIds = new Set<string>(generalNotifications.filter(n => !n.isRead).map(n => n.matchId));

    try {
      if (unreadChatMatchIds.size > 0) {
        await Promise.all(
          Array.from(unreadChatMatchIds).map(matchId =>
            api.markMessagesAsRead(matchId as string, user.id)
          )
        );
      }
      if (unreadGeneralMatchIds.size > 0) {
        await Promise.all(
          Array.from(unreadGeneralMatchIds).map(matchId =>
            api.markMatchAsViewed(matchId as string, user.id)
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    } finally {
      fetchNotifications();
    }
  };

  const generalUnreadCount = generalNotifications.filter(n => !n.isRead).length;
  const chatUnreadCount = chatNotifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ 
      generalNotifications, chatNotifications, 
      generalUnreadCount, chatUnreadCount, 
      fetchNotifications, markAllNotificationsForMatchAsRead, clearAllNotifications 
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};