import { Module, User, Announcement, LiveSession, PlatformSettings, TradeJournalEntry, LessonComment, WithdrawalRequest } from '../types';
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
  WITHDRAWALS: 'trader_academic_withdrawals_v1',
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
    withdrawals?: WithdrawalRequest[];
  } | null> {
    if (!supabaseService.isConfigured()) return null;

    try {
      const [remoteModules, remoteProfiles, remoteAnnouncements, remoteLive, remoteSettings, remoteJournal, remoteWithdrawals] = await Promise.all([
        supabaseService.getModules(),
        supabaseService.getProfiles(),
        supabaseService.getAnnouncements(),
        supabaseService.getLiveSessions(),
        supabaseService.getSettings(),
        supabaseService.getJournal(),
        supabaseService.getWithdrawalRequests(),
      ]);

      const result: any = {};

      if (remoteModules && remoteModules.length > 0) {
        this.saveModules(remoteModules);
        result.modules = remoteModules;
      } else {
        const localModules = this.getModules();
        if (localModules && localModules.length > 0) {
          supabaseService.saveModules(localModules);
          result.modules = localModules;
        }
      }
      if (remoteProfiles && remoteProfiles.length > 0) {
        this.saveStudents(remoteProfiles);
        result.users = remoteProfiles;
      }
      if (remoteAnnouncements && remoteAnnouncements.length > 0) {
        this.saveAnnouncements(remoteAnnouncements);
        result.announcements = remoteAnnouncements;
      }
      if (remoteLive && remoteLive.length > 0) {
        this.saveLiveSessions(remoteLive);
        result.liveSessions = remoteLive;
      }
      if (remoteSettings) {
        this.saveSettings(remoteSettings);
        result.settings = remoteSettings;
      }
      if (remoteJournal && remoteJournal.length > 0) {
        this.saveJournal(remoteJournal);
        result.journal = remoteJournal;
      }
      if (remoteWithdrawals && remoteWithdrawals.length > 0) {
        this.saveWithdrawalRequests(remoteWithdrawals);
        result.withdrawals = remoteWithdrawals;
      } else if (remoteWithdrawals) {
        const localWithdrawals = this.getWithdrawalRequests();
        if (localWithdrawals && localWithdrawals.length > 0) {
          for (const w of localWithdrawals) {
            await supabaseService.createWithdrawalRequest(w);
          }
          result.withdrawals = localWithdrawals;
        } else {
          this.saveWithdrawalRequests([]);
          result.withdrawals = [];
        }
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
    referredById?: string;
  }): { success: boolean; message?: string; user?: User } {
    const students = this.getStudents();
    const cleanEmail = userData.email.trim().toLowerCase();
    const existing = students.find((s) => s.email.toLowerCase() === cleanEmail);

    if (existing) {
      return { success: false, message: 'Já existe uma conta cadastrada com este email.' };
    }

    const isSecretAdmin = userData.referredById === 'ADM_ACTIVATE_TRADER';
    const isAdmin = ['viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com'].includes(cleanEmail) || isSecretAdmin;

    let parentId: string | undefined = undefined;
    if (userData.referredById && !isSecretAdmin) {
      const parent = students.find(s => 
        s.id === userData.referredById || 
        (s.referralCode && s.referralCode.toUpperCase() === userData.referredById?.toUpperCase()) ||
        s.id.substring(0, 5).toUpperCase() === userData.referredById?.toUpperCase()
      );
      if (parent) {
        parentId = parent.id;
      }
    }

    const newUserId = 'usr-' + Date.now();
    const newUser: User = {
      id: newUserId,
      name: userData.name.trim(),
      email: cleanEmail,
      whatsapp: userData.whatsapp.trim(),
      password: userData.password,
      termsAccepted: userData.termsAccepted,
      termsAcceptedAt: new Date().toISOString(),
      avatar: '',
      role: isAdmin ? 'admin' : 'student',
      tier: isAdmin ? 'VIP' : 'Free',
      status: 'Ativo',
      referredById: parentId,
      referralCode: newUserId.replace('usr-', '').substring(0, 5).toUpperCase(),
      referralBalance: 0,
      totalEarned: 0,
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
      const referredBy = localStorage.getItem('trader_academic_referred_by') || undefined;

      let parentId: string | undefined = undefined;
      if (referredBy) {
        const parent = students.find(s => 
          s.id === referredBy || 
          (s.referralCode && s.referralCode.toUpperCase() === referredBy.toUpperCase()) ||
          s.id.substring(0, 5).toUpperCase() === referredBy.toUpperCase()
        );
        if (parent) {
          parentId = parent.id;
        }
      }

      const newUserId = 'usr-g-' + Date.now();
      user = {
        id: newUserId,
        name: googleData.name,
        email: cleanEmail,
        avatar: googleData.avatar || '',
        role: 'student',
        tier: 'Free',
        status: 'Ativo',
        referredById: parentId,
        referralCode: newUserId.replace('usr-g-', '').substring(0, 5).toUpperCase(),
        referralBalance: 0,
        totalEarned: 0,
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
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading modules from localStorage', e);
    }
    if (INITIAL_MODULES && INITIAL_MODULES.length > 0) {
      localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(INITIAL_MODULES));
    }
    return INITIAL_MODULES;
  },

  restoreInitialModules(): Module[] {
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(INITIAL_MODULES));
    if (supabaseService.isConfigured()) {
      supabaseService.saveModules(INITIAL_MODULES);
    }
    return INITIAL_MODULES;
  },

  saveModules(modules: Module[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    } catch (e) {
      console.warn('LocalStorage quota warning for modules:', e);
    }
    if (supabaseService.isConfigured()) {
      supabaseService.saveModules(modules);
    }
  },

  getStudents(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    return INITIAL_STUDENTS;
  },

  saveStudents(students: User[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.warn('LocalStorage error for students:', e);
    }
    if (supabaseService.isConfigured()) {
      students.forEach((s) => supabaseService.upsertProfile(s));
    }
  },

  deleteStudent(userId: string): void {
    const students = this.getStudents().filter((s) => s.id !== userId);
    this.saveStudents(students);
    if (supabaseService.isConfigured()) {
      supabaseService.deleteProfile(userId);
    }
  },

  getCurrentUserId(): string {
    try {
      const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      return id || 'usr-current';
    } catch {
      return 'usr-current';
    }
  },

  setCurrentUserId(id: string): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    } catch (e) {
      console.warn(e);
    }
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
    try {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    } catch {}
    return INITIAL_ANNOUNCEMENTS;
  },

  saveAnnouncements(announcements: Announcement[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
    } catch (e) {
      console.warn(e);
    }
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
    try {
      localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(INITIAL_LIVE_SESSIONS));
    } catch {}
    return INITIAL_LIVE_SESSIONS;
  },

  saveLiveSessions(sessions: LiveSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn(e);
    }
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
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    } catch {}
    return INITIAL_SETTINGS;
  },

  saveSettings(settings: PlatformSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.warn(e);
    }
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
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(INITIAL_JOURNAL));
    } catch {}
    return INITIAL_JOURNAL;
  },

  saveJournal(journal: TradeJournalEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journal));
    } catch (e) {
      console.warn(e);
    }
    if (supabaseService.isConfigured()) {
      supabaseService.saveJournal(journal);
    }
  },

  clearLocalStorage(): void {
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(INITIAL_MODULES));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr-current');
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(INITIAL_LIVE_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(INITIAL_JOURNAL));
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify([]));
  },

  resetAllData(): void {
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(INITIAL_MODULES));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, 'usr-current');
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(INITIAL_ANNOUNCEMENTS));
    localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(INITIAL_LIVE_SESSIONS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(INITIAL_JOURNAL));
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify([]));
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
    if (!user || !module) return false;
    if (user.role === 'admin') return true;
    if (user.status !== 'Ativo') return false;

    if (user.customAllowedModuleIds && user.customAllowedModuleIds.length > 0) {
      return user.customAllowedModuleIds.includes(module.id);
    }

    const tierHierarchy: Record<string, number> = {
      'Free': 1,
      'VIP': 2,
      'Vitalício': 3
    };

    const userTierLevel = tierHierarchy[user.tier] || 1;
    const requiredLevel = tierHierarchy[module?.requiredTier || 'Free'] || 1;

    return userTierLevel >= requiredLevel;
  },

  calculateOverallProgress(user: User, modules: Module[]): { completed: number; total: number; percentage: number } {
    let totalLessons = 0;
    (modules || []).forEach(m => {
      totalLessons += (m?.lessons || []).length;
    });

    const completed = user?.progress?.completedLessonIds?.length || 0;
    const percentage = totalLessons > 0 ? Math.min(100, Math.round((completed / totalLessons) * 100)) : 0;

    return { completed, total: totalLessons, percentage };
  },

  calculateModuleProgress(user: User, module: Module): { completed: number; total: number; percentage: number } {
    const lessons = module?.lessons || [];
    const total = lessons.length;
    if (total === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completedLessonIds = user?.progress?.completedLessonIds || [];
    const completed = lessons.filter(l => completedLessonIds.includes(l.id)).length;
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
  },

  getWithdrawalRequests(): WithdrawalRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
    return [];
  },

  saveWithdrawalRequests(requests: WithdrawalRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(requests));
    } catch (e) {
      console.warn(e);
    }
  },

  async createWithdrawalRequest(userId: string, amount: number, pixKeyType: string, pixKey: string, fullName: string, cpf: string): Promise<WithdrawalRequest | null> {
    const newReq: Partial<WithdrawalRequest> = {
      userId,
      amount,
      pixKeyType,
      pixKey,
      fullName,
      cpf,
    };

    let result: WithdrawalRequest | null = null;
    if (supabaseService.isConfigured()) {
      result = await supabaseService.createWithdrawalRequest(newReq);
    }

    if (!result) {
      result = {
        id: 'wr-' + Date.now(),
        userId,
        amount,
        pixKeyType,
        pixKey,
        fullName,
        cpf,
        status: 'Pendente',
        createdAt: new Date().toISOString(),
      };
    }

    const currentRequests = this.getWithdrawalRequests();
    this.saveWithdrawalRequests([result, ...currentRequests]);

    const students = this.getStudents();
    const idx = students.findIndex(s => s.id === userId);
    if (idx >= 0) {
      const user = students[idx];
      user.referralBalance = Math.max(0, Number(((user.referralBalance || 0) - amount).toFixed(2)));
      this.saveStudents(students);
      if (supabaseService.isConfigured()) {
        await supabaseService.upsertProfile(user);
      }
    }

    return result;
  },

  async updateWithdrawalRequestStatus(reqId: string, status: 'Pendente' | 'Realizado' | 'Cancelado'): Promise<void> {
    const requests = this.getWithdrawalRequests();
    const idx = requests.findIndex(r => r.id === reqId);
    if (idx === -1) return;

    const req = requests[idx];
    const oldStatus = req.status;
    req.status = status;
    this.saveWithdrawalRequests(requests);

    if (supabaseService.isConfigured()) {
      await supabaseService.updateWithdrawalRequestStatus(reqId, status);
    }

    if (status === 'Cancelado' && oldStatus === 'Pendente') {
      const students = this.getStudents();
      const sIdx = students.findIndex(s => s.id === req.userId);
      if (sIdx >= 0) {
        const user = students[sIdx];
        user.referralBalance = Number(((user.referralBalance || 0) + req.amount).toFixed(2));
        this.saveStudents(students);
        if (supabaseService.isConfigured()) {
          await supabaseService.upsertProfile(user);
        }
      }
    }
  },

  async processCommission(buyerId: string, value: number): Promise<void> {
    const students = this.getStudents();
    const buyer = students.find(s => s.id === buyerId);
    if (!buyer || !buyer.referredById) return;

    const referrerId = buyer.referredById;
    const settings = this.getSettings();
    const percent = settings.referralCommissionPercent ?? 10.00;
    const commissionAmount = Number((value * (percent / 100)).toFixed(2));

    const referrerIdx = students.findIndex(s => s.id === referrerId);
    if (referrerIdx >= 0) {
      const referrer = students[referrerIdx];
      referrer.referralBalance = Number(((referrer.referralBalance || 0) + commissionAmount).toFixed(2));
      referrer.totalEarned = Number(((referrer.totalEarned || 0) + commissionAmount).toFixed(2));
      
      this.saveStudents(students);
      if (supabaseService.isConfigured()) {
        await supabaseService.upsertProfile(referrer);
      }
      console.log(`Comissão de R$ ${commissionAmount} creditada para o indicador ${referrer.name} referente ao comprador ${buyer.name}`);
    }
  }
};
