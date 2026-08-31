import React, { useState } from 'react';
import { X, User, LogIn, LogOut, Shield, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, loginAsDemo, loginWithEmail, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  if (!isOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      loginWithEmail(email.trim(), name.trim());
      onClose();
    }
  };

  return (
    <div
      id="modal-auth-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        id="modal-auth-container"
        className="w-full max-w-md bg-[#121722] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-[#0e131c]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Perfil do Trader
              </h3>
              <p className="text-[11px] text-slate-400">
                Sessão e identificação de conta
              </p>
            </div>
          </div>
          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#0b0e14] border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-lg font-black text-white shadow-md">
                    {user.name ? user.name[0].toUpperCase() : 'T'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{user.name}</h4>
                    <p className="text-xs text-slate-400">{user.email}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 mt-1">
                      <CheckCircle className="w-3 h-3" />
                      Conta Ativa & Sincronizada
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  id="btn-logout-auth"
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-rose-950/40 border border-rose-800 text-rose-300 hover:bg-rose-900 transition-all flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handleCustomLogin} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nome do Trader
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Trader Pro"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="trader@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  Entrar com Nome / E-mail
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-2 text-[10px] uppercase text-slate-500 font-semibold">
                  ou
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={() => {
                  loginAsDemo();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#182030] text-cyan-300 border border-cyan-800/40 hover:bg-cyan-950/40 transition-all flex items-center justify-center gap-1.5"
              >
                <Shield className="w-4 h-4 text-cyan-400" />
                Continuar com Usuário Demo Pro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
