import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Landmark, Copy, Check, Filter, Trash2 } from 'lucide-react';
import { WithdrawalRequest, User } from '../../types';

interface AdminWithdrawalsProps {
  requests: WithdrawalRequest[];
  users: User[];
  onUpdateStatus: (reqId: string, status: 'Pendente' | 'Realizado' | 'Cancelado') => Promise<void>;
  onDeleteRequest?: (reqId: string) => Promise<void>;
}

export const AdminWithdrawals: React.FC<AdminWithdrawalsProps> = ({
  requests,
  users,
  onUpdateStatus,
  onDeleteRequest,
}) => {
  const [filterStatus, setFilterStatus] = useState<'Todos' | 'Pendente' | 'Realizado' | 'Cancelado'>('Pendente');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleCopyKey = (key: string, reqId: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(reqId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleStatusChange = async (reqId: string, newStatus: 'Realizado' | 'Cancelado') => {
    if (window.confirm(`Tem certeza de que deseja marcar esta solicitação como ${newStatus}?`)) {
      setProcessingId(reqId);
      try {
        await onUpdateStatus(reqId, newStatus);
      } catch (e) {
        console.error(e);
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleDeleteClick = async (reqId: string) => {
    if (window.confirm('Deseja realmente excluir permanentemente esta solicitação de saque (ela será deletada também do Supabase)?')) {
      setProcessingId(reqId);
      try {
        if (onDeleteRequest) {
          await onDeleteRequest(reqId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setProcessingId(null);
      }
    }
  };

  // Helper: find user info
  const getUserInfo = (userId: string) => {
    const u = users.find(user => user.id === userId);
    return u ? { name: u.name, email: u.email } : { name: 'Usuário Desconhecido', email: '-' };
  };

  // Statistics
  const pendingRequests = requests.filter(r => r.status === 'Pendente');
  const totalPendingSum = pendingRequests.reduce((acc, curr) => acc + curr.amount, 0);

  const completedRequests = requests.filter(r => r.status === 'Realizado');
  const totalCompletedSum = completedRequests.reduce((acc, curr) => acc + curr.amount, 0);

  const filteredRequests = requests.filter(r => {
    if (filterStatus === 'Todos') return true;
    return r.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            Solicitações de Saque (PIX)
          </h2>
          <p className="text-xs text-zinc-400">
            Acompanhe, pague ou rejeite as transferências de afiliados solicitadas pelos alunos.
          </p>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-yellow-950/10 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold text-zinc-400 uppercase">Saques Pendentes</span>
          </div>
          <p className="text-2xl font-black text-white">R$ {totalPendingSum.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-500 font-mono">
            {pendingRequests.length} solicitações aguardando pagamento
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-950/10 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-zinc-400 uppercase">Total Pago</span>
          </div>
          <p className="text-2xl font-black text-emerald-400">R$ {totalCompletedSum.toFixed(2)}</p>
          <p className="text-[10px] text-zinc-500 font-mono">
            {completedRequests.length} saques realizados com sucesso
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5">
          <div className="flex items-center gap-2 mb-1">
            <Landmark className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-zinc-400 uppercase">Saques Totais</span>
          </div>
          <p className="text-2xl font-black text-white">{requests.length}</p>
          <p className="text-[10px] text-zinc-500 font-mono">
            Histórico completo de registros
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-zinc-900 border border-white/5 w-fit">
        {(['Pendente', 'Realizado', 'Cancelado', 'Todos'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filterStatus === status
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            {status === 'Todos' ? 'Todos os Registros' : `${status}s`}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            Nenhuma solicitação de saque encontrada com status "{filterStatus}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#0f0f15] text-[10px] text-zinc-400 font-black uppercase tracking-wider">
                  <th className="p-4">Aluno</th>
                  <th className="p-4">Data Solicitação</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Dados do PIX</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredRequests.map((req) => {
                  const student = getUserInfo(req.userId);
                  const isProcessing = processingId === req.id;

                  return (
                    <tr key={req.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{student.name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono">{student.email}</div>
                      </td>
                      <td className="p-4 text-zinc-400 font-mono">
                        {new Date(req.createdAt).toLocaleString('pt-BR')}
                      </td>
                      <td className="p-4 font-mono font-bold text-white">
                        R$ {req.amount.toFixed(2)}
                      </td>
                      <td className="p-4 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-bold">
                            {req.pixKeyType}
                          </span>
                          <span className="font-mono text-white select-all">{req.pixKey}</span>
                          <button
                            onClick={() => handleCopyKey(req.pixKey, req.id)}
                            className="p-1 rounded bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
                            title="Copiar Chave PIX"
                          >
                            {copiedId === req.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-[10px] text-zinc-400">
                          Nome: <strong className="text-zinc-300">{req.fullName}</strong> • CPF: <strong className="text-zinc-300">{req.cpf}</strong>
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                            req.status === 'Realizado'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : req.status === 'Cancelado'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {req.status === 'Pendente' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                disabled={isProcessing}
                                onClick={() => handleStatusChange(req.id, 'Realizado')}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer shadow shadow-emerald-600/20 disabled:opacity-50"
                              >
                                Pagar
                              </button>
                              <button
                                disabled={isProcessing}
                                onClick={() => handleStatusChange(req.id, 'Cancelado')}
                                className="px-2.5 py-1.5 rounded-lg bg-red-950/40 border border-red-500/20 hover:bg-red-900/40 text-red-400 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                              >
                                Recusar
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-500 font-mono mr-2">
                              {req.status === 'Realizado' ? 'Pago' : 'Recusado'}
                            </span>
                          )}

                          <button
                            disabled={isProcessing}
                            onClick={() => handleDeleteClick(req.id)}
                            className="p-1.5 rounded-lg bg-zinc-850 text-zinc-400 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer disabled:opacity-50"
                            title="Excluir Solicitação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
