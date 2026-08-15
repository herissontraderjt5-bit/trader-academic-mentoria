import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Module, Lesson, Announcement, LiveSession, PlatformSettings, TradeJournalEntry, LessonComment } from '../types';

export const supabaseService = {
  isConfigured(): boolean {
    return isSupabaseConfigured && supabase !== null;
  },

  // ------------------------------------------
  // AUTHENTICATION
  // ------------------------------------------
  async loginWithEmail(email: string, password?: string): Promise<{ success: boolean; message?: string; user?: User }> {
    if (!supabase) return { success: false, message: 'Supabase não está configurado.' };

    try {
      if (!password) {
        return { success: false, message: 'Por favor, informe a senha.' };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (!data.user) {
        return { success: false, message: 'Falha na autenticação.' };
      }

      const profile = await this.getProfileById(data.user.id);
      return { success: true, user: profile || undefined };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro ao realizar login.' };
    }
  },

  async registerWithEmail(userData: {
    name: string;
    email: string;
    whatsapp: string;
    password?: string;
    termsAccepted: boolean;
  }): Promise<{ success: boolean; message?: string; user?: User }> {
    if (!supabase) return { success: false, message: 'Supabase não está configurado.' };

    try {
      if (!userData.password) {
        return { success: false, message: 'Informe uma senha para cadastro.' };
      }

      const { data, error } = await supabase.auth.signUp({
        email: userData.email.trim(),
        password: userData.password,
        options: {
          data: {
            name: userData.name.trim(),
            whatsapp: userData.whatsapp.trim(),
          },
        },
      });

      if (error) {
        return { success: false, message: error.message };
      }

      if (!data.user) {
        return { success: false, message: 'Erro ao criar conta.' };
      }

      // Create or update profile row
      const newUser: User = {
        id: data.user.id,
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop',
        role: 'student',
        tier: 'Free',
        status: 'Ativo',
        whatsapp: userData.whatsapp.trim(),
        termsAccepted: userData.termsAccepted,
        termsAcceptedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString().split('T')[0],
        progress: { completedLessonIds: [] },
        notes: {},
      };

      await this.upsertProfile(newUser);
      return { success: true, user: newUser };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro no cadastro.' };
    }
  },

  async loginWithGoogle(): Promise<{ success: boolean; message?: string }> {
    if (!supabase) return { success: false, message: 'Supabase não está configurado.' };
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) return { success: false, message: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  },

  async logout(): Promise<void> {
    if (supabase) {
      await supabase.auth.signOut();
    }
  },

  // ------------------------------------------
  // PROFILES & STUDENTS
  // ------------------------------------------
  async getProfiles(): Promise<User[]> {
    if (!supabase) return [];
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

      if (error || !profiles) return [];

      const { data: progressList } = await supabase
        .from('user_progress')
        .select('*');

      const { data: notesList } = await supabase
        .from('user_notes')
        .select('*');

      return profiles.map((p) => {
        const userProgress = progressList?.find((pr) => pr.user_id === p.id);
        const userNotesRows = notesList?.filter((n) => n.user_id === p.id) || [];
        
        const notesObj: Record<string, string> = {};
        userNotesRows.forEach((nr) => {
          notesObj[nr.lesson_id] = nr.note;
        });

        return {
          id: p.id,
          name: p.name || '',
          email: p.email || '',
          avatar: p.avatar || '',
          role: (p.role as any) || 'student',
          tier: (p.tier as any) || 'Free',
          status: (p.status as any) || 'Ativo',
          joinedAt: p.joined_at || '',
          expiresAt: p.expires_at,
          whatsapp: p.whatsapp,
          password: p.password,
          tradingMarket: p.trading_market,
          tradingStyle: p.trading_style,
          dailyTarget: p.daily_target,
          bio: p.bio,
          termsAccepted: p.terms_accepted,
          termsAcceptedAt: p.terms_accepted_at,
          customAllowedModuleIds: p.custom_allowed_module_ids,
          progress: {
            completedLessonIds: userProgress?.completed_lesson_ids || [],
            lastWatchedLessonId: userProgress?.last_watched_lesson_id,
            lastWatchedModuleId: userProgress?.last_watched_module_id,
          },
          notes: notesObj,
        };
      });
    } catch (e) {
      console.error('Error fetching profiles from Supabase:', e);
      return [];
    }
  },

  async getProfileById(userId: string): Promise<User | null> {
    const profiles = await this.getProfiles();
    return profiles.find((p) => p.id === userId) || null;
  },

  async upsertProfile(user: User): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        tier: user.tier,
        status: user.status,
        joined_at: user.joinedAt,
        expires_at: user.expiresAt,
        whatsapp: user.whatsapp,
        password: user.password,
        trading_market: user.tradingMarket,
        trading_style: user.tradingStyle,
        daily_target: user.dailyTarget,
        bio: user.bio,
        terms_accepted: user.termsAccepted,
        terms_accepted_at: user.termsAcceptedAt,
        custom_allowed_module_ids: user.customAllowedModuleIds,
        updated_at: new Date().toISOString(),
      });

      // Also upsert progress
      if (user.progress) {
        await supabase.from('user_progress').upsert({
          user_id: user.id,
          completed_lesson_ids: user.progress.completedLessonIds || [],
          last_watched_lesson_id: user.progress.lastWatchedLessonId,
          last_watched_module_id: user.progress.lastWatchedModuleId,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.error('Error upserting profile in Supabase:', e);
    }
  },

  async deleteProfile(userId: string): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (e) {
      console.error('Error deleting profile in Supabase:', e);
    }
  },

  // ------------------------------------------
  // MODULES & LESSONS
  // ------------------------------------------
  async getModules(): Promise<Module[]> {
    if (!supabase) return [];
    try {
      const { data: dbModules, error: modErr } = await supabase
        .from('modules')
        .select('*')
        .order('order_index', { ascending: true });

      if (modErr || !dbModules || dbModules.length === 0) return [];

      const { data: dbLessons } = await supabase
        .from('lessons')
        .select('*')
        .order('order_index', { ascending: true });

      const { data: dbMaterials } = await supabase
        .from('materials')
        .select('*');

      const { data: dbComments } = await supabase
        .from('lesson_comments')
        .select('*')
        .order('created_at', { ascending: false });

      return dbModules.map((m) => {
        const moduleLessons = (dbLessons || [])
          .filter((l) => l.module_id === m.id)
          .map((l) => {
            const lessonMats = (dbMaterials || [])
              .filter((mat) => mat.lesson_id === l.id)
              .map((mat) => ({
                id: mat.id,
                title: mat.title,
                url: mat.url,
                type: mat.type as any,
                size: mat.size,
              }));

            const lessonComms = (dbComments || [])
              .filter((c) => c.lesson_id === l.id && !c.parent_id)
              .map((c) => ({
                id: c.id,
                userName: c.user_name,
                userAvatar: c.user_avatar,
                userRole: c.user_role as any,
                date: new Date(c.created_at).toLocaleDateString('pt-BR'),
                text: c.text,
                likes: c.likes || 0,
              }));

            return {
              id: l.id,
              moduleId: m.id,
              title: l.title,
              description: l.description || '',
              youtubeUrl: l.youtube_url || '',
              durationMinutes: l.duration_minutes || 0,
              order: l.order_index || 0,
              materials: lessonMats.length > 0 ? lessonMats : undefined,
              comments: lessonComms.length > 0 ? lessonComms : undefined,
              keyTakeaways: l.key_takeaways || [],
            };
          });

        return {
          id: m.id,
          title: m.title,
          subtitle: m.subtitle || '',
          description: m.description || '',
          coverImage: m.cover_image || '',
          category: m.category || '',
          order: m.order_index || 0,
          requiredTier: m.required_tier as any,
          badgeText: m.badge_text,
          isNew: m.is_new,
          isLiveModule: m.is_live_module,
          lessons: moduleLessons,
        };
      });
    } catch (e) {
      console.error('Error fetching modules from Supabase:', e);
      return [];
    }
  },

  async saveModules(modules: Module[]): Promise<void> {
    if (!supabase) return;
    try {
      for (const m of modules) {
        await supabase.from('modules').upsert({
          id: m.id,
          title: m.title,
          subtitle: m.subtitle,
          description: m.description,
          cover_image: m.coverImage,
          category: m.category,
          order_index: m.order,
          required_tier: m.requiredTier,
          badge_text: m.badgeText,
          is_new: m.isNew,
          is_live_module: m.isLiveModule,
        });

        for (const l of m.lessons) {
          await supabase.from('lessons').upsert({
            id: l.id,
            module_id: m.id,
            title: l.title,
            description: l.description,
            youtube_url: l.youtubeUrl,
            duration_minutes: l.durationMinutes,
            order_index: l.order,
            key_takeaways: l.keyTakeaways,
          });

          if (l.materials) {
            for (const mat of l.materials) {
              await supabase.from('materials').upsert({
                id: mat.id,
                lesson_id: l.id,
                title: mat.title,
                url: mat.url,
                type: mat.type,
                size: mat.size,
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('Error saving modules to Supabase:', e);
    }
  },

  // ------------------------------------------
  // ANNOUNCEMENTS
  // ------------------------------------------
  async getAnnouncements(): Promise<Announcement[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('announcements').select('*');
      if (error || !data) return [];
      return data.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        date: a.date,
        type: a.type as any,
        linkText: a.link_text,
        linkUrl: a.link_url,
        isPinned: a.is_pinned,
      }));
    } catch (e) {
      console.error('Error fetching announcements:', e);
      return [];
    }
  },

  async saveAnnouncements(announcements: Announcement[]): Promise<void> {
    if (!supabase) return;
    try {
      for (const a of announcements) {
        await supabase.from('announcements').upsert({
          id: a.id,
          title: a.title,
          content: a.content,
          date: a.date,
          type: a.type,
          link_text: a.linkText,
          link_url: a.linkUrl,
          is_pinned: a.isPinned,
        });
      }
    } catch (e) {
      console.error('Error saving announcements to Supabase:', e);
    }
  },

  // ------------------------------------------
  // LIVE SESSIONS
  // ------------------------------------------
  async getLiveSessions(): Promise<LiveSession[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('live_sessions').select('*');
      if (error || !data) return [];
      return data.map((l) => ({
        id: l.id,
        title: l.title,
        date: l.date,
        time: l.time,
        topic: l.topic,
        status: l.status as any,
        youtubeUrl: l.youtube_url,
        zoomUrl: l.zoom_url,
        instructor: l.instructor,
      }));
    } catch (e) {
      console.error('Error fetching live sessions:', e);
      return [];
    }
  },

  async saveLiveSessions(sessions: LiveSession[]): Promise<void> {
    if (!supabase) return;
    try {
      for (const s of sessions) {
        await supabase.from('live_sessions').upsert({
          id: s.id,
          title: s.title,
          date: s.date,
          time: s.time,
          topic: s.topic,
          status: s.status,
          youtube_url: s.youtubeUrl,
          zoom_url: s.zoomUrl,
          instructor: s.instructor,
        });
      }
    } catch (e) {
      console.error('Error saving live sessions to Supabase:', e);
    }
  },

  // ------------------------------------------
  // SETTINGS
  // ------------------------------------------
  async getSettings(): Promise<PlatformSettings | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('platform_settings').select('*').eq('id', 'default').single();
      if (error || !data) return null;
      return {
        platformName: data.platform_name,
        mentorName: data.mentor_name,
        tagline: data.tagline,
        supportWhatsapp: data.support_whatsapp,
        telegramVipUrl: data.telegram_vip_url,
        discordVipUrl: data.discord_vip_url,
        instagramUrl: data.instagram_url,
        bannerHeadline: data.banner_headline,
        bannerSubtext: data.banner_subtext,
        primaryColor: data.primary_color,
      };
    } catch (e) {
      console.error('Error fetching settings:', e);
      return null;
    }
  },

  async saveSettings(settings: PlatformSettings): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('platform_settings').upsert({
        id: 'default',
        platform_name: settings.platformName,
        mentor_name: settings.mentorName,
        tagline: settings.tagline,
        support_whatsapp: settings.supportWhatsapp,
        telegram_vip_url: settings.telegramVipUrl,
        discord_vip_url: settings.discordVipUrl,
        instagram_url: settings.instagramUrl,
        banner_headline: settings.bannerHeadline,
        banner_subtext: settings.bannerSubtext,
        primary_color: settings.primaryColor,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error saving settings to Supabase:', e);
    }
  },

  // ------------------------------------------
  // TRADE JOURNAL
  // ------------------------------------------
  async getJournal(userId?: string): Promise<TradeJournalEntry[]> {
    if (!supabase) return [];
    try {
      let query = supabase.from('trade_journal').select('*').order('date', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (error || !data) return [];
      return data.map((j) => ({
        id: j.id,
        date: j.date,
        asset: j.asset as any,
        type: j.type as any,
        contracts: Number(j.contracts),
        entryPrice: Number(j.entry_price),
        exitPrice: Number(j.exit_price),
        resultCurrency: Number(j.result_currency),
        setupName: j.setup_name,
        outcome: j.outcome as any,
        notes: j.notes,
        screenshotUrl: j.screenshot_url,
      }));
    } catch (e) {
      console.error('Error fetching trade journal:', e);
      return [];
    }
  },

  async saveJournal(journal: TradeJournalEntry[], userId?: string): Promise<void> {
    if (!supabase) return;
    try {
      for (const j of journal) {
        await supabase.from('trade_journal').upsert({
          id: j.id,
          user_id: userId,
          date: j.date,
          asset: j.asset,
          type: j.type,
          contracts: j.contracts,
          entry_price: j.entryPrice,
          exit_price: j.exitPrice,
          result_currency: j.resultCurrency,
          setup_name: j.setupName,
          outcome: j.outcome,
          notes: j.notes,
          screenshot_url: j.screenshotUrl,
        });
      }
    } catch (e) {
      console.error('Error saving trade journal:', e);
    }
  }
};
