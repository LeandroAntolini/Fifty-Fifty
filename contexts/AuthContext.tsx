import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { User, Corretor } from '../types';
import { supabase } from '../src/integrations/supabase/client';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (corretorData: Omit<Corretor, 'ID_Corretor' | 'Email'> & {Email: string, password: string}) => Promise<void>;
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

  const fetchCorretorProfile = async (sessionUser: SupabaseUser): Promise<User | null> => {
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
        avatar_url: corretorData.avatar_url,
      };
      const fullUser = {
        id: sessionUser.id,
        email: sessionUser.email!,
        corretorInfo: corretorInfo,
      };
      setUser(fullUser);
      return fullUser;
    } else if (error) {
      console.error('Error fetching corretor profile:', error);
    }
    return null;
  }

  useEffect(() => {
    setLoading(true);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setUser(null);
      } else if (session) {
        await fetchCorretorProfile(session.user);
        setIsPasswordRecovery(false);
      } else {
        setUser(null);
        setIsPasswordRecovery(false);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const register = async (formData: Omit<Corretor, 'ID_Corretor' | 'Email'> & {Email: string, password: string}) => {
    const { password, Email, Nome, CRECI, Telefone, Cidade, Estado } = formData;
    const { error } = await supabase.auth.signUp({
      email: Email,
      password: password,
      options: {
        data: {
          nome: Nome,
          creci: CRECI,
          telefone: Telefone,
          cidade: Cidade,
          estado: Estado,
        },
      },
    });
    if (error) throw error;
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
        await fetchCorretorProfile(session.user);
    }
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setIsPasswordRecovery(false);
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateUserPassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
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