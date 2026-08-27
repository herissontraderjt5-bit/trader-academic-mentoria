import React, { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
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
  accountType: "DEMO",
  hioveEmail: "",
  hiovePassword: "",
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
  { id: "GBPUSD", label: "GBP/USD", type: "FOREX" },
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
  const [recentResultNotification, setRecentResultNotification] = useState<TradeRecord | null>(null);

  // Hiove integration states
  const [hioveAccountInfo, setHioveAccountInfo] = useState<{ balance: number; demoBalance: number; token: string | null; userId: string | null }>({
    balance: 0,
    demoBalance: 10000,
    token: null,
    userId: null,
  });
  const hioveWsRef = useRef<WebSocket | null>(null);

  // Auto-hide the trade outcome notification after 6 seconds
  useEffect(() => {
    if (recentResultNotification) {
      const timer = setTimeout(() => {
        setRecentResultNotification(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [recentResultNotification]);


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

  // Connect to Hiove WebSocket
  const connectToHiove = useCallback(async (forceReconnect = false) => {
    if (!autoTraderConfig.hioveEmail || !autoTraderConfig.hiovePassword) {
      return;
    }

    if (hioveWsRef.current && hioveWsRef.current.readyState === WebSocket.OPEN && !forceReconnect) {
      return;
    }

    try {
      const tenantId = "01JWYBZHW6DM9D7NKPBGJFDZEA";
      console.log("Authenticating with Hiove API...");
      
      const authRes = await fetch("https://broker-api.mybrokerdev.com/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-timestamp": String(Date.now())
        },
        body: JSON.stringify({
          email: autoTraderConfig.hioveEmail,
          password: autoTraderConfig.hiovePassword,
          tenantId: tenantId,
          recaptchaToken: "bypass-2"
        })
      });

      if (!authRes.ok) {
        console.error("Hiove authentication failed, status:", authRes.status);
        // Clear token
        setHioveAccountInfo((prev) => ({ ...prev, token: null, userId: null }));
        // Turn off robot if it was enabled on REAL account
        if (autoTraderConfig.enabled && autoTraderConfig.accountType === "REAL") {
          const nextConfig = { ...autoTraderConfig, enabled: false };
          setAutoTraderConfig(nextConfig);
          if (currentUser && currentUser.id !== 'usr-guest') {
            localStorage.setItem(`candlex_autotrader_${currentUser.id}`, JSON.stringify(nextConfig));
            supabaseService.saveCandleXAutoTrader(currentUser.id, nextConfig);
          }
          soundManager.speakAlert("Falha na autenticação da Hiove. Robô desativado.");
        }
        return;
      }

      const authData = await authRes.json();
      const token = authData.token || (authData.data && authData.data.token);

      if (!token) {
        console.error("Failed to parse token from Hiove response:", authData);
        setHioveAccountInfo((prev) => ({ ...prev, token: null, userId: null }));
        return;
      }

      // Fetch /auth/me with token to get userId (room)
      const meRes = await fetch("https://broker-api.mybrokerdev.com/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-tenant-id": tenantId,
          "x-timestamp": String(Date.now())
        }
      });

      let userId = null;
      if (meRes.ok) {
        const meData = await meRes.json();
        userId = meData.id || (meData.data && meData.data.id) || (meData.user && meData.user.id) || (meData.data && meData.data.user?.id);
      }

      if (!userId) {
        console.error("Failed to fetch user ID from auth/me profile request");
        setHioveAccountInfo((prev) => ({ ...prev, token: null, userId: null }));
        return;
      }

      // Fetch current wallets balances
      const walletsRes = await fetch("https://broker-api.mybrokerdev.com/users/wallets", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "x-tenant-id": tenantId,
          "x-timestamp": String(Date.now())
        }
      });
      
      let balance = 0;
      let demoBalance = 10000;
      if (walletsRes.ok) {
        const wallets = await walletsRes.json();
        const walletsList = Array.isArray(wallets) ? wallets : (wallets.data && Array.isArray(wallets.data) ? wallets.data : []);
        const realWallet = walletsList.find((w: any) => w.type === "REAL");
        const demoWallet = walletsList.find((w: any) => w.type === "DEMO");
        if (realWallet) balance = realWallet.balance;
        if (demoWallet) demoBalance = demoWallet.balance;
      }

      setHioveAccountInfo({
        token,
        userId,
        balance,
        demoBalance
      });

      const selectedBalance = autoTraderConfig.accountType === "REAL" ? balance : demoBalance;
      setBankrollConfig((prevBr) => {
        const nextBr = { ...prevBr, currentBalance: selectedBalance };
        if (currentUser && currentUser.id !== 'usr-guest') {
          supabaseService.saveCandleXBankroll(currentUser.id, nextBr);
        }
        return nextBr;
      });

      if (hioveWsRef.current) {
        hioveWsRef.current.close();
      }

      const wsUrl = `wss://broker-api-websocket-proxy.asapcode.workers.dev/ws?room=${userId}&token=${token}`;
      console.log("Connecting to Hiove WebSocket proxy...");
      const ws = new WebSocket(wsUrl);
      hioveWsRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to Hiove WebSocket proxy");
        ws.send(JSON.stringify({
          event: "subscribe",
          room: userId
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log("Hiove WS Message:", message);

          if (message.event === "user.balance.updated") {
            const { type, balance: newBalance } = message.data || {};
            if (type && newBalance !== undefined) {
              setHioveAccountInfo((prev) => {
                const updated = {
                  ...prev,
                  balance: type === "REAL" ? newBalance : prev.balance,
                  demoBalance: type === "DEMO" ? newBalance : prev.demoBalance
                };
                
                const currentSelectedType = autoTraderConfig.accountType;
                if (type === currentSelectedType) {
                  setBankrollConfig((prevBr) => {
                    const nextBr = { ...prevBr, currentBalance: newBalance };
                    if (currentUser && currentUser.id !== 'usr-guest') {
                      supabaseService.saveCandleXBankroll(currentUser.id, nextBr);
                    }
                    return nextBr;
                  });
                }
                return updated;
              });
            }
          }
        } catch (err) {
          console.warn("Error parsing Hiove WS message:", err);
        }
      };

      ws.onclose = () => {
        console.log("Hiove WebSocket disconnected, reconnecting in 10s...");
        setTimeout(() => connectToHiove(false), 10000);
      };
    } catch (e) {
      console.error("Failed to connect to Hiove:", e);
      setHioveAccountInfo((prev) => ({ ...prev, token: null, userId: null }));
    }
  }, [autoTraderConfig.hioveEmail, autoTraderConfig.hiovePassword, autoTraderConfig.accountType, autoTraderConfig.enabled, currentUser]);

  // Connect to Hiove on mount or when credentials change (debounced)
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      connectToHiove(true);
    }, 1500); // 1.5s debounce to avoid spamming connection while typing

    return () => {
      clearTimeout(delayDebounce);
    };
  }, [connectToHiove]);

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (hioveWsRef.current) {
        hioveWsRef.current.close();
      }
    };
  }, []);

  // Place order via Hiove WebSocket proxy / HTTP API
  const placeRealHioveTrade = useCallback(async (direction: "CALL" | "PUT", amount: number) => {
    if (!hioveAccountInfo.token) {
      console.warn("Cannot place trade: Hiove is not authenticated");
      return false;
    }

    try {
      const tenantId = "01JWYBZHW6DM9D7NKPBGJFDZEA";
      const isDemo = autoTraderConfig.accountType !== "REAL";
      const closeType = timeframe === "5m" ? "5m" : "1m";
      const tradeDirection = direction === "CALL" ? "BUY" : "SELL";
      const symbol = activeTicker.replace("_OTC", "");

      console.log("Placing real Hiove trade via API...", { symbol, direction: tradeDirection, amount, isDemo });
      
      const res = await fetch("https://broker-api.mybrokerdev.com/trades/open-async", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${hioveAccountInfo.token}`,
          "x-tenant-id": tenantId,
          "x-timestamp": String(Date.now())
        },
        body: JSON.stringify({
          isDemo,
          closeType,
          direction: tradeDirection,
          symbol,
          expirationType: "CANDLE_CLOSE",
          amount,
          builderBot: true
        })
      });

      if (res.ok) {
        const data = await res.json();
        console.log("Real trade executed successfully on Hiove:", data);
        return true;
      } else {
        const errText = await res.text();
        console.error("Failed to execute trade on Hiove, status:", res.status, errText);
        
        // If unauthorized/expired, clear credentials and deactivate
        if (res.status === 401) {
          setHioveAccountInfo((prev) => ({ ...prev, token: null, userId: null }));
          if (autoTraderConfig.enabled && autoTraderConfig.accountType === "REAL") {
            const nextConfig = { ...autoTraderConfig, enabled: false };
            setAutoTraderConfig(nextConfig);
            if (currentUser && currentUser.id !== 'usr-guest') {
              localStorage.setItem(`candlex_autotrader_${currentUser.id}`, JSON.stringify(nextConfig));
              supabaseService.saveCandleXAutoTrader(currentUser.id, nextConfig);
            }
            soundManager.speakAlert("Sessão da Hiove expirada. Robô desativado.");
          }
        }
        return false;
      }
    } catch (e) {
      console.error("Error executing Hiove trade:", e);
      return false;
    }
  }, [activeTicker, timeframe, autoTraderConfig.accountType, hioveAccountInfo.token]);

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
  }, [activeTicker, timeframe]);

  const lastTriggeredCandleStartRef = useRef<number | null>(null);




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

    // Forward the order to the real Hiove broker via WebSocket
    placeRealHioveTrade(tradeData.direction, tradeData.stake);
    
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

  const lastAutoTraderCandleStartRef = useRef<number | null>(null);

  // Background Auto Trader execution callback (evaluates signals and executes silently)
  const runAutoTraderAnalysis = useCallback(async () => {
    if (candles.length === 0) return;

    try {
      const latestIndicators = indicators || calculateAllIndicators(candles);
      
      const result = await candlexApiService.analyze(
        activeTicker,
        timeframe.toUpperCase(),
        candles.slice(-20),
        latestIndicators
      );

      if (result && result.direction !== "NEUTRAL" && result.confidenceScore >= autoTraderConfig.minAiConfidence) {
        // Perform anti-loss check logic directly
        const rsi = latestIndicators?.rsi || 50;
        const trend = latestIndicators?.trend || "ALTA";
        const dir = result.direction;

        const isExtremeOverbought = rsi > 80 && dir === "CALL";
        const isExtremeOversold = rsi < 20 && dir === "PUT";
        const isAgainstTrend = (trend === "ALTA" && dir === "PUT") || (trend === "BAIXA" && dir === "CALL");

        if (isExtremeOverbought || isExtremeOversold || (isAgainstTrend && result.confidenceScore < 85)) {
          console.log("Auto Trader: Trade rejected by anti-loss filters", { rsi, trend, dir });
          return;
        }

        const now = new Date();
        const tf = timeframe.toLowerCase();
        const isM5 = tf.includes("5m") || tf === "5" || tf === "m5";
        const isM2 = tf.includes("2m") || tf === "2" || tf === "m2";
        const candleLengthMs = isM5 ? 300000 : (isM2 ? 120000 : 60000);
        
        // Start of the entry candle (the next candle)
        const entryCandleStartMs = Math.ceil((now.getTime() + 1000) / candleLengthMs) * candleLengthMs;

        // Avoid double entry on the same candle
        if (lastAutoTraderCandleStartRef.current === entryCandleStartMs) return;
        lastAutoTraderCandleStartRef.current = entryCandleStartMs;

        const payoutPercent = 89;
        const stake = autoTraderConfig.stakeAmount || autoTraderConfig.fixedStake || 10;
        const direction = dir as "CALL" | "PUT";
        const entryPrice = candles[candles.length - 1]?.close || 0;

        const logId = "auto_" + Date.now();
        const pendingItem: AutoTradeLogItem = {
          id: logId,
          timestamp: Date.now(),
          ticker: activeTicker,
          direction,
          stake,
          payoutPercent,
          confidenceScore: result.confidenceScore,
          result: "PENDING",
          pnl: 0,
          timeframe: timeframe,
          managementCycle: autoTraderConfig.managementMode || "FIXED",
        };

        // Add to session history
        setAutoTraderSession((prev) => ({
          ...prev,
          status: "RUNNING",
          tradesExecuted: prev.tradesExecuted + 1,
          history: [pendingItem, ...prev.history],
        }));

        // Record trade on general history (this handles bankroll stake deduction and DB save)
        handleRecordTrade({
          ticker: activeTicker,
          direction,
          entryPrice,
          stake,
          payoutPercent,
          expiryMinutes: isM5 ? 5 : (isM2 ? 2 : 1),
          strategyUsed: `IA Automática (${result.strategyName})`,
          confidenceAtEntry: result.confidenceScore,
        });

        soundManager.speakAlert(`Robô executou entrada de ${direction} em ${activeTicker}.`);
      }
    } catch (e) {
      console.error("Auto Trader analysis error:", e);
    }
  }, [candles, indicators, activeTicker, timeframe, autoTraderConfig, handleRecordTrade]);

  // Active clock synchronization for Auto Trader automatic scanning at the exact boundary
  useEffect(() => {
    if (!autoTraderConfig.enabled) return;

    const checkInterval = setInterval(() => {
      const now = new Date();
      const tf = timeframe.toLowerCase();
      const isM5 = tf.includes("5m") || tf === "5" || tf === "m5";
      const isM2 = tf.includes("2m") || tf === "2" || tf === "m2";
      const candleLengthMs = isM5 ? 300000 : (isM2 ? 120000 : 60000);
      const currentCandleStart = Math.floor(now.getTime() / candleLengthMs) * candleLengthMs;

      // Calculate remaining seconds
      const seconds = now.getSeconds();
      const milliseconds = now.getMilliseconds();
      const totalSecondsOfCurrentMinute = seconds + milliseconds / 1000;
      let secondsRemaining = 60 - totalSecondsOfCurrentMinute;
      if (isM5) {
        const minutes = now.getMinutes();
        const elapsedSeconds = (minutes % 5) * 60 + totalSecondsOfCurrentMinute;
        secondsRemaining = 300 - elapsedSeconds;
      } else if (isM2) {
        const minutes = now.getMinutes();
        const elapsedSeconds = (minutes % 2) * 60 + totalSecondsOfCurrentMinute;
        secondsRemaining = 120 - elapsedSeconds;
      }

      const targetRemaining = isM5 ? 150 : (isM2 ? 60 : 30); // 2m30s for M5, 60s for M2, 30s for M1

      // Trigger analysis when the candle hits the target window and it hasn't triggered for this candle yet
      if (secondsRemaining <= targetRemaining && secondsRemaining > targetRemaining - 3) {
        const lastTriggeredCandleStartRefVal = lastTriggeredCandleStartRef.current;
        if (lastTriggeredCandleStartRefVal !== currentCandleStart) {
          lastTriggeredCandleStartRef.current = currentCandleStart;
          runAutoTraderAnalysis();
        }
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [autoTraderConfig.enabled, timeframe, runAutoTraderAnalysis]);

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
    if (!autoTraderConfig.enabled) {
      // Validate credentials if attempting to turn ON in REAL mode
      if (autoTraderConfig.accountType === "REAL") {
        if (!autoTraderConfig.hioveEmail || !autoTraderConfig.hiovePassword) {
          alert("Por favor, preencha o E-mail e Senha da Hiove nas configurações do Robô para operar na conta REAL.");
          return;
        }
        if (!hioveAccountInfo.token) {
          alert("Erro: O robô ainda não está conectado à Hiove. Verifique se o e-mail e senha estão corretos nas configurações do Robô e aguarde o status 'CONECTADO'.");
          return;
        }
      }
    }

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



  // Automatic real-time trade resolver using closed market candles
  useEffect(() => {
    if (candles.length === 0 || trades.length === 0) return;

    const pendingTrades = trades.filter((t) => t.result === "PENDING");
    if (pendingTrades.length === 0) return;

    let updated = false;
    const nextTrades = trades.map((t) => {
      if (t.result !== "PENDING") return t;

      const isM5 = t.expiryMinutes === 5;
      const isM2 = t.expiryMinutes === 2;
      const stepMs = isM5 ? 300000 : (isM2 ? 120000 : 60000);
      // Calculate start time of entry candle
      const entryCandleStartMs = Math.round(t.timestamp / stepMs) * stepMs;
      const entryCandleTimeSecs = entryCandleStartMs / 1000;

      // Find if this candle exists in our loaded candles and is closed (meaning there is a newer candle in the array)
      const candleIndex = candles.findIndex((c) => c.time === entryCandleTimeSecs);
      if (candleIndex !== -1 && candleIndex < candles.length - 1) {
        const candle = candles[candleIndex];
        const entryPrice = t.entryPrice || candle.open;
        const expiryPrice = candle.close;

        let outcome: "WIN" | "LOSS" | "DRAW" = "DRAW";
        if (t.direction === "CALL") {
          if (expiryPrice > entryPrice) outcome = "WIN";
          else if (expiryPrice < entryPrice) outcome = "LOSS";
        } else { // PUT
          if (expiryPrice < entryPrice) outcome = "WIN";
          else if (expiryPrice > entryPrice) outcome = "LOSS";
        }

        let pnl = 0;
        if (outcome === "WIN") {
          pnl = +((t.stake * t.payoutPercent) / 100).toFixed(2);
        } else if (outcome === "LOSS") {
          pnl = -t.stake;
        }

        updated = true;

        // Speak outcome and play audio
        if (outcome === "WIN") {
          soundManager.playWin();
          soundManager.speakAlert(`Vitória! Operação finalizada em ${t.ticker} com lucro de $ ${pnl}.`);
        } else if (outcome === "LOSS") {
          soundManager.speakAlert(`Derrota! Operação finalizada em ${t.ticker} com perda de $ ${t.stake}.`);
        } else {
          soundManager.speakAlert(`Empate! Operação finalizada em ${t.ticker}.`);
        }

        // Update bankroll balance (add stake + pnl back if win, add stake back if draw)
        setBankrollConfig((prevBr) => {
          let nextBalance = prevBr.currentBalance;
          if (outcome === "WIN") {
            nextBalance = +(prevBr.currentBalance + t.stake + pnl).toFixed(2);
          } else if (outcome === "DRAW") {
            nextBalance = +(prevBr.currentBalance + t.stake).toFixed(2);
          }
          const nextBr = { ...prevBr, currentBalance: nextBalance };
          if (currentUser && currentUser.id !== 'usr-guest') {
            supabaseService.saveCandleXBankroll(currentUser.id, nextBr);
          }
          return nextBr;
        });

        // Update AutoTrader session stats
        setAutoTraderSession((prevSession) => {
          const nextWins = prevSession.wins + (outcome === "WIN" ? 1 : 0);
          const nextLosses = prevSession.losses + (outcome === "LOSS" ? 1 : 0);
          const nextDraws = prevSession.draws + (outcome === "DRAW" ? 1 : 0);
          const nextTotalPnl = +(prevSession.totalPnl + pnl).toFixed(2);

          let nextStatus = prevSession.status;
          if (nextTotalPnl >= autoTraderConfig.dailyStopWin) {
            nextStatus = "STOP_WIN";
            confetti();
            soundManager.speakAlert("Meta diária atingida! Robô finalizado com sucesso.");
            setAutoTraderConfig((c) => ({ ...c, enabled: false }));
          } else if (nextTotalPnl <= -autoTraderConfig.dailyStopLoss) {
            nextStatus = "STOP_LOSS";
            soundManager.speakAlert("Limite de Stop Loss diário atingido. Robô desligado por segurança.");
            setAutoTraderConfig((c) => ({ ...c, enabled: false }));
          }

          // Update matching entry in Auto Trader history
          const updatedHistory = prevSession.history.map((h) => {
            if (h.ticker === t.ticker && h.direction === t.direction && Math.abs(h.timestamp - t.timestamp) < 5000) {
              return { ...h, result: outcome, pnl };
            }
            return h;
          });

          return {
            ...prevSession,
            wins: nextWins,
            losses: nextLosses,
            draws: nextDraws,
            totalPnl: nextTotalPnl,
            status: nextStatus,
            history: updatedHistory,
          };
        });

        const resolvedTrade = { ...t, result: outcome, pnl, expiryPrice };
        setRecentResultNotification(resolvedTrade);
        if (currentUser && currentUser.id !== 'usr-guest') {
          supabaseService.saveCandleXTrade(currentUser.id, resolvedTrade);
        }

        return resolvedTrade;
      }

      return t;
    });

    if (updated) {
      setTrades(nextTrades);
      if (currentUser && currentUser.id !== 'usr-guest') {
        localStorage.setItem(`candlex_trades_${currentUser.id}`, JSON.stringify(nextTrades));
      }
    }
  }, [candles, trades, autoTraderConfig.enabled, currentUser]);

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
        hioveToken={hioveAccountInfo.token}
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
              onClose={() => setAiAnalysis(null)}
              onClearAnalysis={() => setAiAnalysis(null)}
              trades={trades}
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
        hioveToken={hioveAccountInfo.token}
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
      {/* Floating Trade Result Notification toast */}
      {recentResultNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#0D121D]/95 border-2 border-slate-700/50 rounded-2xl p-4 shadow-[0_0_30px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-5 fade-in duration-300 pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#1E293B] mb-2.5">
            <span className="text-[10px] font-mono font-black text-slate-400 tracking-wider uppercase">
              RESULTADO DA OPERAÇÃO
            </span>
            <button
              onClick={() => setRecentResultNotification(null)}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-black text-white font-mono block">
                {recentResultNotification.ticker}
              </span>
              <span className={`text-xs font-mono font-bold ${recentResultNotification.direction === "CALL" ? "text-emerald-400" : "text-rose-400"}`}>
                {recentResultNotification.direction === "CALL" ? "COMPRA (CALL) ↗" : "VENDA (PUT) ↘"}
              </span>
            </div>
            
            <div className="text-right">
              {recentResultNotification.result === "WIN" && (
                <span className="text-lg font-black text-emerald-400 tracking-wider font-mono block">
                  VITÓRIA (WIN)
                </span>
              )}
              {recentResultNotification.result === "LOSS" && (
                <span className="text-lg font-black text-rose-400 tracking-wider font-mono block">
                  DERROTA (LOSS)
                </span>
              )}
              {recentResultNotification.result === "DRAW" && (
                <span className="text-lg font-black text-slate-300 tracking-wider font-mono block">
                  EMPATE (DRAW)
                </span>
              )}
              <span className={`text-sm font-bold font-mono ${recentResultNotification.pnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {recentResultNotification.pnl >= 0 ? "+" : ""}$ {recentResultNotification.pnl.toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Prices Detail */}
          <div className="mt-2 bg-[#090D15] p-2 rounded-lg border border-[#182030] flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Entrada: <strong className="text-white">{recentResultNotification.entryPrice}</strong></span>
            <span>Fechamento: <strong className="text-white">{recentResultNotification.expiryPrice || recentResultNotification.entryPrice}</strong></span>
          </div>
        </div>
      )}
    </div>
  );
}
