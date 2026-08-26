import React from "react";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  ShieldAlert,
  Target,
  Zap,
  Volume2,
  RefreshCw,
  Award,
  Layers,
  ArrowRight,
  Info,
} from "lucide-react";
import { AiAnalysisResult, TechnicalIndicators } from "../../../types";
import { soundManager } from "../utils/soundEffects";

interface AiAnalysisPanelProps {
  analysis: AiAnalysisResult | null;
  indicators: TechnicalIndicators | null;
  isAnalyzing: boolean;
  onManualAnalyze: () => void;
  activeTicker: string;
  currentPrice: number;
}

export const AiAnalysisPanel: React.FC<AiAnalysisPanelProps> = ({
  analysis,
  indicators,
  isAnalyzing,
  onManualAnalyze,
  activeTicker,
  currentPrice,
}) => {
  const handleSpeakAnalysis = () => {
    if (!analysis) return;
    const text = `Sinal CandleX AI para ${activeTicker}: ${
      analysis.direction === "CALL" ? "Sinal de Compra e Alta" : analysis.direction === "PUT" ? "Sinal de Venda e Baixa" : "Aguardar confirmação"
    }. Confluência de ${analysis.confidenceScore} por cento. Expiração recomendada: ${analysis.timeframeExpiry}. ${analysis.hioveQuickTip}`;
    soundManager.speakAlert(text);
  };

  const isCall = analysis?.direction === "CALL";
  const isPut = analysis?.direction === "PUT";
  const isNeutral = !isCall && !isPut;

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-slate-900/90 px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              Confluência CandleX AI
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                GEMINI 3.7
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">Análise Quantitativa & Price Action Institucional</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {analysis && (
            <button
              onClick={handleSpeakAnalysis}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              title="Ouvir análise com Voz Neural da IA"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={onManualAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
            <span>{isAnalyzing ? "Calculando..." : "Atualizar"}</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
        {/* Main Signal Banner */}
        {analysis ? (
          <div
            className={`rounded-xl p-3.5 border relative overflow-hidden transition-all shadow-xl ${
              isCall
                ? "bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-500/40 shadow-emerald-950/40"
                : isPut
                ? "bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border-rose-500/40 shadow-rose-950/40"
                : "bg-slate-900/80 border-slate-800"
            }`}
          >
            {/* Top Badge & Score */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    isCall
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : isPut
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}
                >
                  {isCall ? "▲ SINAL DE ALTA (CALL)" : isPut ? "▼ SINAL DE BAIXA (PUT)" : "AGUARDAR CONFIRMAÇÃO"}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {analysis.marketSentiment.replace("_", " ")}
                </span>
              </div>

              {/* Confidence Gauge */}
              <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
                <Award className={`w-3.5 h-3.5 ${isCall ? "text-emerald-400" : isPut ? "text-rose-400" : "text-amber-400"}`} />
                <span className="text-[11px] text-slate-400 font-medium">Confluência:</span>
                <span
                  className={`text-sm font-black font-mono ${
                    analysis.confidenceScore >= 80
                      ? "text-emerald-400"
                      : analysis.confidenceScore >= 60
                      ? "text-amber-400"
                      : "text-slate-400"
                  }`}
                >
                  {analysis.confidenceScore}%
                </span>
              </div>
            </div>

            {/* Strategy Title */}
            <h3 className="text-sm font-bold text-white mb-1.5 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              {analysis.strategyName}
            </h3>

            {/* AI Rationale Summary */}
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 mb-2.5">
              {analysis.rationale}
            </p>

            {/* Key Action Zones */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mb-0.5">
                  <Target className="w-3 h-3 text-cyan-400" />
                  Zona de Gatilho / Entrada
                </div>
                <div className="font-mono font-bold text-white text-[11px]">{analysis.triggerZone}</div>
              </div>

              <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium mb-0.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Expiração Recomendada
                </div>
                <div className="font-mono font-bold text-amber-300 text-[11px]">{analysis.timeframeExpiry}</div>
              </div>
            </div>

            {/* Hiove Quick Order Tip */}
            <div className="mt-2.5 bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-2 flex items-start gap-2 text-xs text-indigo-200">
              <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block text-[11px]">Dica de Execução na Hiove:</strong>
                <span className="text-[11px] leading-snug">{analysis.hioveQuickTip}</span>
              </div>
            </div>

            {/* Detected Patterns Pills */}
            {analysis.detectedPatterns && analysis.detectedPatterns.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {analysis.detectedPatterns.map((pattern, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] font-medium bg-slate-950/90 text-slate-300 px-2 py-0.5 rounded border border-slate-800"
                  >
                    &bull; {pattern}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/60 rounded-xl p-6 border border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Iniciando Varredura Algorítmica</h4>
            <p className="text-xs text-slate-400 max-w-xs mb-3">
              O CandleX AI está calculando médias móveis, RSI, MACD e zonas de liquidez para emitir confluência.
            </p>
            <button
              onClick={onManualAnalyze}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer"
            >
              Analisar Mercado
            </button>
          </div>
        )}

        {/* Technical Indicators Matrix Grid */}
        {indicators && (
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div className="text-xs font-bold text-slate-200 mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Matriz Técnica em Tempo Real
              </span>
              <span className="text-[10px] text-slate-400 font-mono">14 Períodos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {/* RSI (14) */}
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400">RSI (14)</div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="font-mono font-black text-sm text-white">{indicators.rsi}</span>
                  <span
                    className={`text-[9px] font-bold px-1 rounded ${
                      indicators.rsi >= 70
                        ? "bg-rose-500/20 text-rose-300"
                        : indicators.rsi <= 30
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {indicators.rsiStatus}
                  </span>
                </div>
              </div>

              {/* MACD */}
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400">MACD Histograma</div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span
                    className={`font-mono font-black text-sm ${
                      indicators.macdHist >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {indicators.macdHist > 0 ? "+" : ""}
                    {indicators.macdHist}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">12, 26, 9</span>
                </div>
              </div>

              {/* Estocástico */}
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Estocástico %K</div>
                <div className="flex items-baseline justify-between mt-0.5">
                  <span className="font-mono font-black text-sm text-white">{indicators.stochK}</span>
                  <span className="text-[9px] text-slate-500 font-mono">%D: {indicators.stochD}</span>
                </div>
              </div>

              {/* EMA 9 / EMA 20 */}
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400">EMA 9 / EMA 20</div>
                <div className="mt-0.5 font-mono text-[11px] text-slate-200">
                  <span className="text-cyan-400 font-bold">${indicators.ema9}</span> /{" "}
                  <span className="text-amber-400">${indicators.ema20}</span>
                </div>
              </div>

              {/* Suporte Fractal */}
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Suporte M1</div>
                <div className="mt-0.5 font-mono font-bold text-emerald-400 text-xs">${indicators.support}</div>
              </div>

              {/* Resistência Fractal */}
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                <div className="text-[10px] text-slate-400">Resistência M1</div>
                <div className="mt-0.5 font-mono font-bold text-rose-400 text-xs">${indicators.resistance}</div>
              </div>
            </div>

            {/* Current Candlestick Pattern Detection */}
            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">Padrão de Candle:</span>
              <span className="font-bold text-indigo-300 text-[11px]">{indicators.candlestickPattern}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
