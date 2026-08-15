import React, { useState } from 'react';
import { 
  Play, 
  Search, 
  Bell, 
  ShieldCheck, 
  Flame, 
  User as UserIcon, 
  Radio, 
  Calculator, 
  Award, 
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  Edit3
} from 'lucide-react';
import { User, Module, Announcement, PlatformSettings } from '../types';
import { BrandLogo } from './BrandLogo';

interface NavbarProps {
  currentUser: User;
  onSwitchUser: (userId: string) => void;
  allUsers: User[];
  onToggleRole: () => void;
  activeView: 'home' | 'player' | 'admin';
  setActiveView: (view: 'home' | 'player' | 'admin') => void;
  modules: Module[];
  onSelectLesson: (moduleId: string, lessonId: string) => void;
  announcements: Announcement[];
  settings: PlatformSettings;
  overallProgress: { completed: number; total: number; percentage: number };
  onOpenRiskCalc: () => void;
  onOpenCertificate: () => void;
  onOpenLive: () => void;
  onOpenEditProfile: () => void;
  onOpenUpgrade?: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  allUsers,
  onToggleRole,
  activeView,
  setActiveView,
  modules,
  onSelectLesson,
  announcements,
  settings,
  overallProgress,
  onOpenRiskCalc,
  onOpenCertificate,
  onOpenLive,
  onOpenEditProfile,
  onOpenUpgrade,
  onLogout,
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter lessons and modules by search query
  const searchResults = searchQuery.trim() === '' ? [] : modules.flatMap(mod => 
    mod.lessons
      .filter(les => 
        les.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        les.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map(les => ({
        lesson: les,
        module: mod
      }))
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-black/85 backdrop-blur-md border-b border-orange-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand Logo */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveView('home')}
              className="flex items-center gap-3 text-left group transition-transform focus:outline-none cursor-pointer"
            >
              <BrandLogo className="h-10 w-auto" showText={true} subtext="Área de Membros VIP" />
            </button>

            {/* Desktop Navigation Badges */}
            <div className="hidden lg:flex items-center gap-2 ml-6">
              <button
                onClick={onOpenLive}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-900/40 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                <span>Sala Ao Vivo</span>
              </button>

              <button
                onClick={onOpenRiskCalc}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-900/80 border border-white/5 text-zinc-300 text-xs font-medium hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5 text-orange-500" />
                <span>Calculadora de Lote</span>
              </button>
            </div>
          </div>

          {/* Right: Search, Actions, Notifications & Profile */}
          <div className="flex items-center gap-3">
            
            {/* Search Pill Input (Desktop) */}
            <div className="relative hidden md:block">
              <div className="flex items-center bg-zinc-900/60 hover:bg-zinc-900 border border-white/5 focus-within:border-orange-500/50 rounded-full px-3.5 py-1.5 transition-all w-52 lg:w-64">
                <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Pesquisar aulas ou temas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchOpen(true)}
                  className="bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none w-full"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-zinc-400 hover:text-white ml-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {isSearchOpen && searchQuery.trim() !== '' && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#0a0a0a] border border-orange-900/30 rounded-2xl shadow-2xl p-3 z-50 max-h-96 overflow-y-auto"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-white/5 text-xs text-zinc-400 px-1 font-mono">
                    <span>{searchResults.length} Resultados encontrados</span>
                    <button 
                      onClick={() => setIsSearchOpen(false)}
                      className="text-zinc-400 hover:text-white"
                    >
                      Fechar
                    </button>
                  </div>

                  {searchResults.length === 0 ? (
                    <p className="text-center py-6 text-xs text-zinc-500">
                      Nenhuma aula encontrada para "{searchQuery}"
                    </p>
                  ) : (
                    <div className="space-y-1.5 mt-2">
                      {searchResults.map(({ lesson, module }) => (
                        <button
                          key={lesson.id}
                          onClick={() => {
                            onSelectLesson(module.id, lesson.id);
                            setIsSearchOpen(false);
                            setSearchQuery('');
                          }}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-zinc-900/80 transition-all flex items-start gap-2.5 group cursor-pointer border border-transparent hover:border-orange-500/20"
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-600/10 text-orange-500 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-orange-600 group-hover:text-white transition-all">
                            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white group-hover:text-orange-400 truncate">
                              {lesson.title}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate">
                              {module.title} • {lesson.durationMinutes} min
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 text-zinc-300 hover:text-white transition-all relative cursor-pointer"
                title="Avisos e Notificações"
              >
                <Bell className="w-4 h-4" />
                {announcements.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                )}
                {announcements.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-orange-500"></span>
                )}
              </button>

              {/* Notification Popover */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-[#0a0a0a] border border-orange-900/30 rounded-2xl shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <h4 className="font-bold text-xs text-white uppercase tracking-wider font-mono">
                      Mural de Avisos ({announcements.length})
                    </h4>
                    <button 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3 mt-3 max-h-72 overflow-y-auto">
                    {announcements.map(ann => (
                      <div key={ann.id} className="p-3 rounded-xl bg-zinc-900/70 border border-white/5">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            ann.priority === 'alta' 
                              ? 'bg-red-950 text-red-400 border border-red-500/30' 
                              : 'bg-orange-950 text-orange-400 border border-orange-500/30'
                          }`}>
                            {ann.priority}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono">{ann.createdAt}</span>
                        </div>
                        <h5 className="text-xs font-bold text-white mb-1">{ann.title}</h5>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* VIP Upgrade Pill for Free Members */}
            {currentUser.tier === 'Free' && onOpenUpgrade && (
              <button
                onClick={onOpenUpgrade}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-600/30 transition-all hover:scale-105 cursor-pointer animate-pulse"
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Virar VIP • R$ 499,90</span>
                <span className="sm:hidden">VIP</span>
              </button>
            )}

            {/* Painel ADM / Aluno Switcher Button */}
            <button
              onClick={() => {
                if (activeView === 'admin') {
                  setActiveView('home');
                } else {
                  if (currentUser.role !== 'admin') {
                    onToggleRole();
                  }
                  setActiveView('admin');
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md hover:scale-105 ${
                activeView === 'admin'
                  ? 'bg-orange-600 text-white shadow-orange-600/30 border border-orange-400'
                  : 'bg-zinc-900/90 text-orange-400 border border-orange-500/40 hover:bg-orange-600 hover:text-white'
              }`}
              title="Acessar o Painel de Administração"
            >
              <ShieldCheck className="w-4 h-4 text-orange-400 group-hover:text-white" />
              <span className="hidden sm:inline">
                {activeView === 'admin' ? 'Ver como Aluno' : 'Painel ADM'}
              </span>
              <span className="sm:hidden">ADM</span>
            </button>

            {/* User Profile / Simulator Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-full bg-zinc-900/60 hover:bg-zinc-800 border border-white/5 text-white transition-all cursor-pointer"
              >
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-orange-500/40"
                />
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold leading-none">{currentUser.name.split(' ')[0]}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-600/20 text-orange-400 font-mono font-bold">
                      {currentUser.tier}
                    </span>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />
              </button>

              {/* User Switcher Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0a0a0a] border border-orange-900/30 rounded-2xl shadow-2xl p-4 z-50">
                  <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-11 h-11 rounded-xl object-cover ring-2 ring-orange-500"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-white truncate">{currentUser.name}</h4>
                      <p className="text-[10px] text-zinc-400 truncate">{currentUser.email}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-orange-600/20 text-orange-400 font-bold uppercase">
                          {currentUser.tier}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-bold">
                          {currentUser.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress inside User Menu */}
                  <div className="py-3 border-b border-white/5">
                    <div className="flex justify-between text-[11px] text-zinc-400 mb-1 font-mono">
                      <span>Progresso Geral</span>
                      <span className="text-orange-400 font-bold">{overallProgress.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full transition-all"
                        style={{ width: `${overallProgress.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Quick Action Links */}
                  <div className="py-2 space-y-1">
                    {currentUser.tier === 'Free' && onOpenUpgrade && (
                      <button
                        onClick={() => {
                          onOpenUpgrade();
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2 rounded-xl text-xs bg-gradient-to-r from-orange-600/30 to-amber-600/30 text-orange-300 hover:text-white hover:from-orange-600 hover:to-amber-500 border border-orange-500/40 transition-all text-left cursor-pointer font-extrabold shadow-md mb-1"
                      >
                        <div className="flex items-center gap-2">
                          <Flame className="w-4 h-4 text-orange-400 fill-current" />
                          <span>Fazer Upgrade VIP (R$ 499,90)</span>
                        </div>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        onOpenEditProfile();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-orange-400 hover:text-orange-300 hover:bg-orange-950/30 border border-orange-500/20 hover:border-orange-500/40 transition-all text-left cursor-pointer font-bold"
                    >
                      <div className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4 text-orange-400" />
                        <span>Editar Perfil (Foto, Dados & Senha)</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onOpenCertificate();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-orange-500" />
                        <span>Certificado de Conclusão</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        if (activeView !== 'admin') {
                          if (currentUser.role !== 'admin') onToggleRole();
                          setActiveView('admin');
                        } else {
                          setActiveView('home');
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs bg-zinc-900 hover:bg-orange-600 hover:text-white text-orange-400 border border-orange-500/30 transition-all text-left cursor-pointer font-bold mb-1"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-orange-400" />
                        <span>{activeView === 'admin' ? 'Ver como Aluno' : 'Painel de Administração (ADM)'}</span>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        onToggleRole();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-zinc-400" />
                        <span>Alternar Cargo: {currentUser.role === 'admin' ? 'Aluno' : 'Admin'}</span>
                      </div>
                    </button>
                  </div>

                  {/* Logout Button */}
                  <div className="pt-3 mt-2 border-t border-white/5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 border border-transparent hover:border-red-500/30 transition-all cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta (Logout)</span>
                    </button>
                  </div>

                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-zinc-900/60 text-zinc-300 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>

        {/* Mobile Dropdown Menu Bar */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-[#0a0a0a] border-b border-orange-900/30 p-4 space-y-3">
            {/* Mobile Search */}
            <div className="flex items-center bg-zinc-900 border border-white/5 rounded-full px-3 py-2">
              <Search className="w-4 h-4 text-zinc-400 mr-2" />
              <input
                type="text"
                placeholder="Pesquisar aulas ou temas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => {
                  onOpenLive();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-400 text-xs font-bold"
              >
                <Radio className="w-4 h-4" />
                <span>Ao Vivo</span>
              </button>

              <button
                onClick={() => {
                  onOpenRiskCalc();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-zinc-900 border border-white/5 text-zinc-300 text-xs font-bold"
              >
                <Calculator className="w-4 h-4 text-orange-500" />
                <span>Calc. Lote</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (activeView !== 'admin') {
                  if (currentUser.role !== 'admin') onToggleRole();
                  setActiveView('admin');
                } else {
                  setActiveView('home');
                }
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-orange-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-600/30"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{activeView === 'admin' ? 'Ver como Aluno' : 'Painel de Administração (ADM)'}</span>
            </button>

            <button
              onClick={() => {
                onOpenEditProfile();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-white/10 text-zinc-300 text-xs font-bold"
            >
              <Edit3 className="w-4 h-4 text-orange-400" />
              <span>Editar Meu Perfil (Foto & Dados)</span>
            </button>
          </div>
        )}

      </header>
    </>
  );
};
