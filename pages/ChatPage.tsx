import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Message, Match, MatchStatus } from '../types';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { supabase } from '../src/integrations/supabase/client';
import { useNotifications } from '../contexts/NotificationContext';
import { Send } from 'lucide-react';

const ChatPage: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [matchDetails, setMatchDetails] = useState<Match | null>(null);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { fetchNotifications } = useNotifications();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const fetchChatData = useCallback(async () => {
    if (!matchId || !user) return;
    try {
      // Mark the match as viewed and messages as read
      await api.markMatchAsViewed(matchId, user.id);
      await api.markMessagesAsRead(matchId, user.id);
      fetchNotifications(); // Refresh notification count immediately

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

  // Real-time subscriptions
  useEffect(() => {
    if (!matchId || !user) return;

    const messagesChannel = supabase
      .channel(`chat-messages:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `id_match=eq.${matchId}` },
        async (payload) => {
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

          if (newMessage.to_corretor_id === user.id) {
            await api.markMessagesAsRead(matchId, user.id);
            fetchNotifications();
          }
        }
      )
      .subscribe();

    const matchChannel = supabase
      .channel(`match-status:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
        (payload) => {
          const updatedMatch = payload.new as any;
          setMatchDetails(prev => prev ? { ...prev, Status: updatedMatch.status } : null);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(matchChannel);
    };
  }, [matchId, user, fetchNotifications]);

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
        const sentMessage = await api.sendMessage(messageData);
        setMessages(prevMessages => [...prevMessages, sentMessage]);
    } catch (error) {
        console.error("Failed to send message", error);
        toast.error("Falha ao enviar mensagem.");
        setNewMessage(messageData.Message_Text);
    }
  };

  const handleConfirmConclusao = async () => {
    if (!matchDetails) return;
    setIsSubmitting(true);
    try {
      await api.createParceriaFromMatch(matchDetails);
      toast.success("Parabéns! Parceria concluída com sucesso.");
      setMatchDetails(prev => prev ? { ...prev, Status: MatchStatus.Convertido } : null);
      fetchNotifications();
    } catch (error) {
      toast.error("Ocorreu um erro ao concluir a parceria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmFechamento = async () => {
    if (!matchId) return;
    setIsSubmitting(true);
    try {
      await api.closeMatch(matchId);
      toast.success("Match fechado com sucesso.");
      setMatchDetails(prev => prev ? { ...prev, Status: MatchStatus.Fechado } : null);
      fetchNotifications();
    } catch (error) {
      toast.error("Ocorreu um erro ao fechar o match.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopenMatch = async () => {
    if (!matchId) return;
    setIsSubmitting(true);
    try {
        await api.reopenMatch(matchId);
        toast.success("Match reaberto com sucesso!");
        setMatchDetails(prev => prev ? { ...prev, Status: MatchStatus.Aberto } : null);
        fetchNotifications();
    } catch (error) {
        toast.error("Falha ao reabrir o match.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const renderActionUI = () => {
    if (!matchDetails || !user) return null;

    switch (matchDetails.Status) {
      case MatchStatus.Aberto:
        return (
          <div className="p-4 border-b bg-white space-y-2">
            <Button onClick={handleConfirmConclusao} disabled={isSubmitting} className="w-full bg-accent hover:bg-green-700">
              {isSubmitting ? 'Concluindo...' : 'Concluir Parceria'}
            </Button>
            <Button onClick={handleConfirmFechamento} disabled={isSubmitting} variant="destructive" className="w-full">
              {isSubmitting ? 'Fechando...' : 'Fechar Match (Sem Parceria)'}
            </Button>
          </div>
        );

      case MatchStatus.Convertido:
        return (
          <div className="p-4 bg-green-100 text-center space-y-2">
            <p className="text-green-800 font-semibold">Parceria concluída com sucesso!</p>
            <Button onClick={handleReopenMatch} disabled={isSubmitting} variant="outline" className="w-full bg-white">
                {isSubmitting ? 'Reabrindo...' : 'Retornar Tratativa'}
            </Button>
            <Link to="/parcerias">
              <Button variant="link" className="text-green-800">
                Ver na lista de Parcerias
              </Button>
            </Link>
          </div>
        );
      
      case MatchStatus.Fechado:
        return (
            <div className="p-4 bg-gray-100 text-center space-y-2">
                <p className="text-gray-600 font-semibold">Match fechado.</p>
                <Button onClick={handleReopenMatch} disabled={isSubmitting} variant="outline" className="w-full bg-white">
                    {isSubmitting ? 'Reabrindo...' : 'Retornar Tratativa'}
                </Button>
            </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="flex justify-center mt-8"><Spinner /></div>;
  }
  
  return (
    <div className="flex flex-col h-full bg-neutral-light">
      {renderActionUI()}
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
            disabled={matchDetails?.Status !== MatchStatus.Aberto}
          />
          <button type="submit" className="bg-primary text-white rounded-full p-3 flex-shrink-0 disabled:bg-gray-400" disabled={matchDetails?.Status !== MatchStatus.Aberto}>
             <Send className="h-6 w-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;