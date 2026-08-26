import React from "react";
import { X, Sliders, CheckCircle2, Eye, EyeOff } from "lucide-react";

interface IndicatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showEMAs: boolean;
  onToggleEMAs: () => void;
  showBollinger: boolean;
  onToggleBollinger: () => void;
  showLevels: boolean;
  onToggleLevels: () => void;
  showVolume: boolean;
  onToggleVolume: () => void;
}

export const IndicatorsModal: React.FC<IndicatorsModalProps> = ({
  isOpen,
  onClose,
  showEMAs,
  onToggleEMAs,
  showBollinger,
  onToggleBollinger,
  showLevels,
  onToggleLevels,
  showVolume,
  onToggleVolume,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0E121B] border border-[#1E2638] rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E2638] flex items-center justify-between bg-[#121622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-[#FF7A00]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Indicadores Técnicos (fx)
              </h2>
              <p className="text-xs text-slate-400">
                Ative ou desative sobreposições visuais no gráfico
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

        {/* List of Indicators */}
        <div className="p-5 space-y-3">
          {/* EMAs */}
          <div
            onClick={onToggleEMAs}
            className="flex items-center justify-between p-3 rounded-xl bg-[#121622] border border-[#1E2638] hover:border-slate-600 cursor-pointer transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-white">Médias Móveis (EMA 9 & EMA 20)</div>
              <div className="text-[10px] text-slate-400">Rastreamento de tendência e cruzamentos rápidos</div>
            </div>
            <div className={`p-1.5 rounded-lg ${showEMAs ? "bg-[#FF7A00] text-slate-950" : "bg-slate-800 text-slate-500"}`}>
              {showEMAs ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </div>
          </div>

          {/* Bollinger */}
          <div
            onClick={onToggleBollinger}
            className="flex items-center justify-between p-3 rounded-xl bg-[#121622] border border-[#1E2638] hover:border-slate-600 cursor-pointer transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-white">Bandas de Bollinger (20, 2.0)</div>
              <div className="text-[10px] text-slate-400">Canais de volatilidade e exaustão de preço</div>
            </div>
            <div className={`p-1.5 rounded-lg ${showBollinger ? "bg-[#FF7A00] text-slate-950" : "bg-slate-800 text-slate-500"}`}>
              {showBollinger ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </div>
          </div>

          {/* Suporte & Resistência */}
          <div
            onClick={onToggleLevels}
            className="flex items-center justify-between p-3 rounded-xl bg-[#121622] border border-[#1E2638] hover:border-slate-600 cursor-pointer transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-white">Zonas de Suporte & Resistência / SMC</div>
              <div className="text-[10px] text-slate-400">Regiões institucionais de gatilho e FVG</div>
            </div>
            <div className={`p-1.5 rounded-lg ${showLevels ? "bg-[#FF7A00] text-slate-950" : "bg-slate-800 text-slate-500"}`}>
              {showLevels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </div>
          </div>

          {/* Volume */}
          <div
            onClick={onToggleVolume}
            className="flex items-center justify-between p-3 rounded-xl bg-[#121622] border border-[#1E2638] hover:border-slate-600 cursor-pointer transition-colors"
          >
            <div>
              <div className="text-xs font-bold text-white">Barras de Volume Relativo</div>
              <div className="text-[10px] text-slate-400">Intensidade de agressão compradora e vendedora</div>
            </div>
            <div className={`p-1.5 rounded-lg ${showVolume ? "bg-[#FF7A00] text-slate-950" : "bg-slate-800 text-slate-500"}`}>
              {showVolume ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2638] flex items-center justify-end bg-[#121622]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-[#FF7A00] text-slate-950 font-black text-xs hover:bg-[#FFA022] transition-colors cursor-pointer"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};
