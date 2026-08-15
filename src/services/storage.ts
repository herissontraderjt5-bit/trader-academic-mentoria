import { Module, User, Announcement, LiveSession, PlatformSettings, TradeJournalEntry, LessonComment } from '../types';
import { INITIAL_MODULES, INITIAL_STUDENTS, INITIAL_ANNOUNCEMENTS, INITIAL_LIVE_SESSIONS, INITIAL_SETTINGS, INITIAL_JOURNAL } from '../data/initialData';
import { supabaseService } from './supabaseService';

const STORAGE_KEYS = {
  MODULES: 'trader_academic_modules_v1',
  STUDENTS: 'trader_academic_students_v1',
  CURRENT_USER_ID: 'trader_academic_curr_user_id_v1',
  IS_AUTHENTICATED: 'trader_academic_is_auth_v1',
  ANNOUNCEMENTS: 'trader_academic_announcements_v1',
  LIVE_SESSIONS: 'trader_academic_live_sessions_v1',
  SETTINGS: 'trader_academic_settings_v1',
  JOURNAL: 'trader_academic_journal_v1',
};

// Unified storage wrapper (LocalStorage + Supabase sync)
export const storageService = {
  isAuthenticated(): boolean {
    const isAuth = localStorage.getItem(STORAGE_KEYS.IS_AUTHENTICATED);
    if (isAuth === null) {
      return false;
    }
    return isAuth === 'true';
  },

  setAuthenticated(isAuth: boolean): void {
    localStorage.setItem(STORAGE_KEYS.IS_AUTHENTICATED, isAuth ? 'true' : 'false');
  },

  async syncWithSupabase(): Promise<{
    modules?: Module[];
    users?: User[];
    announcements?: Announcement[];
    liveSessions?: LiveSession[];
    settings?: PlatformSettings;
    journal?: TradeJournalEntry[];
  } | null> {
    if (!supabaseService.isConfigured()) return null;

    try {
      const [remoteModules, remoteProfiles, remoteAnnouncements, remoteLive, remoteSettings, remoteJournal] = await Promise.all([
        supabaseService.getModules(),
        supabaseService.getProfiles(),
        supabaseService.getAnnouncements(),
        supabaseService.getLiveSessions(),
        supabaseService.getSettings(),
        supabaseService.getJournal(),
      ]);

      const result: any = {};

      if (remoteModules.length > 0) {
        this.saveModules(remoteModules);
        result.modules = remoteModules;
      }
      if (remoteProfiles.length > 0) {
        this.saveStudents(remoteProfiles);
        result.users = remoteProfiles;
      }
      if (remoteAnnouncements.length > 0) {
        this.saveAnnouncements(remoteAnnouncements);
        result.announcements = remoteAnnouncements;
      }
      if (remoteLive.length > 0) {
        this.saveLiveSessions(remoteLive);
        result.liveSessions = remoteLive;
      }
      if (remoteSettings) {
        this.saveSettings(remoteSettings);
        result.settings = remoteSettings;
      }
      if (remoteJournal.length > 0) {
        this.saveJournal(remoteJournal);
        result.journal = remoteJournal;
      }

      return result;
    } catch (e) {
      console.error('Error during Supabase background sync:', e);
      return null;
    }
  },

  login(email: string, password?: string): { success: boolean; message?: string; user?: User } {
    const students = this.getStudents();
    const cleanEmail = email.trim().toLowerCase();
    const user = students.find((s) => s.email.toLowerCase() === cleanEmail);

    if (!user) {
      return { success: false, message: 'Nenhuma conta encontrada com este email.' };
    }

    if (user.status === 'Bloqueado') {
      return { success: false, message: 'Esta conta está bloqueada pelo administrador. Contate o suporte.' };
    }

    if (user.status === 'Expirado') {
      return { success: false, message: 'Seu período de acesso expirou. Renove sua matrícula.' };
    }

    if (password && user.password && user.password !== password) {
      return { success: false, message: 'Senha incorreta. Verifique suas credenciais ou use a recuperação de senha.' };
    }

    this.setCurrentUserId(user.id);
    this.setAuthenticated(true);
    return { success: true, user };
  },

  register(userData: {
    name: string;
    email: string;
    whatsapp: string;
    password?: string;
    termsAccepted: boolean;
  }): { success: boolean; message?: string; user?: User } {
    const students = this.getStudents();
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = students.find((s) => s.email.toLowerCase() === cleanEmail);

    if (existing) {
      return { success: false, message: 'Já existe uma conta cadastrada com este email.' };
    }

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop',
    ];
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newUser: User = {
      id: 'usr-' + Date.now(),
      name: userData.name.trim(),
      email: cleanEmail,
      whatsapp: userData.whatsapp.trim(),
      password: userData.password,
      termsAccepted: userData.termsAccepted,
      termsAcceptedAt: new Date().toISOString(),
      avatar: randomAvatar,
      role: 'student',
      tier: 'Free',
      status: 'Ativo',
      joinedAt: new Date().toISOString().split('T')[0],
      progress: {
        completedLessonIds: [],
      },
      notes: {},
    };

    students.push(newUser);
    this.saveStudents(students);
    this.setCurrentUserId(newUser.id);
    this.setAuthenticated(true);

    if (supabaseService.isConfigured()) {
      supabaseService.upsertProfile(newUser);
    }

    return { success: true, user: newUser };
  },

  loginWithGoogle(googleData: {
    name: string;
    email: string;
    avatar?: string;
  }): { success: boolean; user: User } {
    const students = this.getStudents();
    const cleanEmail = googleData.email.trim().toLowerCase();
    let user = students.find((s) => s.email.toLowerCase() === cleanEmail);

    if (!user) {
      user = {
        id: 'usr-g-' + Date.now(),
        name: googleData.name,
        email: cleanEmail,
        avatar: googleData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop',
        role: 'student',
        tier: 'Free',
        status: 'Ativo',
        joinedAt: new Date().toISOString().split('T')[0],
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        progress: {
          completedLessonIds: [],
        },
        notes: {},
      };
      students.push(user);
      this.saveStudents(students);
    } else {
      if (googleData.avatar) {
        user.avatar = googleData.avatar;
        this.saveStudents(students);
      }
    }

    this.setCurrentUserId(user.id);
    this.setAuthenticated(true);

    if (supabaseService.isConfigured() && user) {
      supabaseService.upsertProfile(user);
    }

    return { success: true, user };
  },

  logout(): void {
    this.setAuthenticated(false);
    if (supabaseService.isConfigured()) {
      supabaseService.logout();
    }
  },

  getModules(): Module[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MODULES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(INITIAL_MODULES));
    return INITIAL_MODULES;
  },

  saveModules(modules: Module[]): void {
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    if (supabaseService.isConfigured()) {
      supabaseService.saveModules(modules);
    }
  },

  getStudents(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  },

  saveStudents(students: User[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    if (supabaseService.isConfigured()) {
      students.forEach((s) => supabaseService.upsertProfile(s));
    }
  },

  getCurrentUserId(): string {
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return id || 'usr-current';
  },

  setCurrentUserId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  updateUser(userId: string, updates: Partial<User>): User | null {
    const students = this.getStudents();
    const index = students.findIndex((s) => s.id === userId);
    if (index === -1) return null;

    const updatedUser = {
      ...students[index],
      ...updates,
    };

    students[index] = updatedUser;
    this.saveStudents(students);

    if (supabaseService.isConfigured()) {
      supabaseService.upsertProfile(updatedUser);
    }

    return updatedUser;
  },

  getCurrentUser(): User {
    const students = this.getStudents();
    const currentId = this.getCurrentUserId();
    const user = students.find((s) => s.id === currentId);
    if (user) return user;
    return students[0] || INITIAL_STUDENTS[0];
  },

  saveCurrentUser(user: User): void {
    const students = this.getStudents();
    const idx = students.findIndex((s) => s.id === user.id);
    if (idx >= 0) {
      students[idx] = user;
    } else {
      students.push(user);
    }
    this.saveStudents(students);
    if (supabaseService.isConfigured()) {
      supabaseService.upsertProfile(user);
    }
  },

  getAnnouncements(): Announcement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    return INITIAL_ANNOUNCEMENTS;
  },

  saveAnnouncements(announcements: Announcement[]): void {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    if (supabaseService.isConfigured()) {
      supabaseService.saveAnnouncements(announcements);
    }
  },

  getLiveSessions(): LiveSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LIVE_SESSIONS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(INITIAL_LIVE_SESSIONS));
    return INITIAL_LIVE_SESSIONS;
  },

  saveLiveSessions(sessions: LiveSession[]): void {
    localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(sessions));
    if (supabaseService.isConfigured()) {
      supabaseService.saveLiveSessions(sessions);
    }
  },

  getSettings(): PlatformSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    return INITIAL_SETTINGS;
  },

  saveSettings(settings: PlatformSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    if (supabaseService.isConfigured()) {
      supabaseService.saveSettings(settings);
    }
  },

  getJournal(): TradeJournalEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOURNAL);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(INITIAL_JOURNAL));
    return INITIAL_JOURNAL;
  },

  saveJournal(journal: TradeJournalEntry[]): void {
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journal));
    if (supabaseService.isConfigured()) {
      supabaseService.saveJournal(journal);
    }
  },

  resetAllData(): void {
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(INITIAL_MODULES));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr-current');
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(INITIAL_LIVE_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(INITIAL_JOURNAL));
    if (supabaseService.isConfigured()) {
      supabaseService.saveModules(INITIAL_MODULES);
      supabaseService.saveAnnouncements(INITIAL_ANNOUNCEMENTS);
      supabaseService.saveLiveSessions(INITIAL_LIVE_SESSIONS);
      supabaseService.saveSettings(INITIAL_SETTINGS);
      supabaseService.saveJournal(INITIAL_JOURNAL);
      INITIAL_STUDENTS.forEach((s) => supabaseService.upsertProfile(s));
    }
  },

  hasAccessToModule(user: User, module: Module): boolean {
    if (user.role === 'admin') return true;
    if (user.status !== 'Ativo') return false;

    if (user.customAllowedModuleIds && user.customAllowedModuleIds.length > 0) {
      return user.customAllowedModuleIds.includes(module.id);
    }

    const tierHierarchy: Record<string, number> = {
      'Free': 1,
      'Starter': 1,
      'VIP': 2,
      'Pro': 2,
      'VIP Black': 2,
      'Vitalício': 2
    };

    const userTierLevel = tierHierarchy[user.tier] || 1;
    const requiredLevel = tierHierarchy[module.requiredTier] || 1;

    return userTierLevel >= requiredLevel;
  },

  calculateOverallProgress(user: User, modules: Module[]): { completed: number; total: number; percentage: number } {
    let totalLessons = 0;
    modules.forEach(m => {
      totalLessons += m.lessons.length;
    });

    const completed = user.progress.completedLessonIds.length;
    const percentage = totalLessons > 0 ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0;

    return { completed, total: totalLessons, percentage };
  },

  calculateModuleProgress(user: User, module: Module): { completed: number; total: number; percentage: number } {
    const total = module.lessons.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = module.lessons.filter(l => user.progress.completedLessonIds.includes(l.id)).length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  },

  toggleLessonCompleted(userId: string, lessonId: string): boolean {
    const students = this.getStudents();
    const userIndex = students.findIndex(s => s.id === userId);
    if (userIndex === -1) return false;

    const user = students[userIndex];
    const isCompleted = user.progress.completedLessonIds.includes(lessonId);
    
    if (isCompleted) {
      user.progress.completedLessonIds = user.progress.completedLessonIds.filter(id => id !== lessonId);
    } else {
      user.progress.completedLessonIds.push(lessonId);
    }
    
    this.saveStudents(students);
    return !isCompleted;
  },

  saveLessonNote(userId: string, lessonId: string, noteText: string): void {
    const students = this.getStudents();
    const userIndex = students.findIndex(s => s.id === userId);
    if (userIndex === -1) return;

    students[userIndex].notes[lessonId] = noteText;
    this.saveStudents(students);
  },

  addComment(moduleId: string, lessonId: string, text: string, user: User): void {
    const modules = this.getModules();
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    const lesson = mod.lessons.find(l => l.id === lessonId);
    if (!lesson) return;

    if (!lesson.comments) lesson.comments = [];
    const newComment: LessonComment = {
      id: 'comm-' + Date.now(),
      userName: user.name,
      userAvatar: user.avatar,
      userRole: user.role,
      date: 'Agora mesmo',
      text,
      likes: 0,
      replies: []
    };
    lesson.comments.unshift(newComment);
    this.saveModules(modules);
  }
};
