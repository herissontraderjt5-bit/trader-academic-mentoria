import React, { useState, useEffect } from 'react';
import { Clock, Check, Sparkles } from 'lucide-react';
import { formatSecondsToTime } from '../../utils/formatters';

interface ScreenTimePickerProps {
  initialSeconds?: number;
  onTimeChange?: (seconds: number) => void;
  compact?: boolean;
}

export const ScreenTimePicker: React.FC<ScreenTimePickerProps> = ({
  initialSeconds = 0,
  onTimeChange,
  compact = false,
}) => {
  const [hours, setHours] = useState<number>(Math.floor(initialSeconds / 3600));
  const [minutes, setMinutes] = useState<number>(Math.floor((initialSeconds % 3600) / 60));

  useEffect(() => {
    const total = Math.max(0, hours * 3600 + minutes * 60);
    if (onTimeChange) {
      onTimeChange(total);
    }
  }, [hours, minutes, onTimeChange]);

  const setPreset = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    setHours(h);
    setMinutes(m);
  };

  const totalSec = Math.max(0, hours * 3600 + minutes * 60);

  const presets = [
    { label: '15m', mins: 15 },
    { label: '30m', mins: 30 },
    { label: '45m', mins: 45 },
    { label: '1h', mins: 60 },
    { label: '1h 30m', mins: 90 },
    { label: '2h', mins: 120 },
  ];

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-[#0b0e14] border border-slate-700/80 rounded-lg px-2 py-1">
            <input
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-10 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 font-semibold">h</span>
            <span className="text-slate-600">:</span>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-10 bg-transparent text-center font-mono font-bold text-white text-xs focus:outline-none"
            />
            <span className="text-[10px] text-slate-400 font-semibold">min</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto">
            {presets.slice(0, 4).map((p) => (
              <button
                key={p.mins}
                type="button"
                onClick={() => setPreset(p.mins)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  hours * 60 + minutes === p.mins
                    ? 'bg-cyan-500 text-black'
                    : 'bg-[#15161A] text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#0a0d14] border border-cyan-500/30 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Tempo de Tela Operacional</h4>
            <p className="text-[10px] text-slate-400">Quanto tempo você ficou em frente ao gráfico hoje?</p>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs">
          {formatSecondsToTime(totalSec)}
        </div>
      </div>

      {/* Inputs for Hours and Minutes */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#121722] border border-slate-700/80 rounded-lg p-2 flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-300">Horas:</label>
          <div className="flex items-center gap-1.5">
            <input
              id="input-screen-hours"
              type="number"
              min="0"
              max="24"
              value={hours}
              onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-14 bg-[#0b0e14] border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-white text-xs focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] font-bold text-slate-400">h</span>
          </div>
        </div>

        <div className="bg-[#121722] border border-slate-700/80 rounded-lg p-2 flex items-center justify-between">
          <label className="text-[11px] font-semibold text-slate-300">Minutos:</label>
          <div className="flex items-center gap-1.5">
            <input
              id="input-screen-minutes"
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-14 bg-[#0b0e14] border border-slate-700 rounded px-2 py-1 text-center font-mono font-bold text-white text-xs focus:outline-none focus:border-cyan-500"
            />
            <span className="text-[10px] font-bold text-slate-400">min</span>
          </div>
        </div>
      </div>

      {/* Preset Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[10px] text-slate-400 font-semibold mr-1">Atalhos rápidos:</span>
        {presets.map((p) => {
          const isSelected = hours * 60 + minutes === p.mins;
          return (
            <button
              key={p.mins}
              type="button"
              onClick={() => setPreset(p.mins)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all ${
                isSelected
                  ? 'bg-cyan-500 text-black shadow-sm font-black'
                  : 'bg-[#141a26] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-600'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
