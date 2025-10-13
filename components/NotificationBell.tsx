import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { Bell } from 'lucide-react';
import NotificationList from './NotificationList';

const NotificationBell: React.FC = () => {
  const { generalUnreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const toggleNotifications = () => {
    setIsOpen(prev => !prev);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button onClick={toggleNotifications} className="relative text-neutral-dark hover:text-gray-600 p-1">
        <Bell />
        {generalUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            {generalUnreadCount}
          </span>
        )}
      </button>
      {isOpen && <NotificationList onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default NotificationBell;