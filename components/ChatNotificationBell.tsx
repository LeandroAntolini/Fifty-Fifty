import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { MessageSquare } from 'lucide-react';
import ChatNotificationList from './ChatNotificationList';
import { useNavigate } from 'react-router-dom';

const ChatNotificationBell: React.FC = () => {
  const { chatUnreadCount } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const toggleOrNavigate = () => {
    if (chatUnreadCount > 0) {
      setIsOpen(prev => !prev);
    } else {
      navigate('/chats');
    }
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
      <button onClick={toggleOrNavigate} className="relative text-neutral-dark hover:text-gray-600 p-1">
        <MessageSquare />
        {chatUnreadCount > 0 && (
          <span className="absolute -top-1 -right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
            {chatUnreadCount}
          </span>
        )}
      </button>
      {isOpen && <ChatNotificationList onClose={() => setIsOpen(false)} />}
    </div>
  );
};

export default ChatNotificationBell;