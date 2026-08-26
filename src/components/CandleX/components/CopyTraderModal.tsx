import React, { useState } from "react";
import { X, Users, Trophy, TrendingUp, CheckCircle2, ShieldCheck } from "lucide-react";

interface CopyTraderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOP_TRADERS = [
  {
    name: "Alexandre Silva (SMC Pro)",
    winrate: "94.2%",
    tradesToday: 18,
    pnl: "+$1,420.00",
    followers: 1240,
    status: "Operando",
  },
  {
    name: "Mariana Costa (CandleX Elite)",
    winrate: "91.8%",
    tradesToday: 14,
    pnl: "+$980.50",
    followers: 890,
    status: "Operando",
  },
  {
    name: "Rodrigo M. (Fluxo M1)",
    winrate: "89.5%",
    tradesToday: 22,
    pnl: "+$840.00",
    followers: 650,
    status: "Pausa",
  },
  {
    name: "Lucas Sniper (OTC Master)",
    winrate: "88.0%",
    tradesToday: 11,
    pnl: "+$650.00",
    followers: 410,
    status: "Operando",
  },
];

export const CopyTraderModal: React.FC<CopyTraderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedTrader, setCopiedTrader] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0E121B] border border-[#1E2638] rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E2638] flex items-center justify-between bg-[#121622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#FF7A00]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                CopyTrader & Ranking de Traders Hiove
              </h2>
              <p className="text-xs text-slate-400">
                Copie automaticamente as entradas dos traders com maior assertividade
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

        {/* Content Table */}
        <div className="p-5 space-y-3 overflow-y-auto max-h-[65vh]">
          {TOP_TRADERS.map((trader, idx) => {
            const isCopied = copiedTrader === trader.name;
            return (
              <div
                key={idx}
                className="bg-[#121622] border border-[#1E2638] rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF7A00] to-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{trader.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                        {trader.status}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {trader.tradesToday} ordens hoje &bull; {trader.followers} seguidores
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-emerald-400 font-mono font-black text-sm">
                      {trader.pnl}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Winrate: <strong className="text-white">{trader.winrate}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCopiedTrader(isCopied ? null : trader.name)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                      isCopied
                        ? "bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        : "bg-[#FF7A00] hover:bg-[#FFA022] text-slate-950"
                    }`}
                  >
                    {isCopied ? "Copiando ✓" : "Copiar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2638] flex items-center justify-between bg-[#121622]">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Gestão de risco de 1% a 5% por ordem copiada</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
