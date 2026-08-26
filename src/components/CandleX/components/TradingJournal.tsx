import React from "react";
import {
  X,
  BookOpen,
  Award,
  TrendingUp,
  TrendingDown,
  Trash2,
  Download,
  CheckCircle,
  XCircle,
  MinusCircle,
  DollarSign,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { TradeRecord } from "../../../types";
import { soundManager } from "../utils/soundEffects";

interface TradingJournalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeRecord[];
  onUpdateTradeResult: (id: string, result: "WIN" | "LOSS" | "DRAW") => void;
  onClearTrades: () => void;
}

export const TradingJournal: React.FC<TradingJournalProps> = ({
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
  const evaluated = wins + losses;
  const winRate = evaluated > 0 ? +((wins / evaluated) * 100).toFixed(1) : 0;
  const totalPnl = +trades.reduce((acc, t) => acc + (t.pnl || 0), 0).toFixed(2);

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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Diário de Trades &bull; CandleX AI</h3>
              <p className="text-xs text-slate-400">Histórico de operações disparadas com a IA e estatísticas de assertividade</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {trades.length > 0 && (
              <>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                  title="Exportar dados para Excel/CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={onClearTrades}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                  title="Limpar histórico"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Stats Row */}
        <div className="bg-slate-950/40 px-5 py-3 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">Resultado Líquido (P&L)</div>
            <div
              className={`text-base font-black font-mono mt-0.5 ${
                totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {totalPnl >= 0 ? "+$" : "-$"}
              {Math.abs(totalPnl).toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">Taxa de Assertividade</div>
            <div className="text-base font-black font-mono mt-0.5 text-amber-400 flex items-center gap-1">
              <Award className="w-4 h-4 text-amber-400" />
              {winRate}%
            </div>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">Vitórias vs Derrotas</div>
            <div className="text-sm font-bold font-mono mt-0.5 text-slate-200">
              <span className="text-emerald-400">{wins} WIN</span> / <span className="text-rose-400">{losses} LOSS</span>
            </div>
          </div>

          <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
            <div className="text-[10px] text-slate-400">Total de Operações</div>
            <div className="text-sm font-bold font-mono mt-0.5 text-white">{totalTrades} trades</div>
          </div>
        </div>

        {/* Trade List Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {trades.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center text-slate-500">
              <BookOpen className="w-10 h-10 stroke-[1.5] mb-2 opacity-50" />
              <p className="text-sm font-semibold text-slate-400">Nenhuma operação registrada ainda</p>
              <p className="text-xs max-w-sm mt-1">
                Dispare ordens rápidas através dos botões CALL e PUT no painel da Hiove para alimentá-las automaticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {trades.map((trade) => {
                const isWin = trade.result === "WIN";
                const isLoss = trade.result === "LOSS";
                const isPending = trade.result === "PENDING";

                return (
                  <div
                    key={trade.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 flex-wrap transition-colors ${
                      isWin
                        ? "bg-emerald-950/20 border-emerald-500/30"
                        : isLoss
                        ? "bg-rose-950/20 border-rose-500/30"
                        : "bg-slate-950/70 border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-white text-xs ${
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
                      {/* Financial details */}
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

                      {/* Result Selector / Actions */}
                      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                        <button
                          onClick={() => handleWin(trade.id)}
                          className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                            isWin
                              ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                              : "text-slate-400 hover:text-emerald-400 hover:bg-slate-800"
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>WIN</span>
                        </button>
                        <button
                          onClick={() => handleLoss(trade.id)}
                          className={`px-2 py-1 rounded text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                            isLoss
                              ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                              : "text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>LOSS</span>
                        </button>
                        <button
                          onClick={() => onUpdateTradeResult(trade.id, "DRAW")}
                          className={`p-1 rounded text-xs transition-colors cursor-pointer ${
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

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>O CandleX AI sincroniza cada ordem com as metas da sua gestão de banca</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
