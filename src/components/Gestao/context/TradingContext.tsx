import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  Operation,
  Transaction,
  MonthConfig,
  MonthlyStats,
  DailySummary,
  DailyOperationalTime,
  Management5x2Session,
  OperationResult,
  TradingModality,
  ModalityAnalytics,
} from '../types';
import { useAuth } from './AuthContext';
import {
  calculateOperationProfit,
  calculateMonthlyStats,
  buildMonthlyManagementTable,
  buildBankrollEvolutionChartData,
} from '../utils/calculations';
import {
  getOperationModality,
  filterOperationsByModality,
  calculateModalityAnalytics,
  buildModalityManagementTable,
} from '../utils/modalityCalculations';
import { generateInitialMockData, DEFAULT_MONTH_CONFIG, DEFAULT_MONTH_ID } from '../utils/mockData';
import {
  getTodayDateString,
  getCurrentTimeString,
  formatCurrency,
  getCurrencySymbol,
  getPreviousMonthId,
  getNextMonthId,
  getMonthNameBR,
  getMonthsForYear,
} from '../utils/formatters';

function createDefaultConfigForMonth(monthId: string, baseConfig?: MonthConfig): MonthConfig {
  const [yearStr, monthStr] = monthId.split('-');
  const year = parseInt(yearStr, 10) || 2026;
  const month = parseInt(monthStr, 10) || 8;
  const daysInMonth = new Date(year, month, 0).getDate();
  const name = getMonthNameBR(monthId);

  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }

  return {
    ...(baseConfig || DEFAULT_MONTH_CONFIG),
    id: monthId,
    name,
    month,
    year,
    daysInMonth,
    workingDays,
    closedAt: undefined,
  };
}

interface TradingContextType {
  // Modality Selection
  selectedModality: TradingModality;
  setSelectedModality: (modality: TradingModality) => void;
  modalityAnalytics: ModalityAnalytics;

  // Month Selection & Config
  currentMonthId: string;
  availableMonths: { id: string; name: string }[];
  allYearMonths: { id: string; name: string; shortName: string; month: number; year: number }[];
  monthConfig: MonthConfig;
  allMonthConfigs: MonthConfig[];
  currencySymbol: string;
  formatCurrency: (val: number, showSign?: boolean) => string;
  setCurrentMonthId: (id: string) => void;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  goToCurrentMonth: () => void;
  updateMonthConfig: (config: Partial<MonthConfig>) => void;
  createNewMonth: (newMonthId: string, name: string, carryOverBankroll?: boolean) => void;
  startNewMonth: (name: string, monthNum: number, year: number, initialBankroll: number) => void;
  closeMonth: () => void;

  // Operations
  operations: Operation[];
  filteredOperations: Operation[];
  addOperation: (op: Omit<Operation, 'id' | 'userId' | 'monthId' | 'profit' | 'createdAt'>) => Operation;
  updateOperation: (id: string, op: Partial<Operation>) => void;
  deleteOperation: (id: string) => void;
  addCustomAsset: (asset: string) => void;
  addCustomStrategy: (strategy: string) => void;

