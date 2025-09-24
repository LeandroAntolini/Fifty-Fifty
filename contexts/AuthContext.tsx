import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Corretor } from '../types';
import { supabase } from '../src/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (corretorData: Omit<Corretor, 'ID_Corretor' | 'Email'> & {Email: string, password: string}) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const { data: corretorData, error } = await supabase
          .from('corretores')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (corretorData) {
          const corretorInfo: Corretor = {
            ID_Corretor: corretorData.id,
            Nome: corretorData.nome,
            CRECI: corretorData.creci,
            Telefone: corretorData.telefone,
            Email: session.user.email!,
            Cidade: corretorData.cidade,
          };

          setUser({
            id: session.user.id,
            email: session.user.email!,
            corretorInfo: corretorInfo,
          });
        } else if (error) {
          console.error('Error fetching corretor profile:', error);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const checkSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
        }
    };
    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const register = async (formData: Omit<Corretor, 'ID_Corretor' | 'Email'> & {Email: string, password: string}) => {
    const { password, Email, Nome, CRECI, Telefone, Cidade } = formData;
    const { error } = await supabase.auth.signUp({
      email: Email,
      password: password,
      options: {
        data: {
          nome: Nome,
          creci: CRECI,
          telefone: Telefone,
          cidade: Cidade,
        },
      },
    });
    if (error) throw error;
  };
  
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};