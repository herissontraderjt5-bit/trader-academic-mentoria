import React, { useState } from 'react';
import { X, ShieldCheck, Mail, ArrowRight, UserPlus, CheckCircle } from 'lucide-react';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGoogleAccount: (account: { name: string; email: string; avatar: string }) => void;
  defaultEmail?: string;
  defaultName?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSelectGoogleAccount,
  defaultEmail = 'viniciussestremmm@gmail.com',
  defaultName = 'Vinicius Sestrem'
}) => {
  if (!isOpen) return null;

  const [useCustom, setUseCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');

  const presetAccounts = [
    {
      name: defaultName,
      email: defaultEmail,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      badge: 'Admin / Criador'
    },
    {
      name: 'Carlos Henrique Silva',
      email: 'carlos.h.trader@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      badge: 'Aluno VIP'
    },
    {
      name: 'Mariana Prado',
      email: 'mariana.prado@outlook.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      badge: 'Membro'
    }
  ];

  const handleSelectPreset = (acc: { name: string; email: string; avatar: string }) => {
    onSelectGoogleAccount(acc);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    onSelectGoogleAccount({
      name: customName || customEmail.split('@')[0],
      email: customEmail,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customName || customEmail)}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#101017] text-white rounded-3xl shadow-2xl overflow-hidden font-sans border border-orange-500/30">
        
        {/* Header with Google Logo */}
        <div className="p-6 pb-4 border-b border-white/5 flex items-center justify-between bg-[#151520]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Escolha uma conta Google</h3>
              <p className="text-[11px] text-zinc-400">para acessar a Trader Academic</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {!useCustom ? (
            <>
              <p className="text-xs text-zinc-400">
                Selecione sua conta salva ou adicione um novo e-mail:
              </p>

              <div className="space-y-2">
                {presetAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    onClick={() => handleSelectPreset(acc)}
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/70 hover:bg-zinc-800/90 border border-white/5 hover:border-orange-500/40 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={acc.avatar}
                        alt={acc.name}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-orange-500/50 shrink-0"
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white group-hover:text-orange-400 transition-colors truncate">
                            {acc.name}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-600/20 text-orange-400 font-mono">
                            {acc.badge}
                          </span>
                        </div>
                        <span className="text-[11px] text-zinc-400 truncate block">
                          {acc.email}
                        </span>
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setUseCustom(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-xs font-bold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-orange-500" />
                  <span>Usar Outra Conta Google</span>
                </button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1.5">
                  Seu Nome
                </label>
                <input
                  type="text"
                  placeholder="Nome Completo"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1.5">
                  Email do Google
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white placeholder:text-zinc-600 text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUseCustom(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-900 text-zinc-300 text-xs font-bold"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider"
                >
                  Entrar com Google
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-black/40 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>Autenticação Criptografada</span>
          </span>
          <span>Google OAuth 2.0</span>
        </div>

      </div>
    </div>
  );
};
