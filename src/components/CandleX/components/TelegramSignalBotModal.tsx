import React from "react";
import {
  X,
  Send,
  Power,
  Settings,
  Activity,
  AlertTriangle
} from "lucide-react";
import { SignalBotConfig, SignalBotSession } from "../../../types";

interface TelegramSignalBotModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SignalBotConfig;
  onChangeConfig: (newConfig: SignalBotConfig) => void;
  session: SignalBotSession;
}

export const TelegramSignalBotModal: React.FC<TelegramSignalBotModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  session,
}) => {
  if (!isOpen) return null;

  const isRunning = config.enabled;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: "#0d1410",
          border: "2px solid rgba(0, 136, 204, 0.35)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(0, 136, 204, 0.15)",
        }}
      >
        {/* Top Accent Border */}
        <div
          className="h-1.5 w-full"
          style={{
            background: "linear-gradient(90deg, #005580 0%, #0088cc 50%, #33ccff 100%)",
          }}
        />

        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-7 py-5 border-b"
          style={{ borderColor: "rgba(0, 136, 204, 0.2)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#0088cc]/20 text-[#0088cc]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2
                className="text-xl font-black tracking-wider uppercase"
                style={{
                  color: "#0088cc",
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  letterSpacing: "1.5px",
                }}
              >
                MODO SINAIS TELEGRAM
              </h2>
              <p className="text-xs text-blue-200/60 tracking-wide">
                Geração automática via IA CandleX
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-7 space-y-6">
          
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-5 rounded-xl bg-black/40 border border-[#0088cc]/20">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#0088cc]" />
                Status do Gerador
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                {isRunning ? "O bot está analisando ativamente as oportunidades e enviando para o Telegram." : "O envio automático está pausado."}
              </p>
            </div>
            <button
              onClick={() => onChangeConfig({ ...config, enabled: !config.enabled })}
              className={`px-6 py-3 rounded-xl font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto ${
                isRunning
                  ? "bg-rose-900/30 text-rose-400 border border-rose-500/40 hover:bg-rose-900/50"
                  : "bg-[#0088cc] text-white hover:bg-[#0099e6] border border-transparent shadow-[#0088cc]/30"
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isRunning ? "PAUSAR" : "INICIAR BOT"}</span>
            </button>
          </div>

          {/* Configs */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-widest uppercase text-blue-200/70 flex items-center gap-2">
              <Settings className="w-4 h-4" /> Critérios de Disparo
            </h3>

            <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300">Confiança Mínima da IA</label>
                <span className="text-sm font-bold text-[#0088cc]">{config.minAiConfidence}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                value={config.minAiConfidence}
                onChange={(e) => onChangeConfig({ ...config, minAiConfidence: parseInt(e.target.value) })}
                className="w-full accent-[#0088cc]"
                disabled={isRunning}
              />
              <p className="text-[10px] text-zinc-500">
                Apenas análises com score acima deste valor serão enviadas.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-3">
              <label className="text-xs font-bold text-zinc-300 block">Timeframes de Escaneamento</label>
              <div className="flex gap-2">
                {['1m', '2m', '5m'].map(tf => {
                  const isSelected = config.timeframes.includes(tf);
                  return (
                    <button
                      key={tf}
                      disabled={isRunning}
                      onClick={() => {
                        const newTfs = isSelected
                          ? config.timeframes.filter(t => t !== tf)
                          : [...config.timeframes, tf];
                        if (newTfs.length > 0) { // Prevent empty selection
                          onChangeConfig({ ...config, timeframes: newTfs });
                        }
                      }}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                        isSelected
                          ? 'bg-[#0088cc] text-white'
                          : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
                      }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-500">
                O bot irá escanear todos os ativos nestes tempos gráficos simultaneamente.
              </p>
            </div>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                Sinais Enviados
              </span>
              <span className="text-2xl font-black text-white">{session.signalsGenerated}</span>
            </div>
            <div className="p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                Taxa de Acerto (WIN)
              </span>
              <span className="text-2xl font-black text-emerald-400">
                {session.signalsGenerated > 0 
                  ? Math.round((session.wins / session.signalsGenerated) * 100) 
                  : 0}%
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-amber-200/80 text-[10px] flex gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <p>
              Os sinais são enviados para o grupo do Telegram configurado no painel administrativo.
              Certifique-se de que os turnos de operação e ativos permitidos estão ajustados lá.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
