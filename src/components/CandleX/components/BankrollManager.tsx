import React, { useState } from "react";
import { X, PieChart, ShieldCheck, TrendingUp, AlertTriangle, Calculator, Sparkles, Check } from "lucide-react";
import { BankrollConfig } from "../../../types";

interface BankrollManagerProps {
  isOpen: boolean;
  onClose: () => void;
  config: BankrollConfig;
  onSaveConfig: (config: BankrollConfig) => void;
  currentPnl: number;
}

export const BankrollManager: React.FC<BankrollManagerProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  currentPnl,
}) => {
  const [initialBalance, setInitialBalance] = useState(config.initialBalance);
  const [dailyStopWin, setDailyStopWin] = useState(config.dailyStopWin);
  const [dailyStopLoss, setDailyStopLoss] = useState(config.dailyStopLoss);
  const [baseStakePercent, setBaseStakePercent] = useState(config.baseStakePercent);
  const [strategyMode, setStrategyMode] = useState<"FIXED" | "SOROS">(config.strategyMode);
  const [payoutRate, setPayoutRate] = useState(88);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const currentBalance = +(initialBalance + currentPnl).toFixed(2);
  const baseStakeAmount = +((currentBalance * baseStakePercent) / 100).toFixed(2);

  // Stop Win / Stop Loss progress
  const stopWinProgress = Math.min(Math.max((currentPnl / (dailyStopWin || 1)) * 100, 0), 100);
  const stopLossProgress = currentPnl < 0 ? Math.min(Math.max((Math.abs(currentPnl) / (dailyStopLoss || 1)) * 100, 0), 100) : 0;

  // Soros Simulation (Level 1, Level 2, Level 3)
  const sorosStep1 = baseStakeAmount;
  const sorosWin1 = +(sorosStep1 * (1 + payoutRate / 100)).toFixed(2);
  const sorosStep2 = sorosWin1;
  const sorosWin2 = +(sorosStep2 * (1 + payoutRate / 100)).toFixed(2);
  const sorosStep3 = sorosWin2;
  const sorosWin3 = +(sorosStep3 * (1 + payoutRate / 100)).toFixed(2);

  const handleSave = () => {
    onSaveConfig({
      ...config,
      initialBalance,
      currentBalance,
      dailyStopWin,
      dailyStopLoss,
      baseStakePercent,
      strategyMode,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gerenciamento de Banca &bull; CandleX Risk</h3>
              <p className="text-xs text-slate-400">Proteção matemática de capital e calculadora Soros / Mão Fixa</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Top Balance & Goals Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Banca Inicial</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-slate-400 text-sm">$</span>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 text-white font-mono font-bold text-base px-2 py-0.5 rounded border border-slate-700 w-full outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Meta Diária (Stop Win)</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-emerald-400 text-sm">$</span>
                <input
                  type="number"
                  value={dailyStopWin}
                  onChange={(e) => setDailyStopWin(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 text-emerald-400 font-mono font-bold text-base px-2 py-0.5 rounded border border-slate-700 w-full outline-none"
                />
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-medium block">Limite de Perda (Stop Loss)</span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-rose-400 text-sm">$</span>
                <input
                  type="number"
                  value={dailyStopLoss}
                  onChange={(e) => setDailyStopLoss(parseFloat(e.target.value) || 0)}
                  className="bg-slate-900 text-rose-400 font-mono font-bold text-base px-2 py-0.5 rounded border border-slate-700 w-full outline-none"
                />
              </div>
            </div>
          </div>

          {/* Stop Win / Stop Loss Live Progress Meters */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Termômetro da Sessão de Hoje
            </h4>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-emerald-400 font-semibold">Progresso da Meta (Stop Win: ${dailyStopWin})</span>
                <span className="font-mono text-white font-bold">{stopWinProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300"
                  style={{ width: `${stopWinProgress}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] mb-1">
                <span className="text-rose-400 font-semibold">Consumo do Limite (Stop Loss: ${dailyStopLoss})</span>
                <span className="font-mono text-white font-bold">{stopLossProgress.toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-600 to-red-400 transition-all duration-300"
                  style={{ width: `${stopLossProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Calculator Section */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-indigo-400" />
                Calculadora de Alavancagem e Mão Fixa (Sem Martingale)
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[10px]">Risco por Ordem:</span>
                <select
                  value={baseStakePercent}
                  onChange={(e) => setBaseStakePercent(parseFloat(e.target.value))}
                  className="bg-slate-900 text-white font-bold font-mono px-2 py-0.5 rounded border border-slate-700 outline-none"
                >
                  <option value={1}>1% (${(currentBalance * 0.01).toFixed(2)})</option>
                  <option value={2}>2% (${(currentBalance * 0.02).toFixed(2)})</option>
                  <option value={3}>3% (${(currentBalance * 0.03).toFixed(2)})</option>
                  <option value={5}>5% (${(currentBalance * 0.05).toFixed(2)})</option>
                </select>
              </div>
            </div>

            {/* Strategy Modes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Soros Level 1-3 */}
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-indigo-300 font-bold text-xs mb-2">
                  <span>Plano Soros (Alavancagem com Lucro)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Payout: {payoutRate}%</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Nível 1 (Entrada Base):</span>
                    <span className="text-white font-bold">${sorosStep1} &rarr; +${(sorosWin1 - sorosStep1).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Nível 2 (Lucro Acumulado):</span>
                    <span className="text-amber-300 font-bold">${sorosStep2} &rarr; +${(sorosWin2 - sorosStep1).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Nível 3 (Alvo Final):</span>
                    <span className="text-emerald-400 font-bold">${sorosStep3} &rarr; +${(sorosWin3 - sorosStep1).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Mão Fixa / Gestão Conservadora */}
              <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between text-emerald-300 font-bold text-xs mb-2">
                  <span>Mão Fixa (Gestão de Risco Zero Gale)</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Entrada Segura</span>
                </div>
                <div className="space-y-1.5 font-mono text-[11px]">
                  <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Valor de Entrada:</span>
                    <span className="text-white font-bold">${baseStakeAmount}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Retorno com Win (88%):</span>
                    <span className="text-emerald-400 font-bold">+${(baseStakeAmount * 0.88).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded">
                    <span className="text-slate-400">Perda Máxima por Trade:</span>
                    <span className="text-rose-400 font-bold">-${baseStakeAmount.toFixed(2)} (Sem Multiplicação)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">A disciplina de Stop Loss protege 100% da sua consistência</span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-colors cursor-pointer"
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{savedSuccess ? "Salvo!" : "Salvar Gestão"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
