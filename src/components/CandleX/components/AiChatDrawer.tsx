import React, { useState, useRef, useEffect } from "react";
import {
  X,
  BotMessageSquare,
  Send,
  Sparkles,
  User,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { AiAnalysisResult, TechnicalIndicators } from "../../../types";

interface AiChatDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
  activeTicker: string;
  currentAnalysis: AiAnalysisResult | null;
  indicators: TechnicalIndicators | null;
  isEmbedded?: boolean;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  time: string;
}

const PRESET_QUESTIONS = [
  "Qual a confluência mais forte para ETH/USDT agora?",
  "Quando devo entrar na retração de M1?",
  "Como proteger meu capital usando Soros Nível 2?",
  "Qual a diferença entre Martelo e Pinbar de Rejeição?",
  "Explique a confluência com Fair Value Gap (FVG)",
];

export const AiChatDrawer: React.FC<AiChatDrawerProps> = ({
  isOpen = true,
  onClose,
  activeTicker,
  currentAnalysis,
  indicators,
  isEmbedded = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: `Olá! Sou o Mentor CandleX AI. Estou monitorando o par ${activeTicker} em tempo real para você. Como posso te auxiliar com suas estratégias, gatilhos de entrada ou Price Action hoje?`,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isOpen && !isEmbedded) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      role: "user",
      text: query,
      time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          context: {
            activeTicker,
            direction: currentAnalysis?.direction,
            confidence: currentAnalysis?.confidenceScore,
            rsi: indicators?.rsi,
            pattern: indicators?.candlestickPattern,
            trend: indicators?.trend,
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.reply,
            time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        throw new Error(data.error || "Sem resposta da IA.");
      }
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Desculpe, ocorreu uma oscilação na conexão com o servidor. Por favor, tente novamente.",
          time: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-950 select-none overflow-hidden">
      {/* Preset Strategy Prompts */}
      <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs no-scrollbar">
        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 ml-1" />
        {PRESET_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="whitespace-nowrap px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-900/60 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs max-w-4xl mx-auto w-full">
        {messages.map((msg, idx) => {
          const isMe = msg.role === "user";
          return (
            <div key={idx} className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 font-bold ${
                  isMe ? "bg-indigo-600 text-white" : "bg-purple-900/50 text-purple-300 border border-purple-500/30"
                }`}
              >
                {isMe ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-[85%] leading-relaxed shadow-md ${
                  isMe
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : "bg-slate-900 text-slate-200 rounded-tl-none border border-slate-800"
                }`}
              >
                <div className="whitespace-pre-wrap text-xs sm:text-sm">{msg.text}</div>
                <div
                  className={`text-[10px] mt-1.5 text-right font-mono ${
                    isMe ? "text-indigo-200" : "text-slate-500"
                  }`}
                >
                  {msg.time}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-900/50 text-purple-300 border border-purple-500/30 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 p-3.5 rounded-2xl rounded-tl-none border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
              <span>Pensando na resposta analítica...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2 max-w-4xl mx-auto w-full"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte ao Mentor IA sobre Price Action, confluências ou gerenciamento..."
          className="flex-1 bg-slate-900 text-slate-100 text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-slate-700/80 outline-none focus:border-indigo-500 transition-colors"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5 shadow-lg"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <BotMessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Mentor CandleX AI</h3>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Online &bull; {activeTicker}
            </span>
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
  );
};
