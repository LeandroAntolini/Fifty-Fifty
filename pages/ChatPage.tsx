import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Message, Match, ReadStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';

const ChatPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [matchDetails, setMatchDetails] = useState<Match | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchChatData = useCallback(async () => {
    if (!matchId || !user) return;
    setLoading(true);
    try {
      const [msgs, match] = await Promise.all([
        api.getMessagesByMatch(matchId),
        api.getMatchById(matchId)
      ]);
      setMessages(msgs);
      setMatchDetails(match || null);
    } catch (error) {
      console.error("Failed to fetch chat data", error);
      alert("Não foi possível carregar o chat.");
    } finally {
      setLoading(false);
    }
  }, [matchId, user]);

  useEffect(() => {
    fetchChatData();
  }, [fetchChatData]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !matchId || !matchDetails) return;

    const toCorretorId = user.corretorInfo.ID_Corretor === matchDetails.Corretor_A_ID
      ? matchDetails.Corretor_B_ID
      : matchDetails.Corretor_A_ID;

    // FIX: Added From_Corretor_ID to the message data object.
    const messageData = {
      ID_Match: matchId,
      ID_Parceria: null,
      From_Corretor_ID: user.corretorInfo.ID_Corretor,
      To_Corretor_ID: toCorretorId,
      Message_Text: newMessage,
    };
    
    // Optimistically update UI
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage: Message = {
        ...messageData,
        ID_Message: tempId,
        From_Corretor_ID: user.corretorInfo.ID_Corretor,
        Timestamp: new Date().toISOString(),
        Read_Status: ReadStatus.NaoLido,
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    try {
        const sentMessage = await api.sendMessage(messageData);
        // Replace optimistic message with real one from server
        setMessages(prev => prev.map(msg => msg.ID_Message === tempId ? sentMessage : msg));
    } catch (error) {
        console.error("Failed to send message", error);
        alert("Falha ao enviar mensagem.");
        // Revert optimistic update
        setMessages(prev => prev.filter(msg => msg.ID_Message !== tempId));
    }
  };

  if (loading) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }
  
  return (
    <div className="flex flex-col h-full bg-neutral-light">
      <div className="flex-grow p-4 space-y-4 overflow-y-auto">
        {messages.map(msg => (
          <div key={msg.ID_Message} className={`flex ${msg.From_Corretor_ID === user?.corretorInfo.ID_Corretor ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.From_Corretor_ID === user?.corretorInfo.ID_Corretor ? 'bg-primary text-white' : 'bg-white text-neutral-dark'}`}>
              <p>{msg.Message_Text}</p>
              <p className="text-xs text-right mt-1 opacity-75">{new Date(msg.Timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-grow p-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-primary-focus"
          />
          <button type="submit" className="bg-primary text-white rounded-full p-3 flex-shrink-0">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;