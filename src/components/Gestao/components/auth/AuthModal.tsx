import React, { useState } from 'react';
import { X, User as UserIcon, Lock, Mail, LogIn, UserPlus, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, login, logout, switchUser } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    login(email, name);
    onClose();
  };

  const handleQuickDemo = () => {
    switchUser('user-demo', 'Trader Pro', 'trader@academic.com');
    onClose();
  };

  return (
    <div
      id="modal-auth"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-[#121722] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-[#182030] border-b border-slate-700">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isRegister ? 'Criar Nova Conta' : 'Acessar Plataforma'}
              </h3>
              <p className="text-[11px] text-slate-400">Dados isolados por usuário</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {user && (
            <div className="p-3.5 bg-[#0b0e14] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">Usuário Conectado:</span>
                <span className="text-sm font-bold text-white">{user.name}</span>
                <span className="text-xs text-slate-500 block">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 hover:bg-rose-500 hover:text-white transition-colors"
              >
                Sair
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-orange-400" />
                  Nome Completo
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                E-mail
              </label>
              <input
                id="auth-email"
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                Senha
              </label>
              <input
                id="auth-password"
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              id="btn-auth-submit"
              className="w-full py-2.5 rounded-lg text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-950 transition-all flex items-center justify-center gap-2"
            >
              {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {isRegister ? 'Criar Conta' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              {isRegister ? 'Já possui uma conta? Faça Login' : 'Não tem conta? Crie uma agora'}
            </button>
          </div>

          <div className="border-t border-slate-800 pt-3">
            <button
              type="button"
              id="btn-quick-demo"
              onClick={handleQuickDemo}
              className="w-full py-2 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Entrar como Usuário Demo (Trader Pro)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
