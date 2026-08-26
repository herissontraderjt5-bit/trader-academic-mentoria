import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Scan,
  Upload,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Layers,
  AlertCircle,
  FileImage,
  RefreshCw,
} from "lucide-react";
import { VisionAnalysisResult } from "../../../types";

interface AiChartVisionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeTicker: string;
  isEmbedded?: boolean;
}

export const AiChartVisionModal: React.FC<AiChartVisionModalProps> = ({
  isOpen = true,
  onClose,
  activeTicker,
  isEmbedded = false,
}) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [result, setResult] = useState<VisionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Support Ctrl+V clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen && !isEmbedded) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64 = event.target?.result as string;
              setImagePreview(base64);
              analyzeImage(base64);
            };
            reader.readAsDataURL(blob);
          }
          break;
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isOpen, isEmbedded]);

  if (!isOpen && !isEmbedded) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImagePreview(base64);
        analyzeImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (base64Data: string) => {
    setIsScanning(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/screen-chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          ticker: activeTicker,
        }),
      });

      const data = await response.json();
      if (data.success && data.result) {
        setResult(data.result);
      } else {
        throw new Error(data.error || "Falha ao escanear a imagem do gráfico.");
      }
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o Gemini Vision.");
    } finally {
      setIsScanning(false);
    }
  };

  const isCall = result?.direction === "CALL";
  const isPut = result?.direction === "PUT";

  const content = (
    <div className="flex flex-col h-full bg-slate-950 select-none overflow-y-auto p-5 space-y-4 text-xs">
      <div className="max-w-4xl mx-auto w-full space-y-4">
        {/* Drop / Paste Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            imagePreview
              ? "border-indigo-500/50 bg-slate-900/60"
              : "border-slate-700/80 hover:border-indigo-400 bg-slate-900/40 hover:bg-slate-900/80"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {imagePreview ? (
            <div className="flex flex-col items-center gap-3">
              <img
                src={imagePreview}
                alt="Chart Screenshot"
                className="max-h-64 rounded-xl border border-slate-700 object-contain shadow-lg"
              />
              <span className="text-xs text-indigo-300 font-semibold">
                Clique ou cole outra imagem (Ctrl + V) para analisar novamente
              </span>
            </div>
          ) : (
            <div className="py-8 flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-slate-100">
                Pressione <kbd className="px-2 py-0.5 bg-slate-800 rounded-lg border border-slate-700 text-white font-mono text-xs">Ctrl + V</kbd> para colar o print
              </div>
              <div className="text-xs text-slate-400 mt-1.5">
                ou clique nesta área para selecionar uma imagem da corretora Hiove
              </div>
            </div>
          )}
        </div>

        {/* Scanning Progress */}
        {isScanning && (
          <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center flex flex-col items-center justify-center animate-pulse shadow-md">
            <RefreshCw className="w-9 h-9 text-indigo-400 animate-spin mb-3" />
            <div className="text-sm font-bold text-white">CandleX AI Vision Analisando Padrões...</div>
            <div className="text-xs text-slate-400 mt-1">
              Identificando formato de velas, rejeições de pavio, suportes e zonas de confluência
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-rose-950/50 border border-rose-500/40 p-4 rounded-2xl text-rose-300 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Vision Analysis Result */}
        {result && (
          <div
            className={`rounded-2xl p-5 border space-y-3.5 shadow-xl ${
              isCall
                ? "bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-950 border-emerald-500/40"
                : isPut
                ? "bg-gradient-to-br from-rose-950/50 via-slate-900 to-slate-950 border-rose-500/40"
                : "bg-slate-900 border-slate-800"
            }`}
          >
            {/* Top Direction Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <span
                  className={`text-xs font-black uppercase px-3 py-1.5 rounded-xl shadow-md ${
                    isCall
                      ? "bg-emerald-500 text-slate-950 font-black"
                      : isPut
                      ? "bg-rose-500 text-white font-black"
                      : "bg-slate-800 text-slate-200 font-bold"
                  }`}
                >
                  {isCall ? "▲ COMPRA / CALL" : isPut ? "▼ VENDA / PUT" : "AGUARDAR"}
                </span>
                <span className="text-xs text-slate-200 font-bold">
                  Confluência Visual: <strong className="text-white font-mono text-sm">{result.confidenceScore}%</strong>
                </span>
              </div>

              <div className="flex items-center gap-1 text-amber-300 font-mono font-bold text-xs bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
                <Clock className="w-3.5 h-3.5" />
                <span>Expiração Recomendada: {result.executionTimeframe}</span>
              </div>
            </div>

            {/* Action summary */}
            <div className="bg-slate-950/90 p-4 rounded-xl border border-slate-800/80">
              <div className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Parecer Técnico do Gemini Multimodal
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{result.recommendedAction}</p>
            </div>

            {/* Grid details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-medium">Fluxo & Tendência</span>
                <span className="text-slate-100 font-semibold">{result.trendAnalysis}</span>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[10px] text-slate-400 block font-medium">Zonas & Liquidez</span>
                <span className="text-slate-100 font-semibold">{result.keyZonesIdentified}</span>
              </div>
            </div>

            {/* Visual Patterns pills */}
            {result.detectedVisualPatterns && result.detectedVisualPatterns.length > 0 && (
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Padrões Visuais Detectados:</span>
                <div className="flex flex-wrap gap-1.5">
                  {result.detectedVisualPatterns.map((p, i) => (
                    <span
                      key={i}
                      className="bg-slate-950 text-indigo-300 font-semibold px-2.5 py-1 rounded-lg border border-slate-800 text-[11px]"
                    >
                      &bull; {p}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Scan className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">CandleX AI Vision &bull; Leitor de Print</h3>
              <p className="text-xs text-slate-400">Cole (Ctrl+V) ou envie um print para análise visual instantânea</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden">{content}</div>
      </div>
    </div>
  );
};
