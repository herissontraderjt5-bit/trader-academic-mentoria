import React, { useState, useMemo, useEffect } from 'react';
import {
  Target,
  CheckCircle,
  XCircle,
  Percent,
  Calendar,
  Zap,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Layers,
  Plus,
  Clock,
  Save,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { getCurrentTimeString, getTodayDateString, formatSecondsToTime } from '../../utils/formatters';
import { calculate2x1Management, calculateOperationProfit } from '../../utils/calculations';
import { ScreenTimePicker } from '../common/ScreenTimePicker';

export const Management2x1View: React.FC = () => {
  const {
    monthlyStats,
    monthConfig,
    addOperation,
    formatCurrency,
    addCustomStrategy,
    setDayOperationalTime,
    todaySummary,
    currentTimerSeconds,
  } = useTrading();

  // Step 1 Customizations (Payout, Strategy, Asset):
  const [step1Payout, setStep1Payout] = useState<number>(
    Math.max(80, monthConfig.defaultPayout || 85)
  );
  const [step1Strategy, setStep1Strategy] = useState<string>(
    monthConfig.customStrategies?.[0] || 'Pullback'
  );
  const [step1Asset, setStep1Asset] = useState<string>('EUR/USD');

  // Step 2 Customizations (Payout, Strategy, Asset):
  const [step2Payout, setStep2Payout] = useState<number>(
    Math.max(80, monthConfig.defaultPayout || 85)
  );
  const [step2Strategy, setStep2Strategy] = useState<string>(
    monthConfig.customStrategies?.[0] || 'Pullback'
  );
  const [step2Asset, setStep2Asset] = useState<string>('EUR/USD');

  // Inline new strategy creation
  const [newStrategyName, setNewStrategyName] = useState<string>('');
  const [showAddStrategyInput, setShowAddStrategyInput] = useState<boolean>(false);

  // Interactive Live Cycle Execution State
  const [currentStep, setCurrentStep] = useState<'STEP_1' | 'STEP_2' | 'CYCLE_FINISHED'>('STEP_1');
  const [cycleResult, setCycleResult] = useState<'2x0_WIN' | '0x1_STOP' | '1x1_STOP' | null>(null);
  const [profitGenerated, setProfitGenerated] = useState<number>(0);

  // Screen time state for when goal is reached or cycle finishes
  const [screenTimeSeconds, setScreenTimeSeconds] = useState<number>(0);
  const [dayRegisteredSuccess, setDayRegisteredSuccess] = useState<boolean>(false);

  useEffect(() => {
    const existing = (todaySummary?.operationalTimeSeconds || 0) + currentTimerSeconds;
    setScreenTimeSeconds(existing > 0 ? existing : 0);
  }, [todaySummary?.operationalTimeSeconds, currentTimerSeconds]);

  // Sync when monthConfig changes
  useEffect(() => {
    const defPayout = Math.max(80, monthConfig.defaultPayout || 85);
    setStep1Payout(defPayout);
    setStep2Payout(defPayout);
    if (monthConfig.customStrategies && monthConfig.customStrategies.length > 0) {
      setStep1Strategy(monthConfig.customStrategies[0]);
      setStep2Strategy(monthConfig.customStrategies[0]);
    }
  }, [monthConfig.defaultPayout, monthConfig.customStrategies]);

  // Calculate 2x1 Management with monthConfig parameters
  const mgmt = useMemo(() => {
    return calculate2x1Management(
      Number(monthConfig.initialBankroll || 100),
      Number(monthConfig.workingDays || 20),
      Number(monthConfig.defaultPayout || 85)
    );
  }, [monthConfig.initialBankroll, monthConfig.workingDays, monthConfig.defaultPayout]);

  // Step 1 Dynamic Calculations:
  const step1Profit = useMemo(() => {
    return calculateOperationProfit(mgmt.firstEntryAmount, step1Payout, 'WIN');
  }, [mgmt.firstEntryAmount, step1Payout]);

  // Step 2 Dynamic Calculations (Soros = Hand 1 + Step 1 Profit):
  const step2EntryAmount = useMemo(() => {
    return Number((mgmt.firstEntryAmount + step1Profit).toFixed(2));
  }, [mgmt.firstEntryAmount, step1Profit]);

  const step2Profit = useMemo(() => {
    return calculateOperationProfit(step2EntryAmount, step2Payout, 'WIN');
  }, [step2EntryAmount, step2Payout]);

  const totalDynamicTargetProfit = useMemo(() => {
    return Number((step1Profit + step2Profit).toFixed(2));
  }, [step1Profit, step2Profit]);

  // Execute Step 1
  const handleExecuteStep1 = (result: 'WIN' | 'LOSS') => {
    const timeStr = getCurrentTimeString();
    if (result === 'WIN') {
      addOperation({
        date: getTodayDateString(),
        time: timeStr,
        asset: step1Asset,
        marketType: 'ABERTO',
        direction: 'CALL',
        investment: mgmt.firstEntryAmount,
        payout: step1Payout,
        expiration: 'M1',
        strategy: step1Strategy,
        result: 'WIN',
        notes: `Gestão 2x1 - Entrada 01 (Mão 1: ${formatCurrency(mgmt.firstEntryAmount)} | Payout ${step1Payout}% | Estratégia: ${step1Strategy} -> WIN +${formatCurrency(step1Profit)})`,
      });

      setCurrentStep('STEP_2');
    } else {
      addOperation({
        date: getTodayDateString(),
        time: timeStr,
        asset: step1Asset,
        marketType: 'ABERTO',
        direction: 'CALL',
        investment: mgmt.firstEntryAmount,
        payout: step1Payout,
        expiration: 'M1',
        strategy: step1Strategy,
        result: 'LOSS',
        notes: `Gestão 2x1 - Entrada 01 (Stop Diário Atingido: -${formatCurrency(mgmt.firstEntryAmount)} | Estratégia: ${step1Strategy})`,
      });

      setCycleResult('0x1_STOP');
      setProfitGenerated(-mgmt.firstEntryAmount);
      setCurrentStep('CYCLE_FINISHED');
    }
  };

  // Execute Step 2 (Soros: 1st Entry + Profit from 1st Entry)
  const handleExecuteStep2 = (result: 'WIN' | 'LOSS') => {
    const timeStr = getCurrentTimeString();
    if (result === 'WIN') {
      addOperation({
        date: getTodayDateString(),
        time: timeStr,
        asset: step2Asset,
        marketType: 'ABERTO',
        direction: 'CALL',
        investment: step2EntryAmount,
        payout: step2Payout,
        expiration: 'M1',
        strategy: step2Strategy,
        result: 'WIN',
        notes: `Gestão 2x1 - Entrada 02 Soros (Mão 2: ${formatCurrency(step2EntryAmount)} | Payout ${step2Payout}% | Estratégia: ${step2Strategy} -> WIN +${formatCurrency(step2Profit)} | Meta 2x0 Batida!)`,
      });

      setCycleResult('2x0_WIN');
      setProfitGenerated(totalDynamicTargetProfit);
      setCurrentStep('CYCLE_FINISHED');
    } else {
      addOperation({
        date: getTodayDateString(),
        time: timeStr,
        asset: step2Asset,
        marketType: 'ABERTO',
        direction: 'CALL',
        investment: step2EntryAmount,
        payout: step2Payout,
        expiration: 'M1',
        strategy: step2Strategy,
        result: 'LOSS',
        notes: `Gestão 2x1 - Entrada 02 Soros (LOSS na 2ª Mão -> Stop do Dia: -${formatCurrency(mgmt.firstEntryAmount)} | Estratégia: ${step2Strategy})`,
      });

      setCycleResult('1x1_STOP');
      setProfitGenerated(-mgmt.firstEntryAmount);
      setCurrentStep('CYCLE_FINISHED');
    }
  };

  const handleResetCycle = () => {
    setCurrentStep('STEP_1');
    setCycleResult(null);
    setProfitGenerated(0);
    setDayRegisteredSuccess(false);
  };

  const handleAddNewStrategy = (target: 'STEP_1' | 'STEP_2') => {
    if (newStrategyName.trim()) {
      addCustomStrategy(newStrategyName.trim());
      if (target === 'STEP_1') setStep1Strategy(newStrategyName.trim());
      else setStep2Strategy(newStrategyName.trim());
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
    <div className="space-y-6 pb-12" id="view-management-2x1">
      {/* Header Banner */}
      <div className="p-5 bg-[#0F0F12] border border-[#1E2028] rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-11 h-11 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Gestão 2x1 (Soros com Payout e Estratégia por Entrada)
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Soros Nível 1
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
              <span>Banca Base: <strong className="text-white font-mono">{formatCurrency(mgmt.bankroll)}</strong></span>
              <span>•</span>
              <span>{mgmt.workingDays} Dias de Trabalho</span>
              <span>•</span>
              <span>Saldo Atual: <strong className="text-emerald-400 font-mono">{formatCurrency(monthlyStats.currentBankroll)}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetCycle}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#15161A] text-slate-300 border border-[#272935] hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
          Reiniciar Ciclo
        </button>
      </div>

      {/* Main Full-Width Section: Calculated Cards, Summary KPIs & Interactive Console */}
      <div className="space-y-6">
        {/* Top 2 Primary Calculation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Stop Diário & 1ª Mão de Entrada */}
          <div className="p-5 bg-[#0F0F12] border border-[#1E2028] rounded-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-orange-500/15 text-orange-400 border border-orange-500/30">
                Stop Diário / 1ª Mão
              </span>
              <span className="text-xs font-mono text-slate-400">
                {mgmt.firstEntryPercent}% do Capital
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Valor da 1ª Entrada</span>
              <span className="text-2xl font-black font-mono text-white tracking-tight">
                {formatCurrency(mgmt.firstEntryAmount)}
              </span>
            </div>

            <div className="p-3 bg-[#0A0A0B] border border-[#1E2028] rounded-lg space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Payout Entrada 1:</span>
                <strong className="text-white">{step1Payout}%</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Lucro Obtido no WIN:</span>
                <strong className="text-emerald-400">+{formatCurrency(step1Profit)}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Perda no LOSS (Stop do Dia):</span>
                <strong className="text-rose-400">-{formatCurrency(mgmt.dailyStopLoss)}</strong>
              </div>
            </div>
          </div>

          {/* Card 2: 2ª Mão de Entrada (Soros Nível 1) */}
          <div className="p-5 bg-[#0F0F12] border border-cyan-500/30 rounded-xl space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                2ª Mão (Soros Nível 1)
              </span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">
                Mão 1 + Lucro 1
              </span>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Valor da 2ª Entrada (Se der WIN)</span>
              <span className="text-2xl font-black font-mono text-cyan-300 tracking-tight">
                {formatCurrency(step2EntryAmount)}
              </span>
            </div>

            <div className="p-3 bg-[#0A0A0B] border border-[#1E2028] rounded-lg space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Payout Entrada 2:</span>
                <strong className="text-white">{step2Payout}%</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Lucro da 2ª Mão:</span>
                <strong className="text-emerald-400">+{formatCurrency(step2Profit)}</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Meta Líquida Total (2x0):</span>
                <strong className="text-emerald-400 font-black">+{formatCurrency(totalDynamicTargetProfit)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary KPIs Strip */}
        <div className="p-4 bg-[#0A0A0B] border border-[#1E2028] rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Meta Diária (2x0)</span>
            <strong className="text-emerald-400 text-sm">+{formatCurrency(totalDynamicTargetProfit)}</strong>
            <span className="text-[10px] text-slate-500 block">+{((totalDynamicTargetProfit / mgmt.bankroll) * 100).toFixed(1)}% banca</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Stop Loss Diário</span>
            <strong className="text-rose-400 text-sm">-{formatCurrency(mgmt.dailyStopLoss)}</strong>
            <span className="text-[10px] text-slate-500 block">-{mgmt.firstEntryPercent}% banca</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Relação Risco x Retorno</span>
            <strong className="text-cyan-300 text-sm">1 : {(totalDynamicTargetProfit / (mgmt.dailyStopLoss || 1)).toFixed(2)}</strong>
            <span className="text-[10px] text-slate-500 block">Lucro &gt; Risco</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-sans">Banca com Meta Batida</span>
            <strong className="text-white text-sm">{formatCurrency(mgmt.bankroll + totalDynamicTargetProfit)}</strong>
            <span className="text-[10px] text-slate-500 block">Após 1 dia 2x0</span>
          </div>
        </div>

        {/* Interactive Live Cycle Console with Per-Step Payout and Strategy */}
        <div className="p-5 bg-[#0F0F12] border border-orange-500/30 rounded-xl space-y-4 shadow-lg shadow-black/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-orange-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Execução Ao Vivo do Ciclo 2x1
              </h4>
            </div>

            <span className="text-xs font-mono text-slate-400">
              Fase Atual:{' '}
              <strong className="text-orange-400">
                {currentStep === 'STEP_1'
                  ? 'Passo 1: 1ª Mão (Stop Diário)'
                  : currentStep === 'STEP_2'
                  ? 'Passo 2: 2ª Mão (Soros)'
                  : 'Ciclo Encerrado'}
              </strong>
            </span>
          </div>

          {/* STEP 1 CONSOLE */}
          {currentStep === 'STEP_1' && (
            <div className="p-4 bg-[#0A0A0B] border border-[#1E2028] rounded-xl space-y-4">
              {/* Step 1 Settings Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-3 border-b border-[#1E2028]">
                {/* Strategy */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-orange-400" />
                      Estratégia Entrada 1:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddStrategyInput(!showAddStrategyInput)}
                      className="text-[10px] text-orange-400 hover:text-orange-300 font-medium flex items-center gap-0.5"
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
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewStrategy('STEP_1')}
                        placeholder="Nome da estratégia..."
                        className="w-full bg-[#15161A] border border-orange-500/60 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewStrategy('STEP_1')}
                        className="px-2 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      id="select-2x1-step1-strategy"
                      value={step1Strategy}
                      onChange={(e) => setStep1Strategy(e.target.value)}
                      className="w-full bg-[#15161A] border border-[#272935] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-orange-500"
                    >
                      {allStrategies.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Asset */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-200 mb-1">
                    Ativo Entrada 1:
                  </label>
                  <select
                    id="select-2x1-step1-asset"
                    value={step1Asset}
                    onChange={(e) => setStep1Asset(e.target.value)}
                    className="w-full bg-[#15161A] border border-[#272935] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-orange-500"
                  >
                    {allAssets.map((ast) => (
                      <option key={ast} value={ast}>
                        {ast}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payout */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-200 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-orange-400" />
                      Payout Entrada 1 (%):
                    </label>
                    <span className="text-[11px] font-mono text-orange-300 font-bold">
                      {step1Payout}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-2x1-step1-payout"
                      type="number"
                      min="50"
                      max="100"
                      value={step1Payout}
                      onChange={(e) => setStep1Payout(parseFloat(e.target.value) || 80)}
                      className="w-20 bg-[#15161A] border border-[#272935] rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-orange-500"
                    />
                    <div className="flex items-center gap-1 flex-1 overflow-x-auto pb-0.5">
                      {payoutPresets.map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setStep1Payout(pct)}
                          className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold transition-colors shrink-0 ${
                            step1Payout === pct
                              ? 'bg-orange-500 text-black font-black'
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
              <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                <div className="space-y-1 text-center xl:text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-center xl:justify-start">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40 shrink-0">
                      Entrada 01
                    </span>
                    <span className="text-xs text-slate-400 font-mono truncate">
                      {step1Asset} • {step1Strategy} • Payout {step1Payout}%
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono text-white">
                    Valor da Entrada: {formatCurrency(mgmt.firstEntryAmount)}
                  </div>
                  <p className="text-xs text-slate-400">
                    Se vencer, lucra <strong className="text-emerald-400">+{formatCurrency(step1Profit)}</strong> e avança para a 2ª Mão de <strong className="text-cyan-300">{formatCurrency(step2EntryAmount)}</strong>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full xl:w-auto shrink-0">
                  <button
                    id="btn-2x1-step1-win"
                    onClick={() => handleExecuteStep1('WIN')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    DEU WIN! (Ir p/ Soros)
                  </button>
                  <button
                    id="btn-2x1-step1-loss"
                    onClick={() => handleExecuteStep1('LOSS')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    DEU LOSS (Stop do Dia)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 CONSOLE (SOROS) */}
          {currentStep === 'STEP_2' && (
            <div className="p-4 bg-cyan-950/15 border border-cyan-500/40 rounded-xl space-y-4 animate-in fade-in">
              {/* Step 2 Settings Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-3 border-b border-cyan-500/20">
                {/* Strategy for Step 2 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-cyan-200 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      Estratégia Entrada 2 (Soros):
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
                        onKeyDown={(e) => e.key === 'Enter' && handleAddNewStrategy('STEP_2')}
                        placeholder="Nome da estratégia..."
                        className="w-full bg-[#15161A] border border-cyan-500/60 rounded px-2 py-1.5 text-xs text-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleAddNewStrategy('STEP_2')}
                        className="px-2 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  ) : (
                    <select
                      id="select-2x1-step2-strategy"
                      value={step2Strategy}
                      onChange={(e) => setStep2Strategy(e.target.value)}
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

                {/* Asset for Step 2 */}
                <div>
                  <label className="block text-[11px] font-bold text-cyan-200 mb-1">
                    Ativo Entrada 2:
                  </label>
                  <select
                    id="select-2x1-step2-asset"
                    value={step2Asset}
                    onChange={(e) => setStep2Asset(e.target.value)}
                    className="w-full bg-[#15161A] border border-[#272935] rounded-lg px-2.5 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-cyan-500"
                  >
                    {allAssets.map((ast) => (
                      <option key={ast} value={ast}>
                        {ast}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payout for Step 2 */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-cyan-200 flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-cyan-400" />
                      Payout Entrada 2 (%):
                    </label>
                    <span className="text-[11px] font-mono text-cyan-300 font-bold">
                      {step2Payout}%
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <input
                      id="input-2x1-step2-payout"
                      type="number"
                      min="50"
                      max="100"
                      value={step2Payout}
                      onChange={(e) => setStep2Payout(parseFloat(e.target.value) || 80)}
                      className="w-20 bg-[#15161A] border border-[#272935] rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center focus:outline-none focus:border-cyan-500"
                    />
                    <div className="flex items-center gap-1 flex-1 overflow-x-auto pb-0.5">
                      {payoutPresets.map((pct) => (
                        <button
                          key={pct}
                          type="button"
                          onClick={() => setStep2Payout(pct)}
                          className={`px-1.5 py-1 rounded text-[10px] font-mono font-bold transition-colors shrink-0 ${
                            step2Payout === pct
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
              <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
                <div className="space-y-1 text-center xl:text-left flex-1 min-w-0">
                  <div className="flex items-center gap-2 justify-center xl:justify-start">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 shrink-0">
                      Entrada 02 (Soros)
                    </span>
                    <span className="text-xs text-emerald-400 font-mono font-bold truncate">
                      1ª Mão WIN (+{formatCurrency(step1Profit)})
                    </span>
                  </div>
                  <div className="text-xl font-black font-mono text-cyan-300">
                    Valor da Entrada: {formatCurrency(step2EntryAmount)}
                  </div>
                  <p className="text-xs text-slate-300">
                    Mão 1 ({formatCurrency(mgmt.firstEntryAmount)}) + Lucro ({formatCurrency(step1Profit)}). Meta final: <strong className="text-emerald-400">+{formatCurrency(totalDynamicTargetProfit)}</strong>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full xl:w-auto shrink-0">
                  <button
                    id="btn-2x1-step2-win"
                    onClick={() => handleExecuteStep2('WIN')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    DEU WIN! (2x0 Meta Batida)
                  </button>
                  <button
                    id="btn-2x1-step2-loss"
                    onClick={() => handleExecuteStep2('LOSS')}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-lg text-xs font-black bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/40 transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <XCircle className="w-4 h-4 shrink-0" />
                    DEU LOSS (Stop Diário)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FINISHED CONSOLE */}
          {currentStep === 'CYCLE_FINISHED' && (
            <div className="space-y-4 animate-in fade-in">
              <div
                className={`p-5 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  cycleResult === '2x0_WIN'
                    ? 'bg-emerald-950/25 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                    : 'bg-rose-950/25 border-rose-500/40 shadow-lg shadow-rose-950/20'
                }`}
              >
                <div className="space-y-1.5 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    {cycleResult === '2x0_WIN' ? (
                      <span className="px-3 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4" />
                        META BATIDA 2x0 COM SUCESSO!
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4" />
                        STOP LOSS DIÁRIO ATINGIDO
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-2xl font-black font-mono tracking-tight ${
                      cycleResult === '2x0_WIN' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    Resultado do Ciclo: {profitGenerated >= 0 ? `+${formatCurrency(profitGenerated)}` : formatCurrency(profitGenerated)}
                  </div>
                  <p className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    As operações já foram computadas. Agora informe o seu tempo de tela para registrar o dia.
                  </p>
                </div>

                <button
                  id="btn-2x1-new-cycle"
                  onClick={handleResetCycle}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold bg-[#15161A] text-slate-300 border border-[#272935] hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-2 shrink-0"
                >
                  <RotateCcw className="w-4 h-4 text-orange-400" />
                  Iniciar Outro Ciclo
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
                      <h4 className="text-sm font-bold text-white">Tempo de Tela da Sessão</h4>
                      <p className="text-xs text-slate-400">
                        Informe o tempo que levou para bater a meta e registre o dia
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
                    id="btn-2x1-save-screentime"
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
