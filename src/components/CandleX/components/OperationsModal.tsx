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
  const winRate =
    totalTrades > 0 ? +((wins / (wins + losses || 1)) * 100).toFixed(1) : 0;
  const totalPnL = trades.reduce((acc, t) => acc + (t.pnl || 0), 0);

  const handleExportCSV = () => {
    if (trades.length === 0) return;
    const header = "ID,Timestamp,Ticker,Direction,Stake,Payout,Result,PnL\n";
    const rows = trades
      .map(
        (t) =>
          `${t.id},${new Date(t.timestamp).toISOString()},${t.ticker},${
            t.direction
          },${t.stake},${t.payoutPercent},${t.result},${t.pnl}`
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `candlex_trades_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0E121B] border border-[#1E2638] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E2638] flex items-center justify-between bg-[#121622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-[#FF7A00]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Operações & Diário de Trades
              </h2>
              <p className="text-xs text-slate-400">
                Histórico detalhado de ordens disparadas e assertividade
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
        <div className="grid grid-cols-4 gap-2 p-4 bg-[#090C12] border-b border-[#1E2638]">
          <div className="bg-[#121622] p-2.5 rounded-xl border border-[#1E2638]">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Total de Ordens
            </div>
            <div className="text-xl font-black font-mono text-white mt-0.5">
              {totalTrades}
            </div>
          </div>
          <div className="bg-[#121622] p-2.5 rounded-xl border border-[#1E2638]">
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
          <div className="bg-[#121622] p-2.5 rounded-xl border border-[#1E2638]">
            <div className="text-[10px] uppercase font-bold text-slate-400">
              Placar (W / L)
            </div>
            <div className="text-xl font-black font-mono text-white mt-0.5 flex items-center gap-1.5">
              <span className="text-emerald-400">{wins}W</span>
              <span className="text-slate-500">/</span>
              <span className="text-rose-400">{losses}L</span>
            </div>
          </div>
          <div className="bg-[#121622] p-2.5 rounded-xl border border-[#1E2638]">
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
        <div className="flex-1 overflow-y-auto p-4">
          {trades.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-30 text-[#FF7A00]" />
              <p className="text-sm font-semibold">Nenhuma operação registrada ainda.</p>
              <p className="text-xs text-slate-600 mt-1">
                Dispare ordens COMPRAR ou VENDER no painel da direita para alimentá-lo.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {trades.map((trade) => (
                <div
                  key={trade.id}
                  className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-black ${
                        trade.direction === "CALL"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      }`}
                    >
                      {trade.direction === "CALL" ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{trade.ticker}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                          {trade.expiryMinutes}M
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {new Date(trade.timestamp).toLocaleTimeString("pt-BR")} &bull; Entrada: ${trade.entryPrice.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold font-mono text-white">
                        ${trade.stake.toFixed(2)}
                      </div>
                      <div
                        className={`text-[10px] font-mono font-bold ${
                          trade.result === "WIN"
                            ? "text-emerald-400"
                            : trade.result === "LOSS"
                            ? "text-rose-400"
                            : "text-amber-400"
                        }`}
                      >
                        {trade.result === "WIN"
                          ? `+${trade.pnl.toFixed(2)}`
                          : trade.result === "LOSS"
                          ? `-${trade.stake.toFixed(2)}`
                          : "PENDENTE"}
                      </div>
                    </div>

                    {/* Result buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onUpdateTradeResult(trade.id, "WIN")}
                        className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          trade.result === "WIN"
                            ? "bg-emerald-500 text-slate-950 font-black"
                            : "bg-slate-800 text-emerald-400 hover:bg-emerald-500/20"
                        }`}
                      >
                        WIN
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateTradeResult(trade.id, "LOSS")}
                        className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                          trade.result === "LOSS"
                            ? "bg-rose-500 text-white font-black"
                            : "bg-slate-800 text-rose-400 hover:bg-rose-500/20"
                        }`}
                      >
                        LOSS
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2638] flex items-center justify-between bg-[#121622]">
          <button
            type="button"
            onClick={onClearTrades}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 disabled:opacity-40 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar Diário</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={trades.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1C2436] hover:bg-[#253048] text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Relatório CSV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
