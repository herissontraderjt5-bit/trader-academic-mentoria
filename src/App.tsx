import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ModuleGrid } from './components/ModuleGrid';
import { ModuleDetailModal } from './components/ModuleDetailModal';
import { VideoPlayerView } from './components/VideoPlayerView';
import { AdminLayout } from './components/Admin/AdminLayout';
import { RiskCalculatorModal } from './components/Tools/RiskCalculatorModal';
import { CertificateModal } from './components/Tools/CertificateModal';
import { EconomicCalendarModal } from './components/Tools/EconomicCalendarModal';
import { UpgradeModal } from './components/Tools/UpgradeModal';
import { AuthScreen } from './components/Auth/AuthScreen';
import { EditProfileModal } from './components/Profile/EditProfileModal';
import { ReferralModal } from './components/Tools/ReferralModal';

import { Module, User, Lesson, Announcement, LiveSession, PlatformSettings, Role, Tier, StudentStatus, WithdrawalRequest } from './types';
import { storageService } from './services/storage';
import { supabase } from './lib/supabase';
import { supabaseService } from './services/supabaseService';

import { 
  Flame, 
  Radio, 
  Calculator, 
  ShieldCheck,
  Send,
  Lock,
  MessageCircle,
  Phone,
  Compass,
  Sparkles,
  Calendar
} from 'lucide-react';

const AnnouncementBanner: React.FC<{ announcements: Announcement[] }> = ({ announcements }) => {
  if (!announcements || announcements.length === 0) return null;
  const latest = announcements[0];
  return (
    <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-950/60 via-zinc-900 to-black border border-orange-500/30 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase font-mono shrink-0">
          AVISO VIP
        </span>
        <div>
          <h4 className="text-xs font-bold text-white">{latest.title}</h4>
          <p className="text-[11px] text-zinc-400 line-clamp-1">{latest.content}</p>
        </div>
      </div>
      <span className="text-[10px] text-zinc-500 font-mono shrink-0">{latest.date}</span>
    </div>
  );
};

