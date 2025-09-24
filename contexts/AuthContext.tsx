
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Corretor } from '../types';
import * as api from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (corretorData: Omit<Corretor, 'ID_Corretor'> & {password: string}) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const storedUser = localStorage.getItem('fifty-fifty-user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load user from storage", error);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    // This is a mock login. In a real app, you'd call Firebase Auth.
    // We assume the Google Sheet has a corretor with the email 'ana.silva@email.com' for the default login to work.
    try {
        // We'll create a user object locally, but a real app would fetch this after getting a token.
        // For our backend to work, it needs to find a corretor with this email in the sheet.
        const corretorInfo: Corretor = { 
            ID_Corretor: 'c1', // This is a placeholder, real ID is looked up on the backend by email
            Nome: 'Corretor', 
            CRECI: '00000-F', 
            Telefone: '00000000000', 
            Email: email, 
            Cidade: 'Cidade'
        };

        const loggedUser: User = {
            id: 'firebase-user-id-mock', // Mock Firebase ID
            email: email,
            corretorInfo: corretorInfo,
        };
        setUser(loggedUser);
        localStorage.setItem('fifty-fifty-user', JSON.stringify(loggedUser));
    } catch (err) {
      console.error(err);
      throw new Error("Usuário não encontrado ou senha inválida.");
    } finally {
        setLoading(false);
    }
  };

  const register = async (formData: Omit<Corretor, 'ID_Corretor'> & {password: string}) => {
     setLoading(true);
     // In a real app, this would first call Firebase Auth to create a user.
     try {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...corretorData } = formData;
        const newCorretor = await api.register(corretorData);
        
        // After successful registration in our backend, automatically log the user in.
        const registeredUser: User = {
            id: `firebase-user-id-${newCorretor.ID_Corretor}`,
            email: newCorretor.Email,
            corretorInfo: newCorretor
        };
        setUser(registeredUser);
        localStorage.setItem('fifty-fifty-user', JSON.stringify(registeredUser));
     } catch (err) {
        console.error("Registration failed", err);
        throw new Error("Falha ao registrar. O email pode já estar em uso.");
     } finally {
        setLoading(false);
     }
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('fifty-fifty-user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
