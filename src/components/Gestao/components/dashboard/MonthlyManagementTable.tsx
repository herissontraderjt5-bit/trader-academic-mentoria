import React, { useState } from 'react';
import {
  Table,
  Eye,
  Plus,
  Clock,
  Calendar,
  ChevronRight,
  Filter,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { DailySummary } from '../../types';
import { formatDateBR, formatSecondsToTime } from '../../utils/formatters';

interface MonthlyManagementTableProps {
  onSelectDay: (day: DailySummary) => void;
  onNewOpForDate: (date: string) => void;
}

export const MonthlyManagementTable: React.FC<MonthlyManagementTableProps> = ({
  onSelectDay,
  onNewOpForDate,
}) => {
  const { dailySummaries, monthConfig, formatCurrency, clearOperationalTime } = useTrading();
  const [onlyOperatedDays, setOnlyOperatedDays] = useState(false);

  const displayedDays = onlyOperatedDays
    ? dailySummaries.filter((d) => d.totalOperations > 0 || d.operationalTimeSeconds > 0)
    : dailySummaries;

  return (
    <div
      className="p-5 bg-[#121722] border border-slate-800 rounded-xl space-y-4"
      id="card-monthly-management-table"
    >
      {/* Header & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-wide">
              Tabela de Gestão Mensal
            </h3>
            <p className="text-[11px] text-slate-400">
              Acompanhamento detalhado do Dia 01 ao Dia 31 ({monthConfig.name})
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="btn-table-clear-time"
            type="button"
            onClick={() => {
              if (window.confirm('Deseja zerar todo o tempo operacional registrado?')) {
                clearOperationalTime();
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-950/30 hover:bg-cyan-900/50 border border-cyan-800/40 text-cyan-300 transition-colors flex items-center gap-1.5"
            title="Zerar todo o tempo de tela / operacional"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Zerar Tempo
          </button>

          <button
            onClick={() => setOnlyOperatedDays(!onlyOperatedDays)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              onlyOperatedDays
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                : 'bg-[#0b0e14] text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {onlyOperatedDays ? 'Mostrando Dias Operados' : 'Mostrar Todos (1 a 31)'}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0b0e14]">
        <table className="w-full text-left text-xs border-collapse">
          {/* Table Header (Orange/Dark Slate) */}
          <thead className="bg-[#182030] text-slate-300 uppercase tracking-wider font-bold border-b border-slate-800">
            <tr>
              <th className="px-3.5 py-3 text-center w-14">Dia</th>
              <th className="px-3.5 py-3">Data</th>
              <th className="px-3 py-3">Ativo 01</th>
              <th className="px-3 py-3">Ativo 02</th>
              <th className="px-3 py-3">Ativo 03</th>
              <th className="px-3 py-3 text-center">Payout</th>
              <th className="px-3.5 py-3 text-right">Resultado Financeiro</th>
              <th className="px-3 py-3 text-center text-emerald-400">WIN</th>
              <th className="px-3 py-3 text-center text-rose-400">LOSS</th>
              <th className="px-3 py-3 text-center text-amber-400">EMPATE</th>
              <th className="px-3.5 py-3 text-center">Tempo Operacional</th>
              <th className="px-3 py-3 text-center w-16">Ações</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60 font-mono">
            {displayedDays.map((d) => {
              const hasOps = d.totalOperations > 0;
              return (
                <tr
                  key={d.dayNumber}
                  onClick={() => onSelectDay(d)}
                  className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                    hasOps
                      ? d.status === 'POSITIVE'
                        ? 'bg-emerald-950/10'
                        : d.status === 'NEGATIVE'
                        ? 'bg-rose-950/10'
                        : 'bg-amber-950/10'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  {/* Dia */}
                  <td className="px-3.5 py-2.5 text-center font-bold">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                        d.status === 'POSITIVE'
                          ? 'bg-emerald-500/20 text-emerald-400 font-black'
                          : d.status === 'NEGATIVE'
                          ? 'bg-rose-500/20 text-rose-400 font-black'
                          : d.status === 'ZERO'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {String(d.dayNumber).padStart(2, '0')}
                    </span>
                  </td>

                  {/* Data */}
                  <td className="px-3.5 py-2.5 text-slate-300 font-sans text-[11px] whitespace-nowrap">
                    {formatDateBR(d.date)}
                  </td>

                  {/* Ativo 01 */}
                  <td className="px-3 py-2.5 font-bold text-white text-[11px]">
                    {d.assets[0] ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/90 text-cyan-300">
                        {d.assets[0]}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Ativo 02 */}
                  <td className="px-3 py-2.5 font-bold text-white text-[11px]">
                    {d.assets[1] ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/90 text-cyan-300">
                        {d.assets[1]}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Ativo 03 */}
                  <td className="px-3 py-2.5 font-bold text-white text-[11px]">
                    {d.assets[2] ? (
                      <span className="px-1.5 py-0.5 rounded bg-slate-800/90 text-cyan-300">
                        {d.assets[2]}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Payout */}
                  <td className="px-3 py-2.5 text-center text-slate-400 text-[11px]">
                    {d.averagePayout ? `${d.averagePayout}%` : '-'}
                  </td>

                  {/* Resultado Financeiro */}
                  <td className="px-3.5 py-2.5 text-right font-extrabold text-xs">
                    {hasOps ? (
                      <span
                        className={
                          d.financialResult > 0
                            ? 'text-emerald-400'
                            : d.financialResult < 0
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }
                      >
                        {formatCurrency(d.financialResult, true)}
                      </span>
                    ) : (
                      <span className="text-slate-600">{formatCurrency(0)}</span>
                    )}
                  </td>

                  {/* WIN */}
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`font-bold text-xs ${
                        d.wins > 0 ? 'text-emerald-400 font-black' : 'text-slate-600'
                      }`}
                    >
                      {d.wins}
                    </span>
                  </td>

                  {/* LOSS */}
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`font-bold text-xs ${
                        d.losses > 0 ? 'text-rose-400 font-black' : 'text-slate-600'
                      }`}
                    >
                      {d.losses}
                    </span>
                  </td>

                  {/* EMPATE */}
                  <td className="px-3 py-2.5 text-center">
                    <span
                      className={`font-bold text-xs ${
                        d.empates > 0 ? 'text-amber-400 font-black' : 'text-slate-600'
                      }`}
                    >
                      {d.empates}
                    </span>
                  </td>

                  {/* Tempo Operacional */}
                  <td className="px-3.5 py-2.5 text-center text-slate-300 text-[11px]">
                    {d.operationalTimeSeconds > 0 ? (
                      <span className="inline-flex items-center gap-1 text-cyan-300">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        {formatSecondsToTime(d.operationalTimeSeconds)}
                      </span>
                    ) : (
                      <span className="text-slate-600">00:00:00</span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDay(d);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-orange-400 hover:bg-slate-800 transition-colors"
                      title="Ver Detalhes do Dia"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
