import React, { useState, useMemo, useEffect } from 'react';
import {
  Target,
  CheckCircle,
  XCircle,
  Percent,
  Zap,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Layers,
  Plus,
  Clock,
  Save,
  ArrowRight,
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

  // Step 1 Customizations
  const [step1Payout, setStep1Payout] = useState<number>(
    Math.max(80, monthConfig.defaultPayout || 85)
  );
  const [step1Strategy, setStep1Strategy] = useState<string>(
    monthConfig.customStrategies?.[0] || 'Pullback'
  );
  const [step1Asset, setStep1Asset] = useState<string>('EUR/USD');

  // Step 2 Customizations
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

  // Screen time state
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

  // Calculate 2x1 Management
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
        notes: `Gestão 2x1 - Entrada 01: ${formatCurrency(mgmt.firstEntryAmount)} -> WIN (+${formatCurrency(step1Profit)})`,
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
        notes: `Gestão 2x1 - Entrada 01: Stop Diário (-${formatCurrency(mgmt.firstEntryAmount)})`,
      });
      setCycleResult('0x1_STOP');
      setProfitGenerated(-mgmt.firstEntryAmount);
      setCurrentStep('CYCLE_FINISHED');
    }
  };

  // Execute Step 2 (Soros)
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
        notes: `Gestão 2x1 - Entrada 02 Soros: ${formatCurrency(step2EntryAmount)} -> WIN (+${formatCurrency(step2Profit)} | Meta Batida!)`,
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
        notes: `Gestão 2x1 - Entrada 02 Soros: LOSS (-${formatCurrency(mgmt.firstEntryAmount)})`,
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

  const payoutPresets = [80, 85, 87, 90, 92, 95];

  return (
    <div className="space-y-4 pb-10" id="view-management-2x1">
      {/* Resumo Rápido e Limpo */}
      <div className="p-4 bg-[#0D111A] border border-[#1E2536] rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Gestão 2x1 (Soros)
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                1 Entrada + 1 Soros
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
              <span>Banca: <strong className="text-white">{formatCurrency(mgmt.bankroll)}</strong></span>
              <span>•</span>
              <span>Saldo Atual: <strong className="text-emerald-400">{formatCurrency(monthlyStats.currentBankroll)}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={handleResetCycle}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#151922] text-slate-300 border border-[#222B3D] hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
          Reiniciar
        </button>
      </div>

      {/* Cards Resumidos: 1ª Mão & 2ª Mão Soros */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* 1ª Mão */}
        <div className="p-3.5 bg-[#0D111A] border border-[#1E2536] rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">1ª Mão (Stop Diário)</span>
          <div className="text-xl font-black text-white">{formatCurrency(mgmt.firstEntryAmount)}</div>
          <span className="text-[11px] text-emerald-400 block">+ {formatCurrency(step1Profit)} no WIN ({step1Payout}%)</span>
        </div>

        {/* 2ª Mão Soros */}
        <div className="p-3.5 bg-[#0D111A] border border-cyan-500/30 rounded-xl space-y-1">
          <span className="text-[10px] text-cyan-400 uppercase font-sans font-bold block">2ª Mão (Soros Nível 1)</span>
          <div className="text-xl font-black text-cyan-300">{formatCurrency(step2EntryAmount)}</div>
          <span className="text-[11px] text-emerald-400 block">+ {formatCurrency(step2Profit)} no WIN ({step2Payout}%)</span>
        </div>

        {/* Meta Líquida 2x0 */}
        <div className="p-3.5 bg-[#0D111A] border border-emerald-500/30 rounded-xl space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase font-sans font-bold block">Meta Diária (2x0)</span>
          <div className="text-xl font-black text-emerald-400">+{formatCurrency(totalDynamicTargetProfit)}</div>
          <span className="text-[11px] text-slate-400 block">+{((totalDynamicTargetProfit / (mgmt.bankroll || 1)) * 100).toFixed(1)}% da banca</span>
        </div>

        {/* Stop Loss */}
        <div className="p-3.5 bg-[#0D111A] border border-rose-500/30 rounded-xl space-y-1">
          <span className="text-[10px] text-rose-400 uppercase font-sans font-bold block">Stop Diário</span>
          <div className="text-xl font-black text-rose-400">-{formatCurrency(mgmt.dailyStopLoss)}</div>
          <span className="text-[11px] text-slate-400 block">Risco 1 : {(totalDynamicTargetProfit / (mgmt.dailyStopLoss || 1)).toFixed(2)} Retorno</span>
        </div>
      </div>

      {/* Console de Execução do Ciclo */}
      <div className="p-4 bg-[#0D111A] border border-orange-500/30 rounded-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-orange-400" />
            Execução ao Vivo
          </span>
          <span className="text-xs font-mono text-orange-400 font-bold">
            {currentStep === 'STEP_1' ? 'Passo 1 de 2: 1ª Mão' : currentStep === 'STEP_2' ? 'Passo 2 de 2: Soros' : 'Ciclo Finalizado'}
          </span>
        </div>

        {/* PASSO 1 */}
        {currentStep === 'STEP_1' && (
          <div className="p-3.5 bg-[#080B11] border border-[#1E2536] rounded-xl space-y-3">
            {/* Parâmetros compactos da entrada */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Estratégia</label>
                <select
                  value={step1Strategy}
                  onChange={(e) => setStep1Strategy(e.target.value)}
                  className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  {allStrategies.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Ativo</label>
                <select
                  value={step1Asset}
                  onChange={(e) => setStep1Asset(e.target.value)}
                  className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  {allAssets.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Payout (%)</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={step1Payout}
                    onChange={(e) => setStep1Payout(parseFloat(e.target.value) || 85)}
                    className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                  />
                </div>
              </div>
            </div>

            {/* Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-[#1E2536]">
              <div className="font-mono text-xs">
                <span>Entrada: <strong className="text-white text-sm">{formatCurrency(mgmt.firstEntryAmount)}</strong></span>
                <span className="text-slate-400 ml-2">(Lucro se WIN: <strong className="text-emerald-400">+{formatCurrency(step1Profit)}</strong>)</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleExecuteStep1('WIN')}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  WIN (Ir p/ Soros)
                </button>
                <button
                  onClick={() => handleExecuteStep1('LOSS')}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  LOSS (Stop do Dia)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 2 (SOROS) */}
        {currentStep === 'STEP_2' && (
          <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/40 rounded-xl space-y-3 animate-in fade-in">
            {/* Parâmetros compactos */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-cyan-300 font-bold block mb-1">Estratégia Soros</label>
                <select
                  value={step2Strategy}
                  onChange={(e) => setStep2Strategy(e.target.value)}
                  className="w-full bg-[#121620] border border-cyan-500/40 rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  {allStrategies.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-cyan-300 font-bold block mb-1">Ativo</label>
                <select
                  value={step2Asset}
                  onChange={(e) => setStep2Asset(e.target.value)}
                  className="w-full bg-[#121620] border border-cyan-500/40 rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  {allAssets.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-cyan-300 font-bold block mb-1">Payout (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={step2Payout}
                  onChange={(e) => setStep2Payout(parseFloat(e.target.value) || 85)}
                  className="w-full bg-[#121620] border border-cyan-500/40 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
            </div>

            {/* Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-cyan-500/30">
              <div className="font-mono text-xs">
                <span>Entrada Soros: <strong className="text-cyan-300 text-sm">{formatCurrency(step2EntryAmount)}</strong></span>
                <span className="text-slate-400 ml-2">(Meta se WIN: <strong className="text-emerald-400">+{formatCurrency(totalDynamicTargetProfit)}</strong>)</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleExecuteStep2('WIN')}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  WIN (Meta 2x0 Batida!)
                </button>
                <button
                  onClick={() => handleExecuteStep2('LOSS')}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  LOSS (Stop Diário)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CICLO FINALIZADO */}
        {currentStep === 'CYCLE_FINISHED' && (
          <div className="space-y-4 animate-in fade-in">
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                cycleResult === '2x0_WIN'
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}
            >
              <div>
                <span className={`text-xs font-bold uppercase block ${cycleResult === '2x0_WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {cycleResult === '2x0_WIN' ? '🏆 Meta 2x0 Batida com Sucesso!' : '⚠️ Stop Loss Diário Atingido'}
                </span>
                <div className={`text-xl font-black font-mono mt-0.5 ${cycleResult === '2x0_WIN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Resultado: {profitGenerated >= 0 ? `+${formatCurrency(profitGenerated)}` : formatCurrency(profitGenerated)}
                </div>
              </div>

              <button
                onClick={handleResetCycle}
                className="px-3.5 py-2 rounded-lg text-xs font-bold bg-[#151922] text-slate-300 border border-[#222B3D] hover:text-white flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
                Novo Ciclo
              </button>
            </div>

            {/* Seletor de Tempo de Tela e Salvar Dia */}
            <div className="space-y-3">
              <ScreenTimePicker
                initialSeconds={screenTimeSeconds}
                onTimeChange={(sec) => setScreenTimeSeconds(sec)}
              />

              <button
                onClick={() => {
                  setDayOperationalTime(getTodayDateString(), screenTimeSeconds);
                  setDayRegisteredSuccess(true);
                }}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                  dayRegisteredSuccess ? 'bg-emerald-600 shadow-emerald-950/50' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-950/50'
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
                    Salvar Dia e Tempo de Tela no Diário
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