  // Transactions (Saques e Depósitos)
  transactions: Transaction[];
  addTransaction: (trans: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;

  // Time & Stopwatch
  isTimerRunning: boolean;
  currentTimerSeconds: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  clearOperationalTime: () => void;
  saveTimerTime: (additionalSeconds: number) => void;
  setDayOperationalTime: (date: string, seconds: number) => void;
  timeLogs: DailyOperationalTime[];

  // 5x2 Session
  session5x2: Management5x2Session;
  record5x2Result: (
    result: OperationResult,
    asset?: string,
    strategy?: string,
    customInvestment?: number,
    customPayout?: number
  ) => void;
  reset5x2Session: () => void;
  update5x2Settings: (settings: Partial<Management5x2Session>) => void;

  // Derived Stats
  monthlyStats: MonthlyStats;
  dailySummaries: DailySummary[];
  bankrollChartData: ReturnType<typeof buildBankrollEvolutionChartData>;
  todaySummary: DailySummary | undefined;
  todayProfit: number;
  todayGoalReached: boolean;
  todayStopLossReached: boolean;

  // System Helpers
  resetToDemoData: () => void;
  clearAllMonthData: () => void;
  clearAllData: () => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  // Storage keys scoped to user
  const storageKey = useCallback((key: string) => `trader_academic_${userId}_${key}`, [userId]);

  // Months configs
  const [allMonthConfigs, setAllMonthConfigs] = useState<MonthConfig[]>(() => {
    const saved = localStorage.getItem(storageKey('month_configs'));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return [DEFAULT_MONTH_CONFIG];
  });

  const [currentMonthId, setCurrentMonthId] = useState<string>(() => {
    const saved = localStorage.getItem(storageKey('current_month_id'));
    return saved || DEFAULT_MONTH_ID;
  });

  // Selected Modality
  const [selectedModality, setSelectedModalityState] = useState<TradingModality>(() => {
    const saved = localStorage.getItem(storageKey('selected_modality'));
    if (saved && ['ALL', 'BINARIAS', 'FOREX', 'B3', 'CRIPTO'].includes(saved)) {
      return saved as TradingModality;
    }
    return 'ALL';
  });

  const setSelectedModality = (m: TradingModality) => {
    setSelectedModalityState(m);
    localStorage.setItem(storageKey('selected_modality'), m);
  };

  // Operations
  const [operations, setOperations] = useState<Operation[]>(() => {
    const saved = localStorage.getItem(storageKey('operations'));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Filter out old mock demo operations
          return parsed.filter((op: any) => op.userId !== 'user-demo');
        }
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(storageKey('transactions'));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: any) => t.userId !== 'user-demo');
        }
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Time Logs
  const [timeLogs, setTimeLogs] = useState<DailyOperationalTime[]>(() => {
    const saved = localStorage.getItem(storageKey('time_logs'));
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((tl: any) => tl.userId !== 'user-demo' && !tl.id?.startsWith('mock-'));
        }
      } catch (e) {
        // fallback
      }
    }
    return [];
  });

  // Active Stopwatch State
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [currentTimerSeconds, setCurrentTimerSeconds] = useState<number>(0);

  // 5x2 Session State
  const [session5x2, setSession5x2] = useState<Management5x2Session>(() => {
    const saved = localStorage.getItem(storageKey('session_5x2'));
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      id: `s5x2-${Date.now()}`,
      date: getTodayDateString(),
      maxOperations: 5,
      maxConsecutiveLosses: 2,
      maxTotalLosses: 2,
      fixedEntryAmount: 2.84,
      payout: 87,
      dailyTargetWin: 15.92,
      dailyStopLoss: 16.76,
      operations: [],
      status: 'ACTIVE',
      currentProfit: 0,
    };
  });

  // Save changes to localStorage on state changes
  useEffect(() => {
    localStorage.setItem(storageKey('month_configs'), JSON.stringify(allMonthConfigs));
  }, [allMonthConfigs, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey('current_month_id'), currentMonthId);
  }, [currentMonthId, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey('operations'), JSON.stringify(operations));
  }, [operations, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey('transactions'), JSON.stringify(transactions));
  }, [transactions, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey('time_logs'), JSON.stringify(timeLogs));
  }, [timeLogs, storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey('session_5x2'), JSON.stringify(session5x2));
  }, [session5x2, storageKey]);

  // Timer interval
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setCurrentTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning]);

  // Current Month Config
  const monthConfig = useMemo(() => {
    const found = allMonthConfigs.find((c) => c.id === currentMonthId);
    if (found) return found;
    return createDefaultConfigForMonth(currentMonthId, allMonthConfigs[0]);
  }, [allMonthConfigs, currentMonthId]);

  // Current year based on active month
  const activeYear = useMemo(() => {
    const [yearStr] = currentMonthId.split('-');
    return parseInt(yearStr, 10) || new Date().getFullYear();
  }, [currentMonthId]);

  // All 12 months of the active year
  const allYearMonths = useMemo(() => {
    return getMonthsForYear(activeYear);
  }, [activeYear]);

  // Available months: all 12 months of the active year, plus any other months with configs/operations
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<string, { id: string; name: string }>();

    // 1. Add all 12 months of active year
    getMonthsForYear(activeYear).forEach((m) => {
      monthsMap.set(m.id, { id: m.id, name: m.name });
    });

    // 2. Add any other existing month configs
    allMonthConfigs.forEach((c) => {
      monthsMap.set(c.id, { id: c.id, name: c.name });
    });

    // 3. Add any months from operations
    operations.forEach((op) => {
      if (op.monthId && !monthsMap.has(op.monthId)) {
        monthsMap.set(op.monthId, { id: op.monthId, name: getMonthNameBR(op.monthId) });
      }
    });

    // Sort chronologically
    return Array.from(monthsMap.values()).sort((a, b) => a.id.localeCompare(b.id));
  }, [activeYear, allMonthConfigs, operations]);

  // Select month handler with auto-creation of missing configs
  const handleSetCurrentMonthId = useCallback(
    (targetMonthId: string) => {
      setAllMonthConfigs((prev) => {
        const exists = prev.find((c) => c.id === targetMonthId);
        if (exists) return prev;
        const newConf = createDefaultConfigForMonth(targetMonthId, prev[0]);
        const updated = [...prev, newConf];
        localStorage.setItem(storageKey('month_configs'), JSON.stringify(updated));
        return updated;
      });
      setCurrentMonthId(targetMonthId);
    },
    [storageKey]
  );

  const goToPreviousMonth = useCallback(() => {
    const prevId = getPreviousMonthId(currentMonthId);
    handleSetCurrentMonthId(prevId);
  }, [currentMonthId, handleSetCurrentMonthId]);

  const goToNextMonth = useCallback(() => {
    const nextId = getNextMonthId(currentMonthId);
    handleSetCurrentMonthId(nextId);
  }, [currentMonthId, handleSetCurrentMonthId]);

  const goToCurrentMonth = useCallback(() => {
    const currentId = getTodayDateString().slice(0, 7);
    handleSetCurrentMonthId(currentId);
  }, [handleSetCurrentMonthId]);

  // Timer helpers
  const startTimer = () => setIsTimerRunning(true);
  const pauseTimer = () => {
    setIsTimerRunning(false);
    if (currentTimerSeconds > 0) {
      saveTimerTime(currentTimerSeconds);
      setCurrentTimerSeconds(0);
    }
  };
  const resetTimer = () => {
    setIsTimerRunning(false);
    setCurrentTimerSeconds(0);
  };
  const clearOperationalTime = useCallback(() => {
    setIsTimerRunning(false);
    setCurrentTimerSeconds(0);
    setTimeLogs([]);
    try {
      localStorage.removeItem(storageKey('time_logs'));
      localStorage.removeItem('trading_time_logs');
      localStorage.removeItem('time_logs');
      // Also clean any user-specific or legacy time log keys
      Object.keys(localStorage).forEach((key) => {
        if (key.includes('time_logs')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      // ignore storage errors
    }
  }, [storageKey]);

  const saveTimerTime = useCallback(
    (secondsToAdd: number) => {
      const today = getTodayDateString();
      setTimeLogs((prev) => {
        const existing = prev.find((item) => item.date === today);
        let updated: DailyOperationalTime[];
        if (existing) {
          updated = prev.map((item) =>
            item.date === today ? { ...item, seconds: item.seconds + secondsToAdd } : item
          );
        } else {
          updated = [...prev, { date: today, seconds: secondsToAdd }];
        }
        localStorage.setItem(storageKey('time_logs'), JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey]
  );

  const setDayOperationalTime = useCallback(
    (date: string, seconds: number) => {
      setTimeLogs((prev) => {
        const existing = prev.find((item) => item.date === date);
        let updated: DailyOperationalTime[];
        if (existing) {
          updated = prev.map((item) =>
            item.date === date ? { ...item, seconds: Math.max(0, seconds) } : item
          );
        } else {
          updated = [...prev, { date, seconds: Math.max(0, seconds) }];
        }
        localStorage.setItem(storageKey('time_logs'), JSON.stringify(updated));
        return updated;
      });
    },
    [storageKey]
  );

  // Month Config update
  const updateMonthConfig = (updated: Partial<MonthConfig>) => {
    setAllMonthConfigs((prev) =>
      prev.map((c) => (c.id === currentMonthId ? { ...c, ...updated } : c))
    );
  };

  // Create new Month
  const createNewMonth = (newMonthId: string, name: string, carryOverBankroll = true) => {
    let initialBank = 100;
    if (carryOverBankroll) {
      // Calculate current bankroll of active month
      const currentStats = calculateMonthlyStats(
        monthConfig,
        operations,
        transactions,
        timeLogs,
        getTodayDateString()
      );
      initialBank = currentStats.currentBankroll > 0 ? currentStats.currentBankroll : monthConfig.initialBankroll;
    }

    const newConfig: MonthConfig = {
      ...monthConfig,
      id: newMonthId,
      name,
      initialBankroll: initialBank,
      closedAt: undefined,
    };

    setAllMonthConfigs((prev) => {
      const exists = prev.find((c) => c.id === newMonthId);
      if (exists) {
        return prev.map((c) => (c.id === newMonthId ? newConfig : c));
      }
      return [...prev, newConfig];
    });

    setCurrentMonthId(newMonthId);
  };

  const startNewMonth = (name: string, monthNum: number, year: number, initialBankroll: number) => {
    const newMonthId = `${year}-${String(monthNum).padStart(2, '0')}`;
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const newConfig: MonthConfig = {
      ...monthConfig,
      id: newMonthId,
      name,
      month: monthNum,
      year,
      daysInMonth,
      initialBankroll,
      closedAt: undefined,
    };

    setAllMonthConfigs((prev) => {
      const exists = prev.find((c) => c.id === newMonthId);
      if (exists) {
        return prev.map((c) => (c.id === newMonthId ? newConfig : c));
      }
      return [...prev, newConfig];
    });

    setCurrentMonthId(newMonthId);
  };

  // Close Month
  const closeMonth = () => {
    updateMonthConfig({ closedAt: new Date().toISOString() });
  };

  // Operations CRUD
  const addOperation = (
    opData: Omit<Operation, 'id' | 'userId' | 'monthId' | 'profit' | 'createdAt'>
  ): Operation => {
    const profit = calculateOperationProfit(opData.investment, opData.payout, opData.result);
    const newOp: Operation = {
      ...opData,
      id: `op-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      monthId: currentMonthId,
      profit,
      createdAt: new Date().toISOString(),
    };

    setOperations((prev) => [newOp, ...prev]);
    return newOp;
  };

  const updateOperation = (id: string, opData: Partial<Operation>) => {
    setOperations((prev) =>
      prev.map((op) => {
        if (op.id !== id) return op;
        const updated = { ...op, ...opData };
        if (opData.investment !== undefined || opData.payout !== undefined || opData.result !== undefined) {
          updated.profit = calculateOperationProfit(
            updated.investment,
            updated.payout,
            updated.result
          );
        }
        return updated;
      })
    );
  };

  const deleteOperation = (id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
  };

  const addCustomAsset = (asset: string) => {
    if (!asset.trim()) return;
    const current = monthConfig.customAssets || [];
    if (!current.includes(asset.trim())) {
      updateMonthConfig({
        customAssets: [...current, asset.trim().toUpperCase()],
      });
    }
  };

  const addCustomStrategy = (strategy: string) => {
    if (!strategy.trim()) return;
    const current = monthConfig.customStrategies || [];
    if (!current.includes(strategy.trim())) {
      updateMonthConfig({
        customStrategies: [...current, strategy.trim()],
      });
    }
  };

  // Transactions CRUD
  const addTransaction = (transData: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) => {
    const newTrans: Transaction = {
      ...transData,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTrans, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // 5x2 Session management
  const record5x2Result = (
    result: OperationResult,
    asset = 'EUR/USD',
    strategy = 'Gestão 5x2',
    customInvestment?: number,
    customPayout?: number
  ) => {
    const payout = customPayout !== undefined && customPayout > 0 ? customPayout : (session5x2.payout || monthConfig.defaultPayout || 85);
    const investment = customInvestment !== undefined && customInvestment > 0 ? customInvestment : (session5x2.fixedEntryAmount || monthConfig.defaultEntryAmount || 2.5);
    const opProfit = calculateOperationProfit(investment, payout, result);
    const timeStr = getCurrentTimeString();
    
    // Add real operation to main operations list
    addOperation({
      date: getTodayDateString(),
      time: timeStr,
      asset,
      marketType: 'ABERTO',
      direction: 'CALL',
      investment,
      payout,
      expiration: 'M1',
      strategy,
      result,
      notes: `Operação #${session5x2.operations.length + 1} da sessão 5x2 (Payout: ${payout}% | Estratégia: ${strategy})`,
    });

    const newOps = [...session5x2.operations, result];
    const newOpDetail = {
      result,
      payout,
      strategy,
      asset,
      investment,
      profit: opProfit,
      time: timeStr,
    };
    const prevDetails = session5x2.opDetails || [];
    const newDetails = [...prevDetails, newOpDetail];

    // Compute true cumulative profit from all recorded operations in session
    const totalProfit = newDetails.reduce((acc, curr) => acc + curr.profit, 0);

    // Check consecutive and total losses
    let consecutiveLosses = 0;
    for (let i = newOps.length - 1; i >= 0; i--) {
      if (newOps[i] === 'LOSS') {
        consecutiveLosses++;
      } else {
        break;
      }
    }

    const totalLosses = newOps.filter((r) => r === 'LOSS').length;

    let newStatus: Management5x2Session['status'] = 'ACTIVE';
    if (consecutiveLosses >= 2 || totalLosses >= 2) {
      newStatus = 'STOP_LOSS';
    } else if (newOps.length >= (session5x2.maxOperations || 5)) {
      newStatus = totalProfit > 0 ? 'STOP_WIN' : 'FINISHED';
    } else if (totalProfit >= (session5x2.dailyTargetWin || 999999)) {
      newStatus = 'STOP_WIN';
    }

    setSession5x2((prev) => ({
      ...prev,
      fixedEntryAmount: investment,
      payout,
      operations: newOps,
      opDetails: newDetails,
      currentProfit: Number(totalProfit.toFixed(2)),
      status: newStatus,
    }));
  };

  const reset5x2Session = () => {
    setSession5x2({
      id: `s5x2-${Date.now()}`,
      date: getTodayDateString(),
      maxOperations: monthConfig.maxOpsPerDay || 5,
      maxConsecutiveLosses: 2,
      maxTotalLosses: 2,
      fixedEntryAmount: monthConfig.defaultEntryAmount || 2.84,
      payout: monthConfig.defaultPayout || 87,
      dailyTargetWin: monthConfig.dailyStopWin || 15.92,
      dailyStopLoss: monthConfig.dailyStopLoss || 16.76,
      operations: [],
      opDetails: [],
      status: 'ACTIVE',
      currentProfit: 0,
    });
  };

  const update5x2Settings = (settings: Partial<Management5x2Session>) => {
    setSession5x2((prev) => ({ ...prev, ...settings }));
  };

  // Derived Calculations
  const todayDateStr = getTodayDateString();

  const monthOps = useMemo(() => {
    return operations.filter((op) => op.monthId === currentMonthId);
  }, [operations, currentMonthId]);

  const filteredOperations = useMemo(() => {
    return filterOperationsByModality(operations, selectedModality);
  }, [operations, selectedModality]);

  const monthFilteredOps = useMemo(() => {
    return filterOperationsByModality(monthOps, selectedModality);
  }, [monthOps, selectedModality]);

  const modalityAnalytics = useMemo(() => {
    return calculateModalityAnalytics(monthOps, selectedModality);
  }, [monthOps, selectedModality]);

  const monthlyStats = useMemo(() => {
    return calculateMonthlyStats(
      monthConfig,
      monthFilteredOps,
      transactions,
      timeLogs,
      todayDateStr
    );
  }, [monthConfig, monthFilteredOps, transactions, timeLogs, todayDateStr]);

  const dailySummaries = useMemo(() => {
    return buildModalityManagementTable(currentMonthId, operations, timeLogs, selectedModality);
  }, [currentMonthId, operations, timeLogs, selectedModality]);

  const bankrollChartData = useMemo(() => {
    return buildBankrollEvolutionChartData(monthConfig, dailySummaries, transactions);
  }, [monthConfig, dailySummaries, transactions]);

  const todaySummary = useMemo(() => {
    return dailySummaries.find((d) => d.date === todayDateStr);
  }, [dailySummaries, todayDateStr]);

  const todayProfit = todaySummary ? todaySummary.financialResult : 0;
  const todayGoalReached = monthConfig.dailyStopWin > 0 && todayProfit >= monthConfig.dailyStopWin;
  const todayStopLossReached = monthConfig.dailyStopLoss > 0 && todayProfit <= -monthConfig.dailyStopLoss;

  // Reset & Clear
  const resetToDemoData = () => {
    const mock = generateInitialMockData();
    setAllMonthConfigs([mock.config]);
    setCurrentMonthId(mock.config.id);
    setOperations(mock.operations);
    setTransactions(mock.transactions);
    setTimeLogs(mock.timeLogs);
    reset5x2Session();
    resetTimer();
  };

  const clearAllMonthData = () => {
    setOperations((prev) => prev.filter((op) => op.monthId !== currentMonthId));
    setTransactions((prev) => prev.filter((t) => !t.date.startsWith(currentMonthId)));
    setTimeLogs((prev) => prev.filter((tl) => !tl.date.startsWith(currentMonthId)));
    reset5x2Session();
    resetTimer();
  };

  const currencySymbol = useMemo(() => getCurrencySymbol(monthConfig.currency), [monthConfig.currency]);

  const formatCurrencyBound = useCallback(
    (val: number, showSign = false) => formatCurrency(val, showSign, monthConfig.currency),
    [monthConfig.currency]
  );

  return (
    <TradingContext.Provider
      value={{
        selectedModality,
        setSelectedModality,
        modalityAnalytics,

        currentMonthId,
        availableMonths,
        allYearMonths,
        monthConfig,
        allMonthConfigs,
        currencySymbol,
        formatCurrency: formatCurrencyBound,
        setCurrentMonthId: handleSetCurrentMonthId,
        goToPreviousMonth,
        goToNextMonth,
        goToCurrentMonth,
        updateMonthConfig,
        createNewMonth,
        startNewMonth,
        closeMonth,

        operations,
        filteredOperations,
        addOperation,
        updateOperation,
        deleteOperation,
        addCustomAsset,
        addCustomStrategy,

        transactions,
        addTransaction,
        deleteTransaction,

        isTimerRunning,
        currentTimerSeconds,
        startTimer,
        pauseTimer,
        resetTimer,
        clearOperationalTime,
        saveTimerTime,
        setDayOperationalTime,
        timeLogs,

        session5x2,
        record5x2Result,
        reset5x2Session,
        update5x2Settings,

        monthlyStats,
        dailySummaries,
        bankrollChartData,
        todaySummary,
        todayProfit,
        todayGoalReached,
        todayStopLossReached,

        resetToDemoData,
        clearAllMonthData,
        clearAllData: clearAllMonthData,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