export default function App() {
  // Main Data States
  const [modules, setModules] = useState<Module[]>(() => storageService.getModules());
  const [users, setUsers] = useState<User[]>(() => storageService.getStudents());
  const [currentUserId, setCurrentUserId] = useState<string>(() => storageService.getCurrentUserId());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => storageService.isAuthenticated());
  const [announcements, setAnnouncements] = useState<Announcement[]>(() => storageService.getAnnouncements());
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>(() => storageService.getLiveSessions());
  const [settings, setSettings] = useState<PlatformSettings>(() => storageService.getSettings());

  // View States
  const [activeView, setActiveView] = useState<'home' | 'player' | 'admin'>('home');
  const [selectedModuleForModal, setSelectedModuleForModal] = useState<Module | null>(null);
  
  // Video Player States
  const [activePlayingModule, setActivePlayingModule] = useState<Module | null>(null);
  const [activePlayingLesson, setActivePlayingLesson] = useState<Lesson | null>(null);

  // Tools Modal States
  const [isRiskCalcOpen, setIsRiskCalcOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [upgradeTargetModule, setUpgradeTargetModule] = useState<Module | null>(null);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  const handleOpenUpgrade = (mod?: Module | null) => {
    setUpgradeTargetModule(mod || null);
    setIsUpgradeModalOpen(true);
  };

  const handleCreateWithdrawalRequest = async (amount: number, pixKeyType: string, pixKey: string, fullName: string, cpf: string): Promise<boolean> => {
    if (!currentUserId) return false;
    const result = await storageService.createWithdrawalRequest(currentUserId, amount, pixKeyType, pixKey, fullName, cpf);
    if (result) {
      setWithdrawalRequests(prev => [result, ...prev]);
      const updatedStudents = storageService.getStudents();
      setUsers(updatedStudents);
      return true;
    }
    return false;
  };

  const handleUpdateWithdrawalRequestStatus = async (reqId: string, status: 'Pendente' | 'Realizado' | 'Cancelado') => {
    await storageService.updateWithdrawalRequestStatus(reqId, status);
    const updatedReqs = storageService.getWithdrawalRequests();
    setWithdrawalRequests(updatedReqs);
    const updatedStudents = storageService.getStudents();
    setUsers(updatedStudents);
  };

  // Current User Object
  const currentUser = useMemo(() => {
    let found = users.find(u => u.id === currentUserId || u.email?.toLowerCase() === currentUserId?.toLowerCase());
    
    if (found) {
      const emailLower = found.email?.toLowerCase() || '';
      const isAdminEmail = ['viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com'].includes(emailLower);
      if (isAdminEmail || found.role === 'admin') {
        return {
          ...found,
          role: 'admin' as Role,
          tier: 'VIP' as Tier,
          status: 'Ativo' as StudentStatus,
        };
      }
      return {
        ...found,
        role: 'student' as Role,
      };
    }

    return {
      id: currentUserId || 'usr-guest',
      name: 'Aluno',
      email: currentUserId?.includes('@') ? currentUserId : '',
      avatar: '',
      role: 'student',
      tier: 'Free',
      status: 'Ativo',
      joinedAt: new Date().toISOString().split('T')[0],
      progress: { completedLessonIds: [] },
      notes: {},
    } as User;
  }, [users, currentUserId]);

  // Sync with Supabase on mount and listen to Auth state changes (including Google OAuth redirect)
  React.useEffect(() => {
    // Capture referral code if present in the URL
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      localStorage.setItem('trader_academic_referred_by', ref);
      // Clean up URL query parameters for clean look
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    }

    // 1. Initial data sync
    storageService.syncWithSupabase().then(synced => {
      let latestUsers = users;
      if (synced) {
        if (synced.modules) setModules(synced.modules);
        if (synced.users) {
          setUsers(synced.users);
          latestUsers = synced.users;
        }
        if (synced.announcements) setAnnouncements(synced.announcements);
        if (synced.liveSessions) setLiveSessions(synced.liveSessions);
        if (synced.settings) setSettings(synced.settings);
        if (synced.withdrawals) setWithdrawalRequests(synced.withdrawals);
      }

      const isAdminBypass = localStorage.getItem('trader_academic_admin_session') === 'true';
      if (isAdminBypass) {
        const adminUser = latestUsers.find(u => ['viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com'].includes(u.email.toLowerCase()));
        if (adminUser) {
          setCurrentUserId(adminUser.id);
          setIsAuthenticated(true);
        }
      }
    });

    const localWithdrawals = storageService.getWithdrawalRequests();
    setWithdrawalRequests(localWithdrawals);

    // 2. Real Supabase Auth listener (Google OAuth & Email session detection)
    if (supabase) {
      const handleUserSession = async (sessionUser: any) => {
        if (!sessionUser) return;
        const emailLower = sessionUser.email?.toLowerCase() || '';
        const isAdminEmail = ['viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com'].includes(emailLower);
        
        let profile = await supabaseService.getProfileById(sessionUser.id);
        if (!profile) {
          const referredBy = localStorage.getItem('trader_academic_referred_by') || undefined;
          const newProfile: User = {
            id: sessionUser.id,
            name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Aluno',
            email: sessionUser.email || '',
            avatar: sessionUser.user_metadata?.avatar_url || '',
            role: isAdminEmail ? 'admin' : 'student',
            tier: isAdminEmail ? 'VIP' : 'Free',
            status: 'Ativo',
            referredById: referredBy,
            referralBalance: 0,
            totalEarned: 0,
            joinedAt: new Date().toISOString().split('T')[0],
            progress: { completedLessonIds: [] },
            notes: {},
          };
          await supabaseService.upsertProfile(newProfile);
          profile = newProfile;
        } else if (isAdminEmail && profile.role !== 'admin') {
          profile.role = 'admin';
          profile.tier = 'VIP';
          await supabaseService.upsertProfile(profile);
        } else if (!isAdminEmail && profile.role === 'admin') {
          profile.role = 'student';
          await supabaseService.upsertProfile(profile);
        }
        if (profile.status === 'Bloqueado' || profile.status === 'Expirado') {
          await supabase.auth.signOut();
          storageService.setAuthenticated(false);
          setIsAuthenticated(false);
          alert('Sua conta foi bloqueada pelo administrador. Entre em contato com o suporte.');
          return;
        }
        setCurrentUserId(profile.id);
        setIsAuthenticated(true);
        localStorage.removeItem('trader_academic_referred_by');
      };

      // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          handleUserSession(session.user);
        }
      });

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          handleUserSession(session.user);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Overall Progress
  const overallProgress = useMemo(() => {
    return storageService.calculateOverallProgress(currentUser, modules);
  }, [currentUser, modules]);

  // Auth Handlers
  const handleAuthSuccess = (authUser: User) => {
    storageService.setCurrentUserId(authUser.id);
    storageService.setAuthenticated(true);
    let currentStudents = storageService.getStudents();
    if (!currentStudents.some(u => u.id === authUser.id || u.email.toLowerCase() === authUser.email.toLowerCase())) {
      currentStudents = [authUser, ...currentStudents];
      storageService.saveStudents(currentStudents);
    }
    setUsers(currentStudents);
    setCurrentUserId(authUser.id);
    setIsAuthenticated(true);
    setActiveView('home');
  };

  const handleLogout = async () => {
    storageService.logout();
    if (supabaseService.isConfigured()) {
      await supabaseService.logout();
    }
    localStorage.removeItem('trader_academic_admin_session');
    setIsAuthenticated(false);
    setActiveView('home');
  };

  const handleUpdateProfile = (updatedData: Partial<User>) => {
    const updated = storageService.updateUser(currentUserId, updatedData);
    if (updated) {
      const updatedStudents = storageService.getStudents();
      setUsers(updatedStudents);
    }
  };

  // Save changes wrapper
  const handleUpdateModules = (newModules: Module[]) => {
    setModules(newModules);
    storageService.saveModules(newModules);
    
    // Update currently playing module if applicable
    if (activePlayingModule) {
      const updatedMod = newModules.find(m => m.id === activePlayingModule.id);
      if (updatedMod) {
        setActivePlayingModule(updatedMod);
        if (activePlayingLesson) {
          const updatedLes = updatedMod.lessons.find(l => l.id === activePlayingLesson.id);
          if (updatedLes) setActivePlayingLesson(updatedLes);
        }
      }
    }
  };

  const handleUpdateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    storageService.saveStudents(newUsers);
  };

  const handleSwitchUser = (newId: string) => {
    setCurrentUserId(newId);
    storageService.setCurrentUserId(newId);
  };

  const handleToggleRole = () => {
    const nextRole = currentUser.role === 'admin' ? 'student' : 'admin';
    const updatedUsers = users.map(u => u.id === currentUser.id ? { ...u, role: nextRole as any } : u);
    handleUpdateUsers(updatedUsers);
  };

  // Lesson actions
  const handleSelectLesson = (moduleId: string, lessonId: string) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    const les = mod.lessons.find(l => l.id === lessonId);
    if (!les) return;

    setActivePlayingModule(mod);
    setActivePlayingLesson(les);
    setActiveView('player');
    setSelectedModuleForModal(null);

    // Update last watched in user progress
    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          progress: {
            ...u.progress,
            lastWatchedModuleId: moduleId,
            lastWatchedLessonId: lessonId,
          }
        };
      }
      return u;
    });
    handleUpdateUsers(updatedUsers);
  };

  const handleToggleLessonComplete = (lessonId: string) => {
    const completedSet = new Set(currentUser.progress.completedLessonIds);
    if (completedSet.has(lessonId)) {
      completedSet.delete(lessonId);
    } else {
      completedSet.add(lessonId);
    }

    const updatedUsers = users.map(u => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          progress: {
            ...u.progress,
            completedLessonIds: Array.from(completedSet)
          }
        };
      }
      return u;
    });
    handleUpdateUsers(updatedUsers);
  };

  // Quick Resume from banner
  const handleResumeWatching = () => {
    if (currentUser.progress.lastWatchedModuleId && currentUser.progress.lastWatchedLessonId) {
      handleSelectLesson(currentUser.progress.lastWatchedModuleId, currentUser.progress.lastWatchedLessonId);
    } else if (modules.length > 0 && modules[0].lessons.length > 0) {
      handleSelectLesson(modules[0].id, modules[0].lessons[0].id);
    }
  };

  const handlePlayFirstUncompleted = (module: Module) => {
    const uncompleted = module.lessons.find(l => !currentUser.progress.completedLessonIds.includes(l.id));
    if (uncompleted) {
      handleSelectLesson(module.id, uncompleted.id);
    } else if (module.lessons.length > 0) {
      handleSelectLesson(module.id, module.lessons[0].id);
    }
  };

  // If user is not authenticated, render Auth Screen
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onAuthSuccess={handleAuthSuccess}
        settings={settings}
        allUsers={users}
      />
    );
  }

  // Blocked Access Screen
  if (currentUser.status === 'Bloqueado' && currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
        <div className="w-full max-w-md bg-[#0e0e12] border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-500 flex items-center justify-center mx-auto shadow-xl">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Acesso Suspenso</h2>
          <p className="text-xs text-zinc-400">
            Sua conta se encontra temporariamente bloqueada pelo administrador da plataforma. Entre em contato com o suporte para regularizar o acesso.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <a
              href={`https://wa.me/${settings.supportWhatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-600/20"
            >
              Falar com o Suporte
            </a>
            <button
              onClick={handleLogout}
              className="w-full py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs font-bold uppercase transition-all"
            >
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin security check: viniciussestremmm@gmail.com or herisson.trader.jt5@gmail.com
  const isAdmin = currentUser?.role === 'admin' || ['viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com'].includes(currentUser?.email?.toLowerCase() || '');

  return (
    <div className="min-h-screen bg-[#070709] text-gray-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* View 1: Admin Panel (Restrito estritamente a herisson.trader.jt5@gmail.com) */}
      {activeView === 'admin' && isAdmin && (
        <AdminLayout
          currentUser={currentUser}
          allUsers={users}
          modules={modules}
          announcements={announcements}
          liveSessions={liveSessions}
          settings={settings}
          withdrawalRequests={withdrawalRequests}
          onUpdateModules={handleUpdateModules}
          onUpdateUsers={handleUpdateUsers}
          onUpdateAnnouncements={(ann) => { setAnnouncements(ann); storageService.saveAnnouncements(ann); }}
          onUpdateLiveSessions={(sess) => { setLiveSessions(sess); storageService.saveLiveSessions(sess); }}
          onUpdateSettings={(sett) => { setSettings(sett); storageService.saveSettings(sett); }}
          onUpdateWithdrawalRequestStatus={handleUpdateWithdrawalRequestStatus}
          onBackToStudentView={() => setActiveView('home')}
          onLogout={handleLogout}
        />
      )}

      {/* View 2: Video Player (Dedicated Lesson View) */}
      {activeView === 'player' && activePlayingModule && activePlayingLesson && (
        <VideoPlayerView
          currentModule={activePlayingModule}
          currentLesson={activePlayingLesson}
          currentUser={currentUser}
          modules={modules}
          settings={settings}
          onBackToHome={() => setActiveView('home')}
          onSelectLesson={handleSelectLesson}
          onToggleComplete={handleToggleLessonComplete}
        />
      )}

      {/* View 3: Student Member Area (Kiwify Dashboard) */}
      {(activeView === 'home' || (activeView === 'admin' && !isAdmin)) && (
        <>
          <Navbar
            currentUser={currentUser}
            onSwitchUser={handleSwitchUser}
            allUsers={users}
            onToggleRole={handleToggleRole}
            activeView={activeView}
            setActiveView={setActiveView}
            modules={modules}
            announcements={announcements}
            onSelectLesson={handleSelectLesson}
            settings={settings}
            overallProgress={overallProgress}
            onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            onOpenCalendar={() => setIsCalendarOpen(true)}
            onOpenReferral={() => setIsReferralOpen(true)}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onOpenUpgrade={() => handleOpenUpgrade()}
            onLogout={handleLogout}
          />

          {/* Main Dashboard */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
            
            {/* Top Announcement Banner */}
            <AnnouncementBanner announcements={announcements} />

            {/* Kiwify Hero Banner */}
            <HeroBanner
              currentUser={currentUser}
              modules={modules}
              settings={settings}
              overallProgress={overallProgress}
              onResumeWatching={handleResumeWatching}
              onOpenUpgrade={() => handleOpenUpgrade()}
              onOpenCalendar={() => setIsCalendarOpen(true)}
            />

            {/* Course Modules Grid */}
            <ModuleGrid
              modules={modules}
              currentUser={currentUser}
              onSelectModule={(mod) => setSelectedModuleForModal(mod)}
              onPlayFirstUncompleted={handlePlayFirstUncompleted}
            />

            {/* Community & Live Sessions Section */}
            <section className="p-8 rounded-3xl bg-gradient-to-r from-[#120a05] via-[#16121e] to-[#0c0d18] border border-orange-900/30 shadow-2xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 text-center lg:text-left">
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-widest font-mono">
                    Comunidade VIP
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    Opere Ao Vivo com o Mentor e Alunos VIP
                  </h2>
                  <p className="text-sm text-zinc-400 max-w-xl">
                    Participe das nossas salas de operações diárias, analise o mercado em tempo real e tire dúvidas direto no chat exclusivo.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={settings.telegramVipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Telegram VIP</span>
                  </a>

                  <a
                    href={`https://wa.me/${settings.supportWhatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-black font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-green-500/20 cursor-pointer"
                  >
                    <Phone className="w-4 h-4" />
                    <span>WhatsApp de Dúvidas</span>
                  </a>
                </div>
              </div>
            </section>

          </main>

          {/* Footer */}
          <footer className="border-t border-orange-900/20 bg-[#0a0a0a] py-10 px-4 sm:px-6 lg:px-8 text-xs text-zinc-400">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-600/30">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-1 font-black text-sm tracking-tight text-white uppercase">
                    <span className="text-orange-500">TRADER</span>
                    <span>ACADEMIC</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    © {new Date().getFullYear()} {settings.mentorName}. Todos os direitos reservados.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-zinc-400">
                <button onClick={() => setIsRiskCalcOpen(true)} className="hover:text-orange-400 cursor-pointer">
                  Calculadora de Lote
                </button>
                <span>•</span>
                <button onClick={() => setIsCertificateOpen(true)} className="hover:text-orange-400 cursor-pointer">
                  Certificado
                </button>
                {isAdmin && (
                  <>
                    <span>•</span>
                    <button onClick={() => setActiveView('admin')} className="text-orange-400 hover:text-orange-300 hover:underline cursor-pointer font-bold font-mono">
                      Acesso Mentor (Painel ADM)
                    </button>
                  </>
                )}
                <span>•</span>
                <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 cursor-pointer font-mono">
                  Sair da Conta
                </button>
              </div>
            </div>
          </footer>

          {/* Mobile Floating Bottom Bar for Quick Navigation */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-t border-orange-900/30 px-4 py-2 flex items-center justify-around">
            <button
              onClick={() => setActiveView('home')}
              className={`flex flex-col items-center gap-1 text-[10px] font-bold ${
                activeView === 'home' ? 'text-orange-500' : 'text-zinc-400'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span>Aulas</span>
            </button>

            <button
              onClick={() => setIsCalendarOpen(true)}
              className="flex flex-col items-center gap-1 text-[10px] font-bold text-orange-400"
            >
              <Calendar className="w-5 h-5" />
              <span>Notícias</span>
            </button>

            <button
              onClick={() => setIsRiskCalcOpen(true)}
              className="flex flex-col items-center gap-1 text-[10px] font-bold text-zinc-400"
            >
              <Calculator className="w-5 h-5" />
              <span>Calc Lote</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveView('admin')}
                className="flex flex-col items-center gap-1 text-[10px] font-bold text-zinc-400"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>ADM</span>
              </button>
            )}
          </div>
        </>
      )}

      {/* Module Detail Modal */}
      <ModuleDetailModal
        module={selectedModuleForModal}
        currentUser={currentUser}
        settings={settings}
        onClose={() => setSelectedModuleForModal(null)}
        onSelectLesson={handleSelectLesson}
        onOpenSupport={(mod) => {
          setSelectedModuleForModal(null);
          handleOpenUpgrade(mod || selectedModuleForModal);
        }}
      />

      {/* Tools Modals */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => {
          setIsUpgradeModalOpen(false);
          setUpgradeTargetModule(null);
        }}
        settings={settings}
        targetModule={upgradeTargetModule}
        currentUser={currentUser}
      />

      <RiskCalculatorModal
        isOpen={isRiskCalcOpen}
        onClose={() => setIsRiskCalcOpen(false)}
      />

      <CertificateModal
        isOpen={isCertificateOpen}
        onClose={() => setIsCertificateOpen(false)}
        currentUser={currentUser}
        settings={settings}
        overallProgress={overallProgress}
      />

      <EconomicCalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleUpdateProfile}
      />

      <ReferralModal
        isOpen={isReferralOpen}
        onClose={() => setIsReferralOpen(false)}
        currentUser={currentUser}
        allUsers={users}
        settings={settings}
        requests={withdrawalRequests}
        onCreateRequest={handleCreateWithdrawalRequest}
      />

    </div>
  );
}
