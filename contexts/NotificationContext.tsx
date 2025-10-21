import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import { supabase } from '../src/integrations/supabase/client';

export interface Notification {
  id: string;
  type: 'new_match' | 'new_message' | 'reopen_request' | 'match_update' | 'new_follower';
  message: string;
  link: string;
  timestamp: string;
  isRead: boolean;
  matchId?: string; // Opcional, usado apenas para matches/chats
  followerId?: string; // Novo campo para seguidores
}

interface NotificationContextType {
  generalNotifications: Notification[];
  chatNotifications: Notification[];
  generalUnreadCount: number;
  chatUnreadCount: number;
  fetchNotifications: () => void;
  markAllNotificationsForMatchAsRead: (matchId: string) => void;
  markNotificationAsReadLocally: (notificationId: string) => void; // Nova função
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
      const [matchesData, chatsData, newFollowers] = await Promise.all([
        api.getAugmentedMatchesByCorretor(user.id),
        api.getActiveChatsByCorretor(user.id),
        api.getNewFollowers(user.id), // Buscar novos seguidores
      ]);

      const newGeneralNotifs: Notification[] = [];
      const newChatNotifs: Notification[] = [];

      // 1. Notificações de Novos Seguidores
      if (newFollowers) {
        newFollowers.forEach(follower => {
            newGeneralNotifs.push({
                id: `follower-${follower.follower_id}`,
                type: 'new_follower',
                message: `${follower.follower_name} começou a te seguir!`,
                link: `/conexoes?tab=seguidores`, // CORRIGIDO: Aponta para a aba correta
                timestamp: follower.created_at,
                isRead: false,
                followerId: follower.follower_id,
            });
        });
      }

      // 2. Notificações de Matches e Status
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
                      link: `/conexoes`,
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

      // 3. Notificações de Chat
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
        
      // Novo canal para notificações de seguidores
      const followersChannel = supabase
        .channel(`notifications-followers-for-${user.id}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'followers',
                filter: `following_id=eq.${user.id}`,
            },
            fetchNotifications
        )
        .subscribe();


      return () => {
        supabase.removeChannel(matchesChannel);
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(followersChannel);
      };
    }
  }, [user, fetchNotifications]);

  const markAllNotificationsForMatchAsRead = (matchId: string) => {
    setGeneralNotifications(prev => prev.map(n => (n.matchId === matchId ? { ...n, isRead: true } : n)));
    setChatNotifications(prev => prev.map(n => (n.matchId === matchId ? { ...n, isRead: true } : n)));
  };
  
  const markNotificationAsReadLocally = (notificationId: string) => {
    setGeneralNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n)));
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    
    // 1. Coletar IDs de itens não lidos
    const unreadChatMatchIds = new Set<string>(chatNotifications.filter(n => !n.isRead).map(n => n.matchId!));
    const unreadGeneralMatchIds = new Set<string>(generalNotifications.filter(n => !n.isRead && n.matchId).map(n => n.matchId!));
    const unreadFollowerIds = generalNotifications.filter(n => !n.isRead && n.type === 'new_follower' && n.followerId).map(n => n.followerId!);

    // 2. Limpar localmente (otimista)
    setGeneralNotifications([]);
    setChatNotifications([]);

    // 3. Marcar na API
    try {
      const apiCalls: Promise<void>[] = [];

      if (unreadChatMatchIds.size > 0) {
        [...unreadChatMatchIds].forEach(matchId =>
          apiCalls.push(api.markMessagesAsRead(matchId, user.id))
        );
      }
      if (unreadGeneralMatchIds.size > 0) {
        [...unreadGeneralMatchIds].forEach(matchId =>
          apiCalls.push(api.markMatchAsViewed(matchId, user.id))
        );
      }
      if (unreadFollowerIds.length > 0) {
        unreadFollowerIds.forEach(followerId =>
            apiCalls.push(api.markFollowAsNotified(followerId, user.id))
        );
      }
      
      await Promise.all(apiCalls);

    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    } finally {
      // 4. Refetch para garantir a sincronização
      fetchNotifications();
    }
  };

  const generalUnreadCount = generalNotifications.filter(n => !n.isRead).length;
  const chatUnreadCount = chatNotifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{ 
      generalNotifications, chatNotifications, 
      generalUnreadCount, chatUnreadCount, 
      fetchNotifications, markAllNotificationsForMatchAsRead, markNotificationAsReadLocally, clearAllNotifications 
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