import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import * as api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Button } from './ui/Button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationListProps {
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const { notifications, markNotificationAsRead, clearAllNotifications, fetchNotifications } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNotificationClick = async (notification: Notification) => {
    if (!user) return;

    // Mark both the match as viewed and messages as read to clear all related notifications
    await api.markMatchAsViewed(notification.matchId, user.id);
    await api.markMessagesAsRead(notification.matchId, user.id);
    
    // Mark notification as read in the local state to update UI immediately
    markNotificationAsRead(notification.id);
    
    // Refetch notifications to ensure state is in sync with backend
    fetchNotifications();

    // Navigate and close the list
    navigate(notification.link);
    onClose();
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-30">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="font-semibold text-primary">Notificações</h3>
        {notifications.length > 0 && (
          <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={clearAllNotifications}>
            Limpar tudo
          </Button>
        )}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {sortedNotifications.length === 0 ? (
          <p className="text-center text-sm text-gray-500 p-4">Nenhuma notificação nova.</p>
        ) : (
          <ul className="divide-y">
            {sortedNotifications.map(notification => (
              <li
                key={notification.id}
                className={`p-3 hover:bg-gray-50 cursor-pointer ${notification.isRead ? 'opacity-60' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <p className="text-sm text-neutral-dark">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true, locale: ptBR })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationList;