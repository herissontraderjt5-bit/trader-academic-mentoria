import React, { useState } from "react";
import {
  ShieldCheck,
  BookOpen,
  PieChart,
  Award,
  TrendingUp,
  TrendingDown,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  MinusCircle,
  Calculator,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { TradeRecord, BankrollConfig } from "../../../types";
import { soundManager } from "../utils/soundEffects";

interface PerformanceHubProps {
  trades: TradeRecord[];
  onUpdateTradeResult: (id: string, result: "WIN" | "LOSS" | "DRAW") => void;
  onClearTrades: () => void;
  bankrollConfig: BankrollConfig;
  onSaveBankrollConfig: (config: BankrollConfig) => void;
}

export const PerformanceHub: React.FC<PerformanceHubProps> = ({
  trades,
  onUpdateTradeResult,
  onClearTrades,
  bankrollConfig,
  onSaveBankrollConfig,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"bankroll" | "journal">("bankroll");

  // Bankroll state
  const [initialBalance, setInitialBalance] = useState(bankrollConfig.initialBalance);
  const [dailyStopWin, setDailyStopWin] = useState(bankrollConfig.dailyStopWin);
  const [dailyStopLoss, setDailyStopLoss] = useState(bankrollConfig.dailyStopLoss);
  const [baseStakePercent, setBaseStakePercent] = useState(bankrollConfig.baseStakePercent);
  const [strategyMode, setStrategyMode] = useState<"FIXED" | "SOROS">(bankrollConfig.strategyMode);
  const [payoutRate, setPayoutRate] = useState(88);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Journal metrics
  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result === "WIN").length;
  const losses = trades.filter((t) => t.result === "LOSS").length;
  const evaluated = wins + losses;
  const winRate = evaluated > 0 ? +((wins / evaluated) * 100).toFixed(1) : 0;
  const currentPnl = +trades.reduce((acc, t) => acc + (t.pnl || 0), 0).toFixed(2);
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

  const handleSaveBankroll = () => {
    onSaveBankrollConfig({
      ...bankrollConfig,
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
    }, 2000);
  };

  const handleWin = (id: string) => {
    soundManager.playWinChime();
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
    onUpdateTradeResult(id, "WIN");
  };

  const handleLoss = (id: string) => {
    soundManager.playLossChime();
    onUpdateTradeResult(id, "LOSS");
  };

  const exportCSV = () => {
    const headers = ["Data", "Ativo", "Direção", "Entrada", "Investimento", "Expiração", "Resultado", "Lucro/Prejuízo", "Estratégia"];
    const rows = trades.map((t) => [
      new Date(t.timestamp).toLocaleString("pt-BR"),
      t.ticker,
      t.direction,
      t.entryPrice,
      t.stake,
      `${t.expiryMinutes}m`,
      t.result,
      t.pnl,
      t.strategyUsed,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CandleX_Diario_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-hidden select-none">
      {/* Top Navigation Tabs inside Hub */}
      <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("bankroll")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "bankroll"
                ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <PieChart className="w-4 h-4 text-rose-400" />
            <span>Gestão de Banca & Stop</span>
          </button>

          <button
            onClick={() => setActiveSubTab("journal")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === "journal"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                : "bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4 text-amber-400" />
            <span>Diário de Operações ({totalTrades})</span>
          </button>
        </div>

        {/* Global Stats Capsule */}
        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <span className="text-[11px] text-slate-400">P&L Total:</span>
            <span
              className={`font-black font-mono text-sm ${
                currentPnl >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {currentPnl >= 0 ? "+$" : "-$"}
              {Math.abs(currentPnl).toFixed(2)}
            </span>
          </div>

          <div className="bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Win Rate:</span>
            <span className="font-black font-mono text-sm text-amber-400 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              {winRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
        {activeSubTab === "bankroll" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {/* Top Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md">
                <span className="text-[11px] text-slate-400 font-medium block">Banca Inicial</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-slate-400 text-base font-bold">$</span>
                  <input
                    type="number"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(parseFloat(e.target.value) || 0)}
                    className="bg-slate-950 text-white font-mono font-bold text-lg px-2.5 py-1 rounded-xl border border-slate-700/80 w-full outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md">
                <span className="text-[11px] text-emerald-400 font-semibold block">Meta Diária (Stop Win)</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-emerald-400 text-base font-bold">$</span>
                  <input
                    type="number"
                    value={dailyStopWin}
                    onChange={(e) => setDailyStopWin(parseFloat(e.target.value) || 0)}
                    className="bg-slate-950 text-emerald-400 font-mono font-bold text-lg px-2.5 py-1 rounded-xl border border-slate-700/80 w-full outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md">
                <span className="text-[11px] text-rose-400 font-semibold block">Limite de Perda (Stop Loss)</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-rose-400 text-base font-bold">$</span>
                  <input
                    type="number"
                    value={dailyStopLoss}
                    onChange={(e) => setDailyStopLoss(parseFloat(e.target.value) || 0)}
                    className="bg-slate-950 text-rose-400 font-mono font-bold text-lg px-2.5 py-1 rounded-xl border border-slate-700/80 w-full outline-none focus:border-rose-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Live Stop Meters */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 space-y-3.5 shadow-md">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Termômetro de Risco & Consistência
              </h4>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-emerald-400 font-semibold">Progresso do Stop Win (${dailyStopWin})</span>
                  <span className="font-mono text-white font-bold">{stopWinProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300 rounded-full"
                    style={{ width: `${stopWinProgress}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-rose-400 font-semibold">Consumo do Stop Loss (${dailyStopLoss})</span>
                  <span className="font-mono text-white font-bold">{stopLossProgress.toFixed(0)}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-rose-600 to-red-400 transition-all duration-300 rounded-full"
                    style={{ width: `${stopLossProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Soros vs Gale Strategy Section */}
            <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 shadow-md">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-indigo-400" />
                  Calculadora de Alavancagem e Risco Matemático
                </h4>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-xs">Mão Base:</span>
                  <select
                    value={baseStakePercent}
                    onChange={(e) => setBaseStakePercent(parseFloat(e.target.value))}
                    className="bg-slate-950 text-white font-bold font-mono px-2.5 py-1 rounded-xl border border-slate-700 outline-none cursor-pointer"
                  >
                    <option value={1}>1% (${(currentBalance * 0.01).toFixed(2)})</option>
                    <option value={2}>2% (${(currentBalance * 0.02).toFixed(2)})</option>
                    <option value={3}>3% (${(currentBalance * 0.03).toFixed(2)})</option>
                    <option value={5}>5% (${(currentBalance * 0.05).toFixed(2)})</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Soros */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-indigo-300 font-bold text-xs mb-2">
                    <span>Plano Soros (Alavancagem com Lucro)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Payout: {payoutRate}%</span>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Nível 1 (Entrada Base):</span>
                      <span className="text-white font-bold">${sorosStep1} &rarr; +${(sorosWin1 - sorosStep1).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Nível 2 (Lucro Acumulado):</span>
                      <span className="text-amber-300 font-bold">${sorosStep2} &rarr; +${(sorosWin2 - sorosStep1).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Nível 3 (Alvo Final):</span>
                      <span className="text-emerald-400 font-bold">${sorosStep3} &rarr; +${(sorosWin3 - sorosStep1).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Mão Fixa / Gestão Conservadora */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80">
                  <div className="flex items-center justify-between text-emerald-300 font-bold text-xs mb-2">
                    <span>Mão Fixa (Gestão de Risco Zero Gale)</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Entrada Segura</span>
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Valor de Entrada:</span>
                      <span className="text-white font-bold">${baseStakeAmount}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Retorno com Win (88%):</span>
                      <span className="text-emerald-400 font-bold">+${(baseStakeAmount * 0.88).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <span className="text-slate-400">Perda Máxima por Trade:</span>
                      <span className="text-rose-400 font-bold">-${baseStakeAmount.toFixed(2)} (Sem Multiplicação)</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSaveBankroll}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition-all cursor-pointer"
                >
                  {savedSuccess ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{savedSuccess ? "Configuração Salva!" : "Salvar Configuração de Banca"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "journal" && (
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Action Bar */}
            <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <span className="font-semibold text-slate-200">Registros de Ordens Executadas</span>
              <div className="flex items-center gap-2">
                {trades.length > 0 && (
                  <>
                    <button
                      onClick={exportCSV}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Exportar CSV</span>
                    </button>
                    <button
                      onClick={onClearTrades}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* List */}
            {trades.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800/80">
                <BookOpen className="w-12 h-12 stroke-[1.5] mb-2 opacity-40" />
                <p className="text-sm font-semibold text-slate-300">Nenhum trade gravado nesta sessão</p>
                <p className="text-xs max-w-sm mt-1 text-slate-500">
                  Dispare entradas rápidas através do botão One-Click CALL e PUT para registrá-las instantaneamente.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {trades.map((trade) => {
                  const isWin = trade.result === "WIN";
                  const isLoss = trade.result === "LOSS";

                  return (
                    <div
                      key={trade.id}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 flex-wrap transition-colors shadow-sm ${
                        isWin
                          ? "bg-emerald-950/20 border-emerald-500/30"
                          : isLoss
                          ? "bg-rose-950/20 border-rose-500/30"
                          : "bg-slate-900/80 border-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs ${
                            trade.direction === "CALL" ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                        >
                          {trade.direction === "CALL" ? (
                            <TrendingUp className="w-5 h-5" />
                          ) : (
                            <TrendingDown className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{trade.ticker}</span>
                            <span
                              className={`text-[10px] font-black px-1.5 py-0.2 rounded ${
                                trade.direction === "CALL"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {trade.direction}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {trade.expiryMinutes}m &bull; {trade.payoutPercent}% payout
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Entrada: ${trade.entryPrice}</span>
                            <span>&bull;</span>
                            <span>{new Date(trade.timestamp).toLocaleTimeString("pt-BR")}</span>
                            <span>&bull;</span>
                            <span className="text-indigo-300">{trade.strategyUsed}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono">
                          <div className="text-xs text-slate-400">Investido: ${trade.stake}</div>
                          <div
                            className={`text-sm font-bold ${
                              isWin ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-slate-300"
                            }`}
                          >
                            {isWin ? `+$${trade.pnl}` : isLoss ? `-$${trade.stake}` : `$${trade.stake}`}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                          <button
                            onClick={() => handleWin(trade.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                              isWin
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                                : "text-slate-400 hover:text-emerald-400 hover:bg-slate-900"
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>WIN</span>
                          </button>
                          <button
                            onClick={() => handleLoss(trade.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                              isLoss
                                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                                : "text-slate-400 hover:text-rose-400 hover:bg-slate-900"
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>LOSS</span>
                          </button>
                          <button
                            onClick={() => onUpdateTradeResult(trade.id, "DRAW")}
                            className={`p-1 rounded-lg text-xs transition-colors cursor-pointer ${
                              trade.result === "DRAW" ? "bg-amber-600 text-white" : "text-slate-500 hover:text-slate-300"
                            }`}
                            title="Empate / Devolução"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
