import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { User, Corretor } from '../types';
import { supabase } from '../src/integrations/supabase/client';
import * as api from '../services/api';
import toast from 'react-hot-toast';
import { mapSupabaseError } from '../src/utils/supabaseErrors';

interface RegisterResult {
  needsConfirmation: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (corretorData: Omit<Corretor, 'ID_Corretor' | 'Email' | 'username'> & {Email: string, password: string, username: string}) => Promise<RegisterResult>;
  logout: () => void;
  updateProfile: (profileData: Partial<Omit<Corretor, 'ID_Corretor' | 'Email' | 'CRECI'>>, avatarFile?: File | null) => Promise<void>;
  isPasswordRecovery: boolean;
  updatePassword: (password: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  const fetchCorretorProfile = async (sessionUser: SupabaseUser): Promise<User> => {
    for (let i = 0; i < 6; i++) { // Retry up to 6 times (total of ~3 seconds)
      const { data: corretorData, error } = await supabase
        .from('corretores')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (corretorData) {
        const corretorInfo: Corretor = {
          ID_Corretor: corretorData.id,
          Nome: corretorData.nome,
          CRECI: corretorData.creci,
          Telefone: corretorData.telefone,
          Email: sessionUser.email!,
          Cidade: corretorData.cidade,
          Estado: corretorData.estado,
          username: corretorData.username,
          avatar_url: corretorData.avatar_url,
          whatsapp_notifications_enabled: corretorData.whatsapp_notifications_enabled,
        };
        return {
          id: sessionUser.id,
          email: sessionUser.email!,
          corretorInfo: corretorInfo,
        };
      }

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found
        console.error('Error fetching corretor profile:', error);
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(mapSupabaseError({ code: 'PGRST116' }));
  };

  useEffect(() => {
    setLoading(true);

    const handleSession = async (session: Session | null) => {
      try {
        if (session) {
          const fullUser = await fetchCorretorProfile(session.user);
          setUser(fullUser);
          setIsPasswordRecovery(false);
        } else {
          setUser(null);
          setIsPasswordRecovery(false);
        }
      } catch (e) {
        toast.error(mapSupabaseError(e));
        await supabase.auth.signOut();
        setUser(null);
      }
    };

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session).finally(() => {
        setLoading(false);
      });
    });

    // Listen for future changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setUser(null);
      } else {
        handleSession(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw new Error(mapSupabaseError(error));
  };

  const register = async (formData: Omit<Corretor, 'ID_Corretor' | 'Email' | 'username'> & {Email: string, password: string, username: string}): Promise<RegisterResult> => {
    const { password, Email, Nome, CRECI, Telefone, Cidade, Estado, username } = formData;
    const { data, error } = await supabase.auth.signUp({
      email: Email,
      password: password,
      options: {
        data: {
          nome: Nome,
          creci: CRECI,
          telefone: Telefone,
          cidade: Cidade,
          estado: Estado,
          username: username,
        },
      },
    });
    if (error) throw new Error(mapSupabaseError(error));
    const needsConfirmation = !data.session;
    return { needsConfirmation };
  };
  
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (profileData: Partial<Omit<Corretor, 'ID_Corretor' | 'Email' | 'CRECI'>>, avatarFile?: File | null) => {
    if (!user) throw new Error("User not authenticated");
    
    let avatarUrl: string | undefined = undefined;
    if (avatarFile) {
        avatarUrl = await api.uploadAvatar(user.id, avatarFile);
    }

    const fullProfileData = {
        ...profileData,
        avatar_url: avatarUrl,
    };

    await api.updateCorretor(user.id, fullProfileData);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        const updatedUser = await fetchCorretorProfile(session.user);
        setUser(updatedUser);
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(mapSupabaseError(error));
    setIsPasswordRecovery(false);
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(mapSupabaseError(error));
  };

  const deleteAccount = async () => {
    await api.deleteCurrentUserAccount();
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, isPasswordRecovery, updatePassword, updateUserPassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};