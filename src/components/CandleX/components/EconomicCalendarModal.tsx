import React from "react";
import { X, Calendar, AlertCircle, Flame, Clock } from "lucide-react";

interface EconomicCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ECONOMIC_EVENTS = [
  {
    time: "15:30",
    currency: "USD",
    impact: 3,
    title: "IPC / CPI (Índice de Preços ao Consumidor)",
    forecast: "3.1%",
    previous: "3.2%",
  },
  {
    time: "16:00",
    currency: "USD",
    impact: 2,
    title: "Discurso do Membro do FOMC",
    forecast: "-",
    previous: "-",
  },
  {
    time: "17:30",
    currency: "USD",
    impact: 2,
    title: "Estoques de Petróleo Bruto",
    forecast: "-1.2M",
    previous: "+2.1M",
  },
  {
    time: "19:00",
    currency: "EUR",
    impact: 1,
    title: "Confiança do Consumidor da Zona do Euro",
    forecast: "-14.2",
    previous: "-15.0",
  },
  {
    time: "21:30",
    currency: "JPY",
    impact: 3,
    title: "Decisão da Taxa de Juros do BoJ",
    forecast: "0.25%",
    previous: "0.25%",
  },
];

export const EconomicCalendarModal: React.FC<EconomicCalendarModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0E121B] border border-[#1E2638] rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E2638] flex items-center justify-between bg-[#121622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#FF7A00]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">
                Calendário Econômico & Notícias
              </h2>
              <p className="text-xs text-slate-400">
                Eventos de alto impacto com risco de volatilidade e rompimento
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

        {/* Content Table */}
        <div className="p-5 space-y-3 overflow-y-auto max-h-[65vh]">
          <div className="text-xs text-amber-400 bg-amber-950/30 border border-amber-500/30 p-2.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              Atenção: Evite entradas de 1 minuto 5 minutos antes e 5 minutos após notícias de 3 Touros (Alto Impacto).
            </span>
          </div>

          <div className="space-y-2">
            {ECONOMIC_EVENTS.map((event, idx) => (
              <div
                key={idx}
                className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="text-center font-mono font-bold text-slate-300 w-12">
                    <Clock className="w-3.5 h-3.5 mx-auto mb-0.5 text-slate-500" />
                    {event.time}
                  </div>
                  <div className="w-9 h-6 rounded bg-[#1C2436] font-bold text-white font-mono flex items-center justify-center text-[11px]">
                    {event.currency}
                  </div>
                  <div>
                    <div className="font-bold text-white">{event.title}</div>
                    <div className="text-[10px] text-slate-400">
                      Previsto: {event.forecast} &bull; Anterior: {event.previous}
                    </div>
                  </div>
                </div>

                {/* Impact Bulls */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3].map((star) => (
                    <span
                      key={star}
                      className={`text-xs ${
                        star <= event.impact
                          ? event.impact === 3
                            ? "text-rose-500 font-bold"
                            : "text-[#FF7A00]"
                          : "text-slate-700"
                      }`}
                    >
                      🐂
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2638] flex items-center justify-end bg-[#121622]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
