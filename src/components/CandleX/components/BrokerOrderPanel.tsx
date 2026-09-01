import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Info,
  ChevronLeft,
  Volume2,
  VolumeX,
  Settings,
  Instagram,
  Zap,
  Plus,
  Minus,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { soundManager } from "../utils/soundEffects";
import { TradeRecord } from "../../../types";
import { getCandleTimeRemaining, getSynchronizedDate } from "../utils/technicalIndicators";

interface BrokerOrderPanelProps {
  activeTicker: string;
  currentPrice: number;
  lastAiDirection?: "CALL" | "PUT" | "NEUTRAL";
  onRecordTrade: (
    trade: Omit<TradeRecord, "id" | "timestamp" | "result" | "pnl">
  ) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
}

export const BrokerOrderPanel: React.FC<BrokerOrderPanelProps> = ({
  activeTicker,
  currentPrice,
  lastAiDirection,
  onRecordTrade,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
}) => {
  const [stake, setStake] = useState<number>(20);
  const [payoutPercent, setPayoutPercent] = useState<number>(89);
  const [expiryMinutes, setExpiryMinutes] = useState<number>(1);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");
  const [candleCountdown, setCandleCountdown] = useState<string>("00:00");
  const [lastExecuted, setLastExecuted] = useState<{
    direction: "CALL" | "PUT";
    stake: number;
    time: string;
  } | null>(null);

  // Live clock
  useEffect(() => {
    const updateTime = () => {
      const now = getSynchronizedDate();
      setCurrentTimeStr(now.toLocaleTimeString("pt-BR"));
      const { formatted } = getCandleTimeRemaining(now, `${expiryMinutes}m`);
      setCandleCountdown(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 100);
    return () => clearInterval(interval);
  }, [expiryMinutes]);

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
      payoutPercent,
      expiryMinutes,
      strategyUsed: "Gatilho Hiove & CandleX AI",
      confidenceAtEntry: direction === lastAiDirection ? 92 : 75,
    });

    setLastExecuted({
      direction,
      stake,
      time: new Date().toLocaleTimeString("pt-BR"),
    });

    setTimeout(() => setLastExecuted(null), 3500);
  };

  const potentialProfit = +((stake * payoutPercent) / 100).toFixed(2);

  // Formatted ticker display (e.g. ETH/USDT)
  const displayTicker = activeTicker.includes("USDT")
    ? `${activeTicker.replace("USDT", "")}/USDT`
    : activeTicker;

  return (
    <div className="w-[240px] h-full bg-[#0B0E14] border-l border-[#1B2230] flex flex-col justify-between p-3 select-none z-20 flex-shrink-0 text-slate-200">
      {/* Top Header Section */}
      <div className="space-y-3">
        {/* Alerta de preço Header */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <button
            type="button"
            className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Alerta de preço</span>
          </button>
          <Info className="w-3.5 h-3.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
        </div>

        {/* Active Asset Pill with Candle Timer */}
        <div className="bg-[#12161F] border border-[#1E2638] rounded-lg px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-indigo-950/80 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-300">
              {displayTicker.charAt(0)}
            </div>
            <span className="text-xs font-black text-white">{displayTicker}</span>
          </div>
          <span className="text-xs font-mono font-bold text-[#FF5500]">
            {candleCountdown}
          </span>
        </div>

        {/* Valor (Stake / Investment) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
            <span>Valor</span>
          </div>
          <div className="bg-[#12161F] border border-[#1E2638] rounded-lg p-1.5 flex items-center justify-between">
            <span className="text-slate-400 font-mono text-xs font-bold pl-2">$</span>
            <input
              type="number"
              min="1"
              step="1"
              value={stake}
              onChange={(e) =>
                setStake(Math.max(1, parseFloat(e.target.value) || 1))
              }
              className="bg-transparent text-white font-mono font-bold text-sm text-center w-20 outline-none"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setStake(Math.max(1, stake - 5))}
                className="w-6 h-6 rounded bg-[#1C2436] hover:bg-[#253048] flex items-center justify-center text-slate-300 font-bold text-xs cursor-pointer"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setStake(stake + 5)}
                className="w-6 h-6 rounded bg-[#1C2436] hover:bg-[#253048] flex items-center justify-center text-slate-300 font-bold text-xs cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
          {/* Quick presets */}
          <div className="flex items-center gap-1 pt-0.5">
            {[5, 10, 20, 50, 100].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setStake(v)}
                className={`flex-1 py-0.5 rounded text-[9px] font-mono transition-colors cursor-pointer ${
                  stake === v
                    ? "bg-[#FF7A00] text-slate-950 font-black"
                    : "bg-[#12161F] text-slate-400 hover:text-slate-200"
                }`}
              >
                ${v}
              </button>
            ))}
          </div>
        </div>

        {/* Tempo (Expiry) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
            <span>Tempo</span>
          </div>
          <div className="bg-[#12161F] border border-[#1E2638] rounded-lg p-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 pl-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-white font-mono font-bold text-xs">
                {expiryMinutes === 1
                  ? "00:01:00"
                  : expiryMinutes === 5
                  ? "00:05:00"
                  : `00:0${expiryMinutes}:00`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpiryMinutes(Math.max(1, expiryMinutes - 1))}
                className="w-6 h-6 rounded bg-[#1C2436] hover:bg-[#253048] flex items-center justify-center text-slate-300 font-bold text-xs cursor-pointer"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setExpiryMinutes(expiryMinutes + 1)}
                className="w-6 h-6 rounded bg-[#1C2436] hover:bg-[#253048] flex items-center justify-center text-slate-300 font-bold text-xs cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Pagamentos (Payout %) */}
        <div className="text-center py-1">
          <div className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">
            Pagamentos
          </div>
          <div className="text-3xl font-black font-mono text-[#00E676] leading-tight">
            {payoutPercent}%
          </div>
          <div className="text-xs font-mono font-bold text-[#00E676] mt-0.5">
            +${potentialProfit.toFixed(2)}
          </div>
        </div>

        {/* PRIMARY ACTION BUTTONS: COMPRAR ↗ and VENDER ↘ */}
        <div className="space-y-2 pt-1">
          {/* COMPRAR (CALL) */}
          <button
            type="button"
            onClick={() => handleExecute("CALL")}
            className="w-full py-3.5 px-4 rounded-xl bg-[#00C853] hover:bg-[#00E676] active:scale-[0.98] text-slate-950 font-black text-sm tracking-wider flex items-center justify-between shadow-[0_0_20px_rgba(0,200,83,0.35)] transition-all cursor-pointer"
          >
            <span className="text-base font-black">COMPRAR</span>
            <ArrowUpRight className="w-5 h-5 stroke-[3]" />
          </button>

          {/* VENDER (PUT) */}
          <button
            type="button"
            onClick={() => handleExecute("PUT")}
            className="w-full py-3.5 px-4 rounded-xl bg-[#FF334B] hover:bg-[#FF4D63] active:scale-[0.98] text-white font-black text-sm tracking-wider flex items-center justify-between shadow-[0_0_20px_rgba(255,51,75,0.35)] transition-all cursor-pointer"
          >
            <span className="text-base font-black">VENDER</span>
            <ArrowDownRight className="w-5 h-5 stroke-[3]" />
          </button>
        </div>

        {/* Toast feedback on execute */}
        {lastExecuted && (
          <div className="bg-[#12161F] border border-emerald-500/50 p-2 rounded-lg text-center animate-in fade-in zoom-in-95">
            <div className="text-[11px] font-bold text-emerald-400">
              Ordem Executada: {lastExecuted.direction} (${lastExecuted.stake})
            </div>
            <div className="text-[9px] text-slate-400">{lastExecuted.time}</div>
          </div>
        )}
      </div>

      {/* Bottom Footer Section: Live Clock, Flags, Audio, Settings */}
      <div className="pt-3 border-t border-[#1B2230] space-y-2">
        <div className="text-[10px] text-slate-400 font-mono text-center">
          Hora atual: <strong className="text-white font-bold">{currentTimeStr}</strong>
        </div>

        <div className="flex items-center justify-between px-1">
          {/* Brazil Flag Icon */}
          <div className="flex items-center gap-1.5 cursor-pointer" title="Idioma: Português (Brasil)">
            <div className="w-4 h-3 rounded-[2px] bg-emerald-600 relative overflow-hidden flex items-center justify-center">
              <div className="w-2.5 h-1.5 bg-yellow-400 rotate-45" />
              <div className="w-1 h-1 rounded-full bg-blue-700 absolute" />
            </div>
            <span className="text-[10px] font-bold text-slate-400">PT</span>
          </div>

          {/* Social / Instagram */}
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-[#FF7A00] transition-colors"
            title="Canal Oficial"
          >
            <Instagram className="w-3.5 h-3.5" />
          </a>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`transition-colors cursor-pointer ${
              soundEnabled ? "text-emerald-400" : "text-slate-500"
            }`}
            title={soundEnabled ? "Som Ativado" : "Som Mudo"}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Configurações da Plataforma"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
