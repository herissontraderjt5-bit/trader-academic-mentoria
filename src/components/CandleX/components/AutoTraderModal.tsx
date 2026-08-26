import React from "react";
import {
  X,
  Bot,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Percent,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AutoTraderConfig, AutoTraderSession, AutoTradeLogItem } from "../../../types";

interface AutoTraderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoTraderConfig;
  onChangeConfig: (newConfig: AutoTraderConfig) => void;
  session: AutoTraderSession;
  onToggleEnabled: () => void;
  onResetSession: () => void;
  currencySymbol?: string;
}

export const AutoTraderModal: React.FC<AutoTraderModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  session,
  onToggleEnabled,
  onResetSession,
  currencySymbol = "R$",
}) => {
  if (!isOpen) return null;

  const targetWins = config.managementMode === "2x1" ? 2 : 5;
  const maxLosses = config.managementMode === "2x1" ? 1 : 2;

  const winProgressPercent = Math.min(100, (session.wins / targetWins) * 100);
  const lossRiskPercent = Math.min(100, (session.losses / maxLosses) * 100);

  const profitProgressPercent =
    config.dailyStopWin > 0
      ? Math.max(0, Math.min(100, (session.totalPnl / config.dailyStopWin) * 100))
      : 0;

  const handlePresetStake = (amount: number) => {
    onChangeConfig({ ...config, stakeAmount: amount });
  };

  const handlePresetStopWin = (amount: number) => {
    onChangeConfig({ ...config, dailyStopWin: amount });
  };

  const handlePresetStopLoss = (amount: number) => {
    onChangeConfig({ ...config, dailyStopLoss: amount });
  };

  const isMetaHit = session.status === "STOP_WIN" || session.wins >= targetWins;
  const isStopHit = session.status === "STOP_LOSS" || session.losses >= maxLosses;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 select-none overflow-y-auto">
      <div className="bg-[#0C0F17] border border-[#1E2638] rounded-2xl w-full max-w-3xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden my-auto max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1E2638] flex items-center justify-between bg-[#10141F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7A00] to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,0,0.4)]">
              <Bot className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  TRADER AUTO &bull; IA AUTÔNOMA
                </h2>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                    config.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      config.enabled ? "bg-emerald-400" : "bg-slate-500"
                    }`}
                  />
                  {config.enabled ? "OPERANDO" : "PAUSADO"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Execução de ordens 100% automatizadas com validação de confluências e gestão de risco
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200">
          {/* Status Alert Banner if Meta or Stop Hit */}
          {isMetaHit && (
            <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-xl p-3.5 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-300">
                    META DA GESTÃO ATINGIDA COM SUCESSO! 🎉
                  </h4>
                  <p className="text-xs text-emerald-400/90">
                    Placar da sessão: {session.wins} Wins x {session.losses} Loss na Gestão {config.managementMode}. Robô pausado para proteção de lucro.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onResetSession}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nova Sessão</span>
              </button>
            </div>
          )}

          {isStopHit && (
            <div className="bg-rose-950/50 border border-rose-500/50 rounded-xl p-3.5 flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-300">
                    STOP LOSS DE SEGURANÇA ATINGIDO 🛑
                  </h4>
                  <p className="text-xs text-rose-400/90">
                    Limite de perdas da Gestão {config.managementMode} atingido ({session.losses} Loss). O Auto Trader foi pausado para blindar seu capital.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onResetSession}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resetar Placar</span>
              </button>
            </div>
          )}

          {/* Top Live Session Control & Placar Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Placar */}
            <div className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Placar da Sessão
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {session.wins}W
                </span>
                <span className="text-slate-500 font-bold">/</span>
                <span className="text-2xl font-black text-rose-400 font-mono">
                  {session.losses}L
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Alvo {config.managementMode}:</span>
                <span className="font-mono font-bold text-amber-400">
                  {session.wins}/{targetWins} Wins
                </span>
              </div>
            </div>

            {/* Lucro/Prejuízo da Sessão */}
            <div className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Resultado Líquido
              </span>
              <div className="mt-1">
                <span
                  className={`text-2xl font-black font-mono ${
                    session.totalPnl > 0
                      ? "text-emerald-400"
                      : session.totalPnl < 0
                      ? "text-rose-400"
                      : "text-slate-200"
                  }`}
                >
                  {session.totalPnl >= 0 ? "+" : ""}
                  {currencySymbol} {session.totalPnl.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Meta Diária:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {currencySymbol} {config.dailyStopWin}
                </span>
              </div>
            </div>

            {/* Gestão Selecionada */}
            <div className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Gestão Ativa
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-black text-[#FF7A00] font-mono px-2 py-0.5 rounded bg-[#FF7A00]/10 border border-[#FF7A00]/30">
                  {config.managementMode}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {config.managementMode === "2x1"
                    ? "2 Wins p/ Meta (1 Loss Stop)"
                    : "5 Wins p/ Meta (2 Loss Stop)"}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Timeframe:</span>
                <span className="font-mono font-bold text-cyan-400 uppercase">
                  {config.timeframe}
                </span>
              </div>
            </div>

            {/* Botão de Ação Ligar / Desligar */}
            <div className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Controle do Robô
              </span>
              <div className="mt-1">
                <button
                  type="button"
                  onClick={onToggleEnabled}
                  className={`w-full py-2 px-3 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                    config.enabled
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50"
                      : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-emerald-950/50 font-black"
                  }`}
                >
                  {config.enabled ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pausar Auto</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Iniciar Auto</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>Resetar:</span>
                <button
                  type="button"
                  onClick={onResetSession}
                  className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar Sessão</span>
                </button>
              </div>
            </div>
          </div>

          {/* CONFIGURATION FORM */}
          <div className="bg-[#10141F] border border-[#1E2638] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A2234] pb-2.5">
              <h3 className="text-xs uppercase font-bold text-[#FF7A00] tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Parâmetros Operacionais do Trader Auto
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Validação em Tempo Real
              </span>
            </div>

            {/* ROW 1: GESTÃO (2x1 ou 5x2) & TIMEFRAME (M1 ou M5) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SELEÇÃO DE GESTÃO: 2x1 vs 5x2 */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>1. SELECIONE A GESTÃO:</span>
                  <span className="text-[#FF7A00] font-mono text-[10px]">
                    {config.managementMode === "2x1" ? "2 Wins / 1 Loss" : "5 Wins / 2 Losses"}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeConfig({ ...config, managementMode: "2x1" })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.managementMode === "2x1"
                        ? "bg-[#1C2436] border-[#FF7A00] text-white shadow-[0_0_15px_rgba(255,122,0,0.25)]"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black font-mono text-[#FF7A00]">
                        Gestão 2x1
                      </span>
                      {config.managementMode === "2x1" && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF7A00]" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      Conservadora: Meta com 2 Wins. Stop com 1 Loss.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeConfig({ ...config, managementMode: "5x2" })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.managementMode === "5x2"
                        ? "bg-[#1C2436] border-[#FF7A00] text-white shadow-[0_0_15px_rgba(255,122,0,0.25)]"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black font-mono text-cyan-400">
                        Gestão 5x2
                      </span>
                      {config.managementMode === "5x2" && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      Alavancagem: Meta com 5 Wins. Stop com 2 Losses.
                    </p>
                  </button>
                </div>
              </div>

              {/* TIMEFRAME: M1 ou M5 */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>2. TIME DAS OPERAÇÕES (EXPIRAÇÃO):</span>
                  <span className="text-cyan-400 font-mono text-[10px]">
                    {config.timeframe === "1m" ? "1 Minuto (M1)" : "5 Minutos (M5)"}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeConfig({ ...config, timeframe: "1m" })}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      config.timeframe === "1m"
                        ? "bg-[#1C2436] border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-base font-black font-mono text-cyan-400">
                      M1 (1 MIN)
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Entrada rápida de fluxo & Price Action
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeConfig({ ...config, timeframe: "5m" })}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      config.timeframe === "5m"
                        ? "bg-[#1C2436] border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-base font-black font-mono text-cyan-400">
                      M5 (5 MIN)
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Tendência consolidada & SMC
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* ROW 1.5: CONTA DA CORRETORA & CREDENCIAIS HIOVE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  CONTA DA CORRETORA:
                </label>
                <select
                  value={config.accountType || "DEMO"}
                  onChange={(e) => onChangeConfig({ ...config, accountType: e.target.value as "DEMO" | "REAL" })}
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-[#FF7A00] rounded-lg px-3 py-2 text-white font-mono font-bold text-sm outline-none cursor-pointer"
                >
                  <option value="DEMO">CONTA TREINAMENTO (DEMO)</option>
                  <option value="REAL">CONTA REAL (REAL)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  E-MAIL HIOVE:
                </label>
                <input
                  type="email"
                  value={config.hioveEmail || ""}
                  onChange={(e) => onChangeConfig({ ...config, hioveEmail: e.target.value })}
                  placeholder="herissonvinicius52@gmail.com"
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-[#FF7A00] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  SENHA HIOVE:
                </label>
                <input
                  type="password"
                  value={config.hiovePassword || ""}
                  onChange={(e) => onChangeConfig({ ...config, hiovePassword: e.target.value })}
                  placeholder="********"
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-[#FF7A00] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none"
                />
              </div>
            </div>

            {/* ROW 2: VALOR DE ENTRADA & PAYOUT MÍNIMO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* VALOR DE ENTRADA */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>3. VALOR DE ENTRADA (STAKE):</span>
                  <span className="text-amber-400 font-mono text-[11px] font-bold">
                    {currencySymbol} {config.stakeAmount.toFixed(2)}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={config.stakeAmount}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          stakeAmount: Math.max(1, parseFloat(e.target.value) || 1),
                        })
                      }
                      className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-[#FF7A00] rounded-lg pl-9 pr-3 py-2 text-white font-mono font-bold text-sm outline-none"
                    />
                  </div>
                  {/* Preset quick buttons */}
                  <div className="flex gap-1">
                    {[5, 10, 25, 50].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handlePresetStake(amt)}
                        className={`px-2 py-2 rounded-lg text-[10px] font-bold font-mono border cursor-pointer ${
                          config.stakeAmount === amt
                            ? "bg-[#FF7A00] text-slate-950 border-[#FF7A00]"
                            : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:text-white"
                        }`}
                      >
                        +{amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAYOUT MÍNIMO */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>4. PAYOUT MÍNIMO DO ATIVO:</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">
                    {config.minPayout}%
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={60}
                      max={98}
                      value={config.minPayout}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          minPayout: Math.min(98, Math.max(60, parseInt(e.target.value) || 80)),
                        })
                      }
                      className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-[#FF7A00] rounded-lg px-3 py-2 text-white font-mono font-bold text-sm outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      %
                    </span>
                  </div>
                  {/* Payout presets */}
                  <div className="flex gap-1">
                    {[80, 85, 88, 90].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onChangeConfig({ ...config, minPayout: p })}
                        className={`px-2 py-2 rounded-lg text-[10px] font-bold font-mono border cursor-pointer ${
                          config.minPayout === p
                            ? "bg-emerald-500 text-slate-950 border-emerald-500 font-black"
                            : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:text-white"
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[9.5px] text-slate-500">
                  O robô não executará entradas em ativos que estejam pagando menos que {config.minPayout}%.
                </p>
              </div>
            </div>

            {/* ROW 3: META (STOP WIN) & STOP LOSS DIÁRIO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* META (STOP WIN) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    5. META DE LUCRO (STOP WIN):
                  </span>
                  <span className="font-mono font-bold">
                    {currencySymbol} {config.dailyStopWin}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={config.dailyStopWin}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          dailyStopWin: Math.max(5, parseFloat(e.target.value) || 10),
                        })
                      }
                      className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-emerald-300 font-mono font-bold text-sm outline-none"
                    />
                  </div>
                  <div className="flex gap-1">
                    {[50, 100, 200, 500].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handlePresetStopWin(w)}
                        className={`px-2 py-2 rounded-lg text-[10px] font-bold font-mono border cursor-pointer ${
                          config.dailyStopWin === w
                            ? "bg-emerald-500 text-slate-950 border-emerald-500 font-black"
                            : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:text-emerald-300"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* STOP LOSS DIÁRIO */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-rose-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    6. STOP LOSS DIÁRIO:
                  </span>
                  <span className="font-mono font-bold">
                    {currencySymbol} {config.dailyStopLoss}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-xs">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={config.dailyStopLoss}
                      onChange={(e) =>
                        onChangeConfig({
                          ...config,
                          dailyStopLoss: Math.max(5, parseFloat(e.target.value) || 10),
                        })
                      }
                      className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-rose-500 rounded-lg pl-9 pr-3 py-2 text-rose-300 font-mono font-bold text-sm outline-none"
                    />
                  </div>
                  <div className="flex gap-1">
                    {[25, 50, 100, 200].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => handlePresetStopLoss(l)}
                        className={`px-2 py-2 rounded-lg text-[10px] font-bold font-mono border cursor-pointer ${
                          config.dailyStopLoss === l
                            ? "bg-rose-500 text-white border-rose-500 font-black"
                            : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:text-rose-300"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HISTÓRICO DE ENTRADAS AUTOMÁTICAS (LOGS EM TEMPO REAL) */}
          <div className="bg-[#10141F] border border-[#1E2638] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Logs de Operações do Auto Trader ({session.history.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Sincronizado com o CandleX Engine
              </span>
            </div>

            {session.history.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs bg-[#0B0E14] rounded-lg border border-[#182030]">
                Nenhuma operação automática executada nesta sessão ainda.
                <p className="text-[11px] text-slate-600 mt-1">
                  Ative o robô para capturar gatilhos com confluência de {config.minAiConfidence || 78}%+.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {session.history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0B0E14] border border-[#182032] rounded-lg p-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          item.direction === "CALL"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        {item.direction}
                      </span>
                      <div>
                        <span className="font-bold text-white">{item.ticker}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">
                          {new Date(item.timestamp).toLocaleTimeString("pt-BR")} &bull; {item.timeframe}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Conf: <strong className="text-amber-400">{item.confidenceScore}%</strong>
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {currencySymbol} {item.stake}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                          item.result === "WIN"
                            ? "bg-emerald-500 text-slate-950"
                            : item.result === "LOSS"
                            ? "bg-rose-500 text-white"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {item.result === "WIN"
                          ? `+${currencySymbol} ${item.pnl.toFixed(2)}`
                          : item.result === "LOSS"
                          ? `-${currencySymbol} ${Math.abs(item.pnl).toFixed(2)}`
                          : "PENDENTE"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#1E2638] bg-[#10141F] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Blindagem Automática: Para imediatamente ao atingir Meta ou Stop.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Salvar & Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleEnabled();
                onClose();
              }}
              className={`px-4 py-2 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                config.enabled
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-gradient-to-r from-[#FF9500] via-[#FF7A00] to-[#E64A00] hover:brightness-110 text-slate-950"
              }`}
            >
              {config.enabled ? "Pausar Robô" : "Ativar Robô Agora"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
