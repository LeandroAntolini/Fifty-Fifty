import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';

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
      fetchNotifications();
      // Poll for new notifications periodically
      const interval = setInterval(fetchNotifications, 30000); // every 30 seconds
      return () => clearInterval(interval);
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