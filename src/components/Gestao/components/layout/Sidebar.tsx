import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Target,
  ShieldCheck,
  Calendar,
  BarChart3,
  ArrowLeftRight,
  Settings,
  Flame,
  Award,
  Zap,
  TrendingUp,
  Globe,
  X,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrency, formatPercent } from '../../utils/formatters';

export type NavTab =
  | 'dashboard'
  | 'management2x1'
  | 'management5x2'
  | 'managementMulti'
  | 'calendar'
  | 'transactions'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenNewOp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isMobileOpen,
  onCloseMobile,
  onOpenNewOp,
}) => {
  const { monthlyStats, monthConfig } = useTrading();

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'management2x1', label: 'Gestão 2x1', icon: Target },
    { id: 'management5x2', label: 'Gestão 5x2', icon: ShieldCheck },
    { id: 'managementMulti', label: 'Forex / B3 / Cripto', icon: Globe },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'transactions', label: 'Saques e Depósitos', icon: ArrowLeftRight },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        id="app-sidebar"
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-40 h-full lg:h-[calc(100vh-61px)] w-64 bg-[#0e131c] border-r border-slate-800/80 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Section */}
        <div className="p-4 space-y-4">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between lg:hidden pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <span className="font-extrabold text-sm text-white">TRADER ACADEMIC</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1" id="nav-menu-list">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-item-${item.id}`}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-orange-500/15 text-orange-400 border border-orange-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.id === 'calendar' && (
                    <span className="ml-auto text-[10px] font-mono font-bold text-emerald-400">
                      {monthlyStats.wins}W
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Quick Mini-Stats Card */}
        <div className="p-4 border-t border-slate-800/80 bg-[#090d14]/80">
          <div className="p-3 bg-[#121722] border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                Assertividade
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {monthlyStats.winRate}%
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(monthlyStats.winRate, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400 border-t border-slate-800/80">
              <span className="text-emerald-400 font-bold">{monthlyStats.wins} WINS</span>
              <span className="text-rose-400 font-bold">{monthlyStats.losses} LOSSES</span>
              <span className="text-amber-400 font-bold">{monthlyStats.empates} EMP</span>
            </div>
          </div>

          <div className="mt-3 text-center">
            <span className="text-[10px] text-slate-500 block">
              Trader Academic v2.6 • Pro
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
