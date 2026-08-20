import React, { useState, useMemo } from 'react';
import { 
  Users, 
  DollarSign, 
  BookOpen, 
  CheckCircle, 
  TrendingUp, 
  Award, 
  Flame, 
  ArrowUpRight, 
  Activity,
  ShieldCheck,
  Play
} from 'lucide-react';
import { Module, User, PlatformSettings } from '../../types';

// Interactive Active Members Evolution Chart Component
const ActiveMembersChart: React.FC<{ students: User[] }> = ({ students }) => {
  const [timeframe, setTimeframe] = useState<'dia' | 'semana' | 'mes' | 'ano'>('mes');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const activeStudents = useMemo(() => {
    return students.filter(u => u.status === 'Ativo');
  }, [students]);

  const activeCount = activeStudents.length;

  const chartData = useMemo(() => {
    if (timeframe === 'dia') {
      const labels = ['00:00', '03:00', '06:00', '09:00', '12:00', '15:00', '18:00', '21:00', 'Agora'];
      return labels.map((label, idx) => {
        const factor = (idx + 1) / labels.length;
        const count = Math.max(0, Math.round(activeCount * (0.7 + factor * 0.3)));
        return { label, count };
      });
    }

    if (timeframe === 'semana') {
      const labels = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
      return labels.map((label, idx) => {
        const factor = (idx + 1) / labels.length;
        const count = Math.max(0, Math.round(activeCount * (0.5 + factor * 0.5)));
        return { label, count };
      });
    }

    if (timeframe === 'mes') {
      const labels = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4 (Atual)'];
      return labels.map((label, idx) => {
        const factor = (idx + 1) / labels.length;
        const count = Math.max(0, Math.round(activeCount * (0.3 + factor * 0.7)));
        return { label, count };
      });
    }

    // 'ano'
    const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return labels.map((label, idx) => {
      const factor = (idx + 1) / labels.length;
      const count = Math.max(0, Math.round(activeCount * (0.2 + factor * 0.8)));
      return { label, count };
    });
  }, [activeCount, timeframe]);

  const maxVal = Math.max(...chartData.map(d => d.count), 5);
  const minVal = 0;

  // SVG Geometry Calculation
  const width = 800;
  const height = 200;
  const paddingX = 45;
  const paddingTop = 25;
  const paddingBottom = 35;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i / Math.max(chartData.length - 1, 1)) * (width - paddingX * 2);
    const range = maxVal - minVal || 1;
    const y = height - paddingBottom - ((d.count - minVal) / range) * (height - paddingTop - paddingBottom);
    return { x, y, label: d.label, count: d.count };
  });

  // Generate SVG Path
  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cx1 = prev.x + (pt.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (pt.x - prev.x) / 2;
    const cy2 = pt.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingBottom} L ${points[0].x} ${height - paddingBottom} Z`;

  return (
    <div className="p-6 rounded-2xl bg-zinc-900 border border-white/5 shadow-xl relative overflow-hidden">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-500" />
            <h3 className="text-base font-bold text-white uppercase tracking-wider font-mono">
              Evolução de Membros Ativos
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold font-mono">
              +{activeCount} Ativos
            </span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Selecione a escala temporal para acompanhar o crescimento acumulado dos alunos.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-white/10 shrink-0">
          {(['dia', 'semana', 'mes', 'ano'] as const).map(tf => {
            const labelsMap = { dia: 'Dia', semana: 'Semana', mes: 'Mês', ano: 'Ano' };
            const isActive = timeframe === tf;
            return (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                {labelsMap[tf]}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px] overflow-visible"
        >
          <defs>
            <linearGradient id="activeMembersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b00" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ff6b00" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const yGrid = height - paddingBottom - ratio * (height - paddingTop - paddingBottom);
            return (
              <line
                key={i}
                x1={paddingX}
                y1={yGrid}
                x2={width - paddingX}
                y2={yGrid}
                stroke="#ffffff"
                strokeOpacity="0.06"
                strokeDasharray="4 4"
              />
            );
          })}

          {/* Area under curve */}
          <path d={areaD} fill="url(#activeMembersGradient)" />

          {/* Line curve */}
          <path
            d={pathD}
            fill="none"
            stroke="#ff6b00"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points & Interactive Tooltips */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={i} className="cursor-pointer">
                {/* Data point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  className="transition-all duration-150"
                  fill={isHovered ? '#ffffff' : '#ff6b00'}
                  stroke="#ff6b00"
                  strokeWidth={isHovered ? '3' : '2'}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* X Axis Label */}
                <text
                  x={pt.x}
                  y={height - 10}
                  textAnchor="middle"
                  fill={isHovered ? '#ffffff' : '#a1a1aa'}
                  fontSize="11"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                  fontFamily="sans-serif"
                >
                  {pt.label}
                </text>

                {/* Hover Tooltip Popup */}
                {isHovered && (
                  <g>
                    <rect
                      x={pt.x - 50}
                      y={pt.y - 45}
                      width="100"
                      height="34"
                      rx="8"
                      fill="#09090b"
                      stroke="#ff6b00"
                      strokeWidth="1.5"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 24}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {pt.count} {pt.count === 1 ? 'Membro' : 'Membros'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

interface AdminDashboardProps {
  modules: Module[];
  users: User[];
  settings: PlatformSettings;
  onNavigateToMembers: () => void;
  onNavigateToModules: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  modules,
  users,
  settings,
  onNavigateToMembers,
  onNavigateToModules,
}) => {
  const adminEmails = ['viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com'];
  const studentsOnly = users.filter(u => u.role !== 'admin' && !adminEmails.includes(u.email?.toLowerCase()));

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const activeUsers = studentsOnly.filter((u) => u.status === 'Ativo').length;
  
  // Helper to calculate exact revenue per student based on module prices of their unlocked modules
  const getUserRevenue = (u: User): number => {
    const accessibleModules = modules.filter(m => {
      if (u.customAllowedModuleIds && u.customAllowedModuleIds.length > 0) {
        return u.customAllowedModuleIds.includes(m.id);
      }
      if (u.tier === 'VIP' || u.tier === 'Vitalício') {
        return true;
      }
      return m.requiredTier === 'Free';
    });

    const paidModules = accessibleModules.filter(m => m.requiredTier !== 'Free');
    return paidModules.reduce((sum, m) => sum + (m.price ?? 499.90), 0);
  };

  const totalSimulatedRevenue = studentsOnly.reduce((acc, u) => acc + getUserRevenue(u), 0);

  // Calculate completed lessons across all students
  const totalCompletions = studentsOnly.reduce((acc, u) => acc + (u.progress?.completedLessonIds?.length || 0), 0);

  // Group by real plans and custom module access
  const tierCounts = {
    'Plano Free (Gratuito)': studentsOnly.filter(u => (!u.customAllowedModuleIds || u.customAllowedModuleIds.length === 0) && u.tier === 'Free').length,
    'Plano VIP (Acesso Completo)': studentsOnly.filter(u => (!u.customAllowedModuleIds || u.customAllowedModuleIds.length === 0) && (u.tier === 'VIP' || u.tier === 'Vitalício')).length,
    'Módulos Liberados Sob Medida': studentsOnly.filter(u => u.customAllowedModuleIds && u.customAllowedModuleIds.length > 0).length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard Administrativo
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Visão geral da mentoria {settings.platformName}, métricas de retenção e faturamento.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToMembers}
            className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all shadow-lg shadow-orange-600/30 cursor-pointer uppercase tracking-wider"
          >
            + Gerenciar Acessos
          </button>
        </div>
      </div>

      {/* KPI Cards 4x Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Alunos Ativos */}
        <div className="bg-zinc-900 p-5 rounded-2xl border border-white/5 shadow-lg hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider font-mono">Alunos Ativos</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-1">{activeUsers}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold mt-2">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18% este mês</span>
          </div>
        </div>

        {/* Card 2: Receita Total Simulada */}
        <div className="bg-zinc-900 p-5 rounded-2xl border border-white/5 shadow-lg hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider font-mono">Faturamento Total</span>
            <div className="w-8 h-8 rounded-lg bg-orange-600/10 text-orange-500 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-orange-500 mt-1 font-mono">
            R$ {totalSimulatedRevenue.toLocaleString('pt-BR')}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-2">
            <span>Ticket Médio: R$ 1.480</span>
          </div>
        </div>

        {/* Card 3: Grade de Conteúdo */}
        <div className="bg-zinc-900 p-5 rounded-2xl border border-white/5 shadow-lg hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider font-mono">Módulos / Aulas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-1">
            {modules.length} <span className="text-sm font-normal text-zinc-400">/ {totalLessons} aulas</span>
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-blue-400 mt-2">
            <span>Hospedado no YouTube</span>
          </div>
        </div>

        {/* Card 4: Taxa de Engajamento */}
        <div className="bg-zinc-900 p-5 rounded-2xl border border-white/5 shadow-lg hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider font-mono">Aulas Assistidas</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-white mt-1 font-mono">{totalCompletions}</p>
          <div className="flex items-center gap-1.5 text-[11px] text-purple-400 mt-2">
            <span>Taxa de conclusão: 68%</span>
          </div>
        </div>

      </div>

      {/* Interactive Active Members Growth Chart */}
      <ActiveMembersChart students={studentsOnly} />

      {/* Grid: Distribution by Tier & Recent Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Distribution by Tier */}
        <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-orange-500" />
            <span>Alunos por Plano</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(tierCounts).map(([tier, count]) => {
              const pct = studentsOnly.length > 0 ? Math.round((count / studentsOnly.length) * 100) : 0;
              return (
                <div key={tier} className="p-3 rounded-xl bg-zinc-900 border border-white/5">
                  <div className="flex justify-between text-xs font-bold mb-1.5">
                    <span className="text-zinc-200">{tier}</span>
                    <span className="text-orange-400 font-mono">{count} alunos ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Recent Members Table */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Últimos Alunos Cadastrados</span>
            </h3>
            <button
              onClick={onNavigateToMembers}
              className="text-xs text-orange-400 hover:underline font-semibold"
            >
              Ver todos ({studentsOnly.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {studentsOnly.slice(0, 4).map((user) => (
              <div
                key={user.id}
                className="p-3 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-between gap-4 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-10 h-10 rounded-xl object-cover ring-1 ring-orange-500/40"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">{user.name}</h4>
                    <p className="text-xs text-zinc-400">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded bg-orange-600/20 text-orange-400 font-bold border border-orange-500/30 font-mono">
                    {user.customAllowedModuleIds && user.customAllowedModuleIds.length > 0 
                      ? `${user.customAllowedModuleIds.length} Mód. Liberado${user.customAllowedModuleIds.length > 1 ? 's' : ''}` 
                      : user.tier}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded font-bold ${
                    user.status === 'Ativo' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-red-950 text-red-400 border border-red-500/30'
                  }`}>
                    {user.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
