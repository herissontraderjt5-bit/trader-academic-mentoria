import React from "react";
import {
  LineChart,
  Users,
  CircleDollarSign,
  Trophy,
  Gift,
  Calendar,
  Bell,
  Crosshair,
  Minus,
  Maximize,
  Type,
  Smile,
  Ruler,
  ZoomIn,
  Magnet,
  Lock,
  Eye,
  Trash2,
  Star,
  HelpCircle,
  Layers,
  GitCommit,
  SplitSquareVertical,
  Bot,
} from "lucide-react";

interface BrokerToolsSidebarProps {
  onOpenOperations: () => void;
  onOpenCopyTrader: () => void;
  onOpenFinancial: () => void;
  onOpenRanking: () => void;
  onOpenDailyBonus: () => void;
  onOpenEconomicCalendar: () => void;
  onOpenNotifications: () => void;
  onOpenAutoTrader?: () => void;
  selectedTool: string;
  onSelectTool: (tool: string) => void;
  activeTradeCount: number;
}

export const BrokerToolsSidebar: React.FC<BrokerToolsSidebarProps> = ({
  onOpenOperations,
  onOpenCopyTrader,
  onOpenFinancial,
  onOpenRanking,
  onOpenDailyBonus,
  onOpenEconomicCalendar,
  onOpenNotifications,
  onOpenAutoTrader,
  selectedTool,
  onSelectTool,
  activeTradeCount,
}) => {
  return (
    <div className="w-[52px] h-full bg-[#0E121B] border-r border-[#1B2230] flex flex-col justify-between items-center py-2 select-none z-10 flex-shrink-0 text-slate-400">
      {/* Top Section - Broker Feature Icons */}
      <div className="flex flex-col items-center gap-1 w-full px-1">
        {/* Auto Trader IA */}
        <button
          type="button"
          onClick={onOpenAutoTrader}
          className="flex flex-col items-center justify-center w-full py-1.5 rounded hover:bg-[#1C2436] text-amber-400 hover:text-amber-300 transition-colors cursor-pointer group"
          title="Auto Trader IA & Bot Hiove"
        >
          <Bot className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="text-[8px] font-bold tracking-tighter mt-0.5 scale-90 text-amber-400">
            AutoTrader
          </span>
        </button>

        {/* Operações */}
        <button
          type="button"
          onClick={onOpenOperations}
          className="flex flex-col items-center justify-center w-full py-1.5 rounded hover:bg-[#1C2436] text-slate-300 hover:text-white transition-colors cursor-pointer group relative"
          title="Operações / Diário de Trades"
        >
          <LineChart className="w-4 h-4 text-slate-300 group-hover:text-[#FF7A00]" />
          <span className="text-[8px] font-semibold tracking-tighter mt-0.5 scale-90">
            Operações
          </span>
          {activeTradeCount > 0 && (
            <span className="absolute top-0.5 right-1 w-3.5 h-3.5 bg-[#FF7A00] text-slate-950 font-black text-[8px] rounded-full flex items-center justify-center">
              {activeTradeCount}
            </span>
          )}
        </button>

        {/* CopyTrader */}
        <button
          type="button"
          onClick={onOpenCopyTrader}
          className="flex flex-col items-center justify-center w-full py-1.5 rounded hover:bg-[#1C2436] text-slate-300 hover:text-white transition-colors cursor-pointer group"
          title="CopyTrader Hiove"
        >
          <Users className="w-4 h-4 text-slate-300 group-hover:text-[#FF7A00]" />
          <span className="text-[8px] font-semibold tracking-tighter mt-0.5 scale-90">
            CopyTrader
          </span>
        </button>

        {/* Financeiro */}
        <button
          type="button"
          onClick={onOpenFinancial}
          className="flex flex-col items-center justify-center w-full py-1.5 rounded hover:bg-[#1C2436] text-slate-300 hover:text-white transition-colors cursor-pointer group"
          title="Financeiro / Gestão de Banca"
        >
          <CircleDollarSign className="w-4 h-4 text-slate-300 group-hover:text-[#FF7A00]" />
          <span className="text-[8px] font-semibold tracking-tighter mt-0.5 scale-90">
            Financeiro
          </span>
        </button>

        {/* Ranking */}
        <button
          type="button"
          onClick={onOpenRanking}
          className="flex flex-col items-center justify-center w-full py-1.5 rounded hover:bg-[#1C2436] text-slate-300 hover:text-white transition-colors cursor-pointer group"
          title="Ranking de Traders"
        >
          <Trophy className="w-4 h-4 text-slate-300 group-hover:text-amber-400" />
          <span className="text-[8px] font-semibold tracking-tighter mt-0.5 scale-90">
            Ranking
          </span>
        </button>

        {/* Daily Bônus (Highlighted Orange Button in Screenshot) */}
        <button
          type="button"
          onClick={onOpenDailyBonus}
          className="flex flex-col items-center justify-center w-full py-2 my-0.5 rounded-lg bg-[#E66000] hover:bg-[#FF7A00] text-slate-950 font-black shadow-[0_0_10px_rgba(255,122,0,0.4)] transition-all cursor-pointer group"
          title="Daily Bônus Exclusivo"
        >
          <Gift className="w-4 h-4 text-slate-950" />
          <span className="text-[8px] font-extrabold tracking-tight mt-0.5 leading-tight text-center">
            Daily Bônus
          </span>
        </button>

        {/* Calendário Econômico */}
        <button
          type="button"
          onClick={onOpenEconomicCalendar}
          className="flex flex-col items-center justify-center w-full py-1.5 rounded hover:bg-[#1C2436] text-slate-300 hover:text-white transition-colors cursor-pointer group"
          title="Calendário Econômico"
        >
          <Calendar className="w-4 h-4 text-slate-300 group-hover:text-[#FF7A00]" />
          <span className="text-[7.5px] font-semibold tracking-tighter mt-0.5 scale-90 leading-tight text-center">
            Calendário Econômico
          </span>
        </button>

        {/* Notificações */}
        <button
          type="button"
          onClick={onOpenNotifications}
          className="flex flex-col items-center justify-center w-full py-1.5 rounded hover:bg-[#1C2436] text-slate-300 hover:text-white transition-colors cursor-pointer group"
          title="Notificações"
        >
          <Bell className="w-4 h-4 text-slate-300 group-hover:text-[#FF7A00]" />
          <span className="text-[8px] font-semibold tracking-tighter mt-0.5 scale-90">
            Notificações
          </span>
        </button>

        <div className="w-full h-[1px] bg-[#1F2739] my-1" />

        {/* Chart Drawing Tools */}
        <div className="flex flex-col items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => onSelectTool("crosshair")}
            className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
              selectedTool === "crosshair" ? "text-[#FF7A00] bg-[#1C2436]" : "text-slate-400"
            }`}
            title="Mira / Crosshair"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTool("trendline")}
            className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
              selectedTool === "trendline" ? "text-[#FF7A00] bg-[#1C2436]" : "text-slate-400"
            }`}
            title="Linha de Tendência"
          >
            <Minus className="w-3.5 h-3.5 -rotate-45" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTool("channels")}
            className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
              selectedTool === "channels" ? "text-[#FF7A00] bg-[#1C2436]" : "text-slate-400"
            }`}
            title="Canais Paralelos"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTool("fibonacci")}
            className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
              selectedTool === "fibonacci" ? "text-[#FF7A00] bg-[#1C2436]" : "text-slate-400"
            }`}
            title="Retração de Fibonacci"
          >
            <GitCommit className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTool("text")}
            className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
              selectedTool === "text" ? "text-[#FF7A00] bg-[#1C2436]" : "text-slate-400"
            }`}
            title="Texto"
          >
            <Type className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTool("ruler")}
            className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
              selectedTool === "ruler" ? "text-[#FF7A00] bg-[#1C2436]" : "text-slate-400"
            }`}
            title="Régua de Variação"
          >
            <Ruler className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTool("magnet")}
            className={`p-1.5 rounded hover:bg-[#1C2436] cursor-pointer ${
              selectedTool === "magnet" ? "text-[#FF7A00] bg-[#1C2436]" : "text-slate-400"
            }`}
            title="Modo Ímã"
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTool("clear")}
            className="p-1.5 rounded hover:bg-[#1C2436] text-slate-400 hover:text-rose-400 cursor-pointer"
            title="Limpar Desenhos"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom Icons */}
      <div className="flex flex-col items-center gap-1.5 w-full pb-1">
        <button
          type="button"
          className="p-1 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
          title="Favoritos"
        >
          <Star className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Ajuda / Suporte"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          className="p-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Camadas"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
