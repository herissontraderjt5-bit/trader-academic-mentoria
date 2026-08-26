import React, { useState } from "react";
import {
  X,
  CircleDollarSign,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Flame,
  Zap,
  Save,
} from "lucide-react";
import { BankrollConfig } from "../../../types";

interface FinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BankrollConfig;
  onSaveConfig: (config: BankrollConfig) => void;
}

export const FinancialModal: React.FC<FinancialModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [localConfig, setLocalConfig] = useState<BankrollConfig>(config);
  const [savedToast, setSavedToast] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveConfig(localConfig);
    setSavedToast(true);
    setTimeout(() => {
      setSavedToast(false);
      onClose();
    }, 800);
  };

  const baseStake = +(
    (localConfig.currentBalance * localConfig.baseStakePercent) /
    100
  ).toFixed(2);

  // Soros sequence calculation (3 levels)
  const payoutFactor = 1.89; // 89%
  const sorosL1 = baseStake;
  const sorosL2 = +(sorosL1 * payoutFactor).toFixed(2);
  const sorosL3 = +(sorosL2 * payoutFactor).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0E121B] border border-[#1E2638] rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E2638] flex items-center justify-between bg-[#121622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4 text-[#FF7A00]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Gestão Financeira & Proteção de Banca
              </h2>
              <p className="text-xs text-slate-400">
                Configure metas diárias, travas de Stop Win/Loss e planos matemáticos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Banca Atual & Moeda */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#121622] p-3.5 rounded-xl border border-[#1E2638]">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Saldo Atual da Banca ($)
              </label>
              <input
                type="number"
                value={localConfig.currentBalance}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    currentBalance: Math.max(1, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full bg-[#090C12] text-xl font-black font-mono text-white px-3 py-1.5 rounded-lg border border-[#1E2638] outline-none focus:border-[#FF7A00]"
              />
            </div>
            <div className="bg-[#121622] p-3.5 rounded-xl border border-[#1E2638]">
              <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                Entrada Base (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localConfig.baseStakePercent}
                  onChange={(e) =>
                    setLocalConfig({
                      ...localConfig,
                      baseStakePercent: Math.max(0.5, parseFloat(e.target.value) || 1),
                    })
                  }
                  className="w-full bg-[#090C12] text-xl font-black font-mono text-white px-3 py-1.5 rounded-lg border border-[#1E2638] outline-none focus:border-[#FF7A00]"
                />
                <span className="text-xs font-bold text-emerald-400 font-mono">
                  ${baseStake}
                </span>
              </div>
            </div>
          </div>

          {/* Stop Win & Stop Loss */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#121622] p-3.5 rounded-xl border border-emerald-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Meta Diária (Stop Win)
                </span>
              </div>
              <input
                type="number"
                value={localConfig.dailyStopWin}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    dailyStopWin: Math.max(1, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full bg-[#090C12] text-lg font-black font-mono text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 outline-none"
              />
            </div>

            <div className="bg-[#121622] p-3.5 rounded-xl border border-rose-500/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Limite de Perda (Stop Loss)
                </span>
              </div>
              <input
                type="number"
                value={localConfig.dailyStopLoss}
                onChange={(e) =>
                  setLocalConfig({
                    ...localConfig,
                    dailyStopLoss: Math.max(1, parseFloat(e.target.value) || 0),
                  })
                }
                className="w-full bg-[#090C12] text-lg font-black font-mono text-rose-400 px-3 py-1.5 rounded-lg border border-rose-500/30 outline-none"
              />
            </div>
          </div>

          {/* Plano de Alavancagem Soros (Sem Martingale) */}
          <div className="bg-[#121622] p-4 rounded-xl border border-[#1E2638] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#FF7A00]" />
                Calculadora Soros Nível 3 (Alavancagem com Lucro)
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#090C12] p-2.5 rounded-lg border border-[#1E2638]">
                <div className="text-[9px] uppercase font-bold text-slate-400">
                  Nível 1 (Base)
                </div>
                <div className="text-sm font-black font-mono text-white mt-1">
                  ${sorosL1}
                </div>
              </div>
              <div className="bg-[#090C12] p-2.5 rounded-lg border border-[#1E2638]">
                <div className="text-[9px] uppercase font-bold text-slate-400">
                  Nível 2 (Soros 2)
                </div>
                <div className="text-sm font-black font-mono text-amber-400 mt-1">
                  ${sorosL2}
                </div>
              </div>
              <div className="bg-[#090C12] p-2.5 rounded-lg border border-[#1E2638]">
                <div className="text-[9px] uppercase font-bold text-slate-400">
                  Nível 3 (Soros 3)
                </div>
                <div className="text-sm font-black font-mono text-emerald-400 mt-1">
                  ${sorosL3}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2638] flex items-center justify-between bg-[#121622]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#FF7A00] hover:bg-[#FFA022] text-slate-950 text-xs font-black shadow-lg shadow-[#FF7A00]/20 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{savedToast ? "Salvo com Sucesso!" : "Salvar Configurações"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
