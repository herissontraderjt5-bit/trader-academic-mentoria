import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  MinusCircle,
  RotateCcw,
  Zap,
  Clock,
  Save,
  Lock,
  Edit2,
  Check,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { OperationResult } from '../../types';
import { calculate5x2Management, calculateOperationProfit } from '../../utils/calculations';
import { getTodayDateString, formatSecondsToTime } from '../../utils/formatters';

export const Management5x2View: React.FC = () => {
  const {
    session5x2,
    record5x2Result,
    reset5x2Session,
    update5x2Settings,
    monthConfig,
    monthlyStats,
    formatCurrency,
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

  // Current Entry Controls
  const [currentEntryPayout, setCurrentEntryPayout] = useState<number>(
    Math.max(80, monthConfig.defaultPayout || 85)
  );
  const [currentEntryStrategy, setCurrentEntryStrategy] = useState<string>(
    monthConfig.customStrategies?.[0] || 'Pullback'
  );
  const [currentEntryAsset, setCurrentEntryAsset] = useState<string>('EUR/USD');

  // Custom Fixed Entry Override (allows user to lock exact value like 10.60 throughout the entire month)
  const [customFixedEntry, setCustomFixedEntry] = useState<number | null>(null);
  const [isEditingFixedEntry, setIsEditingFixedEntry] = useState<boolean>(false);
  const [tempFixedEntryInput, setTempFixedEntryInput] = useState<string>('');

  // Sync inputs when monthConfig changes
  useEffect(() => {
    const defPayout = Math.max(80, monthConfig.defaultPayout || 85);
    setCurrentEntryPayout(defPayout);
    if (monthConfig.customStrategies && monthConfig.customStrategies.length > 0) {
      setCurrentEntryStrategy(monthConfig.customStrategies[0]);
    }
  }, [monthConfig.defaultPayout, monthConfig.customStrategies]);

  // Base 5x2 parameters calculated strictly from Initial Bankroll of the month
  const mgmt = useMemo(() => {
    return calculate5x2Management(
      Number(monthConfig.initialBankroll || 100),
      Number(monthConfig.workingDays || 20),
      Number(monthConfig.defaultPayout || 85)
    );
  }, [monthConfig.initialBankroll, monthConfig.workingDays, monthConfig.defaultPayout]);

  // Effective constant fixed entry throughout the month
  const effectiveFixedEntry = useMemo(() => {
    return customFixedEntry !== null ? customFixedEntry : mgmt.fixedEntryAmount;
  }, [customFixedEntry, mgmt.fixedEntryAmount]);

  // Effective daily stop loss (2 losses with the constant fixed entry)
  const effectiveDailyStopLoss = useMemo(() => {
    return Number((2 * effectiveFixedEntry).toFixed(2));
  }, [effectiveFixedEntry]);

  // Effective 5x0 target
  const effectiveTarget5x0 = useMemo(() => {
    const singleWin = calculateOperationProfit(effectiveFixedEntry, currentEntryPayout, 'WIN');
    return Number((5 * singleWin).toFixed(2));
  }, [effectiveFixedEntry, currentEntryPayout]);

  useEffect(() => {
    update5x2Settings({
      fixedEntryAmount: effectiveFixedEntry,
      dailyStopLoss: effectiveDailyStopLoss,
      payout: monthConfig.defaultPayout || 85,
      dailyTargetWin: effectiveTarget5x0,
    });
  }, [effectiveFixedEntry, effectiveDailyStopLoss, monthConfig.defaultPayout, effectiveTarget5x0]);

  const winCount = session5x2.operations.filter((r) => r === 'WIN').length;
  const lossCount = session5x2.operations.filter((r) => r === 'LOSS').length;
  const empateCount = session5x2.operations.filter((r) => r === 'EMPATE').length;

  const currentSessionProfit = useMemo(() => {
    if (session5x2.opDetails && session5x2.opDetails.length > 0) {
      const sum = session5x2.opDetails.reduce((acc, curr) => acc + curr.profit, 0);
      return Number(sum.toFixed(2));
    }
    let profit = 0;
    const basePayout = monthConfig.defaultPayout || 85;
    session5x2.operations.forEach((res) => {
      profit += calculateOperationProfit(effectiveFixedEntry, basePayout, res);
    });
    return Number(profit.toFixed(2));
  }, [session5x2.opDetails, session5x2.operations, effectiveFixedEntry, monthConfig.defaultPayout]);

  const isBlocked =
    session5x2.status === 'STOP_LOSS' ||
    session5x2.status === 'STOP_WIN' ||
    session5x2.status === 'FINISHED' ||
    lossCount >= 2;

  const currentWinProfit = useMemo(() => {
    return calculateOperationProfit(effectiveFixedEntry, currentEntryPayout, 'WIN');
  }, [effectiveFixedEntry, currentEntryPayout]);

  const handleRecordResult = (result: OperationResult) => {
    if (isBlocked) return;
    record5x2Result(
      result,
      currentEntryAsset,
      currentEntryStrategy,
      effectiveFixedEntry,
      currentEntryPayout
    );
  };

  const handleSaveCustomFixedEntry = () => {
    const val = parseFloat(tempFixedEntryInput);
    if (!isNaN(val) && val > 0) {
      setCustomFixedEntry(val);
    }
    setIsEditingFixedEntry(false);
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

  return (
    <div className="space-y-4 pb-10" id="view-management-5x2">
      {/* Header Resumido */}
      <div className="p-4 bg-[#0D111A] border border-[#1E2536] rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
              Gestão 5x2 (Entrada Fixa)
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Valor Constante o Mês Todo
              </span>
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
              <span>Banca Inicial: <strong className="text-white">{formatCurrency(monthConfig.initialBankroll || 100)}</strong></span>
              <span>•</span>
              <span>{monthConfig.workingDays || 20} Dias Úteis</span>
              <span>•</span>
              <span>Saldo Atual: <strong className="text-emerald-400">{formatCurrency(monthlyStats.currentBankroll)}</strong></span>
            </div>
          </div>
        </div>

        <button
          onClick={reset5x2Session}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#151922] text-slate-300 border border-[#222B3D] hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-orange-400" />
          Nova Sessão
        </button>
      </div>

      {/* Cards Resumidos de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono">
        {/* Entrada Fixa do Mês */}
        <div className="p-3.5 bg-[#0D111A] border border-cyan-500/40 rounded-xl space-y-1 relative group">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 uppercase font-sans font-bold flex items-center gap-1">
              <Lock className="w-3 h-3 text-cyan-400" />
              Entrada Fixa (Mês Todo)
            </span>
            <button
              type="button"
              onClick={() => {
                setTempFixedEntryInput(String(effectiveFixedEntry));
                setIsEditingFixedEntry(!isEditingFixedEntry);
              }}
              className="text-[10px] text-slate-400 hover:text-cyan-300 flex items-center gap-0.5 font-sans"
              title="Ajustar valor fixo"
            >
              <Edit2 className="w-2.5 h-2.5" />
              {isEditingFixedEntry ? 'Cancelar' : 'Editar'}
            </button>
          </div>

          {isEditingFixedEntry ? (
            <div className="flex items-center gap-1 pt-1">
              <input
                type="number"
                step="0.1"
                value={tempFixedEntryInput}
                onChange={(e) => setTempFixedEntryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCustomFixedEntry()}
                className="w-full bg-[#121620] border border-cyan-500 rounded px-2 py-1 text-xs text-white font-mono font-bold"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveCustomFixedEntry}
                className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold shrink-0"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="text-xl font-black text-cyan-300">{formatCurrency(effectiveFixedEntry)}</div>
          )}
          <span className="text-[11px] text-emerald-400 block">+ {formatCurrency(currentWinProfit)} no WIN ({currentEntryPayout}%)</span>
        </div>

        {/* Meta Diária (5x0) */}
        <div className="p-3.5 bg-[#0D111A] border border-emerald-500/30 rounded-xl space-y-1">
          <span className="text-[10px] text-emerald-400 uppercase font-sans font-bold block">Meta Diária (5x0)</span>
          <div className="text-xl font-black text-emerald-400">+{formatCurrency(effectiveTarget5x0)}</div>
          <span className="text-[11px] text-slate-400 block">5 Vitórias consecutivas</span>
        </div>

        {/* Stop Diário (2 Derrotas) */}
        <div className="p-3.5 bg-[#0D111A] border border-rose-500/30 rounded-xl space-y-1">
          <span className="text-[10px] text-rose-400 uppercase font-sans font-bold block">Stop Diário (2 LOSS)</span>
          <div className="text-xl font-black text-rose-400">-{formatCurrency(effectiveDailyStopLoss)}</div>
          <span className="text-[11px] text-slate-400 block">2 x {formatCurrency(effectiveFixedEntry)}</span>
        </div>

        {/* Placar da Sessão */}
        <div className="p-3.5 bg-[#0D111A] border border-[#1E2536] rounded-xl space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-sans font-bold block">Placar da Sessão</span>
          <div className="text-xl font-black flex items-center gap-2">
            <span className="text-emerald-400">{winCount}W</span>
            <span className="text-slate-500">-</span>
            <span className="text-rose-400">{lossCount}L</span>
            {empateCount > 0 && <span className="text-slate-400 text-xs font-normal">({empateCount}E)</span>}
          </div>
          <span className={`text-[11px] font-bold block ${currentSessionProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Lucro: {currentSessionProfit >= 0 ? `+${formatCurrency(currentSessionProfit)}` : formatCurrency(currentSessionProfit)}
          </span>
        </div>
      </div>

      {/* Console de Execução da Sessão */}
      <div className="p-4 bg-[#0D111A] border border-[#1E2536] rounded-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            Execução de Operações
          </span>
          <span className={`text-xs font-mono font-bold ${isBlocked ? (lossCount >= 2 ? 'text-rose-400' : 'text-emerald-400') : 'text-cyan-400'}`}>
            {isBlocked ? (lossCount >= 2 ? '⚠️ Sessão Encerrada (Stop Loss)' : '🏆 Meta Batida!') : `Entrada ${session5x2.operations.length + 1} de 5`}
          </span>
        </div>

        {!isBlocked ? (
          <div className="p-3.5 bg-[#080B11] border border-[#1E2536] rounded-xl space-y-3">
            {/* Parâmetros compactos da entrada */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Estratégia</label>
                <select
                  value={currentEntryStrategy}
                  onChange={(e) => setCurrentEntryStrategy(e.target.value)}
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
                  value={currentEntryAsset}
                  onChange={(e) => setCurrentEntryAsset(e.target.value)}
                  className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2 py-1.5 text-xs text-white"
                >
                  {allAssets.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold block mb-1">Payout (%)</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={currentEntryPayout}
                  onChange={(e) => setCurrentEntryPayout(parseFloat(e.target.value) || 85)}
                  className="w-full bg-[#121620] border border-[#222B3D] rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                />
              </div>
            </div>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-[#1E2536]">
              <div className="font-mono text-xs">
                <span>Entrada Fixa: <strong className="text-white text-sm">{formatCurrency(effectiveFixedEntry)}</strong></span>
                <span className="text-slate-400 ml-2">(Se WIN: <strong className="text-emerald-400">+{formatCurrency(currentWinProfit)}</strong>)</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => handleRecordResult('WIN')}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  WIN
                </button>
                <button
                  onClick={() => handleRecordResult('LOSS')}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  LOSS
                </button>
                <button
                  onClick={() => handleRecordResult('EMPATE')}
                  className="flex-1 sm:flex-initial px-3 py-2 rounded-lg text-xs font-bold bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <MinusCircle className="w-3.5 h-3.5" />
                  DOJI
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3 animate-in fade-in">
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                lossCount < 2 && winCount > 0
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-rose-950/20 border-rose-500/40'
              }`}
            >
              <div>
                <span className={`text-xs font-bold uppercase block ${lossCount < 2 && winCount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {lossCount < 2 && winCount > 0 ? '🏆 Sessão Finalizada com Lucro!' : '⚠️ Limite de 2 LOSS Atingido'}
                </span>
                <div className={`text-lg font-black font-mono ${currentSessionProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Resultado: {currentSessionProfit >= 0 ? `+${formatCurrency(currentSessionProfit)}` : formatCurrency(currentSessionProfit)} ({winCount}W - {lossCount}L)
                </div>
              </div>

              <button
                onClick={reset5x2Session}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#151922] text-slate-300 border border-[#222B3D] hover:text-white flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                Nova Sessão
              </button>
            </div>

            {/* Tempo de Tela e Salvar Dia */}
            <div className="p-3.5 bg-[#080B11] border border-[#1E2536] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-slate-300">Tempo de Tela: <strong className="text-cyan-300 font-mono">{formatSecondsToTime(screenTimeSeconds)}</strong></span>
              </div>

              <button
                onClick={() => {
                  setDayOperationalTime(getTodayDateString(), screenTimeSeconds);
                  setDayRegisteredSuccess(true);
                }}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 ${
                  dayRegisteredSuccess ? 'bg-emerald-600' : 'bg-cyan-600 hover:bg-cyan-500'
                }`}
              >
                <Save className="w-3.5 h-3.5" />
                {dayRegisteredSuccess ? 'Dia Registrado!' : 'Salvar Dia no Diário'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
