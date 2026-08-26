import React, { useState } from "react";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { soundManager } from "../utils/soundEffects";
import { TradeRecord } from "../../../types";

interface QuickTradeFloatingHudProps {
  activeTicker: string;
  currentPrice: number;
  lastAiDirection?: "CALL" | "PUT" | "NEUTRAL";
  confidenceScore?: number;
  onRecordTrade: (trade: Omit<TradeRecord, "id" | "timestamp" | "result" | "pnl">) => void;
  onNavigateToHiove?: () => void;
}

export const QuickTradeFloatingHud: React.FC<QuickTradeFloatingHudProps> = ({
  activeTicker,
  currentPrice,
  lastAiDirection,
  confidenceScore = 85,
  onRecordTrade,
  onNavigateToHiove,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [stake, setStake] = useState<number>(10);
  const [expiryMinutes, setExpiryMinutes] = useState<number>(1);
  const [payout, setPayout] = useState<number>(88);
  const [lastExecuted, setLastExecuted] = useState<"CALL" | "PUT" | null>(null);

  const handleExecute = (direction: "CALL" | "PUT") => {
    if (direction === "CALL") {
      soundManager.playCallAlert();
    } else {
      soundManager.playPutAlert();
    }
    soundManager.playOrderExecuted();

    onRecordTrade({
      ticker: activeTicker,
      direction,
      entryPrice: currentPrice || 0,
      stake,
      payoutPercent: payout,
      expiryMinutes,
      strategyUsed: "HUD One-Click CandleX",
      confidenceAtEntry: direction === lastAiDirection ? confidenceScore : 70,
    });

    setLastExecuted(direction);
    setTimeout(() => setLastExecuted(null), 3000);
  };

  const potentialProfit = +((stake * payout) / 100).toFixed(2);

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end pointer-events-auto select-none">
      {/* Minimized Pill */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/95 hover:bg-slate-800 text-slate-100 border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold font-mono">{activeTicker}</span>
          <span className="text-xs text-indigo-400 font-bold">${currentPrice.toFixed(2)}</span>
          {lastAiDirection && (
            <span
              className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${
                lastAiDirection === "CALL"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-rose-500/20 text-rose-300"
              }`}
            >
              {lastAiDirection} {confidenceScore}%
            </span>
          )}
          <ChevronUp className="w-4 h-4 text-slate-400" />
        </button>
      ) : (
        /* Expanded HUD */
        <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-lg w-80 sm:w-96 animate-in slide-in-from-bottom-5 duration-200">
          {/* Top Info Bar */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <Zap className="w-3.5 h-3.5 fill-indigo-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white font-mono">{activeTicker}</span>
                  <span className="text-xs font-bold text-slate-300 font-mono">
                    ${currentPrice > 0 ? currentPrice.toFixed(2) : "..."}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {lastAiDirection && lastAiDirection !== "NEUTRAL" && (
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    lastAiDirection === "CALL"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  }`}
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  {lastAiDirection} {confidenceScore}%
                </span>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                title="Minimizar HUD"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Stake & Expiry selectors */}
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            {/* Stake */}
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-1">Valor do Trade:</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  value={stake}
                  onChange={(e) => setStake(Math.max(1, parseFloat(e.target.value) || 1))}
                  className="bg-transparent text-white font-mono font-bold w-full outline-none"
                />
              </div>
              <div className="flex gap-1 mt-1.5">
                {[5, 10, 25, 50].map((v) => (
                  <button
                    key={v}
                    onClick={() => setStake(v)}
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      stake === v ? "bg-indigo-600 text-white font-bold" : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>

            {/* Expiry */}
            <div className="bg-slate-950/80 p-2 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                <span>Tempo / Vela:</span>
                <span className="text-emerald-400 font-bold">{payout}%</span>
              </div>
              <div className="flex gap-1 mt-2">
                {[1, 2, 5, 15].map((m) => (
                  <button
                    key={m}
                    onClick={() => setExpiryMinutes(m)}
                    className={`flex-1 text-[11px] font-mono py-1 rounded font-bold transition-all ${
                      expiryMinutes === m
                        ? "bg-slate-700 text-white border border-slate-600"
                        : "bg-slate-800/80 text-slate-400 hover:text-white"
                    }`}
                  >
                    {m}m
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 text-right font-mono">
                Retorno: <strong className="text-emerald-400">+${potentialProfit}</strong>
              </div>
            </div>
          </div>

          {/* Large Execution Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleExecute("CALL")}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/60 active:scale-95 transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
              <span>CALL (COMPRA)</span>
            </button>

            <button
              onClick={() => handleExecute("PUT")}
              className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-rose-950/60 active:scale-95 transition-all cursor-pointer"
            >
              <TrendingDown className="w-4 h-4 stroke-[2.5]" />
              <span>PUT (VENDA)</span>
            </button>
          </div>

          {/* Feedback alert */}
          {lastExecuted && (
            <div className="mt-2 text-center text-xs font-bold text-emerald-400 flex items-center justify-center gap-1 animate-pulse">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ordem {lastExecuted} de ${stake} registrada no diário!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
