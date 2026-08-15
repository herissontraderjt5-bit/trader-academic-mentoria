import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { ModuleGrid } from './components/ModuleGrid';
import { ModuleDetailModal } from './components/ModuleDetailModal';
import { VideoPlayerView } from './components/VideoPlayerView';
import { AdminLayout } from './components/Admin/AdminLayout';
import { RiskCalculatorModal } from './components/Tools/RiskCalculatorModal';
import { CertificateModal } from './components/Tools/CertificateModal';
import { LiveRoomModal } from './components/Tools/LiveRoomModal';
import { UpgradeModal } from './components/Tools/UpgradeModal';
import { AuthScreen } from './components/Auth/AuthScreen';
import { EditProfileModal } from './components/Profile/EditProfileModal';

import { Module, User, Lesson, Announcement, LiveSession, PlatformSettings } from './types';
import { storageService } from './services/storage';
import { supabase } from './lib/supabase';
import { supabaseService } from './services/supabaseService';

import { 
  Flame, 
  Radio, 
  Calculator, 
  ShieldCheck,
  Send,
  Sparkles,
  Phone,
  Compass
} from 'lucide-react';

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
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Current User Object
  const currentUser = useMemo(() => {
    const found = users.find(u => u.id === currentUserId);
    return found || users[0];
  }, [users, currentUserId]);

  // Sync with Supabase on mount and listen to Auth state changes (including Google OAuth redirect)
  React.useEffect(() => {
    // 1. Initial data sync
    storageService.syncWithSupabase().then(synced => {
      if (synced) {
        if (synced.modules) setModules(synced.modules);
        if (synced.users) setUsers(synced.users);
        if (synced.announcements) setAnnouncements(synced.announcements);
        if (synced.liveSessions) setLiveSessions(synced.liveSessions);
        if (synced.settings) setSettings(synced.settings);
      }
    });

    // 2. Real Supabase Auth listener (Google OAuth & Email session detection)
    if (supabase) {
      const handleUserSession = async (sessionUser: any) => {
        if (!sessionUser) return;
        let profile = await supabaseService.getProfileById(sessionUser.id);
        if (!profile) {
          const newProfile: User = {
            id: sessionUser.id,
            name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'Aluno',
            email: sessionUser.email || '',
            avatar: sessionUser.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
            role: 'student',
            tier: 'Free',
            status: 'Ativo',
            joinedAt: new Date().toISOString().split('T')[0],
            progress: { completedLessonIds: [] },
            notes: {},
          };
          await supabaseService.upsertProfile(newProfile);
          profile = newProfile;
        }
        setCurrentUserId(profile.id);
        setIsAuthenticated(true);
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
    const currentStudents = storageService.getStudents();
    setUsers(currentStudents);
    setCurrentUserId(authUser.id);
    setIsAuthenticated(true);
    // If admin, keep in home or current view
    setActiveView('home');
  };

  const handleLogout = () => {
    storageService.logout();
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      
      {/* View 1: Admin Panel */}
      {activeView === 'admin' && (
        <AdminLayout
          currentUser={currentUser}
          allUsers={users}
          modules={modules}
          announcements={announcements}
          liveSessions={liveSessions}
          settings={settings}
          onUpdateModules={handleUpdateModules}
          onUpdateUsers={handleUpdateUsers}
          onUpdateAnnouncements={(ann) => { setAnnouncements(ann); storageService.saveAnnouncements(ann); }}
          onUpdateLiveSessions={(sess) => { setLiveSessions(sess); storageService.saveLiveSessions(sess); }}
          onUpdateSettings={(sett) => { setSettings(sett); storageService.saveSettings(sett); }}
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
      {activeView === 'home' && (
        <>
          <Navbar
            currentUser={currentUser}
            onSwitchUser={handleSwitchUser}
            allUsers={users}
            onToggleRole={handleToggleRole}
            activeView={activeView}
            setActiveView={setActiveView}
            modules={modules}
            onSelectLesson={handleSelectLesson}
            announcements={announcements}
            settings={settings}
            overallProgress={overallProgress}
            onOpenRiskCalc={() => setIsRiskCalcOpen(true)}
            onOpenCertificate={() => setIsCertificateOpen(true)}
            onOpenLive={() => setIsLiveOpen(true)}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
            onLogout={handleLogout}
          />

          <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 w-full">
            
            {/* Top Spotlight Hero Banner */}
            <HeroBanner
              currentUser={currentUser}
              modules={modules}
              settings={settings}
              overallProgress={overallProgress}
              onResumeWatching={handleResumeWatching}
              onOpenLive={() => setIsLiveOpen(true)}
              onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
            />

            {/* Vertical Cards Module Grid Section */}
            <ModuleGrid
              modules={modules}
              currentUser={currentUser}
              onSelectModule={(mod) => setSelectedModuleForModal(mod)}
              onPlayFirstUncompleted={handlePlayFirstUncompleted}
            />

            {/* VIP Community & Support Hub Card */}
            <section className="mb-16 rounded-3xl p-6 sm:p-10 bg-zinc-900/60 border border-orange-900/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
                <div>
                  <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider font-mono mb-2">
                    <Sparkles className="w-4 h-4" />
                    <span>Rede de Network & Acompanhamento</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2">
                    Comunidade Exclusiva & Suporte dos Mentores
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
                    Tire dúvidas em tempo real, receba análises diárias de pré-mercado e compartilhe seus trades com outros alunos da mentoria Trader Academic.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
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
                <span>•</span>
                <button onClick={() => setActiveView('admin')} className="text-orange-400 hover:text-orange-300 hover:underline cursor-pointer font-bold font-mono">
                  Acesso Mentor (Painel ADM)
                </button>
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
              onClick={() => setIsLiveOpen(true)}
              className="flex flex-col items-center gap-1 text-[10px] font-bold text-red-400"
            >
              <Radio className="w-5 h-5 animate-pulse" />
              <span>Ao Vivo</span>
            </button>

            <button
              onClick={() => setIsRiskCalcOpen(true)}
              className="flex flex-col items-center gap-1 text-[10px] font-bold text-zinc-400"
            >
              <Calculator className="w-5 h-5" />
              <span>Calc Lote</span>
            </button>

            <button
              onClick={() => setActiveView('admin')}
              className="flex flex-col items-center gap-1 text-[10px] font-bold text-zinc-400"
            >
              <ShieldCheck className="w-5 h-5" />
              <span>ADM</span>
            </button>
          </div>
        </>
      )}

      {/* Module Detail Modal */}
      <ModuleDetailModal
        module={selectedModuleForModal}
        currentUser={currentUser}
        onClose={() => setSelectedModuleForModal(null)}
        onSelectLesson={handleSelectLesson}
        onOpenSupport={() => {
          setSelectedModuleForModal(null);
          setIsUpgradeModalOpen(true);
        }}
      />

      {/* Tools Modals */}
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        settings={settings}
        onSuccessUpgrade={() => {
          handleUpdateProfile({ tier: 'VIP' });
        }}
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

      <LiveRoomModal
        isOpen={isLiveOpen}
        onClose={() => setIsLiveOpen(false)}
        liveSessions={liveSessions}
        currentUser={currentUser}
        onUpdateLiveSessions={(sess) => {
          setLiveSessions(sess);
          storageService.saveLiveSessions(sess);
        }}
      />

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={currentUser}
        onSaveProfile={handleUpdateProfile}
      />

    </div>
  );
}
