import React, { useState } from 'react';
import {
  ArrowLeftRight,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Wallet,
  DollarSign,
  Building,
  Calendar,
  Layers,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { TransactionType } from '../../types';
import { formatDateBR, getTodayDateString } from '../../utils/formatters';

export const TransactionsView: React.FC = () => {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    monthlyStats,
    monthConfig,
    formatCurrency,
    currencySymbol,
  } = useTrading();

  const [type, setType] = useState<TransactionType>('DEPOSIT');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [broker, setBroker] = useState<string>('Pocket Option');
  const [notes, setNotes] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;

    addTransaction({
      type,
      amount: numAmount,
      date,
      broker,
      notes,
    });

    setAmount('');
    setNotes('');
    setIsFormOpen(false);
  };

  const deposits = transactions.filter((t) => t.type === 'DEPOSIT');
  const withdrawals = transactions.filter((t) => t.type === 'WITHDRAWAL');

  return (
    <div className="space-y-6 pb-12" id="view-transactions">
      {/* Header & New Transaction Toggle */}
      <div className="p-5 bg-[#121722] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Saques e Depósitos (Fluxo de Capital)
            </h2>
            <p className="text-xs text-slate-400">
              Gestão de aportes e retiradas com atualização automática do saldo da banca
            </p>
          </div>
        </div>

        <button
          id="btn-new-transaction"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-950 transition-all flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          {isFormOpen ? 'Fechar Formulário' : 'Novo Saque / Depósito'}
        </button>
      </div>

      {/* Financial Formula Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 font-mono text-xs">
        {/* Banca Inicial */}
        <div className="p-4 bg-[#121722] border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-400 font-sans block">1. Banca Inicial</span>
          <strong className="text-lg font-black text-white mt-1 block">
            {formatCurrency(monthlyStats.initialBankroll)}
          </strong>
        </div>

        {/* Depósitos */}
        <div className="p-4 bg-[#121722] border border-cyan-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-sans">2. Total Depósitos</span>
            <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <strong className="text-lg font-black text-cyan-400 mt-1 block">
            +{formatCurrency(monthlyStats.totalDeposits)}
          </strong>
        </div>

        {/* Lucro Operacional */}
        <div className="p-4 bg-[#121722] border border-emerald-500/30 rounded-xl">
          <span className="text-[10px] text-slate-400 font-sans block">3. Lucro Líquido Ops</span>
          <strong
            className={`text-lg font-black mt-1 block ${
              monthlyStats.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(monthlyStats.netProfit, true)}
          </strong>
        </div>

        {/* Saques */}
        <div className="p-4 bg-[#121722] border border-amber-500/30 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-sans">4. Total Saques</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <strong className="text-lg font-black text-amber-400 mt-1 block">
            -{formatCurrency(monthlyStats.totalWithdrawals)}
          </strong>
        </div>

        {/* Saldo Final */}
        <div className="p-4 bg-[#182030] border border-orange-500/40 rounded-xl">
          <span className="text-[10px] text-orange-400 font-sans font-bold block">
            = BANCA ATUAL
          </span>
          <strong className="text-xl font-black text-white mt-1 block">
            {formatCurrency(monthlyStats.currentBankroll)}
          </strong>
        </div>
      </div>

      {/* New Transaction Form (Collapsible) */}
      {isFormOpen && (
        <form
          onSubmit={handleSubmit}
          className="p-5 bg-[#121722] border border-orange-500/40 rounded-xl space-y-4 animate-in fade-in"
          id="form-transaction"
        >
          <h3 className="text-xs font-bold text-orange-400 uppercase tracking-wider">
            Cadastrar Movimentação Financeira
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Tipo */}
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Tipo</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TransactionType)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded px-2.5 py-2 text-white font-bold"
              >
                <option value="DEPOSIT">Depósito (Entrada de Capital)</option>
                <option value="WITHDRAWAL">Saque (Retirada de Lucro)</option>
              </select>
            </div>

            {/* Valor */}
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Valor ({currencySymbol})</label>
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="Ex: 50.00"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded px-2.5 py-2 text-white font-mono"
              />
            </div>

            {/* Data */}
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Data</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded px-2.5 py-2 text-white"
              />
            </div>

            {/* Corretora */}
            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Corretora / Banco</label>
              <input
                type="text"
                placeholder="Ex: Pocket Option, Quotex, IQ Option"
                value={broker}
                onChange={(e) => setBroker(e.target.value)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded px-2.5 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 mb-1 font-semibold text-xs">Observação</label>
            <input
              type="text"
              placeholder="Ex: Aporte inicial via PIX, Retirada semanal de lucros"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0b0e14] border border-slate-700 rounded px-2.5 py-2 text-white text-xs"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-1.5 rounded text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md"
            >
              Salvar Movimentação
            </button>
          </div>
        </form>
      )}

      {/* Two Tables Side by Side: Depósitos & Saques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Tabela de Depósitos */}
        <div className="p-5 bg-[#121722] border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowDownLeft className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Histórico de Depósitos
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              Total: +{formatCurrency(monthlyStats.totalDeposits)}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0b0e14]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#182030] text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Data</th>
                  <th className="px-3 py-2.5">Corretora</th>
                  <th className="px-3 py-2.5 text-right">Valor</th>
                  <th className="px-3 py-2.5">Obs</th>
                  <th className="px-3 py-2.5 text-center w-12">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {deposits.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans">
                      Nenhum depósito cadastrado.
                    </td>
                  </tr>
                ) : (
                  deposits.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="px-3 py-2.5 text-slate-300 font-sans">{formatDateBR(t.date)}</td>
                      <td className="px-3 py-2.5 text-white font-sans">{t.broker || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-cyan-400">
                        +{formatCurrency(t.amount)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 font-sans text-xs">{t.notes || '-'}</td>
                      <td className="px-3 py-2.5 text-center font-sans">
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="text-slate-500 hover:text-rose-400"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabela de Saques */}
        <div className="p-5 bg-[#121722] border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Histórico de Saques
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              Total: -{formatCurrency(monthlyStats.totalWithdrawals)}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0b0e14]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#182030] text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2.5">Data</th>
                  <th className="px-3 py-2.5">Corretora</th>
                  <th className="px-3 py-2.5 text-right">Valor</th>
                  <th className="px-3 py-2.5">Obs</th>
                  <th className="px-3 py-2.5 text-center w-12">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans">
                      Nenhum saque cadastrado.
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/30">
                      <td className="px-3 py-2.5 text-slate-300 font-sans">{formatDateBR(t.date)}</td>
                      <td className="px-3 py-2.5 text-white font-sans">{t.broker || '-'}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-amber-400">
                        -{formatCurrency(t.amount)}
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 font-sans text-xs">{t.notes || '-'}</td>
                      <td className="px-3 py-2.5 text-center font-sans">
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="text-slate-500 hover:text-rose-400"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
