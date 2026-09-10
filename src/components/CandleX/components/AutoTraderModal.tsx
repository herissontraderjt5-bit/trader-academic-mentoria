import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Bot,
  Key,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Power,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Eye,
  EyeOff,
  Edit3,
} from "lucide-react";
import { AutoTraderConfig, AutoTraderSession } from "../../../types";
import {
  hioveUserbotsService,
  HioveBotConfigData,
  HioveProfileData,
} from "../services/hioveUserbotsService";

interface AutoTraderModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoTraderConfig;
  onChangeConfig: (newConfig: AutoTraderConfig) => void;
  session?: AutoTraderSession;
  onToggleEnabled?: () => void;
  onResetSession?: () => void;
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
  hioveToken,
}) => {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [profile, setProfile] = useState<HioveProfileData | null>(null);
  const [currentBot, setCurrentBot] = useState<HioveBotConfigData | null>(null);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Submodals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditingBot, setIsEditingBot] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Form states for Create / Edit Bot
  const [entryValue, setEntryValue] = useState("50.00");
  const [stopLoss, setStopLoss] = useState("200.00");
  const [stopWin, setStopWin] = useState("500.00");
  const [gale1, setGale1] = useState(false);
  const [gale2, setGale2] = useState(false);

  // Form states for API Key
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKeyText, setShowApiKeyText] = useState(false);

  // Resolve authenticated token
  const getEffectiveToken = useCallback(async (): Promise<string | null> => {
    const rawKey = config.hioveApiKey || hioveToken || "hx3pvi2oua";
    const auth = await hioveUserbotsService.authenticateUser(rawKey);
    return auth.token || null;
  }, [config.hioveApiKey, hioveToken]);

  // Load Bot and API Key status from Hiove
  const loadData = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const token = await getEffectiveToken();
      if (!token) {
        setApiKeyConfigured(false);
        setLoading(false);
        return;
      }

      // 1. Fetch Profile
      const prof = await hioveUserbotsService.getProfile(token);
      setProfile(prof);

      const hasApiToken =
        Boolean(prof?.client?.api_token) &&
        prof?.client?.api_token !== "null" &&
        prof?.client?.api_token !== "";

      setApiKeyConfigured(Boolean(hasApiToken || config.hioveApiKey));

      // 2. Fetch configured Bot on Hiove
      const botRes = await hioveUserbotsService.getBotByAffiliate(token);
      if (botRes.found && botRes.bot) {
        setCurrentBot(botRes.bot);
        // Sync local enabled status with bot status
        const isRunning =
          botRes.bot.status === "running" ||
          botRes.bot.status === "ativo";
        onChangeConfig({
          ...config,
          enabled: isRunning,
          stakeAmount: parseFloat(String(botRes.bot.valor_entrada)) || config.stakeAmount,
          dailyStopLoss: parseFloat(String(botRes.bot.stop_loss)) || config.dailyStopLoss,
          dailyStopWin: parseFloat(String(botRes.bot.stop_win)) || config.dailyStopWin,
          gale1: Boolean(botRes.bot.usar_gale_1),
          gale2: Boolean(botRes.bot.usar_gale_2),
        });
      } else {
        setCurrentBot(null);
      }
    } catch (err: any) {
      console.error("Erro ao carregar dados do robô Hiove:", err);
    } finally {
      setLoading(false);
    }
  }, [getEffectiveToken, config, onChangeConfig]);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  // Open Create Bot Modal
  const handleOpenCreateModal = () => {
    setEntryValue(String(config.stakeAmount || 50));
    setStopLoss(String(config.dailyStopLoss || 200));
    setStopWin(String(config.dailyStopWin || 500));
    setGale1(Boolean(config.gale1));
    setGale2(Boolean(config.gale2 && config.gale1));
    setIsEditingBot(false);
    setShowCreateModal(true);
  };

  // Open Edit Bot Modal
  const handleOpenEditModal = () => {
    if (!currentBot) return;
    setEntryValue(String(currentBot.valor_entrada || 50));
    setStopLoss(String(currentBot.stop_loss || 200));
    setStopWin(String(currentBot.stop_win || 500));
    setGale1(Boolean(currentBot.usar_gale_1));
    setGale2(Boolean(currentBot.usar_gale_2 && currentBot.usar_gale_1));
    setIsEditingBot(true);
    setShowCreateModal(true);
  };

  // Toggle Bot Status (Start / Pause)
  const handleToggleBot = async () => {
    if (!currentBot?.id) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const token = await getEffectiveToken();
      if (!token) throw new Error("Token não autenticado.");

      const success = await hioveUserbotsService.toggleBotStatus(token, currentBot.id);
      if (success) {
        setFeedback({ type: "success", text: "Status do bot atualizado na Hiove com sucesso!" });
        await loadData();
      } else {
        setFeedback({ type: "error", text: "Não foi possível alterar o status do bot." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Erro ao atualizar status do bot." });
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delete Bot
  const handleConfirmDeleteBot = async () => {
    if (!currentBot?.id) return;

    setActionLoading(true);
    setFeedback(null);
    try {
      const token = await getEffectiveToken();
      if (!token) throw new Error("Token não autenticado.");

      const success = await hioveUserbotsService.deleteBot(token, currentBot.id);
      if (success) {
        setShowDeleteConfirmModal(false);
        setCurrentBot(null);
        onChangeConfig({ ...config, enabled: false });
        setFeedback({ type: "success", text: "Bot deletado com sucesso da nuvem Hiove!" });
        await loadData();
      } else {
        setFeedback({ type: "error", text: "Erro ao deletar o bot na Hiove." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Falha ao deletar o bot." });
    } finally {
      setActionLoading(false);
    }
  };

  // Save / Update API Key
  const handleSaveApiKey = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setFeedback({ type: "error", text: "Digite uma chave API válida." });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const token = await getEffectiveToken();
      if (!token) throw new Error("Token de autenticação não encontrado.");

      const res = await hioveUserbotsService.updateApiKey(token, trimmed);
      if (res.success) {
        onChangeConfig({ ...config, hioveApiKey: trimmed });
        setApiKeyConfigured(true);
        setShowApiKeyModal(false);
        setApiKeyInput("");
        setFeedback({ type: "success", text: "API Key configurada com sucesso!" });
        await loadData();
      } else {
        setFeedback({ type: "error", text: res.message || "Falha ao salvar API Key na Hiove." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Erro ao conectar na Hiove." });
    } finally {
      setActionLoading(false);
    }
  };

  // Save Bot (Handles both Create and Edit)
  const handleSaveBot = async () => {
    const entryNum = parseFloat(entryValue);
    const stopLossNum = parseFloat(stopLoss);
    const stopWinNum = parseFloat(stopWin);

    if (isNaN(entryNum) || isNaN(stopLossNum) || isNaN(stopWinNum) || entryNum <= 0) {
      setFeedback({ type: "error", text: "Por favor, preencha todos os campos com valores válidos." });
      return;
    }

    setActionLoading(true);
    setFeedback(null);
    try {
      const token = await getEffectiveToken();
      if (!token) throw new Error("Token não autenticado.");

      if (isEditingBot && currentBot?.id) {
        // UPDATE existing bot
        const res = await hioveUserbotsService.updateBot(token, currentBot.id, {
          valor_entrada: entryNum,
          stop_loss: stopLossNum,
          stop_win: stopWinNum,
          usar_gale_1: gale1,
          usar_gale_2: gale2,
        });

        if (res.success) {
          setShowCreateModal(false);
          setFeedback({ type: "success", text: "Configurações do bot atualizadas com sucesso na Hiove!" });
          await loadData();
        } else {
          setFeedback({ type: "error", text: res.message || "Erro ao atualizar bot na Hiove." });
        }
      } else {
        // CREATE new bot
        const res = await hioveUserbotsService.createBot(token, {
          valor_entrada: entryNum,
          stop_loss: stopLossNum,
          stop_win: stopWinNum,
          usar_gale_1: gale1,
          usar_gale_2: gale2,
          status: "ativo",
        });

        if (res.success) {
          setShowCreateModal(false);
          setFeedback({ type: "success", text: "Bot criado e ativado com sucesso na Hiove!" });
          await loadData();
        } else {
          setFeedback({ type: "error", text: res.message || "Erro ao criar bot na Hiove." });
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err?.message || "Falha na conexão com a Hiove." });
    } finally {
      setActionLoading(false);
    }
  };

  // Status text helper
  const getStatusInfo = (status?: string) => {
    switch (status) {
      case "ativo":
      case "running":
        return { text: "▶️ EXECUTANDO", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
      case "pausado":
      case "paused":
        return { text: "⏸️ PAUSADO", color: "#eab308", bg: "rgba(234, 179, 8, 0.15)" };
      case "stop_win":
        return { text: "✓ STOP WIN", color: "#10b981", bg: "rgba(16, 185, 129, 0.2)" };
      case "stop_loss":
        return { text: "✗ STOP LOSS", color: "#ef4444", bg: "rgba(239, 68, 68, 0.2)" };
      case "sem_saldo":
        return { text: "⚠️ SEM SALDO", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)" };
      case "stopped":
        return { text: "⏹️ PARADO", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)" };
      default:
        return { text: status ? status.toUpperCase() : "INATIVO", color: "#d4af37", bg: "rgba(212, 175, 55, 0.15)" };
    }
  };

  if (!isOpen) return null;

  const isRunning = currentBot?.status === "running" || currentBot?.status === "ativo";
  const statusInfo = getStatusInfo(currentBot?.status);
  const gale1Active = Boolean(currentBot?.usar_gale_1);
  const gale2Active = Boolean(currentBot?.usar_gale_2);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: "#0d1410",
          border: "2px solid rgba(212, 175, 55, 0.35)",
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(212, 175, 55, 0.15)",
        }}
      >
        {/* Top Gold Accent Border */}
        <div
          className="h-1.5 w-full"
          style={{
            background: "linear-gradient(90deg, #996515 0%, #d4af37 50%, #f3e5ab 100%)",
          }}
        />

        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-7 py-5 border-b"
          style={{ borderColor: "rgba(212, 175, 55, 0.2)" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h2
                className="text-xl md:text-2xl font-black tracking-wider uppercase"
                style={{
                  color: "#d4af37",
                  fontFamily: "'Space Grotesk', system-ui, sans-serif",
                  letterSpacing: "1.5px",
                }}
              >
                GERENCIADOR DE BOTS HIOVE
              </h2>
              <p className="text-xs text-amber-200/60 tracking-wide">
                Sistema de Automação Oficial em Nuvem • Hiove Trading Room
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              title="Atualizar status"
              className="p-2 rounded-lg text-amber-300 hover:text-amber-100 hover:bg-amber-500/10 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mx-7 mt-5 p-3.5 rounded-xl border flex items-center gap-3 text-sm font-medium ${
              feedback.type === "success"
                ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                : "bg-rose-950/40 border-rose-500/50 text-rose-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-7 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* 1. API KEY STATUS CARD (Exact Billion Style) */}
          {apiKeyConfigured ? (
            <div
              className="rounded-xl p-6 transition-all"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                border: "2px solid #10b981",
                boxShadow: "0 0 20px rgba(16, 185, 129, 0.15)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold"
                    style={{
                      backgroundColor: "rgba(16, 185, 129, 0.2)",
                      border: "2px solid #10b981",
                      color: "#10b981",
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-emerald-400 tracking-wide uppercase">
                      API KEY CONFIGURADA COM SUCESSO
                    </h3>
                    <p className="text-xs md:text-sm text-amber-200/70">
                      Sua chave API está ativa e pronta para uso na nuvem Hiove
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setApiKeyInput(config.hioveApiKey || "");
                    setShowApiKeyModal(true);
                  }}
                  className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold tracking-wider uppercase transition-all shadow-md flex-shrink-0 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #d97706 0%, #b45309 100%)",
                    color: "#ffffff",
                    border: "1px solid rgba(245, 158, 11, 0.5)",
                  }}
                >
                  ATUALIZAR API KEY
                </button>
              </div>
            </div>
          ) : (
            <div
              className="rounded-xl p-6 transition-all"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                border: "2px solid #f59e0b",
                boxShadow: "0 0 20px rgba(245, 158, 11, 0.15)",
              }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-2xl font-bold"
                    style={{
                      backgroundColor: "rgba(245, 158, 11, 0.2)",
                      border: "2px solid #f59e0b",
                      color: "#f59e0b",
                    }}
                  >
                    ⚠️
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-amber-400 tracking-wide uppercase">
                      API KEY NÃO CONFIGURADA
                    </h3>
                    <p className="text-xs md:text-sm text-amber-200/70">
                      Configure sua chave API da corretora para utilizar os bots
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setApiKeyInput("");
                    setShowApiKeyModal(true);
                  }}
                  className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-bold tracking-wider uppercase transition-all shadow-md flex-shrink-0 cursor-pointer"
                  style={{
                    background: "linear-gradient(135deg, #d4af37 0%, #996515 100%)",
                    color: "#000000",
                    fontWeight: 800,
                  }}
                >
                  CONFIGURAR API KEY
                </button>
              </div>
            </div>
          )}

          {/* 2. BOT STATUS (Card if configured, Empty state if not) */}
          {currentBot ? (
            <div
              className="rounded-2xl p-6 md:p-8"
              style={{
                backgroundColor: "rgba(26, 40, 32, 0.6)",
                border: "2px solid rgba(212, 175, 55, 0.3)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
              }}
            >
              {/* Bot Header */}
              <div
                className="flex flex-col sm:flex-row justify-between sm:items-center pb-5 mb-6 gap-3"
                style={{ borderBottom: "2px solid rgba(212, 175, 55, 0.2)" }}
              >
                <div>
                  <h4
                    className="text-lg md:text-xl font-black uppercase tracking-wider"
                    style={{ color: "#d4af37" }}
                  >
                    BOT IA HIOVE
                  </h4>
                  <p className="text-xs text-amber-200/60 mt-1">
                    ID: {currentBot.id} • Criado em:{" "}
                    {currentBot.criado_em
                      ? new Date(currentBot.criado_em).toLocaleDateString("pt-BR")
                      : "Recente"}
                  </p>
                </div>

                <div
                  className="px-5 py-2 rounded-full font-bold text-xs md:text-sm tracking-wider uppercase text-center self-start sm:self-auto"
                  style={{
                    border: `2px solid ${statusInfo.color}`,
                    color: statusInfo.color,
                    backgroundColor: statusInfo.bg,
                  }}
                >
                  {statusInfo.text}
                </div>
              </div>

              {/* Bot 5 Metric Grid (Exact Billion Layout) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-7">
                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="block text-[11px] font-bold text-amber-200/70 tracking-widest uppercase mb-1">
                    VALOR ENTRADA
                  </span>
                  <span
                    className="text-xl md:text-2xl font-extrabold"
                    style={{ color: "#d4af37", fontFamily: "'Space Mono', monospace" }}
                  >
                    ${parseFloat(String(currentBot.valor_entrada)).toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="block text-[11px] font-bold text-amber-200/70 tracking-widest uppercase mb-1">
                    STOP LOSS
                  </span>
                  <span
                    className="text-xl md:text-2xl font-extrabold text-rose-500"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    ${parseFloat(String(currentBot.stop_loss)).toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="block text-[11px] font-bold text-amber-200/70 tracking-widest uppercase mb-1">
                    STOP WIN
                  </span>
                  <span
                    className="text-xl md:text-2xl font-extrabold text-emerald-400"
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    ${parseFloat(String(currentBot.stop_win)).toFixed(2)}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="block text-[11px] font-bold text-amber-200/70 tracking-widest uppercase mb-1">
                    GALE 1
                  </span>
                  <span
                    className={`text-xl md:text-2xl font-extrabold ${
                      gale1Active ? "text-emerald-400" : "text-rose-500"
                    }`}
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {gale1Active ? "ATIVO" : "INATIVO"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/30 border border-white/5">
                  <span className="block text-[11px] font-bold text-amber-200/70 tracking-widest uppercase mb-1">
                    GALE 2
                  </span>
                  <span
                    className={`text-xl md:text-2xl font-extrabold ${
                      gale2Active ? "text-emerald-400" : "text-rose-500"
                    }`}
                    style={{ fontFamily: "'Space Mono', monospace" }}
                  >
                    {gale2Active ? "ATIVO" : "INATIVO"}
                  </span>
                </div>
              </div>

              {/* Bot Action Buttons (Start/Pause, Edit, Delete) */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleToggleBot}
                  disabled={actionLoading}
                  className="flex-1 py-3.5 px-6 rounded-xl font-black text-sm tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  style={{
                    background: isRunning
                      ? "linear-gradient(135deg, #d97706 0%, #b45309 100%)"
                      : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#ffffff",
                    border: isRunning
                      ? "1px solid rgba(245, 158, 11, 0.4)"
                      : "1px solid rgba(16, 185, 129, 0.4)",
                  }}
                >
                  <Power className="w-4 h-4" />
                  <span>{isRunning ? "DESATIVAR BOT" : "ATIVAR BOT"}</span>
                </button>

                <button
                  onClick={handleOpenEditModal}
                  disabled={actionLoading}
                  className="py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider uppercase transition-all bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-2 cursor-pointer"
                  title="Editar valores de entrada, stop loss, stop win e gales"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>EDITAR BOT</span>
                </button>

                <button
                  onClick={() => setShowDeleteConfirmModal(true)}
                  disabled={actionLoading}
                  className="py-3.5 px-6 rounded-xl font-bold text-sm tracking-wider uppercase transition-all bg-rose-900/30 hover:bg-rose-900/50 text-rose-300 border border-rose-600/40 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>DELETAR BOT</span>
                </button>
              </div>
            </div>
          ) : (
            /* No Bot Configured - Exact Billion Style (Image 1) */
            <div
              className="text-center py-12 px-6 rounded-2xl border-2 border-dashed"
              style={{
                backgroundColor: "rgba(26, 40, 32, 0.35)",
                borderColor: "rgba(212, 175, 55, 0.3)",
              }}
            >
              <div className="text-5xl mb-4 animate-bounce">🤖</div>
              <h3
                className="text-xl md:text-2xl font-black tracking-wider uppercase mb-2"
                style={{ color: "#ffffff" }}
              >
                NENHUM BOT CONFIGURADO
              </h3>
              <p className="text-sm text-amber-200/70 max-w-md mx-auto mb-7">
                Você ainda não tem um bot ativo. Crie um novo para começar a operar na nuvem Hiove.
              </p>

              <button
                onClick={handleOpenCreateModal}
                className="px-8 py-3.5 rounded-xl font-black text-sm tracking-wider uppercase shadow-xl transition-all inline-flex items-center gap-2 transform hover:scale-105 active:scale-95 cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)",
                  color: "#0d1410",
                  fontWeight: 900,
                  boxShadow: "0 10px 25px rgba(217, 119, 6, 0.4)",
                }}
              >
                <Sparkles className="w-4 h-4" />
                <span>CRIAR NOVO BOT</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div
          className="px-7 py-4 bg-black/40 border-t flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-amber-200/50"
          style={{ borderColor: "rgba(212, 175, 55, 0.15)" }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Operações executadas 100% diretamente no servidor da corretora Hiove.</span>
          </div>
          <a
            href="https://app.hiove.com/traderoom"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 font-semibold"
          >
            <span>Acessar Plataforma Hiove</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBMODAL: CRIAR OU EDITAR BOT                                             */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl p-6 md:p-8 overflow-hidden shadow-2xl"
            style={{
              backgroundColor: "#0d1410",
              border: "2px solid rgba(212, 175, 55, 0.4)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.95), 0 0 30px rgba(212, 175, 55, 0.2)",
            }}
          >
            {/* Modal Title */}
            <h3
              className="text-2xl font-black tracking-wider uppercase mb-6"
              style={{ color: "#d4af37", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              {isEditingBot ? "EDITAR CONFIGURAÇÕES DO BOT" : "CRIAR NOVO BOT"}
            </h3>

            {/* Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-amber-200/70 mb-2">
                  VALOR DE ENTRADA ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="Ex: 50.00"
                  value={entryValue}
                  onChange={(e) => setEntryValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-all text-base"
                  style={{ borderColor: "rgba(212, 175, 55, 0.3)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-amber-200/70 mb-2">
                  STOP LOSS ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="Ex: 200.00"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-all text-base"
                  style={{ borderColor: "rgba(212, 175, 55, 0.3)" }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-amber-200/70 mb-2">
                  STOP WIN ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  placeholder="Ex: 500.00"
                  value={stopWin}
                  onChange={(e) => setStopWin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-black/50 border text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-all text-base"
                  style={{ borderColor: "rgba(212, 175, 55, 0.3)" }}
                />
              </div>
            </div>

            {/* Gale Section (Martingale) */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-white mb-3">
                🎯 Configuração de Gale (Martingale)
              </label>

              {/* Gale 1 Toggle */}
              <div
                className="flex items-center justify-between p-4 rounded-xl mb-3 border transition-all"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                }}
              >
                <div>
                  <div className="font-bold text-sm text-white">Gale 1</div>
                  <div className="text-xs text-zinc-400">Ativa primeira proteção de entrada</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !gale1;
                    setGale1(next);
                    if (!next) setGale2(false);
                  }}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer ${
                    gale1 ? "bg-amber-400" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      gale1 ? "transform translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Gale 2 Toggle */}
              <div
                className="flex items-center justify-between p-4 rounded-xl border transition-all"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.03)",
                  borderColor: "rgba(255, 255, 255, 0.08)",
                  opacity: gale1 ? 1 : 0.45,
                  pointerEvents: gale1 ? "auto" : "none",
                }}
              >
                <div>
                  <div className="font-bold text-sm text-white">Gale 2</div>
                  <div className="text-xs text-zinc-400">Ativa segunda proteção (requer Gale 1)</div>
                </div>
                <button
                  type="button"
                  disabled={!gale1}
                  onClick={() => setGale2(!gale2)}
                  className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none cursor-pointer ${
                    gale2 && gale1 ? "bg-amber-400" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      gale2 && gale1 ? "transform translate-x-6" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Warning when Gale 1 is inactive (Exact Billion Warning) */}
              {!gale1 && (
                <div
                  className="mt-3 p-3 rounded-lg border flex items-center gap-2 text-xs font-semibold"
                  style={{
                    backgroundColor: "rgba(255, 214, 10, 0.1)",
                    borderColor: "rgba(212, 175, 55, 0.5)",
                    color: "#f59e0b",
                  }}
                >
                  <span>⚠️</span>
                  <span>Ative o Gale 1 primeiro para habilitar o Gale 2</span>
                </div>
              )}
            </div>

            {/* Submodal Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all text-amber-200/80 hover:text-white hover:bg-white/5 cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleSaveBot}
                disabled={actionLoading}
                className="px-7 py-3 rounded-xl font-black text-sm tracking-wider uppercase transition-all shadow-lg cursor-pointer"
                style={{
                  background: isEditingBot
                    ? "linear-gradient(135deg, #d4af37 0%, #b45309 100%)"
                    : "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)",
                  color: "#ffffff",
                  border: isEditingBot
                    ? "1px solid rgba(212, 175, 55, 0.5)"
                    : "1px solid rgba(239, 68, 68, 0.5)",
                }}
              >
                {actionLoading
                  ? "SALVANDO..."
                  : isEditingBot
                  ? "SALVAR ALTERAÇÕES"
                  : "CRIAR BOT"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMODAL: CONFIRMAR EXCLUSÃO DO BOT (Elimina bloqueios de popup do browser)*/}
      {/* ========================================================================= */}
      {showDeleteConfirmModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl p-6 md:p-7 overflow-hidden shadow-2xl text-center"
            style={{
              backgroundColor: "#0d1410",
              border: "2px solid rgba(239, 68, 68, 0.5)",
              boxShadow: "0 25px 50px rgba(0, 0, 0, 0.95), 0 0 35px rgba(239, 68, 68, 0.25)",
            }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "2px solid rgba(239, 68, 68, 0.4)",
                color: "#ef4444",
              }}
            >
              <Trash2 className="w-8 h-8" />
            </div>

            <h4
              className="text-xl font-black uppercase tracking-wider mb-2"
              style={{ color: "#ffffff", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              DELETAR BOT DA HIOVE?
            </h4>

            <p className="text-sm text-zinc-300 leading-relaxed mb-6">
              Tem certeza que deseja excluir este robô? Suas operações automáticas na corretora Hiove serão interrompidas imediatamente.
            </p>

            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmModal(false)}
                className="px-5 py-3 rounded-xl font-bold text-sm tracking-wider uppercase text-zinc-300 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBot}
                disabled={actionLoading}
                className="px-6 py-3 rounded-xl font-black text-sm tracking-wider uppercase transition-all shadow-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                style={{
                  boxShadow: "0 8px 20px rgba(225, 29, 72, 0.4)",
                }}
              >
                {actionLoading ? "DELETANDO..." : "SIM, DELETAR BOT"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBMODAL: CONFIGURAR / ATUALIZAR API KEY                                  */}
      {/* ========================================================================= */}
      {showApiKeyModal && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.88)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-2xl p-6 md:p-8 overflow-hidden shadow-2xl"
            style={{
              backgroundColor: "#0d1410",
              border: "2px solid rgba(212, 175, 55, 0.4)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.95), 0 0 30px rgba(212, 175, 55, 0.2)",
            }}
          >
            <h3
              className="text-xl md:text-2xl font-black tracking-wider uppercase mb-6"
              style={{ color: "#d4af37", fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            >
              CONFIGURAR API KEY
            </h3>

            <div className="mb-5">
              <label className="block text-xs font-bold tracking-widest uppercase text-amber-200/70 mb-2">
                INSIRA SUA CHAVE API DA HIOVE
              </label>
              <div className="relative">
                <input
                  type={showApiKeyText ? "text" : "password"}
                  placeholder="Cole sua API Key aqui..."
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-black/50 border text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-amber-400 transition-all text-sm"
                  style={{ borderColor: "rgba(212, 175, 55, 0.3)" }}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKeyText(!showApiKeyText)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
                >
                  {showApiKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Instruction Tip */}
            <div
              className="p-4 rounded-xl border mb-6 text-xs leading-relaxed"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.08)",
                borderColor: "rgba(245, 158, 11, 0.4)",
                color: "#f59e0b",
              }}
            >
              <span className="font-bold">💡 Onde encontrar sua API Key:</span>
              <br />
              Acesse sua conta na Hiove → <strong>Configurações</strong> → <strong>API Key</strong> (ou crie uma nova chave de acesso).
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowApiKeyModal(false)}
                className="px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase text-amber-200/80 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                disabled={actionLoading}
                className="px-7 py-3 rounded-xl font-black text-sm tracking-wider uppercase transition-all shadow-lg cursor-pointer"
                style={{
                  background: "linear-gradient(135deg, #d4af37 0%, #996515 100%)",
                  color: "#000000",
                  fontWeight: 900,
                }}
              >
                {actionLoading ? "SALVANDO..." : "SALVAR CHAVE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
