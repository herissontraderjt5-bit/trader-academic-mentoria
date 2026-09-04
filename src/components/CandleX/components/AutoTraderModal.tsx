import React from "react";
import {
  X,
  Bot,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Target,
  ShieldAlert,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Percent,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Award,
  Key,
  Save,
  RefreshCw,
} from "lucide-react";
import confetti from "canvas-confetti";
import { AutoTraderConfig, AutoTraderSession, AutoTradeLogItem } from "../../../types";
import { hioveUserbotsService } from "../services/hioveUserbotsService";

interface AutoTraderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoTraderConfig;
  onChangeConfig: (newConfig: AutoTraderConfig) => void;
  session: AutoTraderSession;
  onToggleEnabled: () => void;
  onResetSession: () => void;
  currencySymbol?: string;
  hioveToken?: string | null;
  activeTicker?: string;
  onConnectHiove?: () => Promise<boolean>;
  isConnectingHiove?: boolean;
}

export const AutoTraderModal: React.FC<AutoTraderModalProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  session,
  onToggleEnabled,
  onResetSession,
  currencySymbol = "$",
  hioveToken,
  activeTicker = "BTCUSDT",
  onConnectHiove,
  isConnectingHiove = false,
}) => {
  const [isTestingLogin, setIsTestingLogin] = React.useState(false);
  const [loginFeedback, setLoginFeedback] = React.useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [isSavingApiKey, setIsSavingApiKey] = React.useState(false);
  const [isSyncingBot, setIsSyncingBot] = React.useState(false);
  const [botSyncFeedback, setBotSyncFeedback] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnect = async () => {
    if (!config.hioveEmail || !config.hiovePassword) {
      setLoginFeedback({ type: "error", msg: "Preencha e-mail e senha da Hiove antes de conectar." });
      return;
    }
    setIsTestingLogin(true);
    setLoginFeedback(null);
    try {
      if (onConnectHiove) {
        const ok = await onConnectHiove();
        if (ok) {
          setLoginFeedback({ type: "success", msg: "Conectado com sucesso à Hiove!" });
        } else {
          setLoginFeedback({ type: "error", msg: "Falha ao autenticar na Hiove. Verifique e-mail e senha." });
        }
      }
    } catch (e: any) {
      setLoginFeedback({ type: "error", msg: e?.message || "Erro ao conectar." });
    } finally {
      setIsTestingLogin(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!config.hioveApiKey) {
      setLoginFeedback({ type: "error", msg: "Insira sua API Key antes de salvar." });
      return;
    }
    setIsSavingApiKey(true);
    try {
      if (hioveToken) {
        const res = await hioveUserbotsService.updateApiKey(hioveToken, config.hioveApiKey);
        if (res.success) {
          setLoginFeedback({ type: "success", msg: "API Key da Hiove salva e atualizada com sucesso!" });
        } else {
          setLoginFeedback({ type: "error", msg: res.message || "Erro ao salvar API Key na Hiove." });
        }
      } else {
        setLoginFeedback({ type: "success", msg: "API Key salva localmente. Conecte na Hiove para sincronizar." });
      }
    } catch (e: any) {
      setLoginFeedback({ type: "error", msg: e.message || "Falha de conexão com a Hiove." });
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleSyncHioveBot = async () => {
    if (!hioveToken) {
      setBotSyncFeedback("Faça login ou conecte na Hiove primeiro.");
      return;
    }
    setIsSyncingBot(true);
    setBotSyncFeedback(null);
    try {
      const res = await hioveUserbotsService.createBot(hioveToken, {
        valor_entrada: config.stakeAmount,
        stop_loss: config.dailyStopLoss,
        stop_win: config.dailyStopWin,
        usar_gale_1: !!config.gale1,
        usar_gale_2: !!config.gale2,
      });
      if (res.success) {
        setBotSyncFeedback("Bot sincronizado na Hiove com sucesso! 🚀");
      } else {
        setBotSyncFeedback(res.message || "Erro ao sincronizar bot na Hiove.");
      }
    } catch (e: any) {
      setBotSyncFeedback(e.message || "Erro de sincronização.");
    } finally {
      setIsSyncingBot(false);
    }
  };

  const AVAILABLE_PAIRS = [
    { id: "CURRENT", label: `📌 Ativo Atual (${activeTicker})`, sub: "Segue o gráfico aberto" },
    { id: "EURUSD_OTC", label: "EUR/USD (OTC)", sub: "Paridade Forex" },
    { id: "GBPUSD_OTC", label: "GBP/USD (OTC)", sub: "Paridade Forex" },
    { id: "USDJPY_OTC", label: "USD/JPY (OTC)", sub: "Paridade Forex" },
    { id: "EURJPY_OTC", label: "EUR/JPY (OTC)", sub: "Paridade Forex" },
    { id: "AUDCAD_OTC", label: "AUD/CAD (OTC)", sub: "Paridade Forex" },
    { id: "BTCUSDT", label: "BTC/USDT", sub: "Criptoativo" },
    { id: "ETHUSDT", label: "ETH/USDT", sub: "Criptoativo" },
    { id: "SOLUSDT", label: "SOL/USDT", sub: "Criptoativo" },
  ];

  const selectedAssets = config.selectedAssets && config.selectedAssets.length > 0 
    ? config.selectedAssets 
    : ["CURRENT"];

  const handleToggleAsset = (assetId: string) => {
    let next: string[];
    if (assetId === "CURRENT") {
      next = ["CURRENT"];
    } else {
      const filtered = selectedAssets.filter((a) => a !== "CURRENT");
      if (filtered.includes(assetId)) {
        next = filtered.filter((a) => a !== assetId);
        if (next.length === 0) next = ["CURRENT"];
      } else {
        next = [...filtered, assetId];
      }
    }
    onChangeConfig({ ...config, selectedAssets: next });
  };

  const handleSelectAllAssets = () => {
    const all = AVAILABLE_PAIRS.filter((p) => p.id !== "CURRENT").map((p) => p.id);
    onChangeConfig({ ...config, selectedAssets: all });
  };

  const handleResetToCurrent = () => {
    onChangeConfig({ ...config, selectedAssets: ["CURRENT"] });
  };

  const targetWins = config.managementMode === "2x1" ? 2 : 5;
  const maxLosses = config.managementMode === "2x1" ? 1 : 2;

  const winProgressPercent = Math.min(100, (session.wins / targetWins) * 100);
  const lossRiskPercent = Math.min(100, (session.losses / maxLosses) * 100);

  const profitProgressPercent =
    config.dailyStopWin > 0
      ? Math.max(0, Math.min(100, (session.totalPnl / config.dailyStopWin) * 100))
      : 0;

  const handlePresetStake = (amount: number) => {
    onChangeConfig({ ...config, stakeAmount: amount });
  };

  const handlePresetStopWin = (amount: number) => {
    onChangeConfig({ ...config, dailyStopWin: amount });
  };

  const handlePresetStopLoss = (amount: number) => {
    onChangeConfig({ ...config, dailyStopLoss: amount });
  };

  const isMetaHit = session.status === "STOP_WIN" || session.wins >= targetWins;
  const isStopHit = session.status === "STOP_LOSS" || session.losses >= maxLosses;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 select-none overflow-y-auto">
      <div className="bg-[#0C0F17] border border-[#1E2638] rounded-2xl w-full max-w-3xl flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden my-auto max-h-[92vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#1E2638] flex items-center justify-between bg-[#10141F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF7A00] to-amber-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,122,0,0.4)]">
              <Bot className="w-6 h-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wide">
                  TRADER AUTO &bull; IA AUTÔNOMA
                </h2>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                    config.enabled
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse"
                      : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      config.enabled ? "bg-emerald-400" : "bg-slate-500"
                    }`}
                  />
                  {config.enabled ? "OPERANDO" : "PAUSADO"}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Execução de ordens 100% automatizadas com validação de confluências e gestão de risco
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-200">
          {/* Status Alert Banner if Meta or Stop Hit */}
          {isMetaHit && (
            <div className="bg-emerald-950/50 border border-emerald-500/50 rounded-xl p-3.5 flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-emerald-300">
                    META DA GESTÃO ATINGIDA COM SUCESSO! 🎉
                  </h4>
                  <p className="text-xs text-emerald-400/90">
                    Placar da sessão: {session.wins} Wins x {session.losses} Loss na Gestão {config.managementMode}. Robô pausado para proteção de lucro.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onResetSession}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nova Sessão</span>
              </button>
            </div>
          )}

          {isStopHit && (
            <div className="bg-rose-950/50 border border-rose-500/50 rounded-xl p-3.5 flex items-center justify-between shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-rose-300">
                    STOP LOSS DE SEGURANÇA ATINGIDO 🛑
                  </h4>
                  <p className="text-xs text-rose-400/90">
                    Limite de perdas da Gestão {config.managementMode} atingido ({session.losses} Loss). O Auto Trader foi pausado para blindar seu capital.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onResetSession}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resetar Placar</span>
              </button>
            </div>
          )}

          {/* Top Live Session Control & Placar Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Placar */}
            <div className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Placar da Sessão
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {session.wins}W
                </span>
                <span className="text-slate-500 font-bold">/</span>
                <span className="text-2xl font-black text-rose-400 font-mono">
                  {session.losses}L
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Alvo {config.managementMode}:</span>
                <span className="font-mono font-bold text-amber-400">
                  {session.wins}/{targetWins} Wins
                </span>
              </div>
            </div>

            {/* Lucro/Prejuízo da Sessão */}
            <div className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Resultado Líquido
              </span>
              <div className="mt-1">
                <span
                  className={`text-2xl font-black font-mono ${
                    session.totalPnl > 0
                      ? "text-emerald-400"
                      : session.totalPnl < 0
                      ? "text-rose-400"
                      : "text-slate-200"
                  }`}
                >
                  {session.totalPnl >= 0 ? "+" : ""}
                  {currencySymbol} {session.totalPnl.toFixed(2)}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Meta Diária:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {currencySymbol} {config.dailyStopWin}
                </span>
              </div>
            </div>

            {/* Gestão Selecionada */}
            <div className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Gestão Ativa
              </span>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xl font-black text-[#FF7A00] font-mono px-2 py-0.5 rounded bg-[#FF7A00]/10 border border-[#FF7A00]/30">
                  {config.managementMode}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">
                  {config.managementMode === "2x1"
                    ? "2 Wins p/ Meta (1 Loss Stop)"
                    : "5 Wins p/ Meta (2 Loss Stop)"}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Timeframe:</span>
                <span className="font-mono font-bold text-cyan-400 uppercase">
                  {config.timeframe}
                </span>
              </div>
            </div>

            {/* Botão de Ação Ligar / Desligar */}
            <div className="bg-[#121622] border border-[#1E2638] rounded-xl p-3 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Controle do Robô
              </span>
              <div className="mt-1">
                <button
                  type="button"
                  onClick={onToggleEnabled}
                  className={`w-full py-2 px-3 rounded-lg font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                    config.enabled
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/50"
                      : "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-emerald-950/50 font-black"
                  }`}
                >
                  {config.enabled ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pausar Auto</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Iniciar Auto</span>
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>Resetar:</span>
                <button
                  type="button"
                  onClick={onResetSession}
                  className="text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar Sessão</span>
                </button>
              </div>
            </div>
          </div>

          {/* CONFIGURATION FORM */}
          <div className="bg-[#10141F] border border-[#1E2638] rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1A2234] pb-2.5">
              <h3 className="text-xs uppercase font-bold text-[#FF7A00] tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4" />
                Parâmetros Operacionais do Trader Auto
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                Validação em Tempo Real
              </span>
            </div>

            {/* ROW 1: GESTÃO (2x1 ou 5x2) & TIMEFRAME (M1 ou M5) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SELEÇÃO DE GESTÃO: 2x1 vs 5x2 */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>1. SELECIONE A GESTÃO:</span>
                  <span className="text-[#FF7A00] font-mono text-[10px]">
                    {config.managementMode === "2x1" ? "2 Wins / 1 Loss" : "5 Wins / 2 Losses"}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeConfig({ ...config, managementMode: "2x1" })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.managementMode === "2x1"
                        ? "bg-[#1C2436] border-[#FF7A00] text-white shadow-[0_0_15px_rgba(255,122,0,0.25)]"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black font-mono text-[#FF7A00]">
                        Gestão 2x1
                      </span>
                      {config.managementMode === "2x1" && (
                        <CheckCircle2 className="w-4 h-4 text-[#FF7A00]" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      Conservadora: Meta com 2 Wins. Stop com 1 Loss.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeConfig({ ...config, managementMode: "5x2" })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      config.managementMode === "5x2"
                        ? "bg-[#1C2436] border-[#FF7A00] text-white shadow-[0_0_15px_rgba(255,122,0,0.25)]"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black font-mono text-cyan-400">
                        Gestão 5x2
                      </span>
                      {config.managementMode === "5x2" && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                      Alavancagem: Meta com 5 Wins. Stop com 2 Losses.
                    </p>
                  </button>
                </div>
              </div>

              {/* TIMEFRAME: M1, M2 ou M5 */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>2. TIME DAS OPERAÇÕES (EXPIRAÇÃO):</span>
                  <span className="text-cyan-400 font-mono text-[10px]">
                    {config.timeframe === "1m" ? "1 Minuto (M1)" : config.timeframe === "2m" ? "2 Minutos (M2)" : "5 Minutos (M5)"}
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeConfig({ ...config, timeframe: "1m" })}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      config.timeframe === "1m"
                        ? "bg-[#1C2436] border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-sm font-black font-mono text-cyan-400">
                      M1 (1 MIN)
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Fluxo rápido
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeConfig({ ...config, timeframe: "2m" })}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      config.timeframe === "2m"
                        ? "bg-[#1C2436] border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-sm font-black font-mono text-cyan-400">
                      M2 (2 MIN)
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Filtro ideal
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => onChangeConfig({ ...config, timeframe: "5m" })}
                    className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                      config.timeframe === "5m"
                        ? "bg-[#1C2436] border-cyan-400 text-white shadow-[0_0_15px_rgba(34,211,238,0.25)]"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                    }`}
                  >
                    <div className="text-sm font-black font-mono text-cyan-400">
                      M5 (5 MIN)
                    </div>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Consistência
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* ROW 1.5: CONTA DA CORRETORA & CREDENCIAIS HIOVE */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>CONTA DA CORRETORA:</span>
                  {hioveToken ? (
                    <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                      CONECTADO
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-500" />
                      OFFLINE
                    </span>
                  )}
                </label>
                <select
                  value={config.accountType || "DEMO"}
                  onChange={(e) => onChangeConfig({ ...config, accountType: e.target.value as "DEMO" | "REAL" })}
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-[#FF7A00] rounded-lg px-3 py-2 text-white font-mono font-bold text-sm outline-none cursor-pointer"
                >
                  <option value="DEMO">CONTA TREINAMENTO (DEMO)</option>
                  <option value="REAL">CONTA REAL (REAL)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  E-MAIL HIOVE:
                </label>
                <input
                  type="email"
                  value={config.hioveEmail || ""}
                  onChange={(e) => onChangeConfig({ ...config, hioveEmail: e.target.value.trim() })}
                  placeholder="seu-email@exemplo.com"
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-[#FF7A00] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300">
                  SENHA HIOVE:
                </label>
                <input
                  type="password"
                  value={config.hiovePassword || ""}
                  onChange={(e) => onChangeConfig({ ...config, hiovePassword: e.target.value })}
                  placeholder="********"
                  className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-[#FF7A00] rounded-lg px-3 py-2 text-white font-mono text-sm outline-none"
                />
              </div>
            </div>

            {/* BOTÃO DE CONECTAR NA CORRETORA & FEEDBACK */}
            <div className="bg-[#121724] border border-[#1E2638] p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                  hioveToken ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                }`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>STATUS DA CONEXÃO HIOVE:</span>
                    {hioveToken ? (
                      <span className="text-emerald-400 font-mono font-black">AUTENTICADO 🟢</span>
                    ) : (
                      <span className="text-amber-400 font-mono font-bold">DESCONECTADO ⚪</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {loginFeedback ? loginFeedback.msg : "Clique abaixo para testar suas credenciais e validar login na Hiove."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTestConnect}
                disabled={isTestingLogin || isConnectingHiove}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#FF7A00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-md hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isTestingLogin || isConnectingHiove ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    CONECTANDO...
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    {hioveToken ? "RECONECTAR CORRETORA" : "CONECTAR NA CORRETORA"}
                  </>
                )}
              </button>
            </div>

            {/* CHAVE API TOKEN DO PERFIL HIOVE & MARTINGALE (GALE 1 & GALE 2) */}
            <div className="bg-[#121724] border border-[#1E2638] p-3.5 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    CHAVE API (TOKEN) DO PERFIL HIOVE
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-mono">
                  Hiove Traderoom API
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400">
                    API KEY / TOKEN DE ACESSO DO PERFIL HIOVE:
                  </label>
                  <input
                    type="password"
                    value={config.hioveApiKey || ""}
                    onChange={(e) => onChangeConfig({ ...config, hioveApiKey: e.target.value.trim() })}
                    placeholder="Cole sua chave API Token do perfil Hiove (ex: Configurações -> API Key)"
                    className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-amber-500 rounded-lg px-3 py-2 text-white font-mono text-xs outline-none"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    disabled={isSavingApiKey}
                    className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingApiKey ? (
                      <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>Salvar API Key</span>
                  </button>
                </div>
              </div>

              {/* MARTINGALE (GALE 1 & GALE 2) TOGGLES */}
              <div className="pt-2 border-t border-[#1E2638] grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-[#0B0E14] border border-[#1E2638] p-2.5 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-400">Gale 1 (Primeira Proteção)</div>
                    <div className="text-[9px] text-slate-400">Ativa 1ª recuperação de entrada</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!config.gale1}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const nextGale2 = checked ? !!config.gale2 : false;
                      onChangeConfig({ ...config, gale1: checked, gale2: nextGale2 });
                    }}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className={`bg-[#0B0E14] border border-[#1E2638] p-2.5 rounded-lg flex items-center justify-between ${
                  !config.gale1 ? "opacity-50 pointer-events-none" : ""
                }`}>
                  <div>
                    <div className="text-xs font-bold text-amber-400">Gale 2 (Segunda Proteção)</div>
                    <div className="text-[9px] text-slate-400">Ativa 2ª recuperação (requer Gale 1)</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={!!config.gale2}
                    disabled={!config.gale1}
                    onChange={(e) => onChangeConfig({ ...config, gale2: e.target.checked })}
                    className="w-4 h-4 accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* BOTÃO DE SINCRONIZAÇÃO DE BOT COM HIOVE */}
              <div className="pt-1 flex items-center justify-between flex-wrap gap-2">
                <span className="text-[10px] text-slate-400">
                  {botSyncFeedback ? botSyncFeedback : "Sincronize Stake, Stop Loss e Stop Win direto na Hiove Userbots"}
                </span>
                <button
                  type="button"
                  onClick={handleSyncHioveBot}
                  disabled={isSyncingBot}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSyncingBot ? (
                    <span className="w-3 h-3 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Sincronizar Bot Hiove</span>
                </button>
              </div>
            </div>

            {/* SELEÇÃO DE ATIVOS PARA O ROBÔ OPERAR */}
            <div className="space-y-2 pt-1 border-t border-[#1E2638]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <label className="text-[11px] font-bold text-[#FF7A00] flex items-center gap-1.5 uppercase">
                    <Activity className="w-3.5 h-3.5" />
                    <span>ATIVOS QUE O AUTO TRADER DEVE MONITORAR & OPERAR:</span>
                  </label>
                  <p className="text-[10px] text-slate-400">
                    {selectedAssets.includes("CURRENT")
                      ? `Operando exclusivamente no ativo aberto na tela: ${activeTicker}`
                      : `Operando em ${selectedAssets.length} ativo(s) selecionados`}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetToCurrent}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      selectedAssets.includes("CURRENT")
                        ? "bg-[#FF7A00] text-slate-950 border-[#FF7A00] font-black"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:text-white"
                    }`}
                  >
                    Ativo Atual
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllAssets}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                      !selectedAssets.includes("CURRENT") && selectedAssets.length === AVAILABLE_PAIRS.length - 1
                        ? "bg-cyan-500 text-slate-950 border-cyan-500 font-black"
                        : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:text-white"
                    }`}
                  >
                    Todos os Pares
                  </button>
                </div>
              </div>

              {/* Grid de Ativos */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_PAIRS.map((pair) => {
                  const isSelected = selectedAssets.includes(pair.id);
                  return (
                    <button
                      key={pair.id}
                      type="button"
                      onClick={() => handleToggleAsset(pair.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[#182030] border-amber-500/80 text-white shadow-[0_0_12px_rgba(255,122,0,0.15)]"
                          : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:border-slate-600 hover:text-slate-200"
                      }`}
                    >
                      <div>
                        <div className={`text-xs font-black font-mono ${isSelected ? "text-amber-400" : "text-slate-300"}`}>
                          {pair.label}
                        </div>
                        <div className="text-[9px] text-slate-500">{pair.sub}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-black ${
                        isSelected ? "bg-amber-500 border-amber-500 text-slate-950" : "border-slate-700 bg-black/40 text-transparent"
                      }`}>
                        ✓
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ROW 2: VALOR DE ENTRADA & PAYOUT MÍNIMO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* VALOR DE ENTRADA */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>3. VALOR DE ENTRADA (STAKE):</span>
                  <span className="text-amber-400 font-mono text-[11px] font-bold">
                    {currencySymbol} {(config.stakeAmount || 1).toFixed(2)}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={config.stakeAmount === 0 ? "" : config.stakeAmount}
                      placeholder="1"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        if (val === "") {
                          onChangeConfig({ ...config, stakeAmount: 0 });
                        } else {
                          const num = parseFloat(val);
                          onChangeConfig({ ...config, stakeAmount: isNaN(num) ? 0 : num });
                        }
                      }}
                      onBlur={() => {
                        if (!config.stakeAmount || config.stakeAmount < 1) {
                          onChangeConfig({ ...config, stakeAmount: 1 });
                        }
                      }}
                      className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-[#FF7A00] rounded-lg pl-9 pr-3 py-2 text-white font-mono font-bold text-sm outline-none"
                    />
                  </div>
                  {/* Preset quick buttons */}
                  <div className="flex gap-1 flex-wrap">
                    {[1, 2, 5, 10, 25, 50].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handlePresetStake(amt)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold font-mono border cursor-pointer transition-all ${
                          config.stakeAmount === amt
                            ? "bg-[#FF7A00] text-slate-950 border-[#FF7A00] font-black"
                            : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:text-white"
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PAYOUT MÍNIMO */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                  <span>4. PAYOUT MÍNIMO DO ATIVO:</span>
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">
                    {config.minPayout}%
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={config.minPayout === 0 ? "" : config.minPayout}
                      placeholder="80"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        if (val === "") {
                          onChangeConfig({ ...config, minPayout: 0 });
                        } else {
                          const num = parseInt(val, 10);
                          onChangeConfig({ ...config, minPayout: isNaN(num) ? 0 : Math.min(98, num) });
                        }
                      }}
                      onBlur={() => {
                        if (!config.minPayout || config.minPayout < 50) {
                          onChangeConfig({ ...config, minPayout: 80 });
                        }
                      }}
                      className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-[#FF7A00] rounded-lg px-3 py-2 text-white font-mono font-bold text-sm outline-none"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      %
                    </span>
                  </div>
                  {/* Payout presets */}
                  <div className="flex gap-1">
                    {[80, 85, 88, 90].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => onChangeConfig({ ...config, minPayout: p })}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold font-mono border cursor-pointer ${
                          config.minPayout === p
                            ? "bg-emerald-500 text-slate-950 border-emerald-500 font-black"
                            : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:text-white"
                        }`}
                      >
                        {p}%
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[9.5px] text-slate-500">
                  O robô não executará entradas em ativos que estejam pagando menos que {config.minPayout}%.
                </p>
              </div>
            </div>

            {/* ROW 3: META (STOP WIN) & STOP LOSS DIÁRIO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* META (STOP WIN) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-emerald-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    5. META DE LUCRO (STOP WIN):
                  </span>
                  <span className="font-mono font-bold">
                    {currencySymbol} {config.dailyStopWin}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-xs">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={config.dailyStopWin === 0 ? "" : config.dailyStopWin}
                      placeholder="50"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        if (val === "") {
                          onChangeConfig({ ...config, dailyStopWin: 0 });
                        } else {
                          const num = parseFloat(val);
                          onChangeConfig({ ...config, dailyStopWin: isNaN(num) ? 0 : num });
                        }
                      }}
                      onBlur={() => {
                        if (!config.dailyStopWin || config.dailyStopWin < 1) {
                          onChangeConfig({ ...config, dailyStopWin: 50 });
                        }
                      }}
                      className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-emerald-500 rounded-lg pl-9 pr-3 py-2 text-emerald-300 font-mono font-bold text-sm outline-none"
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {[10, 25, 50, 100, 200].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => handlePresetStopWin(w)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold font-mono border cursor-pointer ${
                          config.dailyStopWin === w
                            ? "bg-emerald-500 text-slate-950 border-emerald-500 font-black"
                            : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:text-emerald-300"
                        }`}
                      >
                        ${w}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* STOP LOSS DIÁRIO */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-rose-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    6. STOP LOSS DIÁRIO:
                  </span>
                  <span className="font-mono font-bold">
                    {currencySymbol} {config.dailyStopLoss}
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400 font-bold text-xs">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={config.dailyStopLoss === 0 ? "" : config.dailyStopLoss}
                      placeholder="10"
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        if (val === "") {
                          onChangeConfig({ ...config, dailyStopLoss: 0 });
                        } else {
                          const num = parseFloat(val);
                          onChangeConfig({ ...config, dailyStopLoss: isNaN(num) ? 0 : num });
                        }
                      }}
                      onBlur={() => {
                        if (!config.dailyStopLoss || config.dailyStopLoss < 1) {
                          onChangeConfig({ ...config, dailyStopLoss: 10 });
                        }
                      }}
                      className="w-full bg-[#0B0E14] border border-[#1E2638] focus:border-rose-500 rounded-lg pl-9 pr-3 py-2 text-rose-300 font-mono font-bold text-sm outline-none"
                    />
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {[5, 10, 20, 50, 100].map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => handlePresetStopLoss(l)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold font-mono border cursor-pointer ${
                          config.dailyStopLoss === l
                            ? "bg-rose-500 text-slate-950 border-rose-500 font-black"
                            : "bg-[#0B0E14] border-[#1E2638] text-slate-400 hover:text-rose-300"
                        }`}
                      >
                        ${l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* HISTÓRICO DE ENTRADAS AUTOMÁTICAS (LOGS EM TEMPO REAL) */}
          <div className="bg-[#10141F] border border-[#1E2638] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                Logs de Operações do Auto Trader ({session.history.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Sincronizado com o CandleX Engine
              </span>
            </div>

            {session.history.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs bg-[#0B0E14] rounded-lg border border-[#182030]">
                Nenhuma operação automática executada nesta sessão ainda.
                <p className="text-[11px] text-slate-600 mt-1">
                  Ative o robô para capturar gatilhos com confluência de {config.minAiConfidence || 78}%+.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {session.history.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#0B0E14] border border-[#182032] rounded-lg p-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          item.direction === "CALL"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                        }`}
                      >
                        {item.direction}
                      </span>
                      <div>
                        <span className="font-bold text-white">{item.ticker}</span>
                        <span className="text-[10px] text-slate-400 font-mono ml-2">
                          {new Date(item.timestamp).toLocaleTimeString("pt-BR")} &bull; {item.timeframe}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-400 font-mono">
                        Conf: <strong className="text-amber-400">{item.confidenceScore}%</strong>
                      </span>
                      <span className="text-xs font-mono font-bold text-white">
                        {currencySymbol} {item.stake}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                          item.result === "WIN"
                            ? "bg-emerald-500 text-slate-950"
                            : item.result === "LOSS"
                            ? "bg-rose-500 text-white"
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {item.result === "WIN"
                          ? `+${currencySymbol} ${item.pnl.toFixed(2)}`
                          : item.result === "LOSS"
                          ? `-${currencySymbol} ${Math.abs(item.pnl).toFixed(2)}`
                          : "PENDENTE"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-[#1E2638] bg-[#10141F] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Blindagem Automática: Para imediatamente ao atingir Meta ou Stop.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Salvar & Fechar
            </button>
            <button
              type="button"
              onClick={() => {
                onToggleEnabled();
                onClose();
              }}
              className={`px-4 py-2 rounded-lg font-black text-xs uppercase flex items-center gap-1.5 transition-all shadow-lg cursor-pointer ${
                config.enabled
                  ? "bg-rose-600 hover:bg-rose-500 text-white"
                  : "bg-gradient-to-r from-[#FF9500] via-[#FF7A00] to-[#E64A00] hover:brightness-110 text-slate-950"
              }`}
            >
              {config.enabled ? "Pausar Robô" : "Ativar Robô Agora"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
