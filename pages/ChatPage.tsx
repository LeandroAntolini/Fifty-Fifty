import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Message, Match, MatchStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { supabase } from '../src/integrations/supabase/client';
import { useNotifications } from '../contexts/NotificationContext';

const ChatPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [matchDetails, setMatchDetails] = useState<Match | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isConcluding, setIsConcluding] = useState(false);
  const { fetchNotifications } = useNotifications();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchChatData = useCallback(async () => {
    if (!matchId || !user) return;
    setLoading(true);
    try {
      await api.markMessagesAsRead(matchId, user.id);
      fetchNotifications();

      const [msgs, match] = await Promise.all([
        api.getMessagesByMatch(matchId),
        api.getMatchById(matchId)
      ]);
      setMessages(msgs);
      setMatchDetails(match || null);
    } catch (error) {
      console.error("Failed to fetch chat data", error);
      toast.error("Não foi possível carregar o chat.");
    } finally {
      setLoading(false);
    }
  }, [matchId, user, fetchNotifications]);

  useEffect(() => {
    fetchChatData();
  }, [fetchChatData]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `id_match=eq.${matchId}` },
        (payload) => {
          const newMessage = payload.new as any;
          const formattedMessage: Message = {
            ID_Message: newMessage.id,
            ID_Match: newMessage.id_match,
            ID_Parceria: null,
            From_Corretor_ID: newMessage.from_corretor_id,
            To_Corretor_ID: newMessage.to_corretor_id,
            Timestamp: newMessage.created_at,
            Message_Text: newMessage.message_text,
            Read_Status: newMessage.read_status,
          };
          setMessages((prevMessages) => {
            if (prevMessages.some(msg => msg.ID_Message === formattedMessage.ID_Message)) {
              return prevMessages;
            }
            return [...prevMessages, formattedMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !matchId || !matchDetails) return;

    const toCorretorId = user.corretorInfo.ID_Corretor === matchDetails.Corretor_A_ID
      ? matchDetails.Corretor_B_ID
      : matchDetails.Corretor_A_ID;

    const messageData = {
      ID_Match: matchId,
      ID_Parceria: null,
      From_Corretor_ID: user.corretorInfo.ID_Corretor,
      To_Corretor_ID: toCorretorId,
      Message_Text: newMessage,
    };
    
    setNewMessage('');

    try {
        await api.sendMessage(messageData);
        fetchNotifications();
    } catch (error) {
        console.error("Failed to send message", error);
        toast.error("Falha ao enviar mensagem.");
        // Re-set the message in the input if sending fails
        setNewMessage(messageData.Message_Text);
    }
  };

  const handleConcluirParceria = async () => {
    if (!matchDetails) return;
    const confirmation = window.confirm("Tem certeza que deseja marcar esta conversa como uma parceria concluída? Esta ação não pode ser desfeita.");
    if (confirmation) {
        setIsConcluding(true);
        try {
            await api.createParceriaFromMatch(matchDetails);
            setMatchDetails(prev => prev ? { ...prev, Status: MatchStatus.Convertido } : null);
            toast.success("Parabéns! Parceria concluída com sucesso.");
        } catch (error) {
            console.error("Failed to conclude parceria", error);
            toast.error("Ocorreu um erro ao concluir a parceria.");
        } finally {
            setIsConcluding(false);
        }
    }
  };

  if (loading) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }
  
  return (
    <div className="flex flex-col h-full bg-neutral-light">
      {matchDetails && matchDetails.Status === MatchStatus.Aberto && (
        <div className="p-4 border-b bg-white">
            <Button 
                onClick={handleConcluirParceria}
                disabled={isConcluding}
                className="w-full bg-accent hover:bg-green-700"
            >
                {isConcluding ? 'Concluindo...' : 'Marcar como Parceria Concluída'}
            </Button>
        </div>
      )}
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
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;