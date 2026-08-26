import React, { useState } from "react";
import { X, Gift, Sparkles, Trophy, CheckCircle2 } from "lucide-react";
import { soundManager } from "../utils/soundEffects";

interface DailyBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBalance: (amount: number) => void;
}

export const DailyBonusModal: React.FC<DailyBonusModalProps> = ({
  isOpen,
  onClose,
  onAddBalance,
}) => {
  const [claimed, setClaimed] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleClaimBonus = () => {
    if (spinning || claimed) return;
    setSpinning(true);

    setTimeout(() => {
      const rewards = [10, 25, 50, 100];
      const win = rewards[Math.floor(Math.random() * rewards.length)];
      setRewardAmount(win);
      setSpinning(false);
      setClaimed(true);
      onAddBalance(win);
      soundManager.playOrderExecuted();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 select-none">
      <div className="bg-[#0E121B] border border-[#FF7A00]/40 rounded-3xl w-full max-w-md p-6 flex flex-col items-center text-center shadow-[0_0_50px_rgba(255,122,0,0.2)] animate-in fade-in zoom-in-95 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-[#FF7A00]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gift Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FF7A00] to-amber-400 flex items-center justify-center text-slate-950 shadow-[0_0_25px_rgba(255,122,0,0.5)] mb-4 animate-bounce">
          <Gift className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-white">Daily Bônus Hiove & CandleX</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          Resgate seu bônus diário para alavancagem de banca ou teste de confluências.
        </p>

        {/* Reward Wheel / Box */}
        <div className="my-6 w-full p-4 bg-[#121622] rounded-2xl border border-[#1E2638]">
          {claimed && rewardAmount ? (
            <div className="space-y-2 animate-in zoom-in-95">
              <div className="text-xs uppercase font-bold text-emerald-400 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Bônus Creditado com Sucesso!
              </div>
              <div className="text-4xl font-black font-mono text-[#FF7A00]">
                +${rewardAmount}.00
              </div>
              <div className="text-[11px] text-slate-400">
                Adicionado diretamente à sua banca de trading
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-300 font-semibold">
                Prêmios Diários Disponíveis:
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 25, 50, 100].map((amt) => (
                  <div
                    key={amt}
                    className="p-2 rounded-lg bg-[#090C12] border border-[#1E2638] font-mono font-black text-sm text-[#FF7A00]"
                  >
                    ${amt}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {!claimed ? (
          <button
            type="button"
            onClick={handleClaimBonus}
            disabled={spinning}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#FF8C00] to-[#FF5500] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(255,122,0,0.4)] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60"
          >
            {spinning ? "GIRANDO ROLETA DE BÔNUS..." : "RESGATAR BÔNUS DIÁRIO"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase cursor-pointer"
          >
            Fechar e Voltar ao Gráfico
          </button>
        )}
      </div>
    </div>
  );
};
