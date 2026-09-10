import React, { useState } from "react";
import { ExternalLink, RefreshCw, Layers, Monitor, AlertCircle } from "lucide-react";
import { TradeRecord } from "../../../types";

interface HioveBrokerFrameProps {
  activeTicker: string;
  onRecordTrade?: (trade: Omit<TradeRecord, "id" | "timestamp" | "result" | "pnl">) => void;
  lastAiDirection?: "CALL" | "PUT" | "NEUTRAL";
  currentPrice?: number;
  onSwitchChartEngine?: (engine: "TRADINGVIEW" | "HIOVE_REAL") => void;
}

export const HioveBrokerFrame: React.FC<HioveBrokerFrameProps> = ({
  activeTicker,
  onSwitchChartEngine,
}) => {
  const [iframeKey, setIframeKey] = useState<number>(0);
  const [showHelper, setShowHelper] = useState<boolean>(true);

  const cleanSymbol = activeTicker.toUpperCase();
  const hioveUrl = `https://app.hiove.com/traderoom?ticker=${cleanSymbol}`;

  const handleOpenPopup = () => {
    window.open(
      "https://app.hiove.com/traderoom",
      "hiove_traderoom_popup",
      "width=1320,height=840,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes"
    );
  };

  const handleOpenExternal = () => {
    window.open("https://app.hiove.com/traderoom", "_blank", "noopener,noreferrer");
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="relative flex-1 w-full h-full bg-[#0B0E14] overflow-hidden flex flex-col">
      {/* Top Traderoom Quick Navigation Bar */}
      <div className="bg-[#0e131d] border-b border-[#1b2333] px-3 py-2 flex items-center justify-between flex-wrap gap-2 text-xs flex-shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-black text-amber-400 font-mono text-[11px] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            HIOVE TRADEROOM OFICIAL
          </span>
          <span className="text-slate-600">&bull;</span>
          <span className="text-amber-300 font-mono font-bold text-[11px] bg-[#141A26] px-2 py-0.5 rounded border border-amber-500/30">
            {activeTicker}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {onSwitchChartEngine && (
            <button
              type="button"
              onClick={() => onSwitchChartEngine("TRADINGVIEW")}
              className="px-2.5 py-1 rounded-lg bg-[#141A26] hover:bg-[#1E2738] border border-[#263248] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] font-bold"
              title="Alternar para visualização com Gráfico TradingView"
            >
              <Monitor className="w-3.5 h-3.5 text-cyan-400" />
              <span>Gráfico TradingView</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleReload}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
            title="Recarregar tela da corretora"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Recarregar</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPopup}
            className="px-2.5 py-1 rounded-lg bg-[#182030] hover:bg-[#202c44] border border-amber-500/40 text-amber-300 font-bold text-[11px] uppercase flex items-center gap-1.5 shadow cursor-pointer transition-all"
            title="Abrir em janela flutuante independente otimizada para operações"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Janela Flutuante</span>
          </button>

          <button
            type="button"
            onClick={handleOpenExternal}
            className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#FF7A00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-[11px] uppercase flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            title="Abrir Hiove Traderoom em tela cheia em nova aba"
          >
            <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Abrir em Nova Aba</span>
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className="relative flex-1 w-full h-full bg-[#0B0E14] overflow-hidden">
        <iframe
          key={iframeKey}
          id="hiove-traderoom-iframe"
          src={hioveUrl}
          title={`Hiove Traderoom ${activeTicker}`}
          className="w-full h-full border-0 bg-[#0B0E14]"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
        />

        {/* Security / Iframe block notification helper */}
        {showHelper && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-md bg-[#0F1420]/95 backdrop-blur-md border border-amber-500/40 rounded-xl p-3 text-xs text-slate-300 shadow-[0_4px_20px_rgba(0,0,0,0.6)] z-20 flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <p className="font-bold text-white text-[11px] leading-tight">
                Dica para visualização da Corretora:
              </p>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Se o quadro acima exibir tela preta devido às políticas de segurança do seu navegador, abra a Hiove em <strong className="text-amber-400">Janela Flutuante</strong> ou <strong className="text-amber-400">Nova Aba</strong>. O Auto Trader continuará enviando ordens automaticamente via API!
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenPopup}
                  className="px-2 py-0.5 bg-amber-500 text-slate-950 font-bold text-[10px] rounded cursor-pointer hover:bg-amber-400"
                >
                  Abrir Janela Flutuante
                </button>
                <button
                  type="button"
                  onClick={() => setShowHelper(false)}
                  className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[10px] rounded hover:text-white cursor-pointer"
                >
                  Ocultar Aviso
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
