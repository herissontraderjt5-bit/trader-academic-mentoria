import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Target,
  CheckCircle,
  XCircle,
  MinusCircle,
  RotateCcw,
  AlertTriangle,
  Zap,
  Lock,
  Percent,
  Calendar,
  Layers,
  Plus,
  Clock,
  Save,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { OperationResult } from '../../types';
import { calculate5x2Management, calculateOperationProfit } from '../../utils/calculations';
import { getTodayDateString, formatSecondsToTime } from '../../utils/formatters';
import { ScreenTimePicker } from '../common/ScreenTimePicker';

export const Management5x2View: React.FC = () => {
  const {
    session5x2,
    record5x2Result,
    reset5x2Session,
    update5x2Settings,
    monthConfig,
    monthlyStats,
    formatCurrency,
    addCustomStrategy,
    setDayOperationalTime,
    todaySummary,
    currentTimerSeconds,
  } = useTrading();

  // Screen time state
  const [screenTimeSeconds, setScreenTimeSeconds] = useState<number>(0);
  const [dayRegisteredSuccess, setDayRegisteredSuccess] = useState<boolean>(false);

  useEffect(() => {
    const existing = (todaySummary?.operationalTimeSeconds || 0) + currentTimerSeconds;
    setScreenTimeSeconds(existing > 0 ? existing : 0);
  }, [todaySummary?.operationalTimeSeconds, currentTimerSeconds]);

  // Current Upcoming Entry Controls (Configured dynamically per trade):
  const [currentEntryPayout, setCurrentEntryPayout] = useState<number>(
    Math.max(80, monthConfig.defaultPayout || 85)
  );
  const [currentEntryStrategy, setCurrentEntryStrategy] = useState<string>(
    monthConfig.customStrategies?.[0] || 'Pullback'
  );
  const [currentEntryAsset, setCurrentEntryAsset] = useState<string>('EUR/USD');
  const [newStrategyName, setNewStrategyName] = useState<string>('');
  const [showAddStrategyInput, setShowAddStrategyInput] = useState<boolean>(false);

  // Sync inputs when monthConfig changes
  useEffect(() => {
    const defPayout = Math.max(80, monthConfig.defaultPayout || 85);
    setCurrentEntryPayout(defPayout);
    if (monthConfig.customStrategies && monthConfig.customStrategies.length > 0) {
      setCurrentEntryStrategy(monthConfig.customStrategies[0]);
    }
  }, [monthConfig.defaultPayout, monthConfig.customStrategies]);

  // Calculate 5x2 parameters using the exact formula:
  // Stop Diário = Capital ÷ Dias
  // Mão Fixa (Entrada) = Stop Diário ÷ 2 (duas perdas)
  const mgmt = useMemo(() => {
    return calculate5x2Management(
      Number(monthConfig.initialBankroll || 100),
      Number(monthConfig.workingDays || 20),
      Number(monthConfig.defaultPayout || 85)
    );
  }, [monthConfig.initialBankroll, monthConfig.workingDays, monthConfig.defaultPayout]);

  // Keep session settings in sync with calculated values
  useEffect(() => {
    update5x2Settings({
      fixedEntryAmount: mgmt.fixedEntryAmount,
      dailyStopLoss: mgmt.dailyStopLoss,
      payout: monthConfig.defaultPayout || 85,
      dailyTargetWin: mgmt.dailyTarget5x0,
    });
  }, [mgmt.fixedEntryAmount, mgmt.dailyStopLoss, monthConfig.defaultPayout, mgmt.dailyTarget5x0]);

  // Count wins, losses and empates in current session
  const winCount = session5x2.operations.filter((r) => r === 'WIN').length;
  const lossCount = session5x2.operations.filter((r) => r === 'LOSS').length;
  const empateCount = session5x2.operations.filter((r) => r === 'EMPATE').length;

  // Accurately compute session profit in real-time from opDetails or fallback
  const currentSessionProfit = useMemo(() => {
    if (session5x2.opDetails && session5x2.opDetails.length > 0) {
      const sum = session5x2.opDetails.reduce((acc, curr) => acc + curr.profit, 0);
      return Number(sum.toFixed(2));
    }
    let profit = 0;
    const basePayout = monthConfig.defaultPayout || 85;
    session5x2.operations.forEach((res) => {
      profit += calculateOperationProfit(mgmt.fixedEntryAmount, basePayout, res);
    });
    return Number(profit.toFixed(2));
  }, [session5x2.opDetails, session5x2.operations, mgmt.fixedEntryAmount, monthConfig.defaultPayout]);

  const isBlocked =
    session5x2.status === 'STOP_LOSS' ||
    session5x2.status === 'STOP_WIN' ||
    session5x2.status === 'FINISHED' ||
    lossCount >= 2;

  // Potential profit of the current upcoming trade
  const currentWinProfit = useMemo(() => {
    return calculateOperationProfit(mgmt.fixedEntryAmount, currentEntryPayout, 'WIN');
  }, [mgmt.fixedEntryAmount, currentEntryPayout]);

  // Quick action to record operation with exact hand value & payout & strategy
  const handleRecordResult = (result: OperationResult) => {
    if (isBlocked) return;
    record5x2Result(
      result,
      currentEntryAsset,
      currentEntryStrategy,
      mgmt.fixedEntryAmount,
      currentEntryPayout
    );
  };

  const handleAddNewStrategy = () => {
    if (newStrategyName.trim()) {
      addCustomStrategy(newStrategyName.trim());
      setCurrentEntryStrategy(newStrategyName.trim());
      setNewStrategyName('');
      setShowAddStrategyInput(false);
    }
  };

  const allStrategies = useMemo(() => {
    return (
      monthConfig.customStrategies || [
        'Pullback',
        'Rompimento',
        'Fibonacci',
        'Fluxo de Velas',
        'Suporte e Resistência',
        'MHI',
        'Reversão',
        'Tendência',
      ]
    );
  }, [monthConfig.customStrategies]);

  const allAssets = useMemo(() => {
    return monthConfig.customAssets || ['EUR/USD', 'GBP/USD', 'USD/JPY', 'EUR/JPY', 'AUD/USD', 'BTC/USDT'];
  }, [monthConfig.customAssets]);

  const payoutPresets = [80, 82, 85, 87, 90, 92, 95];

  return (
    <div className="space-y-6 pb-12" id="view-management-5x2">
      {/* Header Banner */}
      <div className="p-5 bg-[#0F0F12] border border-[#1E2028] rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Gestão 5x2 (Mão Fixa com Payout e Estratégia por Entrada)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Stop Diário ÷ 2 = Mão Fixa
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span>Banca Base: <strong className="text-white font-mono">{formatCurrency(mgmt.bankroll)}</strong></span>
              <span>•</span>
              <span>{mgmt.workingDays} Dias</span>
              <span>•</span>
              <span>Saldo Atual: <strong className="text-emerald-400 font-mono">{formatCurrency(monthlyStats.currentBankroll)}</strong></span>
            </div>
          </div>
        </div>

        <button
          id="btn-reset-5x2-session"
          onClick={reset5x2Session}
          className="px-4 py-2 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white transition-all flex items-center gap-1.5 shadow-md shadow-orange-950/30"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Nova Sessão 5x2
        </button>
      </div>

      {/* Main Full-Width Section: Calculated Cards & Live Session */}
      <div className="space-y-6">
        {/* Top 2 Primary Calculation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Limite de Perda Diária */}
          <div className="p-5 bg-[#0F0F12] border border-[#1E2028] rounded-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-rose-500/15 text-rose-400 border border-rose-500/30">
                Stop Diário (2 Derrotas)
              </span>
              <span className="text-xs font-mono text-slate-400">
                Capital ÷ {mgmt.workingDays} dias
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Limite Máximo de Perda no Dia</span>
              <span className="text-2xl font-black font-mono text-rose-400 tracking-tight">
                -{formatCurrency(mgmt.dailyStopLoss)}
              </span>
            </div>

            <div className="p-3 bg-[#0A0A0B] border border-[#1E2028] rounded-lg space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Capital Base:</span>
                <strong className="text-white">{formatCurrency(mgmt.bankroll)}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Dias de Trabalho:</span>
                <strong className="text-white">{mgmt.workingDays} dias</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Trava de Proteção:</span>
                <strong className="text-rose-400">2 derrotas (LOSS)</strong>
              </div>
            </div>
          </div>

          {/* Card 2: Valor da Mão Fixa (Stop ÷ 2) */}
          <div className="p-5 bg-[#0F0F12] border border-cyan-500/30 rounded-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
                Valor da Mão Fixa
              </span>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                Stop Diário ÷ 2
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Valor por Entrada (Op. 1 a 5)</span>
              <span className="text-2xl font-black font-mono text-cyan-300 tracking-tight">
                {formatCurrency(mgmt.fixedEntryAmount)}
              </span>
            </div>

            <div className="p-3 bg-[#0A0A0B] border border-[#1E2028] rounded-lg space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Lucro c/ Payout {currentEntryPayout}%:</span>
                <strong className="text-emerald-400">+{formatCurrency(currentWinProfit)}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Meta 5x0 Máxima (Estimada):</span>
                <strong className="text-emerald-400 font-black">+{formatCurrency(mgmt.dailyTarget5x0)}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Cenário 4x1 (80% Win):</span>
                <strong className="text-emerald-400">+{formatCurrency(mgmt.dailyTarget4x1)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Live Session Board */}
        <div className="p-5 bg-[#0F0F12] border border-[#1E2028] rounded-xl space-y-6">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1E2028]">
            <div className="flex items-center space-x-3">
              <div className="text-sm font-bold text-white uppercase tracking-wider">
                Progresso da Sessão 5x2
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {winCount}W
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {lossCount}L
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-slate-300">
                  {empateCount}E
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Resultado Atual</span>
                <strong className={`text-base font-black font-mono ${
                  currentSessionProfit > 0
                    ? 'text-emerald-400'
                    : currentSessionProfit < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}>
                  {currentSessionProfit > 0
                    ? `+${formatCurrency(currentSessionProfit)}`
                    : currentSessionProfit < 0
                    ? formatCurrency(currentSessionProfit)
                    : formatCurrency(0)}
                </strong>
              </div>

              <div className="flex items-center">
                {session5x2.status === 'STOP_LOSS' && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-black bg-rose-600 text-white flex items-center gap-1.5 shadow-md shadow-rose-950/50 animate-pulse">
                    <Lock className="w-3.5 h-3.5" />
                    STOP LOSS (2 LOSS)
                  </span>
                )}
                {session5x2.status === 'STOP_WIN' && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 text-white flex items-center gap-1.5 shadow-md shadow-emerald-950/50">
                    <CheckCircle className="w-3.5 h-3.5" />
                    META BATIDA! (STOP WIN)
                  </span>
                )}
                {session5x2.status === 'FINISHED' && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 text-white flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    SESSÃO CONCLUÍDA (5 OPS)
                  </span>
                )}
                {session5x2.status === 'ACTIVE' && (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    SESSÃO EM ANDAMENTO
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 5 Fixed Operation Slots Visual Display with per-entry details */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[0, 1, 2, 3, 4].map((index) => {
              const result = session5x2.operations[index];
              const detail = session5x2.opDetails?.[index];
              const isCurrent = session5x2.operations.length === index && !isBlocked;

              return (
                <div
                  key={index}
                  className={`p-3.5 rounded-xl border transition-all text-center space-y-2 relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                    result === 'WIN'
                      ? 'bg-emerald-950/25 border-emerald-500/40 text-emerald-300'
                      : result === 'LOSS'
                      ? 'bg-rose-950/25 border-rose-500/40 text-rose-300'
                      : result === 'EMPATE'
                      ? 'bg-slate-900 border-slate-700 text-slate-400'
                      : isCurrent
                      ? 'bg-[#15161A] border-cyan-500/80 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/40'
                      : 'bg-[#0A0A0B] border-[#1E2028] opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400 font-bold">Op. 0{index + 1}</span>
                    {detail ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0A0A0B] text-slate-300 font-mono">
                        {detail.payout}%
                      </span>
                    ) : isCurrent ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                        {currentEntryPayout}%
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">{monthConfig.defaultPayout || 85}%</span>
                    )}
                  </div>

                  <div className="py-1">
                    {result === 'WIN' && (
                      <div className="flex flex-col items-center space-y-1">
                        <CheckCircle className="w-6 h-6 text-emerald-400" />
                        <span className="text-xs font-black text-emerald-400 font-mono">
                          +{formatCurrency(detail?.profit ?? (mgmt.fixedEntryAmount * ((monthConfig.defaultPayout || 85) / 100)))}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans truncate max-w-full px-1">
                          {detail?.strategy || 'Estratégia'}
                        </span>
                      </div>
                    )}
                    {result === 'LOSS' && (
                      <div className="flex flex-col items-center space-y-1">
                        <XCircle className="w-6 h-6 text-rose-400" />
                        <span className="text-xs font-black text-rose-400 font-mono">
                          -{formatCurrency(mgmt.fixedEntryAmount)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans truncate max-w-full px-1">
                          {detail?.strategy || 'Estratégia'}
                        </span>
                      </div>
                    )}
                    {result === 'EMPATE' && (
                      <div className="flex flex-col items-center space-y-1">
                        <MinusCircle className="w-6 h-6 text-slate-400" />
                        <span className="text-xs font-bold text-slate-400 font-mono">
                          {formatCurrency(0)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans truncate max-w-full px-1">
                          {detail?.strategy || 'Empate'}
                        </span>
                      </div>
                    )}
                    {!result && (
                      <div className="flex flex-col items-center space-y-1">
                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-mono ${
                          isCurrent
                            ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10 font-bold'
                            : 'border-dashed border-[#272935] text-slate-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-xs font-bold text-white font-mono">
                          {formatCurrency(mgmt.fixedEntryAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] font-mono truncate">
                    {result ? (
                      <span className="text-slate-400">{detail?.asset || currentEntryAsset}</span>
                    ) : isCurrent ? (
                      <span className="text-cyan-400 font-bold">👉 Configurando</span>
                    ) : (
                      <span className="text-slate-600">Aguardando</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Configuração Específica da Entrada Atual + Botões de Ação */}
          {!isBlocked ? (
            <div className="p-4 bg-[#0A0A0B] border border-cyan-500/40 rounded-xl space-y-4 shadow-lg shadow-cyan-950/20">
              {/* Entry Settings Bar: Strategy, Asset & Payout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pb-3 border-b border-[#1E2028]">
                {/* 1. Estratégia da Entrada Atual */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Estratégia desta Entrada:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddStrategyInput(!showAddStrategyInput)}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      {showAddStrategyInput ? 'Fechar' : 'Nova'}
                    </button>
                  </div>

                  {showAddStrategyInput ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newStrategyName}
                        onChange={(e) => setNewStrategyName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewStrategy()}
                        placeholder="Nome da estratégia..."
                        className="w-full bg-[#15161A] border border-cyan-500/60 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddNewStrategy}
                        className="px-2 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      id="select-5x2-strategy"
                      value={currentEntryStrategy}
                      onChange={(e) => setCurrentEntryStrategy(e.target.value)}
                      className="w-full bg-[#15161A] border border-[#272935] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                    >
                      {allStrategies.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. Ativo da Entrada */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Ativo da Operação:
                  </label>
                  <select
                    id="select-5x2-asset"
                    value={currentEntryAsset}
                    onChange={(e) => setCurrentEntryAsset(e.target.value)}
                    className="w-full bg-[#15161A] border border-[#272935] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                  >
                    {allAssets.map((ast) => (
                      <option key={ast} value={ast}>
                        {ast}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. Payout da Entrada Atual */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-cyan-400" />
                      Payout desta Entrada (%):
                    </label>
                    <span className="text-[11px] font-mono text-cyan-300 font-bold">
                      {currentEntryPayout}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-5x2-entry-payout"
                      type="number"
                      min="50"
                      max="100"
                      value={currentEntryPayout}
                      onChange={(e) => setCurrentEntryPayout(parseFloat(e.target.value) || 80)}
                      className="w-20 bg-[#15161A] border border-[#272935] rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex items-center gap-1 flex-1 overflow-x-auto pb-0.5">
                      {payoutPresets.map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setCurrentEntryPayout(pct)}
                          className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold transition-colors shrink-0 ${
                            currentEntryPayout === pct
                              ? 'bg-cyan-500 text-black font-black'
                              : 'bg-[#15161A] border border-[#272935] text-slate-400 hover:text-white'
                          }`}
                        >
                          {pct}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Execution Row */}
              <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 pt-1">
                <div className="space-y-1 text-center xl:text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-center xl:justify-start">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                      Próxima: Operação 0{session5x2.operations.length + 1}
                    </span>
                    <span className="text-xs text-slate-300 font-mono truncate">
                      {currentEntryAsset} • {currentEntryStrategy} • Payout {currentEntryPayout}%
                    </span>
                  </div>
                  <div className="text-lg font-black text-white font-mono truncate">
                    Mão Fixa: {formatCurrency(mgmt.fixedEntryAmount)}
                  </div>
                  <div className="text-xs text-slate-400">
                    Se der WIN: <strong className="text-emerald-400">+{formatCurrency(currentWinProfit)}</strong> • Se der LOSS: <strong className="text-rose-400">-{formatCurrency(mgmt.fixedEntryAmount)}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full xl:w-auto shrink-0">
                  <button
                    id="btn-5x2-win"
                    onClick={() => handleRecordResult('WIN')}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    WIN (+{formatCurrency(currentWinProfit)})
                  </button>

                  <button
                    id="btn-5x2-loss"
                    onClick={() => handleRecordResult('LOSS')}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    LOSS (-{formatCurrency(mgmt.fixedEntryAmount)})
                  </button>

                  <button
                    id="btn-5x2-empate"
                    onClick={() => handleRecordResult('EMPATE')}
                    className="px-3.5 py-2.5 rounded-lg text-xs font-bold bg-[#182030] hover:bg-slate-700 text-slate-300 transition-colors flex items-center justify-center gap-1 shrink-0"
                  >
                    <MinusCircle className="w-4 h-4 shrink-0" />
                    Empate
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div
                className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  session5x2.status === 'STOP_WIN' || currentSessionProfit > 0
                    ? 'bg-emerald-950/25 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : 'bg-rose-950/25 border-rose-500/40 shadow-lg shadow-rose-950/20'
                }`}
              >
                <div className="space-y-1.5 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    {session5x2.status === 'STOP_WIN' || currentSessionProfit > 0 ? (
                      <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        META 5x2 BATIDA COM SUCESSO!
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        SESSÃO 5x2 FINALIZADA (STOP LOSS)
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-2xl font-black font-mono tracking-tight ${
                      currentSessionProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    Resultado da Sessão: {currentSessionProfit >= 0 ? `+${formatCurrency(currentSessionProfit)}` : formatCurrency(currentSessionProfit)}
                  </div>
                  <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    Placar Final: <strong className="text-emerald-400 font-mono">{winCount}W</strong> - <strong className="text-rose-400 font-mono">{lossCount}L</strong> {empateCount > 0 && <span className="text-amber-400 font-mono">- {empateCount}E</span>}.
                  </p>
                </div>

                <button
                  onClick={() => {
                    reset5x2Session();
                    setDayRegisteredSuccess(false);
                  }}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#15161A] text-slate-300 border border-[#272935] hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 shrink-0"
                >
                  <RotateCcw className="w-4 h-4 text-orange-400" />
                  Nova Sessão 5x2
                </button>
              </div>

              {/* Screen Time & Day Registration Card */}
              <div className="p-5 bg-[#0F0F12] border border-cyan-500/30 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Tempo de Tela da Sessão 5x2</h4>
                      <p className="text-xs text-slate-400">
                        Informe o tempo gasto nas operações e registre o dia
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs">
                    {formatSecondsToTime(screenTimeSeconds)}
                  </span>
                </div>

                <ScreenTimePicker
                  initialSeconds={screenTimeSeconds}
                  onTimeChange={(sec) => setScreenTimeSeconds(sec)}
                />

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <button
                    id="btn-5x2-save-screentime"
                    type="button"
                    onClick={() => {
                      setDayOperationalTime(getTodayDateString(), screenTimeSeconds);
                      setDayRegisteredSuccess(true);
                    }}
                    className={`w-full sm:flex-1 py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                      dayRegisteredSuccess
                        ? 'bg-emerald-600 shadow-emerald-950/60'
                        : 'bg-orange-500 hover:bg-orange-600 shadow-orange-950/50'
                    }`}
                  >
                    {dayRegisteredSuccess ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Dia e Tempo de Tela Registrados com Sucesso!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Registrar Tempo de Tela e Salvar Dia
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
