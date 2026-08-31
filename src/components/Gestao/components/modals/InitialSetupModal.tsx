import React, { useState } from 'react';
import { Settings, Check, X, Target, DollarSign, Percent, Activity, Calendar } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { ManagementModel } from '../../types';
import { getCurrencySymbol } from '../../utils/formatters';

interface InitialSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InitialSetupModal: React.FC<InitialSetupModalProps> = ({ isOpen, onClose }) => {
  const { monthConfig, updateMonthConfig } = useTrading();

  const [initialBankroll, setInitialBankroll] = useState<number>(monthConfig.initialBankroll || 125);
  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>(monthConfig.currency || 'BRL');
  const [monthlyGoalPercent, setMonthlyGoalPercent] = useState<number>(monthConfig.monthlyGoalPercent || 80);
  const [workingDays, setWorkingDays] = useState<number>(monthConfig.workingDays || 20);
  const [defaultPayout, setDefaultPayout] = useState<number>(monthConfig.defaultPayout || 87);
  const [preferredManagement, setPreferredManagement] = useState<ManagementModel>(monthConfig.preferredManagement || '2x1');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMonthConfig({
      initialBankroll: Number(initialBankroll),
      currency,
      monthlyGoalPercent: Number(monthlyGoalPercent),
      workingDays: Number(workingDays),
      defaultPayout: Number(defaultPayout),
      preferredManagement,
    });
    onClose();
  };

  const currentSymbol = getCurrencySymbol(currency);

  return (
    <div
      id="modal-initial-setup"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-[#121722] border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-6 py-4 bg-[#182030] border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">Configurações de Gestão & Risco</h2>
              <p className="text-xs text-slate-400">
                Defina seus parâmetros para cálculo automático nas gestões 2x1 e 5x2
              </p>
            </div>
          </div>
          <button
            id="btn-close-setup-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Row 1: Moeda & Banca Inicial */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-orange-400" />
                Moeda da Conta
              </label>
              <select
                id="setup-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-medium"
              >
                <option value="BRL">BRL (R$) - Real Brasileiro</option>
                <option value="USD">USD ($) - Dólar Americano</option>
                <option value="EUR">EUR (€) - Euro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-orange-400" />
                Banca Inicial ({currentSymbol})
              </label>
              <input
                id="setup-initial-bankroll"
                type="number"
                step="0.01"
                min="10"
                required
                value={initialBankroll}
                onChange={(e) => setInitialBankroll(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>
          </div>

          {/* Row 2: Meta Mensal % & Dias Trabalhados */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-orange-400" />
                Meta Mensal (% da banca)
              </label>
              <input
                id="setup-monthly-goal-percent"
                type="number"
                step="0.5"
                min="1"
                required
                value={monthlyGoalPercent}
                onChange={(e) => setMonthlyGoalPercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-cyan-400 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Dias Trabalhados no Mês
              </label>
              <input
                id="setup-working-days"
                type="number"
                step="1"
                min="1"
                max="31"
                required
                value={workingDays}
                onChange={(e) => setWorkingDays(parseInt(e.target.value, 10) || 20)}
                className="w-full bg-[#0b0e14] border border-cyan-500/40 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Row 3: Payout Padrão & Modelo de Gestão */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Percent className="w-3.5 h-3.5 text-orange-400" />
                Payout Padrão da Corretora (%)
              </label>
              <input
                id="setup-default-payout"
                type="number"
                step="1"
                min="50"
                max="100"
                required
                value={defaultPayout}
                onChange={(e) => setDefaultPayout(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-orange-400" />
                Modelo de Gestão Preferido
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-model-2x1"
                  onClick={() => setPreferredManagement('2x1')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                    preferredManagement === '2x1'
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500 shadow-sm'
                      : 'bg-[#0b0e14] text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  Gestão 2x1
                </button>
                <button
                  type="button"
                  id="btn-model-5x2"
                  onClick={() => setPreferredManagement('5x2')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                    preferredManagement === '5x2'
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500 shadow-sm'
                      : 'bg-[#0b0e14] text-slate-400 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  Gestão 5x2
                </button>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              id="btn-cancel-setup"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-setup"
              className="px-5 py-2 rounded-lg text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-950 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
