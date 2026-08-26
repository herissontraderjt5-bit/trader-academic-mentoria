import React, { useState, useEffect, useCallback, useRef } from "react";
import { NeuralAnalyzerSidebar } from "./components/NeuralAnalyzerSidebar";
import { TradingViewRealChart } from "./components/TradingViewRealChart";
import { HioveBrokerFrame } from "./components/HioveBrokerFrame";
import { OperationsModal } from "./components/OperationsModal";
import { FinancialModal } from "./components/FinancialModal";
import { CopyTraderModal } from "./components/CopyTraderModal";
import { DailyBonusModal } from "./components/DailyBonusModal";
import { EconomicCalendarModal } from "./components/EconomicCalendarModal";
import { IndicatorsModal } from "./components/IndicatorsModal";
import { DepositModal } from "./components/DepositModal";
import { AiChartVisionModal } from "./components/AiChartVisionModal";
import { AiChatDrawer } from "./components/AiChatDrawer";
import { AutoTraderModal } from "./components/AutoTraderModal";
import { AiNeuralScannerOverlay } from "./components/AiNeuralScannerOverlay";
import { CenterSignalOverlay } from "./components/CenterSignalOverlay";
import { HioveUnifiedTopBar } from "./components/HioveUnifiedTopBar";

import {
  Candle,
  TechnicalIndicators,
  AiAnalysisResult,
  TradeRecord,
  BankrollConfig,
  AutoTraderConfig,
  AutoTraderSession,
  AutoTradeLogItem,
  User,
} from "../../types";

import { calculateAllIndicators } from "./utils/technicalIndicators";
import { soundManager } from "./utils/soundEffects";
import { candlexApiService } from "./services/apiService";
import { supabaseService } from "../../services/supabaseService";
import confetti from "canvas-confetti";

interface CandleXWorkstationProps {
  currentUser: User;
  onBackToHome: () => void;
}

const INITIAL_BANKROLL_CONFIG: BankrollConfig = {
  initialBalance: 500,
  currentBalance: 500,
  currency: "USD",
  dailyStopWin: 100,
  dailyStopLoss: 50,
  baseStakePercent: 2,
  strategyMode: "SOROS",
  sorosLevel: 1,
};

const INITIAL_AUTOTRADER_CONFIG: AutoTraderConfig = {
  enabled: false,
  dailyStopWin: 100,
  dailyStopLoss: 50,
  stakeAmount: 10,
  minPayout: 85,
  timeframe: "1m",
  managementMode: "2x1",
  minAiConfidence: 78,
  soundAlerts: true,
};

const INITIAL_AUTOTRADER_SESSION: AutoTraderSession = {
  status: "IDLE",
  wins: 0,
  losses: 0,
  draws: 0,
  totalPnl: 0,
  tradesExecuted: 0,
  startedAt: Date.now(),
  history: [],
};

const INITIAL_TABS = [
  { id: "ETHUSDT", label: "ETH/USDT", type: "CRYPTO" },
  { id: "BTCUSDT", label: "BTC/USDT", type: "CRYPTO" },
  { id: "GBPUSD_OTC", label: "GBP/USD (OTC)", type: "FOREX OTC" },
];

