import React, { useState, useEffect, useRef } from 'react';
import { Bot, Activity, Target, Zap, ShieldCheck, Radar, ShieldAlert, CheckCircle2, ChevronRight, Cpu } from 'lucide-react';
import { AiAnalysisResult, AutoTraderConfig, TradeRecord } from '../../../types';

interface AutoTraderVisualizerOverlayProps {
  config: AutoTraderConfig;
  activeTicker: string;
  timeframe: string;
  latestAnalysis: AiAnalysisResult | null;
  onTriggerAnalysis: () => void;
  onExecuteTrade: (direction: 'CALL' | 'PUT', stake: number) => void;
}

export const AutoTraderVisualizerOverlay: React.FC<AutoTraderVisualizerOverlayProps> = ({
  config,
  activeTicker,
  timeframe,
  latestAnalysis,
  onTriggerAnalysis,
  onExecuteTrade
}) => {
  const [status, setStatus] = useState<'IDLE' | 'ANALYZING' | 'EXECUTING'>('IDLE');
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const addLog = (msg: string) => {
    setLogs(prev => {
      const newLogs = [...prev, `[${new Date().toLocaleTimeString('pt-BR')}] ${msg}`];
      if (newLogs.length > 8) return newLogs.slice(newLogs.length - 8);
      return newLogs;
    });
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Main loop
  useEffect(() => {
    if (!config.enabled) return;
    
    addLog('ROBÔ AUTO TRADER INICIADO');
    addLog(`Conectado ao ativo: ${activeTicker} (${timeframe})`);
    
    let interval: NodeJS.Timeout;
    
    const runCycle = () => {
      setStatus('ANALYZING');
      addLog('Iniciando varredura neural profunda...');
      onTriggerAnalysis();
      
      // We will react to the analysis result in the other useEffect
      setTimeout(() => {
        setStatus(prev => {
          if (prev === 'ANALYZING') {
             addLog('Aguardando próxima janela de operação...');
             return 'IDLE';
          }
          return prev;
        });
      }, 5000);
    };

    // Run first cycle after 3s
    setTimeout(runCycle, 3000);
    
    // Then run every 60 seconds
    interval = setInterval(runCycle, 60000);
    
    return () => clearInterval(interval);
  }, [config.enabled, activeTicker, timeframe]);

  // React to analysis results
  useEffect(() => {
    if (!config.enabled || !latestAnalysis || status !== 'ANALYZING') return;

    if (latestAnalysis.signal === 'CALL' || latestAnalysis.signal === 'PUT') {
      const conf = latestAnalysis.confidence || 0;
      addLog(`Sinal Detectado: ${latestAnalysis.signal} com precisão de ${conf}%`);
      
      if (conf >= 70) {
        setStatus('EXECUTING');
        addLog(`EXECUTANDO ORDEM ${latestAnalysis.signal} - Valor: $${config.stakeAmount}`);
        
        setTimeout(() => {
          onExecuteTrade(latestAnalysis.signal as 'CALL' | 'PUT', config.stakeAmount || 50);
          addLog('Ordem executada com sucesso. Proteção de capital ativada.');
          setStatus('IDLE');
        }, 3000);
      } else {
        addLog('Sinal descartado. Precisão abaixo da margem de segurança do Auto Trader.');
        setStatus('IDLE');
      }
    } else {
      addLog('Nenhuma oportunidade clara identificada. Padrão NEUTRO.');
      setStatus('IDLE');
    }
  }, [latestAnalysis]);

  if (!config.enabled) return null;

  return (
    <div className="absolute top-4 right-4 z-40 w-80 rounded-2xl bg-[#08080a]/90 backdrop-blur-xl border border-[#ff6b00]/30 shadow-[0_0_40px_-10px_rgba(255,107,0,0.3)] overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#ff6b00]/20 to-transparent p-3 flex items-center gap-3 border-b border-[#ff6b00]/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,107,0,0.1)_50%,transparent_100%)] translate-x-[-100%] animate-[shimmer_2s_infinite]" />
        
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-[#111116] border border-[#ff6b00]/50 flex items-center justify-center relative z-10">
            <Bot className="w-5 h-5 text-[#ff8800]" />
          </div>
          {status === 'ANALYZING' && (
            <div className="absolute inset-0 rounded-full bg-[#ff6b00] animate-ping opacity-20" />
          )}
        </div>
        
        <div>
          <h3 className="text-[#ff8800] font-black text-xs tracking-wider uppercase flex items-center gap-1.5">
            Auto Trader IA
            <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400 animate-pulse" />
          </h3>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ONLINE & OPERANDO
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-4">
        {/* Radar / Status Area */}
        <div className="relative h-32 rounded-xl bg-[#0c0c10] border border-white/5 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20"
               style={{ backgroundImage: 'radial-gradient(circle at center, #ff6b00 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
               
          {status === 'IDLE' && (
            <div className="flex flex-col items-center text-center z-10">
              <ShieldCheck className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
              <span className="text-xs text-emerald-400 font-bold tracking-widest uppercase animate-pulse">Aguardando Padrões</span>
            </div>
          )}

          {status === 'ANALYZING' && (
            <>
              {/* Spinning Radar */}
              <div className="absolute w-full h-full animate-[spin_3s_linear_infinite]">
                <div className="w-1/2 h-1/2 bg-gradient-to-tr from-[#ff6b00]/40 to-transparent origin-bottom-right" />
              </div>
              <div className="flex flex-col items-center text-center z-10">
                <Radar className="w-8 h-8 text-[#ff8800] mb-2 animate-pulse" />
                <span className="text-xs text-[#ff8800] font-bold tracking-widest uppercase">Analisando Fluxo</span>
              </div>
            </>
          )}

          {status === 'EXECUTING' && (
            <div className="absolute inset-0 bg-[#ff6b00]/10 flex flex-col items-center justify-center z-10">
              <div className="w-full h-1 bg-[#ff6b00]/30 absolute top-0 overflow-hidden">
                <div className="h-full bg-[#ff6b00] animate-[progress_3s_ease-in-out_forwards]" />
              </div>
              <Target className="w-10 h-10 text-[#ff8800] mb-2 animate-[ping_1s_infinite]" />
              <span className="text-[10px] text-white font-black tracking-widest uppercase bg-[#ff6b00] px-2 py-0.5 rounded shadow-[0_0_15px_rgba(255,107,0,0.8)]">
                Executando Ordem
              </span>
            </div>
          )}
        </div>

        {/* Matrix Terminal Logs */}
        <div className="h-28 bg-black rounded-lg border border-[#222] p-2 overflow-y-auto font-mono text-[9px] leading-relaxed shadow-inner">
          {logs.map((log, i) => (
            <div key={i} className="text-emerald-500/80 mb-1 flex items-start gap-1.5">
              <ChevronRight className="w-3 h-3 shrink-0 text-emerald-500 opacity-50 mt-0.5" />
              <span className="opacity-90">{log}</span>
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>
      
      {/* Footer stats */}
      <div className="bg-[#111116] p-2 border-t border-[#ff6b00]/10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
          <Cpu className="w-3 h-3 text-[#ff6b00]" />
          <span>Motor IA: <span className="text-[#ff8800] font-bold">V4 Neural</span></span>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
          <CheckCircle2 className="w-3 h-3" />
          <span>Proteção Ativa</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  );
};
