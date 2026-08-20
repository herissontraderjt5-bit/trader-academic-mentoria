import React, { useState } from 'react';
import { X, Calendar, RefreshCw } from 'lucide-react';

interface EconomicCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EconomicCalendarModal: React.FC<EconomicCalendarModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [iframeKey, setIframeKey] = useState(0);

  if (!isOpen) return null;

  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-5xl h-[85vh] bg-[#111118] border border-[#272737] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 bg-[#14141e] border-b border-[#242433] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 border border-orange-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">
                Calendário Econômico
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase mt-0.5">
                Acompanhe as notícias de alto impacto do mercado
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              title="Recarregar Calendário"
              className="p-2 rounded-xl bg-[#222230] text-zinc-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#222230] text-zinc-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body / Iframe Container */}
        <div className="flex-1 bg-[#12121a] relative p-1 sm:p-4">
          <iframe
            key={iframeKey}
            src="https://sslecal2.investing.com?columns=exc_flags,exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&features=datepicker,timezone&countries=110,17,29,25,32,6,37,36,26,5,22,39,14,48,10,35,7,43&calType=day&timeZone=12&lang=12"
            style={{ 
              width: '100%', 
              height: '100%', 
              border: 'none', 
              filter: 'invert(0.88) hue-rotate(180deg)' 
            }}
            title="Investing.com Economic Calendar"
          ></iframe>
        </div>
      </div>
    </div>
  );
};
