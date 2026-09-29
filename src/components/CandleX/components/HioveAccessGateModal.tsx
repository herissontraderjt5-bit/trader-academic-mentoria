import React, { useState } from 'react';
import { X, Bot, CheckCircle2, AlertTriangle, Key, ExternalLink } from 'lucide-react';

interface HioveAccessGateModalProps {
  isOpen: boolean;
  onSuccess: (email: string) => void;
  onClose: () => void;
}

export const HioveAccessGateModal: React.FC<HioveAccessGateModalProps> = ({
  isOpen,
  onSuccess,
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Por favor, digite seu e-mail.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/hiove/access-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      if (!response.ok) {
        throw new Error('Não conseguimos validar agora, tente em alguns minutos.');
      }

      const data = await response.json();
      if (data.access === true) {
        onSuccess(email.trim().toLowerCase());
      } else {
        setError('SALDO INSUFICIENTE, REALIZE UM DEPÓSITO MÍNIMO PARA CONTINUAR USANDO A FERRAMENTA!');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-[#111118] border border-[#242433] rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-[#242433] relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
            <Key className="w-6 h-6 text-purple-400" />
          </div>
          <h2 className="text-xl font-black text-white">Acesso Restrito</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Para utilizar a Inteligência Artificial CandleX, você precisa ter uma conta ativa e com saldo na corretora Hiove.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
                E-mail cadastrado na Hiove
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seuemail@exemplo.com"
                className="w-full bg-[#171724] border border-[#272738] rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Fazer Login
                </>
              )}
            </button>
          </form>

          <div className="pt-6 border-t border-[#242433]">
            <p className="text-sm text-center text-zinc-400 mb-4">
              Ainda não tem conta ou não fez seu depósito?
            </p>
            <a
              href="https://hiove.io/gSBstV"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 bg-[#171724] hover:bg-[#1a1a24] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all border border-[#272738]"
            >
              <ExternalLink className="w-5 h-5 text-zinc-400" />
              Cadastrar na Hiove
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
