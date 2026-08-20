import React, { useState } from 'react';
import { 
  BarChart3, 
  Layers, 
  Users, 
  Bell, 
  CreditCard, 
  Settings, 
  ArrowLeft, 
  Flame, 
  Radio, 
  ShieldCheck,
  Menu,
  X,
  HelpCircle,
  LogOut
} from 'lucide-react';
import { Module, User, Announcement, PlatformSettings, LiveSession, WithdrawalRequest } from '../../types';
import { AdminDashboard } from './AdminDashboard';
import { AdminModules } from './AdminModules';
import { AdminMembers } from './AdminMembers';
import { AdminAnnouncements } from './AdminAnnouncements';
import { AdminSimulator } from './AdminSimulator';
import { AdminSettings } from './AdminSettings';
import { AdminWithdrawals } from './AdminWithdrawals';
import { BrandLogo } from '../BrandLogo';

interface AdminLayoutProps {
  currentUser: User;
  allUsers: User[];
  modules: Module[];
  announcements: Announcement[];
  liveSessions: LiveSession[];
  settings: PlatformSettings;
  withdrawalRequests: WithdrawalRequest[];
  onUpdateModules: (modules: Module[]) => void;
  onUpdateUsers: (users: User[]) => void;
  onUpdateAnnouncements: (ann: Announcement[]) => void;
  onUpdateLiveSessions: (sessions: LiveSession[]) => void;
  onUpdateSettings: (settings: PlatformSettings) => void;
  onUpdateWithdrawalRequestStatus: (reqId: string, status: 'Pendente' | 'Realizado' | 'Cancelado') => Promise<void>;
  onBackToStudentView: () => void;
  onLogout?: () => void;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentUser,
  allUsers,
  modules,
  announcements,
  liveSessions,
  settings,
  withdrawalRequests,
  onUpdateModules,
  onUpdateUsers,
  onUpdateAnnouncements,
  onUpdateLiveSessions,
  onUpdateSettings,
  onUpdateWithdrawalRequestStatus,
  onBackToStudentView,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'modules' | 'members' | 'announcements' | 'simulator' | 'settings' | 'withdrawals'>('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard & Métricas', icon: BarChart3 },
    { id: 'modules', label: 'Módulos & Aulas (YouTube)', icon: Layers },
    { id: 'members', label: 'Gestão de Alunos & Acessos', icon: Users, badge: allUsers.length },
    { id: 'announcements', label: 'Avisos & Salas Ao Vivo', icon: Radio, badge: liveSessions.length },
    { id: 'withdrawals', label: 'Solicitações de Saque', icon: CreditCard, badge: withdrawalRequests.filter(w => w.status === 'Pendente').length },
    { id: 'settings', label: 'Configurações da Plataforma', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row font-sans">
      
      {/* Mobile Topbar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-[#0a0a0a] border-b border-orange-900/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center text-white">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <span className="font-black text-sm tracking-tight text-white uppercase">PAINEL ADM</span>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-xl bg-zinc-900 text-zinc-300"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Admin Sidebar */}
      <aside className={`w-full md:w-64 bg-[#0a0a0a] border-r border-orange-900/30 flex flex-col justify-between shrink-0 ${
        isMobileSidebarOpen ? 'block' : 'hidden md:flex'
      }`}>
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-orange-900/20">
            <BrandLogo className="h-10 w-auto" showText={true} subtext="Painel ADM" />
          </div>

          {/* Navigation Links */}
          <div className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-orange-600/10 text-orange-500 border border-orange-600/20'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                        isActive ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Support Box & Back Button */}
        <div className="p-4 border-t border-orange-900/20 space-y-3">

          <button
            onClick={onBackToStudentView}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-orange-400 text-xs font-bold transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar à Área do Aluno</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair da Conta (Logout)</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 p-4 sm:p-8 lg:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            modules={modules}
            users={allUsers}
            settings={settings}
            onNavigateToMembers={() => setActiveTab('members')}
            onNavigateToModules={() => setActiveTab('modules')}
          />
        )}

        {activeTab === 'modules' && (
          <AdminModules
            modules={modules}
            onUpdateModules={onUpdateModules}
          />
        )}

        {activeTab === 'members' && (
          <AdminMembers
            users={allUsers}
            modules={modules}
            onUpdateUsers={onUpdateUsers}
          />
        )}

        {activeTab === 'announcements' && (
          <AdminAnnouncements
            announcements={announcements}
            liveSessions={liveSessions}
            onUpdateAnnouncements={onUpdateAnnouncements}
            onUpdateLiveSessions={onUpdateLiveSessions}
          />
        )}

        {activeTab === 'settings' && (
          <AdminSettings
            settings={settings}
            onUpdateSettings={onUpdateSettings}
          />
        )}

        {activeTab === 'withdrawals' && (
          <AdminWithdrawals
            requests={withdrawalRequests}
            users={allUsers}
            onUpdateStatus={onUpdateWithdrawalRequestStatus}
          />
        )}
      </main>

    </div>
  );
};
