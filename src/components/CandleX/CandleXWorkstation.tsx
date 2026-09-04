import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  X, 
  AlertTriangle, 
  Cpu, 
  Sparkles, 
  Clock, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  Zap, 
  Wrench, 
  ShieldAlert, 
  ExternalLink, 
  Eye, 
  BarChart3, 
  MessageCircle,
  Flame,
  Check,
  Radio
} from "lucide-react";
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
import { AiNeuralScannerOverlay } from "./components/AiNeuralScannerOverlay";
import { CenterSignalOverlay } from "./components/CenterSignalOverlay";
import { HioveUnifiedTopBar } from "./components/HioveUnifiedTopBar";
import { AutoTraderModal } from "./components/AutoTraderModal";

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
  PlatformSettings,
} from "../../types";

import { calculateAllIndicators, getCandleTimeRemaining, getSynchronizedDate } from "./utils/technicalIndicators";
import { soundManager } from "./utils/soundEffects";
import { candlexApiService } from "./services/apiService";
import { supabaseService } from "../../services/supabaseService";
import confetti from "canvas-confetti";

interface CandleXWorkstationProps {
  currentUser: User;
  onBackToHome: () => void;
  settings?: PlatformSettings;
  onUpdateSettings?: (settings: PlatformSettings) => void;
  onOpenGestao?: () => void;
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
  accountType: "REAL",
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

export default function CandleXWorkstation({ 
  currentUser, 
  onBackToHome,
  settings,
  onUpdateSettings,
  onOpenGestao,
}: CandleXWorkstationProps) {
  const isAdmin = currentUser.role === 'admin' || ['viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com'].includes(currentUser.email?.toLowerCase() || '');
  const [adminPreviewStudentMode, setAdminPreviewStudentMode] = useState(false);
  const isMaintenanceActive = Boolean(settings?.candlexMaintenanceMode);
  const allowAdminBypass = settings?.candlexAllowAdminBypass ?? true;

  const [mobileTab, setMobileTab] = useState<"chart" | "ai">("chart");
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

  // Connect to Hiove API
  const connectToHiove = useCallback(async (forceReconnect = false) => {
    if (autoTraderConfig.hioveApiKey) {
      setHioveAccountInfo((prev) => ({
        ...prev,
        token: autoTraderConfig.hioveApiKey!,
        email: autoTraderConfig.hioveEmail || "api-user@hiove.com",
      }));
      return true;
    }

    if (!autoTraderConfig.hioveEmail || !autoTraderConfig.hiovePassword) {
      return false;
    }

    if (hioveWsRef.current && hioveWsRef.current.readyState === WebSocket.OPEN && !forceReconnect) {
      return;
    }

    try {
      const tenantId = "01JWYBZHW6DM9D7NKPBGJFDZEA";
      console.log("Authenticating with Hiove API...");
      
      let token: string | null = null;

      // 1. Try server-side proxy first (bypasses CORS and browser restrictions)
      try {
        const proxyRes = await fetch("/api/hiove/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "/auth/login",
            method: "POST",
            payload: {
              email: autoTraderConfig.hioveEmail,
              password: autoTraderConfig.hiovePassword,
              tenantId: tenantId,
              recaptchaToken: "bypass-2"
            }
          })
        });

        if (proxyRes.ok) {
          const authData = await proxyRes.json();
          token = authData.token || (authData.data && authData.data.token) || null;
        }
      } catch (proxyErr) {
        console.warn("Hiove proxy error on login, trying direct fetch fallback:", proxyErr);
      }

      // 2. Direct fetch fallback if proxy failed
      if (!token) {
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

        if (authRes.ok) {
          const authData = await authRes.json();
          token = authData.token || (authData.data && authData.data.token) || null;
        }
      }

      if (!token) {
        console.warn("Could not authenticate with Hiove API with provided credentials");
        setHioveAccountInfo((prev) => ({ ...prev, token: null, userId: null }));
        return;
      }

      // Fetch profile /auth/me for userId
      let userId: string | null = null;
      try {
        const meProxy = await fetch("/api/hiove/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: "/auth/me", method: "GET", token })
        });
        if (meProxy.ok) {
          const meData = await meProxy.json();
          userId = meData.id || (meData.data && meData.data.id) || (meData.user && meData.user.id) || (meData.data && meData.data.user?.id) || null;
        }
      } catch {}

