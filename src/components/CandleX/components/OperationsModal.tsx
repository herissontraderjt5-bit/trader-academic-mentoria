import React from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Download,
  Filter,
  Sparkles,
  Bot,
  Layers,
  Zap,
} from "lucide-react";
import { TradeRecord } from "../../../types";

interface OperationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeRecord[];
  onUpdateTradeResult: (id: string, result: "WIN" | "LOSS" | "DRAW") => void;
  onClearTrades: () => void;
}

export const OperationsModal: React.FC<OperationsModalProps> = ({
  isOpen,
  onClose,
  trades,
  onUpdateTradeResult,
  onClearTrades,
}) => {
  if (!isOpen) return null;

  const totalTrades = trades.length;
  const wins = trades.filter((t) => t.result === "WIN").length;
  const losses = trades.filter((t) => t.result === "LOSS").length;
  const pending = trades.filter((t) => t.result === "PENDING").length;
  const evaluated = wins + losses;
  const winRate = evaluated > 0 ? +((wins / evaluated) * 100).toFixed(1) : 0;
  const totalPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);

  const handleExportCSV = () => {
    if (trades.length === 0) return;
    const header = "ID,Timestamp,Ticker,Direction,Stake,Payout,Result,PnL,Strategy,Confidence\n";
    const rows = trades
      .map(
        (t) =>
          `${t.id},${new Date(t.timestamp).toISOString()},${t.ticker},${
            t.direction
          },${t.stake},${t.payoutPercent},${t.result},${t.pnl},"${t.strategyUsed || ""}",${t.confidenceAtEntry || 0}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `candlex_diario_trades_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none animate-in fade-in duration-200">
      <div className="bg-[#0C101A] border border-[#1E2638] rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1A2234] flex items-center justify-between bg-[#10141E]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF7A00]/20 to-amber-500/20 border border-[#FF7A00]/40 flex items-center justify-center text-[#FF7A00] shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <span>Operações & Diário de Trades</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#FF7A00]/20 text-[#FF7A00] border border-[#FF7A00]/30">
                  CandleX AI
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Histórico automatizado de sinais analisados, auditados e executados
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

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 bg-[#080B12] border-b border-[#1A2234]">
          <div className="bg-[#0E121B] p-2.5 rounded-xl border border-[#182030]">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Total de Ordens
            </div>
            <div className="text-xl font-black font-mono text-white mt-0.5 flex items-center justify-between">
              <span>{totalTrades}</span>
              {pending > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  {pending} em andamento
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#0E121B] p-2.5 rounded-xl border border-[#182030]">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Assertividade (Winrate)
            </div>
            <div
              className={`text-xl font-black font-mono mt-0.5 ${
                winRate >= 60 ? "text-emerald-400" : "text-amber-400"
              }`}
            >
              {winRate}%
            </div>
          </div>

          <div className="bg-[#0E121B] p-2.5 rounded-xl border border-[#182030]">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Placar (W / L)
            </div>
            <div className="text-xl font-black font-mono text-white mt-0.5 flex items-center gap-1.5">
              <span className="text-emerald-400">{wins}W</span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400">{losses}L</span>
            </div>
          </div>

          <div className="bg-[#0E121B] p-2.5 rounded-xl border border-[#182030]">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Lucro Líquido (PnL)
            </div>
            <div
              className={`text-xl font-black font-mono mt-0.5 ${
                totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {totalPnL >= 0 ? `+$${totalPnL.toFixed(2)}` : `-$${Math.abs(totalPnL).toFixed(2)}`}
            </div>
          </div>
        </div>

        {/* Trades Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {trades.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30 text-[#FF7A00]" />
              <p className="text-sm font-bold text-slate-300">Nenhum sinal ou operação registrada ainda.</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Clique em "Analisar Mercado" no painel CandleX ou abra uma ordem para que cada sinal seja gravado e auditado automaticamente aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {trades.map((trade) => {
                const isWin = trade.result === "WIN";
                const isLoss = trade.result === "LOSS";
                const isPending = trade.result === "PENDING";
                const isAi = (trade.strategyUsed || "").toLowerCase().includes("ia") || (trade.strategyUsed || "").toLowerCase().includes("candlex");

                return (
                  <div
                    key={trade.id}
                    className={`bg-[#0E131F] border rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-all ${
                      isWin
                        ? "border-emerald-500/30 bg-emerald-950/10 shadow-[0_0_15px_rgba(16,185,129,0.06)]"
                        : isLoss
                        ? "border-rose-500/30 bg-rose-950/10"
                        : isPending
                        ? "border-amber-500/40 bg-amber-950/15"
                        : "border-[#1B2436]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
                          trade.direction === "CALL"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm"
                        }`}
                      >
                        {trade.direction === "CALL" ? (
                          <TrendingUp className="w-5 h-5 stroke-[2.5]" />
                        ) : (
                          <TrendingDown className="w-5 h-5 stroke-[2.5]" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="font-bold text-white flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-sm tracking-wide">{trade.ticker}</span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                              trade.direction === "CALL"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {trade.direction === "CALL" ? "COMPRA (CALL)" : "VENDA (PUT)"}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#182030] text-slate-300 font-mono border border-slate-700">
                            {trade.expiryMinutes}M
                          </span>

                          {isAi && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                              <Bot className="w-3 h-3 text-indigo-400" />
                              Sinal IA {trade.confidenceAtEntry ? `(${trade.confidenceAtEntry}%)` : ""}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-slate-300">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {new Date(trade.timestamp).toLocaleTimeString("pt-BR")}
                          </span>
                          <span>&bull;</span>
                          <span>Entrada: <strong className="text-white">${trade.entryPrice ? trade.entryPrice.toFixed(2) : "0.00"}</strong></span>
                          {trade.expiryPrice && (
                            <>
                              <span>&bull;</span>
                              <span>Fim: <strong className="text-white">${trade.expiryPrice.toFixed(2)}</strong></span>
                            </>
                          )}
                        </div>

                        {trade.notes && (
                          <div className="text-[10px] text-slate-400 font-mono truncate max-w-md pt-0.5">
                            {trade.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#1B2436]">
                      <div className="text-left sm:text-right">
                        <div className="font-bold font-mono text-white text-sm">
                          ${trade.stake.toFixed(2)}
                        </div>
                        <div
                          className={`text-xs font-mono font-black ${
                            isWin
                              ? "text-emerald-400"
                              : isLoss
                              ? "text-rose-400"
                              : "text-amber-400 animate-pulse"
                          }`}
                        >
                          {isWin
                            ? `+ $${trade.pnl.toFixed(2)}`
                            : isLoss
                            ? `- $${trade.stake.toFixed(2)}`
                            : "⏳ EM ANDAMENTO"}
                        </div>
                      </div>

                      {/* Status / Override Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onUpdateTradeResult(trade.id, "WIN")}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                            isWin
                              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                              : "bg-[#141A26] text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                          }`}
                        >
                          WIN
                        </button>
                        <button
                          type="button"
                          onClick={() => onUpdateTradeResult(trade.id, "LOSS")}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-all ${
                            isLoss
                              ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                              : "bg-[#141A26] text-rose-400 hover:bg-rose-500/20 border border-rose-500/30"
                          }`}
                        >
                          LOSS
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1A2234] flex items-center justify-between bg-[#10141E]">
          <button
            type="button"
            onClick={onClearTrades}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 disabled:opacity-40 cursor-pointer font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Histórico</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1C2436] hover:bg-[#253048] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 border border-slate-700 shadow-sm font-mono"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Exportar Diário (CSV)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
