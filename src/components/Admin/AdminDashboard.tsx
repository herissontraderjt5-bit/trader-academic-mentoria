import React from 'react';
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
  
  // Helper to calculate exact revenue per student based on custom unlocked modules or tier
  const getUserRevenue = (u: User): number => {
    // If student has custom allowed modules specified by admin
    if (u.customAllowedModuleIds && u.customAllowedModuleIds.length > 0) {
      const unlockedPaidModules = modules.filter(
        m => u.customAllowedModuleIds!.includes(m.id) && m.requiredTier !== 'Free'
      );
      if (unlockedPaidModules.length === 0) return 0;
      return unlockedPaidModules.reduce((sum, m) => sum + (m.price || 497), 0);
    }

    // Default by Tier
    switch (u.tier) {
      case 'VIP':
        return 499.90;
      case 'VIP Black':
        return 1997;
      case 'Vitalício':
        return 2997;
      case 'Pro':
        return 997;
      case 'Starter':
        return 497;
      case 'Free':
      default:
        return 0;
    }
  };

  const totalSimulatedRevenue = studentsOnly.reduce((acc, u) => acc + getUserRevenue(u), 0);

  // Calculate completed lessons across all students
  const totalCompletions = studentsOnly.reduce((acc, u) => acc + (u.progress?.completedLessonIds?.length || 0), 0);

  // Group by tier
  const tierCounts = {
    'Free': studentsOnly.filter(u => u.tier === 'Free').length,
    'Starter': studentsOnly.filter(u => u.tier === 'Starter').length,
    'Pro': studentsOnly.filter(u => u.tier === 'Pro').length,
    'VIP': studentsOnly.filter(u => u.tier === 'VIP' || u.tier === 'VIP Black').length,
    'Vitalício': studentsOnly.filter(u => u.tier === 'Vitalício').length,
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
