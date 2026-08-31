import React from 'react';
import { Clock, Play, Pause, RotateCcw, Save, Trash2, Calendar, BarChart2 } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { formatSecondsToTime, formatSecondsShort } from '../../utils/formatters';

export const OperationalTimeCard: React.FC = () => {
  const {
    monthlyStats,
    isTimerRunning,
    currentTimerSeconds,
    startTimer,
    pauseTimer,
    resetTimer,
    clearOperationalTime,
    saveTimerTime,
  } = useTrading();

  const handleSaveCurrentSession = () => {
    if (currentTimerSeconds > 0) {
      saveTimerTime(currentTimerSeconds);
      resetTimer();
    }
  };

  return (
    <div
      className="p-5 bg-[#121722] border border-slate-800 rounded-xl flex flex-col justify-between"
      id="card-operational-time"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">Tempo Operacional</h3>
            <p className="text-[11px] text-slate-400">Controle de exposição diária ao mercado</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800/40">
            TEMPO MENSAL: {formatSecondsToTime(monthlyStats.totalOperationalTimeSeconds)}
          </span>
          <button
            id="btn-clear-all-op-time"
            type="button"
            onClick={() => {
              if (window.confirm('Deseja zerar todo o tempo operacional acumulado?')) {
                clearOperationalTime();
              }
            }}
            title="Zerar todo o tempo operacional"
            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live Stopwatch Section */}
      <div className="p-4 bg-[#0b0e14] border border-slate-800 rounded-xl my-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
            Cronômetro da Sessão
          </span>
          <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-wider">
            {formatSecondsToTime(currentTimerSeconds)}
          </span>
        </div>

        {/* Stopwatch Action Controls */}
        <div className="flex items-center space-x-2">
          {isTimerRunning ? (
            <button
              id="btn-timecard-pause"
              onClick={pauseTimer}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-black shadow-md transition-all flex items-center gap-1.5"
            >
              <Pause className="w-3.5 h-3.5 fill-black" />
              Pausar
            </button>
          ) : (
            <button
              id="btn-timecard-start"
              onClick={startTimer}
              className="px-3.5 py-2 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-950 transition-all flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Iniciar
            </button>
          )}

          {currentTimerSeconds > 0 && (
            <>
              <button
                id="btn-timecard-save"
                onClick={handleSaveCurrentSession}
                title="Salvar tempo no dia de hoje"
                className="p-2 rounded-lg bg-slate-800 text-cyan-400 hover:bg-slate-700 hover:text-white transition-colors"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                id="btn-timecard-reset"
                onClick={resetTimer}
                title="Zerar cronômetro"
                className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Metrics Breakdown Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs font-mono">
        <div className="p-2.5 bg-[#0b0e14] border border-slate-800/80 rounded-lg">
          <span className="text-[10px] text-slate-500 block uppercase">Tempo de Hoje</span>
          <strong className="text-white text-sm">
            {formatSecondsToTime(monthlyStats.todayOperationalTimeSeconds)}
          </strong>
        </div>

        <div className="p-2.5 bg-[#0b0e14] border border-slate-800/80 rounded-lg">
          <span className="text-[10px] text-slate-500 block uppercase">Tempo Semanal</span>
          <strong className="text-cyan-300 text-sm">
            {formatSecondsToTime(monthlyStats.weeklyOperationalTimeSeconds)}
          </strong>
        </div>

        <div className="p-2.5 bg-[#0b0e14] border border-slate-800/80 rounded-lg">
          <span className="text-[10px] text-slate-500 block uppercase">Tempo Mensal</span>
          <strong className="text-orange-400 text-sm">
            {formatSecondsToTime(monthlyStats.totalOperationalTimeSeconds)}
          </strong>
        </div>

        <div className="p-2.5 bg-[#0b0e14] border border-slate-800/80 rounded-lg">
          <span className="text-[10px] text-slate-500 block uppercase">Média Diária</span>
          <strong className="text-slate-300 text-sm">
            {formatSecondsToTime(monthlyStats.dailyAvgOperationalTimeSeconds)}
          </strong>
        </div>
      </div>
    </div>
  );
};
