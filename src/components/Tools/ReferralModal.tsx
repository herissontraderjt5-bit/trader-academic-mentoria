import React, { useState } from 'react';
import { X, Copy, Check, DollarSign, Users, Award, Landmark, RefreshCw } from 'lucide-react';
import { User, PlatformSettings, WithdrawalRequest } from '../../types';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  allUsers: User[];
  settings: PlatformSettings;
  requests: WithdrawalRequest[];
  onCreateRequest: (amount: number, pixKeyType: string, pixKey: string, fullName: string, cpf: string) => Promise<boolean>;
  onRefresh?: () => Promise<void>;
}

export const ReferralModal: React.FC<ReferralModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  settings,
  requests,
  onCreateRequest,
  onRefresh,
}) => {
  const [copied, setCopied] = useState(false);
  const [pixType, setPixType] = useState('CPF');
  const [pixKey, setPixKey] = useState('');
  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [amount, setAmount] = useState<number>(currentUser.referralBalance || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync state whenever the modal opens or balance updates
  React.useEffect(() => {
    if (isOpen) {
      setAmount(currentUser.referralBalance || 0);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, currentUser.referralBalance]);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isOpen) return null;

  const referralLink = `${window.location.origin}/?ref=${currentUser.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculations
  const myReferrals = allUsers.filter(u => u.referredById === currentUser.id);
  const totalReferred = myReferrals.length;
  const activeReferred = myReferrals.filter(u => u.tier !== 'Free' && u.status === 'Ativo').length;
  
  const myRequests = requests.filter(r => r.userId === currentUser.id);
  const minWithdrawal = settings.minWithdrawalAmount ?? 50.00;
  const currentBalance = currentUser.referralBalance || 0;
  const canWithdraw = currentBalance >= minWithdrawal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!pixKey.trim() || !fullName.trim() || !cpf.trim()) {
      setErrorMsg('Por favor, preencha todos os campos do formulário.');
      return;
    }

    if (amount < minWithdrawal) {
      setErrorMsg(`O valor mínimo para saque é de R$ ${minWithdrawal.toFixed(2)}.`);
      return;
    }

    if (amount > currentBalance) {
      setErrorMsg('Você não possui saldo suficiente para esta solicitação.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onCreateRequest(amount, pixType, pixKey, fullName, cpf);
      if (ok) {
        setSuccessMsg('Solicitação de saque enviada com sucesso! O administrador analisará em breve.');
        setPixKey('');
        setFullName('');
        setCpf('');
        setAmount(0);
      } else {
        setErrorMsg('Erro ao registrar solicitação. Tente novamente mais tarde.');
      }
    } catch (e) {
      setErrorMsg('Erro interno no servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#12121a] border border-orange-900/30 rounded-2xl w-full max-w-3xl shadow-2xl relative flex flex-col my-8 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-500/30 flex items-center justify-center">
              <Award className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white uppercase">
                Indique e Ganhe
              </h2>
              <p className="text-xs text-zinc-400">
                Compartilhe seu link, indique novos alunos e ganhe comissões recorrentes.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-[#222230] text-zinc-400 hover:text-white border border-white/5 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center"
                title="Atualizar Saldo"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#222230] text-zinc-400 hover:text-white border border-white/5 transition-colors cursor-pointer flex items-center justify-center"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Referral Link Box */}
          <div className="p-5 rounded-2xl bg-orange-950/10 border border-orange-500/20 space-y-3">
            <h3 className="text-xs font-black uppercase text-orange-400 tracking-wider">
              Seu Link de Indicação Único
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-xs text-zinc-300 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-5 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-orange-600/20"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#1b1b26] border border-white/5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <Landmark className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-zinc-400 font-bold">Total Indicados</span>
              </div>
              <p className="text-2xl font-black text-white">{totalReferred}</p>
              <p className="text-[10px] text-zinc-500 font-mono">
                {activeReferred} alunos VIPs ativos
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#1b1b26] border border-white/5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-zinc-400 font-bold">Saldo Disponível</span>
              </div>
              <p className="text-2xl font-black text-emerald-400">
                R$ {currentBalance.toFixed(2)}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">
                Saque mínimo: R$ {minWithdrawal.toFixed(2)}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#1b1b26] border border-white/5">
              <div className="flex items-center gap-2.5 mb-1.5">
                <Award className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-zinc-400 font-bold">Comissões Ganhas</span>
              </div>
              <p className="text-2xl font-black text-white">
                R$ {(currentUser.totalEarned || 0).toFixed(2)}
              </p>
              <p className="text-[10px] text-zinc-500 font-mono">
                Comissão de {settings.referralCommissionPercent}%
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* PIX Withdrawal Form */}
            <div className="space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Solicitar Retirada PIX
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Transfira suas comissões acumuladas diretamente para seu banco.
                </p>
              </div>

              {!canWithdraw ? (
                <div className="p-4 rounded-xl bg-red-950/15 border border-red-500/10 text-red-400 text-xs">
                  Você ainda não atingiu o valor mínimo de saque de R$ {minWithdrawal.toFixed(2)}. Continue indicando para acumular comissões!
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3.5">
                  {errorMsg && (
                    <div className="p-3 rounded-lg bg-red-900/30 text-red-400 text-xs font-semibold border border-red-500/20">
                      {errorMsg}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 rounded-lg bg-emerald-900/30 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                      {successMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-black mb-1">
                        Tipo de Chave PIX
                      </label>
                      <select
                        value={pixType}
                        onChange={(e) => setPixType(e.target.value)}
                        className="w-full bg-[#1b1b26] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                      >
                        <option value="CPF">CPF</option>
                        <option value="CNPJ">CNPJ</option>
                        <option value="Email">E-mail</option>
                        <option value="Celular">Celular</option>
                        <option value="Chave Aleatoria">Chave Aleatória</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 uppercase font-black mb-1">
                        Valor do Saque (R$)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={minWithdrawal}
                        max={currentBalance}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                        className="w-full bg-[#1b1b26] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase font-black mb-1">
                      Chave PIX
                    </label>
                    <input
                      type="text"
                      placeholder="Insira sua chave correspondente"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full bg-[#1b1b26] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase font-black mb-1">
                      Nome Completo do Titular
                    </label>
                    <input
                      type="text"
                      placeholder="Nome cadastrado na conta bancária"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-[#1b1b26] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-400 uppercase font-black mb-1">
                      CPF do Titular da Conta
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      className="w-full bg-[#1b1b26] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Landmark className="w-4 h-4" />
                    )}
                    <span>Solicitar Retirada</span>
                  </button>
                </form>
              )}
            </div>

            {/* Withdrawal Requests History */}
            <div className="space-y-4">
              <div className="border-b border-white/5 pb-2">
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Histórico de Retiradas
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Acompanhe o processamento dos seus saques solicitados.
                </p>
              </div>

              <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                {myRequests.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-4 text-center">
                    Nenhuma solicitação de saque realizada ainda.
                  </p>
                ) : (
                  myRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-[#1b1b26]/50 border border-white/5 space-y-2 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-white">
                          R$ {req.amount.toFixed(2)}
                        </span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                            req.status === 'Realizado'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : req.status === 'Cancelado'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>
                      
                      <div className="text-[10px] text-zinc-400 font-mono space-y-0.5">
                        <p>PIX ({req.pixKeyType}): {req.pixKey}</p>
                        <p className="text-zinc-500">Solicitado: {new Date(req.createdAt).toLocaleDateString('pt-BR')}</p>
                        {req.status === 'Cancelado' && (
                          <p className="text-red-400 font-bold mt-1">⚠️ Recusado (Saldo estornado)</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
