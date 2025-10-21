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
  const { generalNotifications, markAllNotificationsForMatchAsRead, clearAllNotifications } = useNotifications();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    if (!user) return;
    
    // Mark as read/viewed based on type
    if (notification.type === 'new_match') {
        notification.matchId && api.markMatchAsViewed(notification.matchId, user.id).catch(err => console.error("Falha ao marcar match como visto", err));
    } else if (notification.type === 'match_update') {
        notification.matchId && api.markMatchStatusChangeAsViewed(notification.matchId, user.id).catch(err => console.error("Falha ao marcar status do match como visto", err));
    } else if (notification.type === 'new_follower' && notification.followerId) {
        // Corrigido: followerId é quem seguiu, user.id é quem foi seguido (followingId)
        api.markFollowAsNotified(notification.followerId, user.id).catch(err => console.error("Falha ao marcar follow como notificado", err));
    }

    // Mark notification locally as read
    if (notification.matchId) {
        markAllNotificationsForMatchAsRead(notification.matchId);
    } else {
        // For follower notifications, we rely on the next fetch to remove it if marked as notified
        // For now, we just close the list and navigate.
    }

    navigate(notification.link);
    onClose();
  };

  const sortedNotifications = [...generalNotifications].sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-30">
      <div className="p-3 border-b flex justify-between items-center">
        <h3 className="font-semibold text-primary">Notificações</h3>
        {generalNotifications.length > 0 && (
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