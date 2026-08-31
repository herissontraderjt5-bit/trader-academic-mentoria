import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, name?: string) => void;
  logout: () => void;
  switchUser: (userId: string, name: string, email: string) => void;
}

const DEMO_USER: User = {
  id: 'user-demo',
  name: 'Trader Pro',
  email: 'trader@academic.com',
  createdAt: '2026-01-01T00:00:00Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('trader_academic_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEMO_USER;
      }
    }
    return DEMO_USER;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('trader_academic_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('trader_academic_user');
    }
  }, [user]);

  const login = (email: string, name?: string) => {
    const id = `user-${email.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    const newUser: User = {
      id,
      name: name || email.split('@')[0] || 'Trader',
      email,
      createdAt: new Date().toISOString(),
    };
    setUser(newUser);
  };

  const logout = () => {
    setUser(null);
  };

  const switchUser = (userId: string, name: string, email: string) => {
    setUser({
      id: userId,
      name,
      email,
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        switchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