      if (!userId) {
        try {
          const meRes = await fetch("https://broker-api.mybrokerdev.com/auth/me", {
            headers: {
              "Authorization": `Bearer ${token}`,
              "x-tenant-id": tenantId,
              "x-timestamp": String(Date.now())
            }
          });
          if (meRes.ok) {
            const meData = await meRes.json();
            userId = meData.id || (meData.data && meData.data.id) || (meData.user && meData.user.id) || (meData.data && meData.data.user?.id) || null;
          }
        } catch {}
      }

      // Fetch wallets
      let balance = 0;
      let demoBalance = 10000;
      try {
        const walletsProxy = await fetch("/api/hiove/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: "/users/wallets", method: "GET", token })
        });
        if (walletsProxy.ok) {
          const wallets = await walletsProxy.json();
          const walletsList = Array.isArray(wallets) ? wallets : (wallets.data && Array.isArray(wallets.data) ? wallets.data : []);
          const realWallet = walletsList.find((w: any) => w.type === "REAL");
          const demoWallet = walletsList.find((w: any) => w.type === "DEMO");
          if (realWallet) balance = realWallet.balance;
          if (demoWallet) demoBalance = demoWallet.balance;
        }
      } catch {}

      setHioveAccountInfo({
        token,
        userId: userId || "user",
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

      return true;
    } catch (e) {
      console.error("Failed to connect to Hiove:", e);
      setHioveAccountInfo((prev) => ({ ...prev, token: null, userId: null }));
      return false;
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
  // Place order via Hiove WebSocket proxy / HTTP API
  const placeRealHioveTrade = useCallback(async (
    direction: "CALL" | "PUT",
    amount: number,
    targetSymbol?: string,
    targetTf?: string
  ) => {
    let currentToken = autoTraderConfig.hioveApiKey || hioveAccountInfo.token;

    // Auto-login fallback if token is missing but API Key is configured
    if (!currentToken && autoTraderConfig.hioveApiKey) {
      console.log("No active token found, attempting rapid reconnect using API Key...");
      await connectToHiove(true);
      currentToken = autoTraderConfig.hioveApiKey || hioveAccountInfo.token;
    }

    if (!currentToken) {
      console.warn("Cannot place trade on broker: Hiove is not authenticated");
      soundManager.speakAlert("Aviso: Conecte sua conta Hiove nas configurações para que as ordens entrem na corretora.");
      return false;
    }

    try {
      const tenantId = "01JWYBZHW6DM9D7NKPBGJFDZEA";
      const isDemo = autoTraderConfig.accountType !== "REAL";
      const chosenTf = (targetTf || timeframe).toLowerCase();
      const closeType = chosenTf.includes("5m") ? "5m" : (chosenTf.includes("2m") ? "2m" : "1m");
      const tradeDirection = direction === "CALL" ? "BUY" : "SELL";
      
      const rawSymbol = (targetSymbol || activeTicker).replace("_OTC", "").trim();
      const symbol = rawSymbol.toUpperCase();

      console.log("Placing real Hiove trade via API...", { symbol, direction: tradeDirection, amount, isDemo, closeType });
      
      const payload = {
        isDemo,
        closeType,
        direction: tradeDirection,
        symbol,
        expirationType: "CANDLE_CLOSE",
        amount,
        builderBot: true
      };

      let success = false;

      // 1. Try server-side proxy first
      try {
        const proxyRes = await fetch("/api/hiove/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: "/trades/open-async",
            method: "POST",
            token: currentToken,
            payload
          })
        });

        if (proxyRes.ok) {
          const data = await proxyRes.json();
          console.log("Real trade executed successfully via proxy on Hiove:", data);
          success = true;
        } else {
          const errData = await proxyRes.text();
          console.warn("Proxy trade error:", proxyRes.status, errData);
        }
      } catch (proxyErr) {
        console.warn("Proxy trade error, trying direct fetch fallback:", proxyErr);
      }

      // 2. Direct fetch fallback
      if (!success) {
        try {
          const res = await fetch("https://broker-api.mybrokerdev.com/trades/open-async", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${currentToken}`,
              "x-tenant-id": tenantId,
              "x-timestamp": String(Date.now())
            },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            console.log("Real trade executed successfully on Hiove direct:", data);
            success = true;
          } else {
            const errText = await res.text();
            console.error("Failed to execute trade on Hiove direct, status:", res.status, errText);
            if (res.status === 401) {
              setHioveAccountInfo((prev) => ({ ...prev, token: null, userId: null }));
            }
          }
        } catch (directErr) {
          console.error("Direct fetch trade execution error:", directErr);
        }
      }

      if (success) {
        soundManager.speakAlert(`Ordem de ${direction === "CALL" ? "Compra" : "Venda"} aberta na Hiove em ${symbol}!`);
      }

      return success;
    } catch (e) {
      console.error("Error executing Hiove trade:", e);
      return false;
    }
  }, [activeTicker, timeframe, autoTraderConfig.accountType, autoTraderConfig.hioveEmail, autoTraderConfig.hiovePassword, hioveAccountInfo.token, connectToHiove]);

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
      
      const result = await candlexApiService.analyze(
        activeTicker,
        timeframe.toUpperCase(),
        candles,
        latestIndicators
      );

      if (result) {
        setAiAnalysis(result);

        // Audio notifications on signals (chimes only to avoid blocking 10s decision voice)
        if (result.confidenceScore >= 70) {
          if (result.direction === "CALL") {
            soundManager.playCallAlert();
          } else if (result.direction === "PUT") {
            soundManager.playPutAlert();
          }
        }
      }
    } catch (e) {
      console.error("AI Analysis error:", e);
    } finally {
      setIsAnalyzing(false);
    }
  }, [candles, indicators, activeTicker, timeframe, isAnalyzing]);

  const prevSelectionRef = useRef<string>(`${activeTicker}_${timeframe}`);

  useEffect(() => {
    const currentKey = `${activeTicker}_${timeframe}`;
    if (prevSelectionRef.current !== currentKey) {
      prevSelectionRef.current = currentKey;
      setAiAnalysis(null);
      lastAnalysisTimeRef.current = 0;

      candlexApiService.getCandles(activeTicker, timeframe, 60).then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setCandles(data);
          const computed = calculateAllIndicators(data);
          setIndicators(computed);
        }
      }).catch(() => {});
    }
  }, [activeTicker, timeframe]);

  // Save trade log to diário
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

  const handleSaveSignalTrade = async (tradeData: TradeRecord) => {
    const tradeId = tradeData.id;
    const existingIndex = trades.findIndex(
      (t) => t.id === tradeId || (t.ticker === tradeData.ticker && Math.abs(t.timestamp - tradeData.timestamp) < 15000 && t.direction === tradeData.direction)
    );
    const existingTrade = existingIndex !== -1 ? trades[existingIndex] : null;
    let updatedTrades: TradeRecord[];

    if (existingIndex !== -1) {
      updatedTrades = trades.map((t, idx) => (idx === existingIndex ? { ...t, ...tradeData } : t));
    } else {
      updatedTrades = [tradeData, ...trades];
    }
    setTrades(updatedTrades);

    // Only modify bankroll balance if result is finalized (WIN or LOSS) and was NOT already finalized
    const wasAlreadyFinalized = existingTrade && (existingTrade.result === "WIN" || existingTrade.result === "LOSS" || existingTrade.result === "DRAW");
    if (!wasAlreadyFinalized && (tradeData.result === "WIN" || tradeData.result === "LOSS")) {
      let nextBalance = bankrollConfig.currentBalance;
      if (tradeData.result === "WIN") {
        nextBalance = +(nextBalance + tradeData.pnl).toFixed(2);
      } else if (tradeData.result === "LOSS") {
        nextBalance = Math.max(0, +(nextBalance - tradeData.stake).toFixed(2));
      }
      const nextBankroll = {
        ...bankrollConfig,
        currentBalance: nextBalance,
      };
      setBankrollConfig(nextBankroll);
      setRecentResultNotification(tradeData);

      if (currentUser && currentUser.id !== 'usr-guest') {
        localStorage.setItem(`candlex_bankroll_${currentUser.id}`, JSON.stringify(nextBankroll));
        await supabaseService.saveCandleXBankroll(currentUser.id, nextBankroll);
      }
    }

    if (currentUser && currentUser.id !== 'usr-guest') {
      localStorage.setItem(`candlex_trades_${currentUser.id}`, JSON.stringify(updatedTrades));
      await supabaseService.saveCandleXTrade(currentUser.id, tradeData);
    }
  };

  const handleDeleteSignalTrade = async (tradeId: string) => {
    const updatedTrades = trades.filter((t) => t.id !== tradeId);
    setTrades(updatedTrades);
    if (currentUser && currentUser.id !== 'usr-guest') {
      localStorage.setItem(`candlex_trades_${currentUser.id}`, JSON.stringify(updatedTrades));
      await supabaseService.deleteCandleXTrade(currentUser.id, tradeId);
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
  const handleToggleAutoTrader = async () => {
    if (!autoTraderConfig.enabled) {
      const activeToken = autoTraderConfig.hioveApiKey || hioveAccountInfo.token;
      // If token exists or API Key is set, connect right now
      if (activeToken && !hioveAccountInfo.token) {
        console.log("Connecting to Hiove on AutoTrader activation via Token...");
        await connectToHiove(true);
      }

      // Validate Token API if attempting to turn ON in REAL mode
      if (autoTraderConfig.accountType === "REAL" && !activeToken) {
        alert("Por favor, insira o seu Token / API Key da Hiove nas configurações do Robô para operar na conta REAL.");
        return;
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

  const lastExecutedSignalRef = useRef<string>("");

  // Continuous Neural Scanner: Automatically runs AI Analysis every 6 seconds when AutoTrader is active
  useEffect(() => {
    if (!autoTraderConfig.enabled || autoTraderSession.status !== "RUNNING") return;

    const scanInterval = setInterval(() => {
      runAiAnalysis(false);
    }, 6000);

    return () => clearInterval(scanInterval);
  }, [autoTraderConfig.enabled, autoTraderSession.status, runAiAnalysis]);

  // Automated Execution Engine: Triggers real Hiove broker trades when high-confidence AI signals are detected
  useEffect(() => {
    if (!autoTraderConfig.enabled || autoTraderSession.status !== "RUNNING") return;
    if (!aiAnalysis) return;

    const minConf = autoTraderConfig.minAiConfidence || 75;
    if (aiAnalysis.confidenceScore < minConf) return;
    if (aiAnalysis.direction !== "CALL" && aiAnalysis.direction !== "PUT") return;

    const signalKey = `${activeTicker}_${aiAnalysis.direction}_${aiAnalysis.timestamp || Date.now()}`;
    if (lastExecutedSignalRef.current === signalKey) return;

    // Cooldown check: prevent placing multiple auto-trades within 40 seconds on the same asset
    const recentAutoTrade = trades.find(
      (t) =>
        t.ticker === activeTicker &&
        (t.strategyUsed?.includes("AutoTrader") || t.strategyUsed?.includes("Robô")) &&
        Date.now() - t.timestamp < 40000
    );
    if (recentAutoTrade) return;

    lastExecutedSignalRef.current = signalKey;

    const expiryMins = timeframe === "5m" ? 5 : timeframe === "2m" ? 2 : 1;
    const currentPriceVal = candles[candles.length - 1]?.close || 0;

    console.log("🤖 AutoTrader Triggering Automated Trade:", {
      ticker: activeTicker,
      direction: aiAnalysis.direction,
      confidence: aiAnalysis.confidenceScore,
      stake: autoTraderConfig.stakeAmount,
      accountType: autoTraderConfig.accountType,
    });

    const newTradeId = "at_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);

    // 1. Send order to real Hiove broker via API Token
    placeRealHioveTrade(
      aiAnalysis.direction,
      autoTraderConfig.stakeAmount,
      activeTicker,
      timeframe
    );

    // 2. Record trade in workstation trade log
    const newTradeRecord: TradeRecord = {
      id: newTradeId,
      ticker: activeTicker,
      direction: aiAnalysis.direction,
      stake: autoTraderConfig.stakeAmount,
      entryPrice: currentPriceVal,
      expiryMinutes: expiryMins,
      payoutPercent: autoTraderConfig.minPayout || 85,
      timestamp: Date.now(),
      result: "PENDING",
      pnl: 0,
      strategyUsed: `AutoTrader IA (${aiAnalysis.confidenceScore}% Conf)`,
      confidenceAtEntry: aiAnalysis.confidenceScore,
    };

    handleRecordTrade(newTradeRecord);

    // 3. Update AutoTrader session history
    setAutoTraderSession((prev) => ({
      ...prev,
      history: [
        {
          id: newTradeId,
          ticker: activeTicker,
          direction: aiAnalysis.direction,
          stake: autoTraderConfig.stakeAmount,
          confidenceScore: aiAnalysis.confidenceScore,
          result: "PENDING",
          pnl: 0,
          timestamp: Date.now(),
        },
        ...prev.history,
      ],
    }));

    soundManager.speakAlert(
      `Robô AutoTrader executou ordem de ${aiAnalysis.direction === "CALL" ? "Compra" : "Venda"} em ${activeTicker} com ${aiAnalysis.confidenceScore}% de confiança.`
    );
  }, [
    aiAnalysis,
    autoTraderConfig.enabled,
    autoTraderConfig.minAiConfidence,
    autoTraderConfig.stakeAmount,
    autoTraderConfig.accountType,
    autoTraderSession.status,
    activeTicker,
    timeframe,
    candles,
    placeRealHioveTrade,
    handleRecordTrade,
    trades,
  ]);

  // Automatic real-time trade resolver using closed market candles
  useEffect(() => {
    if (candles.length === 0 || trades.length === 0) return;

    const pendingTrades = trades.filter((t) => t.result === "PENDING");
    if (pendingTrades.length === 0) return;

    const now = Date.now();
    let updated = false;
    const nextTrades = trades.map((t) => {
      if (t.result !== "PENDING") return t;

      const stepMs = Math.max(1, t.expiryMinutes || 1) * 60000;

      // FIX: Only resolve AFTER the trade duration has finished
      const expiryTimestamp = t.timestamp + (t.expiryMinutes * 60 * 1000);
      if (now < expiryTimestamp) {
        return t; // Trade still running
      }

      // Calculate start time of entry candle
      const entryCandleStartMs = Math.floor(t.timestamp / stepMs) * stepMs;
      const entryCandleTimeSecs = entryCandleStartMs / 1000;
      const stepSecs = stepMs / 1000;

      // Find if this operational candle exists in loaded candles
      let candle = candles.find((c) => c.time === entryCandleTimeSecs);
      if (!candle) {
        candle = candles.find((c) => Math.abs(c.time - entryCandleTimeSecs) < (stepSecs / 2));
      }
      if (!candle && candles.length > 0) {
        const pastCandles = candles.filter((c) => c.time <= entryCandleTimeSecs);
        candle = pastCandles.length > 0 ? pastCandles[pastCandles.length - 1] : candles[candles.length - 1];
      }

      if (candle) {
        const entryPrice = candle.open || t.entryPrice;
        const expiryPrice = candle.close;
        const priceDiff = +(expiryPrice - entryPrice).toFixed(6);

        let outcome: "WIN" | "LOSS" | "DRAW" = "DRAW";
        if (Math.abs(priceDiff) <= 0.000001) {
          outcome = "DRAW";
        } else if (t.direction === "CALL") {
          // COMPRA (CALL): Win se preço final for maior que a entrada (subiu / verde)
          outcome = expiryPrice > entryPrice ? "WIN" : "LOSS";
        } else { // PUT
          // VENDA (PUT): Win se preço final for menor que a entrada (caiu / vermelha)
          outcome = expiryPrice < entryPrice ? "WIN" : "LOSS";
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
          soundManager.speakAlert(`Vitória! Operação em ${t.ticker} com lucro de $ ${pnl}.`);
        } else if (outcome === "LOSS") {
          soundManager.playLoss();
          soundManager.speakAlert(`Loss confirmado em ${t.ticker}.`);
        } else {
          soundManager.speakAlert(`Empate em ${t.ticker}.`);
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

        // ONLY update AutoTrader session stats if the trade originated from AutoTrader
        const isAutoTraderTrade = t.strategyUsed?.toLowerCase().includes("autotrader") || t.strategyUsed?.toLowerCase().includes("robô");
        if (isAutoTraderTrade && autoTraderConfig.enabled) {
          setAutoTraderSession((prevSession) => {
            const nextWins = prevSession.wins + (outcome === "WIN" ? 1 : 0);
            const nextLosses = prevSession.losses + (outcome === "LOSS" ? 1 : 0);
            const nextDraws = prevSession.draws + (outcome === "DRAW" ? 1 : 0);
            const nextTotalPnl = +(prevSession.totalPnl + pnl).toFixed(2);

            let nextStatus = prevSession.status;
            if (nextTotalPnl >= autoTraderConfig.dailyStopWin) {
              nextStatus = "STOP_WIN";
              confetti();
              soundManager.speakAlert("Meta diária do Robô atingida! AutoTrader finalizado com sucesso.");
              setAutoTraderConfig((c) => ({ ...c, enabled: false }));
            } else if (nextTotalPnl <= -autoTraderConfig.dailyStopLoss) {
              nextStatus = "STOP_LOSS";
              soundManager.speakAlert("Limite de Stop Loss diário atingido. AutoTrader pausado por segurança.");
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
        }

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

  // If CandleX AI is in maintenance mode and user is student (or admin in preview mode or bypass disabled)
  if (isMaintenanceActive && (!isAdmin || !allowAdminBypass || adminPreviewStudentMode)) {
    return (
      <div className="min-h-screen bg-[#06060a] text-white flex flex-col font-sans relative overflow-x-hidden selection:bg-orange-500 selection:text-white">
        
        {/* Glow ambient background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-orange-600/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none rounded-full"></div>
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-orange-500/10 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full"></div>

        {/* Top Header */}
        <header className="w-full border-b border-orange-900/30 bg-[#0a0a0f]/80 backdrop-blur-xl px-4 sm:px-8 py-3.5 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-black font-black shadow-lg shadow-orange-500/30">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-tight text-white uppercase font-mono">
                  <span className="text-orange-500">CANDLEX</span> AI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono">
                  {settings?.candlexAiVersion || 'v2.6.0 Neural'}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono">Terminal de Inteligência Artificial & Sinais</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && adminPreviewStudentMode && (
              <button
                onClick={() => setAdminPreviewStudentMode(false)}
                className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black text-xs font-black uppercase transition-all shadow-md cursor-pointer"
              >
                Sair do Modo Preview (Voltar ADM)
              </button>
            )}
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar à Mentoria</span>
            </button>
          </div>
        </header>

        {/* Admin Preview Top Notice */}
        {isAdmin && adminPreviewStudentMode && (
          <div className="w-full bg-amber-500 text-black px-4 py-2 text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md">
            <Eye className="w-4 h-4" />
            <span>MODO DE PRÉ-VISUALIZAÇÃO: É assim que os alunos visualizam a tela de manutenção neste momento.</span>
          </div>
        )}

        {/* Central Futuristic Maintenance Card */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
          <div className="w-full max-w-2xl bg-gradient-to-b from-[#12121c] via-[#0e0e16] to-[#0a0a0f] border border-orange-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-orange-500/5 space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            
            {/* Glowing Accent Ring */}
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/30 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-xl shadow-orange-500/20">
                  <Cpu className="w-10 h-10 animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center font-bold text-xs shadow-md">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-black uppercase tracking-widest font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                  <span>ATUALIZAÇÃO NEURAL EM ANDAMENTO</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {settings?.candlexMaintenanceTitle || 'Atenção: CandleX-IA está em manutenção e atualização'}
                </h1>

                <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
                  {settings?.candlexMaintenanceMessage || 'Nossa inteligência artificial está passando por uma recalibração neural com novos modelos de análise institucional SMC e validação de confluências. O serviço será restabelecido em breve.'}
                </p>
              </div>
            </div>

            {/* Status Grid Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#161622] border border-[#27273d] text-center space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-orange-400" /> Previsão
                </span>
                <p className="text-xs font-black text-amber-300 font-mono truncate">
                  {settings?.candlexMaintenanceEta || 'Hoje às 22:00'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#161622] border border-[#27273d] text-center space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase flex items-center justify-center gap-1">
                  <Cpu className="w-3 h-3 text-orange-400" /> Versão IA
                </span>
                <p className="text-xs font-black text-orange-400 font-mono truncate">
                  {settings?.candlexAiVersion || 'v2.6.0 Neural'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#161622] border border-[#27273d] text-center space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 font-mono uppercase flex items-center justify-center gap-1">
                  <Zap className="w-3 h-3 text-orange-400" /> Progresso
                </span>
                <p className="text-xs font-black text-emerald-400 font-mono">
                  {settings?.candlexMaintenanceProgress ?? 85}% Concluído
                </p>
              </div>
            </div>

            {/* Neural Checkpoint Progress Bar */}
            <div className="p-4 rounded-2xl bg-[#0e0e17] border border-[#202030] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" /> Sincronização do Modelo Neural
                </span>
                <span className="font-black text-orange-400 font-mono">{settings?.candlexMaintenanceProgress ?? 85}%</span>
              </div>
              
              <div className="w-full h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-white/10 p-0.5">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500 animate-pulse shadow-lg shadow-orange-500/50"
                  style={{ width: `${settings?.candlexMaintenanceProgress ?? 85}%` }}
                ></div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>1. Feeds de velas Hiove & Quotex sincronizados</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>2. Calibração dos pesos neurais SMC & Order Blocks</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-amber-300 font-mono animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 shrink-0 animate-spin" />
                  <span>3. Validação de taxa de assertividade em backtest ({settings?.candlexMaintenanceProgress ?? 85}%)</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>4. Liberação oficial do terminal para os alunos</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={onBackToHome}
                className="w-full py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar para as Aulas</span>
              </button>

              {onOpenGestao ? (
                <button
                  onClick={onOpenGestao}
                  className="w-full py-3.5 rounded-xl bg-[#1a1a27] hover:bg-[#252538] border border-[#2d2d44] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BarChart3 className="w-4 h-4 text-orange-400" />
                  <span>Acessar Gestão de Banca</span>
                </button>
              ) : (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3.5 rounded-xl bg-[#1a1a27] hover:bg-[#252538] border border-[#2d2d44] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4 text-orange-400" />
                  <span>Verificar Novamente</span>
                </button>
              )}
            </div>

            {settings?.supportWhatsapp && (
              <div className="text-center pt-1">
                <a
                  href={`https://wa.me/${settings.supportWhatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 hover:text-orange-400 font-mono transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Dúvidas? Fale com a equipe no WhatsApp de Suporte</span>
                </a>
              </div>
            )}

          </div>
        </main>

        {/* Footer */}
        <footer className="w-full text-center py-4 text-[11px] text-zinc-500 font-mono border-t border-white/5 bg-black/40">
          Trader Academic • CandleX-IA System Status • {settings?.candlexAiVersion || 'v2.6.0 Neural'}
        </footer>

      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] md:h-[calc(100vh-64px)] w-full bg-[#0B0E14] text-slate-100 overflow-hidden font-sans select-none relative">
      
      {/* Admin Maintenance Bypass Notice Banner */}
      {isMaintenanceActive && isAdmin && (
        <div className="bg-gradient-to-r from-amber-950/95 via-orange-950/90 to-black border-b border-amber-500/40 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs z-50 flex-shrink-0">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
            <span>MODO MANUTENÇÃO ATIVO: Alunos visualizam o aviso de atualização. Você está acessando pelo modo de Administrador.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAdminPreviewStudentMode(true)}
              className="px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-[11px] font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span>Ver como Aluno</span>
            </button>
            <button
              onClick={() => onUpdateSettings?.({ ...settings, candlexMaintenanceMode: false })}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-[11px] font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Desativar Manutenção</span>
            </button>
          </div>
        </div>
      )}

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
        onOpenVision={() => setIsVisionOpen(true)}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenAutoTrader={() => setIsAutoTraderOpen(true)}
        autoTraderConfig={autoTraderConfig}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        syncStatus={syncStatus}
        hioveToken={autoTraderConfig.hioveApiKey || hioveAccountInfo.token}
        chartEngine={chartEngine}
        onSelectChartEngine={setChartEngine}
        timeframe={timeframe}
      />

      {/* Mobile Tab Selector */}
      <div className="md:hidden flex bg-[#0E121B] border-b border-[#1B2230] p-1 flex-shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab("chart")}
          className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            mobileTab === "chart"
              ? "bg-[#181D26] text-[#FF7A00] border border-[#FF7A00]/50 shadow-[0_0_10px_rgba(255,122,0,0.2)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Gráfico & Corretora
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("ai")}
          className={`flex-1 py-2 text-center text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
            mobileTab === "ai"
              ? "bg-[#181D26] text-[#FF7A00] border border-[#FF7A00]/50 shadow-[0_0_10px_rgba(255,122,0,0.2)]"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Análise IA & Sinais
        </button>
      </div>

      {/* Main Trading Area */}
      <div className="flex-1 flex w-full overflow-hidden min-h-0 relative">
        
        {/* Left Side: Neural AI panel */}
        <div className={`${mobileTab === "ai" ? "flex w-full" : "hidden md:flex flex-shrink-0"}`}>
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
            onOpenOperations={() => setIsOperationsOpen(true)}
            onOpenAutoTrader={() => setIsAutoTraderOpen(true)}
            tradesCount={trades.length}
            winsCount={trades.filter((t) => t.result === "WIN").length}
            lossesCount={trades.filter((t) => t.result === "LOSS").length}
            drawsCount={trades.filter((t) => t.result === "DRAW").length}
          />
        </div>

        {/* Central Workstation */}
        <main className={`flex-1 h-full min-h-0 bg-[#0B0E14] relative flex flex-col overflow-hidden ${
          mobileTab === "chart" ? "flex" : "hidden md:flex"
        }`}>
          
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
              onSaveSignalTrade={handleSaveSignalTrade}
              onDeleteSignalTrade={handleDeleteSignalTrade}
              onOpenOperations={() => setIsOperationsOpen(true)}
              bankrollConfig={bankrollConfig}
            />
          </div>
        </main>
      </div>

      {/* Modals */}
      <AutoTraderModal
        isOpen={isAutoTraderOpen}
        onClose={() => setIsAutoTraderOpen(false)}
        config={autoTraderConfig}
        onChangeConfig={handleUpdateAutoTraderConfig}
        session={autoTraderSession}
        onToggleEnabled={handleToggleAutoTrader}
        onResetSession={handleResetAutoTraderSession}
        currencySymbol="$"
        hioveToken={autoTraderConfig.hioveApiKey || hioveAccountInfo.token}
        activeTicker={activeTicker}
        onConnectHiove={() => connectToHiove(true)}
        isConnectingHiove={false}
      />

      <OperationsModal
        isOpen={isOperationsOpen}
        onClose={() => setIsOperationsOpen(false)}
        trades={trades}
        onUpdateTradeResult={handleUpdateTradeResult}
        onClearTrades={handleClearTrades}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-[#0E121B] border border-slate-800 md:border-[#1E2638] rounded-none md:rounded-2xl w-full max-w-2xl p-4 h-full md:h-auto md:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-0 md:p-4 animate-in fade-in duration-200">
          <div className="bg-[#0E121B] border border-slate-800 md:border-[#1E2638] rounded-none md:rounded-2xl w-full max-w-2xl p-4 h-full md:h-auto md:max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95">
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
