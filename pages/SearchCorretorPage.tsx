import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as api from '../services/api';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Corretor } from '../types';
import { User as UserIcon, Search } from 'lucide-react';

const SearchCorretorPage: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Partial<Corretor>[]>([]);
    const [loading, setLoading] = useState(false);
    const [followedStatus, setFollowedStatus] = useState<{ [key: string]: boolean }>({});

    const handleSearch = useCallback(async (term: string) => {
        if (!user || term.length < 3) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const searchResults = await api.searchCorretoresByUsername(term, user.id);
            setResults(searchResults);

            // Check follow status for all results
            const followChecks = searchResults.map(c => 
                c.ID_Corretor ? api.isFollowing(user.id, c.ID_Corretor) : Promise.resolve(false)
            );
            const statuses = await Promise.all(followChecks);
            const newFollowedStatus: { [key: string]: boolean } = {};
            searchResults.forEach((c, index) => {
                if (c.ID_Corretor) {
                    newFollowedStatus[c.ID_Corretor] = statuses[index];
                }
            });
            setFollowedStatus(newFollowedStatus);

        } catch (error) {
            console.error("Failed to search corretores", error);
            toast.error("Falha ao buscar corretores.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // Debounce search input
        const handler = setTimeout(() => {
            handleSearch(searchTerm);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, handleSearch]);

    const handleFollowToggle = async (corretor: Partial<Corretor>) => {
        if (!user || !corretor.ID_Corretor) return;
        
        const isCurrentlyFollowing = followedStatus[corretor.ID_Corretor];
        
        // Optimistic update
        setFollowedStatus(prev => ({ ...prev, [corretor.ID_Corretor!]: !isCurrentlyFollowing }));

        try {
            if (isCurrentlyFollowing) {
                await api.unfollowCorretor(user.id, corretor.ID_Corretor);
                toast.success(`Você deixou de seguir @${corretor.username}.`);
            } else {
                await api.followCorretor(user.id, corretor.ID_Corretor);
                toast.success(`Você está seguindo @${corretor.username}!`);
            }
        } catch (error) {
            toast.error("Ocorreu um erro ao atualizar o status de seguir.");
            // Revert optimistic update on failure
            setFollowedStatus(prev => ({ ...prev, [corretor.ID_Corretor!]: isCurrentlyFollowing }));
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2 bg-white p-3 rounded-lg shadow">
                <Search size={20} className="text-gray-500 flex-shrink-0" />
                <Input
                    type="text"
                    placeholder="Buscar corretor por @nome_de_usuario"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-none focus-visible:ring-0 h-8 p-0"
                />
            </div>

            {loading && <div className="flex justify-center"><Spinner /></div>}

            {!loading && searchTerm.length < 3 && searchTerm.length > 0 && (
                <p className="text-center text-sm text-gray-500">Digite pelo menos 3 caracteres para buscar.</p>
            )}

            {!loading && searchTerm.length >= 3 && results.length === 0 && (
                <p className="text-center text-sm text-gray-500">Nenhum corretor encontrado com este nome de usuário.</p>
            )}

            <div className="space-y-2">
                {results.map(corretor => (
                    <div key={corretor.ID_Corretor} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            {corretor.avatar_url ? (
                                <img src={corretor.avatar_url} alt={corretor.Nome} className="w-12 h-12 rounded-full object-cover" />
                            ) : (
                                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-gray-500" />
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-primary">{corretor.Nome}</p>
                                <p className="text-sm text-gray-500">@{corretor.username}</p>
                                <p className="text-xs text-muted-foreground">{corretor.Cidade} - {corretor.Estado}</p>
                            </div>
                        </div>
                        <Button 
                            size="sm" 
                            variant={followedStatus[corretor.ID_Corretor!] ? 'outline' : 'default'} 
                            onClick={() => handleFollowToggle(corretor)}
                            disabled={loading}
                        >
                            {followedStatus[corretor.ID_Corretor!] ? 'Seguindo' : 'Seguir'}
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SearchCorretorPage;