export default function CandleXWorkstation({ currentUser, onBackToHome }: CandleXWorkstationProps) {
  const [activeTicker, setActiveTicker] = useState<string>("ETHUSDT");
  const [timeframe, setTimeframe] = useState<string>("1m");
  const [protectionEnabled, setProtectionEnabled] = useState<boolean>(true);
  const [chartEngine, setChartEngine] = useState<"HIOVE_REAL" | "TRADINGVIEW">("HIOVE_REAL");

  const [openTabs, setOpenTabs] = useState(INITIAL_TABS);

  // States
  const [candles, setCandles] = useState<Candle[]>([]);
  const [indicators, setIndicators] = useState<TechnicalIndicators | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AiAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [selectedTool, setSelectedTool] = useState<string>("crosshair");

  // Overlays
  const [showEMAs, setShowEMAs] = useState<boolean>(true);
  const [showBollinger, setShowBollinger] = useState<boolean>(true);
  const [showLevels, setShowLevels] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);

  // Modals
  const [isOperationsOpen, setIsOperationsOpen] = useState<boolean>(false);
  const [isFinancialOpen, setIsFinancialOpen] = useState<boolean>(false);
  const [isCopyTraderOpen, setIsCopyTraderOpen] = useState<boolean>(false);
  const [isDailyBonusOpen, setIsDailyBonusOpen] = useState<boolean>(false);
  const [isEconomicCalendarOpen, setIsEconomicCalendarOpen] = useState<boolean>(false);
  const [isIndicatorsOpen, setIsIndicatorsOpen] = useState<boolean>(false);
  const [isDepositOpen, setIsDepositOpen] = useState<boolean>(false);
  const [isVisionOpen, setIsVisionOpen] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isAutoTraderOpen, setIsAutoTraderOpen] = useState<boolean>(false);

  // Auto Trader Config & Session
  const [autoTraderConfig, setAutoTraderConfig] = useState<AutoTraderConfig>(INITIAL_AUTOTRADER_CONFIG);
  const [autoTraderSession, setAutoTraderSession] = useState<AutoTraderSession>(INITIAL_AUTOTRADER_SESSION);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [bankrollConfig, setBankrollConfig] = useState<BankrollConfig>(INITIAL_BANKROLL_CONFIG);

  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'local'>('syncing');

  // 1. Sync from Supabase on load
  useEffect(() => {
    const loadData = async () => {
      if (currentUser && currentUser.id !== 'usr-guest') {
        setSyncStatus('syncing');
        try {
          const { bankroll: dbBankroll, autotrader: dbAutotrader, trades: dbTrades } = 
            await supabaseService.syncCandleXData(currentUser.id);
          
          if (dbBankroll) {
            setBankrollConfig(dbBankroll);
          } else {
            // First time load fallback to local storage or defaults
            const savedBr = localStorage.getItem(`candlex_bankroll_${currentUser.id}`);
            if (savedBr) setBankrollConfig(JSON.parse(savedBr));
          }

          if (dbAutotrader) {
            setAutoTraderConfig(dbAutotrader);
          } else {
            const savedAt = localStorage.getItem(`candlex_autotrader_${currentUser.id}`);
            if (savedAt) setAutoTraderConfig(JSON.parse(savedAt));
          }

          if (dbTrades && dbTrades.length > 0) {
            setTrades(dbTrades);
          } else {
            const savedTr = localStorage.getItem(`candlex_trades_${currentUser.id}`);
            if (savedTr) setTrades(JSON.parse(savedTr));
          }

          setSyncStatus('synced');
        } catch (e) {
          console.warn("Could not sync CandleX data with Supabase, using local fallback", e);
          setSyncStatus('local');
        }
      } else {
        setSyncStatus('local');
      }
    };

    loadData();
  }, [currentUser]);

  // Save changes to Supabase & localStorage helper
  const handleUpdateBankroll = async (newConfig: BankrollConfig) => {
    setBankrollConfig(newConfig);
    if (currentUser && currentUser.id !== 'usr-guest') {
      localStorage.setItem(`candlex_bankroll_${currentUser.id}`, JSON.stringify(newConfig));
      await supabaseService.saveCandleXBankroll(currentUser.id, newConfig);
    }
  };

  const handleUpdateAutoTraderConfig = async (newConfig: AutoTraderConfig) => {
    setAutoTraderConfig(newConfig);
    if (currentUser && currentUser.id !== 'usr-guest') {
      localStorage.setItem(`candlex_autotrader_${currentUser.id}`, JSON.stringify(newConfig));
      await supabaseService.saveCandleXAutoTrader(currentUser.id, newConfig);
    }
  };

  // Fetch Market Candles Polling
  const fetchMarketData = useCallback(async () => {
    try {
      const data = await candlexApiService.getCandles(activeTicker, timeframe, 60);
      if (data && Array.isArray(data) && data.length > 0) {
        setCandles(data);
        const computed = calculateAllIndicators(data);
        setIndicators(computed);
      }
    } catch (e) {
      console.warn("Market klines fetch error:", e);
    }
  }, [activeTicker, timeframe]);

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 2800);
    return () => clearInterval(interval);
  }, [fetchMarketData]);

  const lastAnalysisTimeRef = useRef<number>(0);

  // Run AI Neural Analysis
  const runAiAnalysis = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastAnalysisTimeRef.current < 8000) {
      return; // Cooldown protection
    }
    if (candles.length === 0 || isAnalyzing) return;
    setIsAnalyzing(true);
    lastAnalysisTimeRef.current = now;

    try {
      const latestIndicators = indicators || calculateAllIndicators(candles);
      
      // Scanning animation simulation duration (2s for smooth experience)
      const scanAnim = new Promise((resolve) => setTimeout(resolve, 2000));
      
      const analysisPromise = candlexApiService.analyze(
        activeTicker,
        timeframe.toUpperCase(),
        candles.slice(-20),
        latestIndicators
      );

      const [result] = await Promise.all([analysisPromise, scanAnim]);

      if (result) {
        setAiAnalysis(result);

        // Audio notifications on signals
        if (result.confidenceScore >= 70) {
          if (result.direction === "CALL") {
            soundManager.playCallAlert();
          } else if (result.direction === "PUT") {
            soundManager.playPutAlert();
          }
          soundManager.speakAlert(
            `Alerta CandleX: Análise concluída em ${activeTicker}. Assertividade ${result.confidenceScore}%.`
          );
        }
      }
    } catch (e) {
      console.error("AI Analysis error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [candles, indicators, activeTicker, timeframe, isAnalyzing]);

  useEffect(() => {
    setAiAnalysis(null);
    const delay = setTimeout(() => {
      runAiAnalysis(true);
    }, 800);
    return () => clearTimeout(delay);
  }, [activeTicker, timeframe]);

  // Recurrent analysis trigger
  useEffect(() => {
    const timer = setInterval(() => {
      runAiAnalysis(false);
    }, 45000);
    return () => clearInterval(timer);
  }, [runAiAnalysis]);

  // Save trade log to diário
  const handleRecordTrade = async (
    tradeData: Omit<TradeRecord, "id" | "timestamp" | "result" | "pnl">
  ) => {
    const newTrade: TradeRecord = {
      ...tradeData,
      id: "ord_" + Date.now() + "_" + Math.random().toString(36).substr(2, 3),
      timestamp: Date.now(),
      result: "PENDING",
      pnl: 0,
    };
    
    const updatedTrades = [newTrade, ...trades];
    setTrades(updatedTrades);

    const nextBankroll = {
      ...bankrollConfig,
      currentBalance: Math.max(0, +(bankrollConfig.currentBalance - tradeData.stake).toFixed(2)),
    };
    setBankrollConfig(nextBankroll);

    if (currentUser && currentUser.id !== 'usr-guest') {
      localStorage.setItem(`candlex_trades_${currentUser.id}`, JSON.stringify(updatedTrades));
      localStorage.setItem(`candlex_bankroll_${currentUser.id}`, JSON.stringify(nextBankroll));
      await supabaseService.saveCandleXTrade(currentUser.id, newTrade);
      await supabaseService.saveCandleXBankroll(currentUser.id, nextBankroll);
    }
  };

  // Update Trade outcome
  const handleUpdateTradeResult = async (
    id: string,
    result: "WIN" | "LOSS" | "DRAW"
  ) => {
    let targetTrade: TradeRecord | null = null;
    let nextBankroll = { ...bankrollConfig };

    const updatedTrades = trades.map((t) => {
      if (t.id !== id) return t;
      let pnl = 0;
      if (result === "WIN") {
        pnl = +((t.stake * t.payoutPercent) / 100).toFixed(2);
        nextBankroll.currentBalance = +(nextBankroll.currentBalance + t.stake + pnl).toFixed(2);
      } else if (result === "LOSS") {
        pnl = -t.stake;
      }
      targetTrade = { ...t, result, pnl };
      return targetTrade;
    });

    setTrades(updatedTrades);
    setBankrollConfig(nextBankroll);

    if (currentUser && currentUser.id !== 'usr-guest') {
      localStorage.setItem(`candlex_trades_${currentUser.id}`, JSON.stringify(updatedTrades));
      localStorage.setItem(`candlex_bankroll_${currentUser.id}`, JSON.stringify(nextBankroll));
      if (targetTrade) {
        await supabaseService.saveCandleXTrade(currentUser.id, targetTrade);
      }
      await supabaseService.saveCandleXBankroll(currentUser.id, nextBankroll);
    }
  };

  const handleClearTrades = async () => {
    if (window.confirm("Deseja realmente limpar o histórico de ordens do diário?")) {
      setTrades([]);
      if (currentUser && currentUser.id !== 'usr-guest') {
        localStorage.removeItem(`candlex_trades_${currentUser.id}`);
        await supabaseService.clearCandleXTrades(currentUser.id);
      }
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.setSoundEnabled(next);
  };

  const handleAddFunds = (amount: number) => {
    const nextBr = {
      ...bankrollConfig,
      currentBalance: +(bankrollConfig.currentBalance + amount).toFixed(2),
    };
    handleUpdateBankroll(nextBr);
  };

  // Auto Trader session simulation engine
  const handleToggleAutoTrader = () => {
    const nextConfig = {
      ...autoTraderConfig,
      enabled: !autoTraderConfig.enabled,
    };
    handleUpdateAutoTraderConfig(nextConfig);

    if (nextConfig.enabled) {
      setAutoTraderSession((prev) => ({
        ...prev,
        status: "RUNNING",
        startedAt: Date.now(),
      }));
      soundManager.speakAlert("Robô CandleX Ativado. Iniciando varredura automatizada.");
    } else {
      setAutoTraderSession((prev) => ({
        ...prev,
        status: "PAUSED",
      }));
      soundManager.speakAlert("Robô de Opções Pausado.");
    }
  };

  const handleResetAutoTraderSession = () => {
    setAutoTraderSession({
      ...INITIAL_AUTOTRADER_SESSION,
      startedAt: Date.now(),
    });
  };

  // Simulation execution for Auto Trader (simulates trade resolver after M1 timer)
  useEffect(() => {
    if (!autoTraderConfig.enabled || !aiAnalysis || aiAnalysis.direction === "NEUTRAL") return;

    // Minimum AI confidence check
    if (aiAnalysis.confidenceScore < autoTraderConfig.minAiConfidence) return;

    const payoutPercent = 89; // constant simulated payout
    const stake = autoTraderConfig.stakeAmount;

    // Simulate entry
    const entryPrice = candles[candles.length - 1]?.close || 0;
    const direction = aiAnalysis.direction as "CALL" | "PUT";

    // Deduct stake from banca
    const stakeBankroll = {
      ...bankrollConfig,
      currentBalance: Math.max(0, +(bankrollConfig.currentBalance - stake).toFixed(2)),
    };
    setBankrollConfig(stakeBankroll);

    const logId = "auto_" + Date.now();
    const pendingItem: AutoTradeLogItem = {
      id: logId,
      timestamp: Date.now(),
      ticker: activeTicker,
      direction,
      stake,
      payoutPercent,
      confidenceScore: aiAnalysis.confidenceScore,
      result: "PENDING",
      pnl: 0,
      timeframe: timeframe,
      managementCycle: autoTraderConfig.managementMode,
    };

    // Add to session logs
    setAutoTraderSession((prev) => ({
      ...prev,
      status: "RUNNING",
      tradesExecuted: prev.tradesExecuted + 1,
      history: [pendingItem, ...prev.history],
    }));

    // Record trade on general history too
    handleRecordTrade({
      ticker: activeTicker,
      direction,
      entryPrice,
      stake,
      payoutPercent,
      expiryMinutes: timeframe === "5m" ? 5 : 1,
      strategyUsed: `IA Automática (${aiAnalysis.strategyName})`,
      confidenceAtEntry: aiAnalysis.confidenceScore,
    });

    // Simulate options expiry timer
    const resolveTimeout = setTimeout(() => {
      const isWin = Math.random() < (aiAnalysis.confidenceScore / 100);
      const outcome = isWin ? "WIN" : "LOSS";
      const profitPnl = isWin ? +((stake * payoutPercent) / 100).toFixed(2) : -stake;

      // Update log item
      setAutoTraderSession((prev) => {
        const updatedHistory = prev.history.map((h) => {
          if (h.id !== logId) return h;
          return { ...h, result: outcome, pnl: profitPnl };
        });

        const nextWins = prev.wins + (isWin ? 1 : 0);
        const nextLosses = prev.losses + (isWin ? 0 : 1);
        const nextTotalPnl = +(prev.totalPnl + profitPnl).toFixed(2);

        // Check stops limits
        let nextStatus = prev.status;
        if (nextTotalPnl >= autoTraderConfig.dailyStopWin) {
          nextStatus = "STOP_WIN";
          confetti();
          soundManager.speakAlert("Meta diária atingida! Robô finalizado com sucesso.");
          setAutoTraderConfig((c) => ({ ...c, enabled: false }));
        } else if (nextTotalPnl <= -autoTraderConfig.dailyStopLoss) {
          nextStatus = "STOP_LOSS";
          soundManager.speakAlert("Limite de Stop Loss diário atingido. Robô desligado por segurança.");
          setAutoTraderConfig((c) => ({ ...c, enabled: false }));
        } else {
          if (isWin) soundManager.playWin();
        }

        return {
          ...prev,
          wins: nextWins,
          losses: nextLosses,
          totalPnl: nextTotalPnl,
          status: nextStatus,
          history: updatedHistory,
        };
      });

      if (isWin) {
        setBankrollConfig((b) => {
          const nextB = {
            ...b,
            currentBalance: +(b.currentBalance + stake + profitPnl).toFixed(2),
          };
          // Save back to DB
          if (currentUser && currentUser.id !== 'usr-guest') {
            supabaseService.saveCandleXBankroll(currentUser.id, nextB);
          }
          return nextB;
        });
      }
    }, 12000); // 12 seconds simulated round expiry for fast testing

    return () => clearTimeout(resolveTimeout);
  }, [aiAnalysis, autoTraderConfig.enabled]);

  const currentPrice = candles[candles.length - 1]?.close || 0;

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-64px)] w-full bg-[#0B0E14] text-slate-100 overflow-hidden font-sans select-none relative">
      
      {/* 1. Hiove Topbar Switcher */}
      <HioveUnifiedTopBar
        activeTicker={activeTicker}
        onSelectTicker={setActiveTicker}
        openTabs={openTabs}
        onCloseTab={(id) => setOpenTabs(openTabs.filter(t => t.id !== id))}
        onAddTab={() => {
          const available = [
            { id: "SOLUSDT", label: "SOL/USDT", type: "CRYPTO" },
            { id: "EURUSD", label: "EUR/USD", type: "FOREX" },
          ].find(a => !openTabs.some(t => t.id === a.id));
          if (available) setOpenTabs([...openTabs, available]);
        }}
        bankroll={bankrollConfig}
        onOpenDeposit={() => setIsDepositOpen(true)}
        onOpenWithdrawal={() => setIsFinancialOpen(true)}
        onOpenJournal={() => setIsOperationsOpen(true)}
        onOpenCalendar={() => setIsEconomicCalendarOpen(true)}
        onOpenIndicators={() => setIsIndicatorsOpen(true)}
        onOpenAutoTrader={() => setIsAutoTraderOpen(true)}
        onOpenVision={() => setIsVisionOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        syncStatus={syncStatus}
      />

      {/* Main Trading Area */}
      <div className="flex-1 flex w-full overflow-hidden min-h-0">
        
        {/* Left Side: Neural AI panel */}
        <NeuralAnalyzerSidebar
          activeTicker={activeTicker}
          onSelectTicker={setActiveTicker}
          timeframe={timeframe}
          onChangeTimeframe={setTimeframe}
          protectionEnabled={protectionEnabled}
          onToggleProtection={() => setProtectionEnabled(!protectionEnabled)}
          onGenerateAnalysis={() => runAiAnalysis(true)}
          isAnalyzing={isAnalyzing}
          analysis={aiAnalysis}
          indicators={indicators}
          currentPrice={currentPrice}
          autoTraderConfig={autoTraderConfig}
          autoTraderSession={autoTraderSession}
          onToggleAutoTrader={handleToggleAutoTrader}
          onOpenAutoTraderModal={() => setIsAutoTraderOpen(true)}
        />

        {/* Central Workstation */}
        <main className="flex-1 h-full min-h-0 bg-[#0B0E14] relative flex flex-col overflow-hidden">
          
          <div className="bg-[#0D111A] border-b border-[#1A2233] px-3 py-1.5 flex items-center justify-between gap-2 flex-shrink-0 z-20">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-[#121622] p-0.5 rounded-lg border border-[#1E2638]">
                <button
                  type="button"
                  onClick={() => setChartEngine("HIOVE_REAL")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-black transition-all cursor-pointer ${
                    chartEngine === "HIOVE_REAL"
                      ? "bg-gradient-to-r from-[#FF7A00] to-amber-500 text-slate-950 shadow-[0_0_10px_rgba(255,122,0,0.35)]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Hiove Oficial (Real)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChartEngine("TRADINGVIEW")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    chartEngine === "TRADINGVIEW"
                      ? "bg-[#1C2538] text-white border border-[#2D3B59]"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <span>TradingView Pro</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
                Ativo: <strong className="text-white">{activeTicker}</strong> &bull; {timeframe}
              </span>
              <button
                type="button"
                onClick={() => window.open(`https://app.hiove.com/traderoom?ticker=${activeTicker}`, "_blank")}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#141A26] hover:bg-[#1E2638] text-[11px] text-amber-400 border border-[#1E2638] cursor-pointer font-bold transition-all"
              >
                <span>Negociar no site da Hiove</span>
                <span className="text-[10px]">↗</span>
              </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full min-h-0 relative">
            {chartEngine === "HIOVE_REAL" && (
              <HioveBrokerFrame
                activeTicker={activeTicker}
                onRecordTrade={handleRecordTrade}
                lastAiDirection={aiAnalysis?.direction}
                currentPrice={currentPrice}
              />
            )}

            {chartEngine === "TRADINGVIEW" && (
              <TradingViewRealChart
                ticker={activeTicker}
                interval={timeframe}
              />
            )}

            <AiNeuralScannerOverlay
              isScanning={isAnalyzing}
              activeTicker={activeTicker}
              timeframe={timeframe}
              indicators={indicators}
              candles={candles}
              analysis={aiAnalysis}
            />

            <CenterSignalOverlay
              analysis={aiAnalysis}
              activeTicker={activeTicker}
              timeframe={timeframe}
              indicators={indicators}
              candles={candles}
              isAnalyzing={isAnalyzing}
              onReScan={() => runAiAnalysis(true)}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <OperationsModal
        isOpen={isOperationsOpen}
        onClose={() => setIsOperationsOpen(false)}
        trades={trades}
        onUpdateTradeResult={handleUpdateTradeResult}
        onClearTrades={handleClearTrades}
      />

      <AutoTraderModal
        isOpen={isAutoTraderOpen}
        onClose={() => setIsAutoTraderOpen(false)}
        config={autoTraderConfig}
        onChangeConfig={handleUpdateAutoTraderConfig}
        session={autoTraderSession}
        onResetSession={handleResetAutoTraderSession}
        onToggleEnabled={handleToggleAutoTrader}
      />

      <FinancialModal
        isOpen={isFinancialOpen}
        onClose={() => setIsFinancialOpen(false)}
        config={bankrollConfig}
        onSaveConfig={handleUpdateBankroll}
      />

      <CopyTraderModal
        isOpen={isCopyTraderOpen}
        onClose={() => setIsCopyTraderOpen(false)}
      />

      <DailyBonusModal
        isOpen={isDailyBonusOpen}
        onClose={() => setIsDailyBonusOpen(false)}
        onAddBalance={handleAddFunds}
      />

      <EconomicCalendarModal
        isOpen={isEconomicCalendarOpen}
        onClose={() => setIsEconomicCalendarOpen(false)}
      />

      <IndicatorsModal
        isOpen={isIndicatorsOpen}
        onClose={() => setIsIndicatorsOpen(false)}
        showEMAs={showEMAs}
        onToggleEMAs={() => setShowEMAs(!showEMAs)}
        showBollinger={showBollinger}
        onToggleBollinger={() => setShowBollinger(!showBollinger)}
        showLevels={showLevels}
        onToggleLevels={() => setShowLevels(!showLevels)}
        showVolume={showVolume}
        onToggleVolume={() => setShowVolume(!showVolume)}
      />

      <DepositModal
        isOpen={isDepositOpen}
        onClose={() => setIsDepositOpen(false)}
        onAddFunds={handleAddFunds}
      />

      {/* Paste Vision screenshot modal */}
      {isVisionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0E121B] border border-[#1E2638] rounded-2xl w-full max-w-2xl p-4 overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-white text-sm">CandleX AI Print Vision Scanner</h3>
              <button
                onClick={() => setIsVisionOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg"
              >
                ✕
              </button>
            </div>
            <AiChartVisionModal
              isEmbedded
              activeTicker={activeTicker}
              onClose={() => setIsVisionOpen(false)}
            />
          </div>
        </div>
      )}

      {/* AI Assistant Chat Drawer */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-[#0E121B] border border-[#1E2638] rounded-2xl w-full max-w-2xl p-4 max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-3 flex-shrink-0">
              <h3 className="font-bold text-white text-sm">Assistente de Trading & Gestão CandleX AI</h3>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              <AiChatDrawer
                isEmbedded
                activeTicker={activeTicker}
                currentAnalysis={aiAnalysis}
                indicators={indicators}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
