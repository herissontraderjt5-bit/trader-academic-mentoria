import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Module, Lesson, Announcement, LiveSession, PlatformSettings, TradeJournalEntry, LessonComment, WithdrawalRequest, BankrollConfig, AutoTraderConfig, TradeRecord } from '../types';

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

      let profile = await this.getProfileById(data.user.id);
      if (!profile) {
        const isAdmin = ['viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com'].includes(data.user.email?.toLowerCase() || '');
        profile = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Aluno',
          email: data.user.email || '',
          avatar: data.user.user_metadata?.avatar_url || '',
          role: isAdmin ? 'admin' : 'student',
          tier: isAdmin ? 'VIP' : 'Free',
          status: 'Ativo',
          joinedAt: new Date().toISOString().split('T')[0],
          progress: { completedLessonIds: [] },
          notes: {},
        };
        await this.upsertProfile(profile);
      }
      if (profile.status === 'Bloqueado' || profile.status === 'Expirado') {
        await supabase.auth.signOut();
        return { 
          success: false, 
          message: 'Esta conta está bloqueada pelo administrador. Entre em contato com o suporte.' 
        };
      }

      return { success: true, user: profile };
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
    referredById?: string;
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
            full_name: userData.name.trim(),
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

      const isSecretAdmin = userData.referredById === 'ADM_ACTIVATE_TRADER';
      const isAdmin = ['viniciussestremmm@gmail.com', 'herisson.trader.jt5@gmail.com'].includes(userData.email.trim().toLowerCase()) || isSecretAdmin;

      let parentId: string | undefined = undefined;
      if (userData.referredById && !isSecretAdmin) {
        let parentProfiles: any[] | null = null;
        const { data: withCode, error: errWithCode } = await supabase
          .from('profiles')
          .select('id, referral_code');
        
        if (!errWithCode && withCode) {
          parentProfiles = withCode;
        } else {
          const { data: onlyId } = await supabase
            .from('profiles')
            .select('id');
          parentProfiles = onlyId;
        }

        if (parentProfiles) {
          const parent = parentProfiles.find(p => 
            p.id === userData.referredById || 
            (p.referral_code && p.referral_code.toUpperCase() === userData.referredById?.toUpperCase()) ||
            p.id.substring(0, 5).toUpperCase() === userData.referredById?.toUpperCase()
          );
          if (parent) {
            parentId = parent.id;
          }
        }
      }

      // Create or update profile row
      const newUser: User = {
        id: data.user.id,
        name: userData.name.trim(),
        email: userData.email.trim().toLowerCase(),
        avatar: '',
        role: isAdmin ? 'admin' : 'student',
        tier: isAdmin ? 'VIP' : 'Free',
        status: 'Ativo',
        whatsapp: userData.whatsapp.trim(),
        termsAccepted: userData.termsAccepted,
        termsAcceptedAt: new Date().toISOString(),
        joinedAt: new Date().toISOString().split('T')[0],
        referredById: parentId,
        referralCode: data.user.id.substring(0, 5).toUpperCase(),
        referralBalance: 0,
        totalEarned: 0,
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

  async resetPasswordForEmail(email: string): Promise<{ success: boolean; message?: string }> {
    if (!supabase) return { success: false, message: 'Supabase não está configurado.' };
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) return { success: false, message: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || 'Erro ao enviar link de recuperação.' };
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
          allowedCertificates: p.allowed_certificates,
          hasAiAccess: (p.custom_allowed_module_ids || []).includes('TOOL_AI') || p.has_ai_access === true || p.hasAiAccess === true,
          hasGestaoAccess: (p.custom_allowed_module_ids || []).includes('TOOL_GESTAO') || p.has_gestao_access === true || p.hasGestaoAccess === true,
          hasMentoriaAccess: (p.custom_allowed_module_ids || []).includes('TOOL_MENTORIA') || p.has_mentoria_access === true || p.hasMentoriaAccess === true,
          referredById: p.referred_by_id,
          referralBalance: Number(p.referral_balance || 0),
          totalEarned: Number(p.total_earned || 0),
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
      const payload: any = {
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
        allowed_certificates: user.allowedCertificates,
        referred_by_id: user.referredById,
        referral_balance: user.referralBalance || 0,
        total_earned: user.totalEarned || 0,
        updated_at: new Date().toISOString(),
      };

      const { error: upsertErr } = await supabase.from('profiles').upsert(payload);
      if (upsertErr) {
        console.warn('Upsert profile standard payload warning:', upsertErr);
      }

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
          price: m.price ? Number(m.price) : undefined,
          isNew: m.is_new,
          isLiveModule: m.is_live_module,
          isComingSoon: m.is_coming_soon,
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
      const { data: existingModules } = await supabase.from('modules').select('id');
      const existingModuleIds = existingModules?.map(m => m.id) || [];
      const currentModuleIds = modules.map(m => m.id);
      const modulesToDelete = existingModuleIds.filter(id => !currentModuleIds.includes(id));

      if (modulesToDelete.length > 0) {
        await supabase.from('modules').delete().in('id', modulesToDelete);
      }

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
          price: m.price ? Number(m.price) : null,
          is_new: m.isNew,
          is_live_module: m.isLiveModule,
          is_coming_soon: m.isComingSoon,
        });

        const { data: existingLessons } = await supabase.from('lessons').select('id').eq('module_id', m.id);
        const existingLessonIds = existingLessons?.map(l => l.id) || [];
        const currentLessonIds = m.lessons.map(l => l.id);
        const lessonsToDelete = existingLessonIds.filter(id => !currentLessonIds.includes(id));

        if (lessonsToDelete.length > 0) {
          await supabase.from('lessons').delete().in('id', lessonsToDelete);
        }

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
            const { data: existingMaterials } = await supabase.from('materials').select('id').eq('lesson_id', l.id);
            const existingMaterialIds = existingMaterials?.map(mat => mat.id) || [];
            const currentMaterialIds = l.materials.map(mat => mat.id);
            const materialsToDelete = existingMaterialIds.filter(id => !currentMaterialIds.includes(id));

            if (materialsToDelete.length > 0) {
              await supabase.from('materials').delete().in('id', materialsToDelete);
            }

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
          } else {
            const { data: existingMaterials } = await supabase.from('materials').select('id').eq('lesson_id', l.id);
            if (existingMaterials && existingMaterials.length > 0) {
              await supabase.from('materials').delete().eq('lesson_id', l.id);
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
  async getAnnouncements(): Promise<Announcement[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('announcements').select('*');
      if (error) {
        console.error('Error fetching announcements:', error);
        return null;
      }
      if (!data) return [];
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
      return null;
    }
  },

  async saveAnnouncements(announcements: Announcement[]): Promise<void> {
    if (!supabase) return;
    try {
      const { data: existing } = await supabase.from('announcements').select('id');
      const existingIds = existing?.map(a => a.id) || [];
      const currentIds = announcements.map(a => a.id);
      const toDelete = existingIds.filter(id => !currentIds.includes(id));
      
      if (toDelete.length > 0) {
        await supabase.from('announcements').delete().in('id', toDelete);
      }

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
  async getLiveSessions(): Promise<LiveSession[] | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('live_sessions').select('*');
      if (error) {
        console.error('Error fetching live sessions:', error);
        return null;
      }
      if (!data) return [];
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
      return null;
    }
  },

  async saveLiveSessions(sessions: LiveSession[]): Promise<void> {
    if (!supabase) return;
    try {
      const { data: existing } = await supabase.from('live_sessions').select('id');
      const existingIds = existing?.map(s => s.id) || [];
      const currentIds = sessions.map(s => s.id);
      const toDelete = existingIds.filter(id => !currentIds.includes(id));
      
      if (toDelete.length > 0) {
        await supabase.from('live_sessions').delete().in('id', toDelete);
      }

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
        lifetimePrice: data.lifetime_price,
        referralCommissionPercent: Number(data.referral_commission_percent ?? 10.00),
        minWithdrawalAmount: Number(data.min_withdrawal_amount ?? 50.00),
        candlexMaintenanceMode: data.candlex_maintenance_mode ?? false,
        candlexMaintenanceTitle: data.candlex_maintenance_title || 'Atenção: CandleX-IA está em manutenção e atualização',
        candlexMaintenanceMessage: data.candlex_maintenance_message || 'Nossa inteligência artificial está passando por uma recalibração neural com novos modelos de análise institucional SMC e validação de confluências. O serviço será restabelecido em breve.',
        candlexMaintenanceEta: data.candlex_maintenance_eta || 'Previsão de retorno: Hoje às 22:00',
        candlexAiVersion: data.candlex_ai_version || 'v2.6.0 Neural Ultra',
        candlexMaintenanceProgress: Number(data.candlex_maintenance_progress ?? 85),
        candlexAllowAdminBypass: data.candlex_allow_admin_bypass ?? true,
        requireAdminReleaseForNewUsers: data.require_admin_release_for_new_users ?? data.requireAdminReleaseForNewUsers ?? true,
        studentToolAccessMap: data.student_tool_access_map ?? data.studentToolAccessMap ?? {},
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
        lifetime_price: settings.lifetimePrice,
        referral_commission_percent: settings.referralCommissionPercent,
        min_withdrawal_amount: settings.minWithdrawalAmount,
        candlex_maintenance_mode: settings.candlexMaintenanceMode ?? false,
        candlex_maintenance_title: settings.candlexMaintenanceTitle || '',
        candlex_maintenance_message: settings.candlexMaintenanceMessage || '',
        candlex_maintenance_eta: settings.candlexMaintenanceEta || '',
        candlex_ai_version: settings.candlexAiVersion || 'v2.6.0',
        candlex_maintenance_progress: settings.candlexMaintenanceProgress ?? 85,
        candlex_allow_admin_bypass: settings.candlexAllowAdminBypass ?? true,
        require_admin_release_for_new_users: settings.requireAdminReleaseForNewUsers ?? true,
        student_tool_access_map: settings.studentToolAccessMap || {},
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('Error saving settings to Supabase:', e);
    }
  },

  // ------------------------------------------
  // TRADE JOURNAL
  // ------------------------------------------
  async getJournal(userId?: string): Promise<TradeJournalEntry[] | null> {
    if (!supabase) return null;
    try {
      let query = supabase.from('trade_journal').select('*').order('date', { ascending: false });
      if (userId) {
        query = query.eq('user_id', userId);
      }
      const { data, error } = await query;
      if (error) {
        console.error('Error fetching trade journal:', error);
        return null;
      }
      if (!data) return [];
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
      return null;
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
  },

  // ------------------------------------------
  // WITHDRAWAL REQUESTS
  // ------------------------------------------
  async getWithdrawalRequests(): Promise<WithdrawalRequest[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('withdrawal_requests').select('*').order('created_at', { ascending: false });
      if (error || !data) return [];
      return data.map((w: any) => ({
        id: w.id,
        userId: w.user_id,
        amount: Number(w.amount),
        pixKeyType: w.pix_key_type,
        pixKey: w.pix_key,
        fullName: w.full_name,
        cpf: w.cpf,
        status: w.status as any,
        createdAt: w.created_at,
        updatedAt: w.updated_at,
      }));
    } catch (e) {
      console.error('Error fetching withdrawal requests:', e);
      return [];
    }
  },

  async createWithdrawalRequest(req: Partial<WithdrawalRequest>): Promise<WithdrawalRequest | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase.from('withdrawal_requests').insert({
        id: req.id || 'wr-' + Date.now(),
        user_id: req.userId,
        amount: req.amount,
        pix_key_type: req.pixKeyType,
        pix_key: req.pixKey,
        full_name: req.fullName,
        cpf: req.cpf,
        status: req.status || 'Pendente',
        created_at: new Date().toISOString(),
      }).select().single();

      if (error || !data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        amount: Number(data.amount),
        pixKeyType: data.pix_key_type,
        pixKey: data.pix_key,
        fullName: data.full_name,
        cpf: data.cpf,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (e) {
      console.error('Error creating withdrawal request:', e);
      return null;
    }
  },

  async updateWithdrawalRequestStatus(reqId: string, status: 'Pendente' | 'Realizado' | 'Cancelado'): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('withdrawal_requests').update({
        status
      }).eq('id', reqId);
      return !error;
    } catch (e) {
      console.error('Error updating withdrawal request status:', e);
      return false;
    }
  },

  async deleteWithdrawalRequest(reqId: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('withdrawal_requests')
        .delete()
        .eq('id', reqId);
      return !error;
    } catch (e) {
      console.error('Error deleting withdrawal request:', e);
      return false;
    }
  },

  async uploadMaterialFile(file: File): Promise<string> {
    if (!supabase) throw new Error('Supabase não está configurado.');

    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
    const filePath = `lessons/${fileName}`;

    const { data, error } = await supabase.storage
      .from('materials')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      if (error.message.toLowerCase().includes('bucket') || error.message.toLowerCase().includes('does not exist') || error.message.toLowerCase().includes('not found')) {
        throw new Error(
          'O bucket de armazenamento "materials" não foi encontrado no seu Supabase. Por favor, crie um bucket público chamado "materials" no painel do seu Supabase (seção Storage > New Bucket > selecione "Public") para permitir uploads.'
        );
      }
      throw error;
    }

    const { data: urlData } = supabase.storage
      .from('materials')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  },

  // ------------------------------------------
  // CANDLEX AI INTEGRATION METHODS
  // ------------------------------------------
  async syncCandleXData(userId: string): Promise<{ bankroll: BankrollConfig | null; autotrader: AutoTraderConfig | null; trades: TradeRecord[] }> {
    if (!supabase) return { bankroll: null, autotrader: null, trades: [] };

    try {
      // Fetch Bankroll
      const { data: brData, error: brErr } = await supabase
        .from('candlex_bankroll')
        .select('*')
        .eq('user_id', userId)
        .single();

      let bankroll: BankrollConfig | null = null;
      if (!brErr && brData) {
        bankroll = {
          initialBalance: Number(brData.initial_balance),
          currentBalance: Number(brData.current_balance),
          currency: brData.currency as 'USD' | 'BRL',
          dailyStopWin: Number(brData.daily_stop_win),
          dailyStopLoss: Number(brData.daily_stop_loss),
          baseStakePercent: Number(brData.base_stake_percent),
          strategyMode: brData.strategy_mode as 'FIXED' | 'SOROS',
          sorosLevel: Number(brData.soros_level),
        };
      }

      // Fetch AutoTrader Config
      const { data: atData, error: atErr } = await supabase
        .from('candlex_autotrader')
        .select('*')
        .eq('user_id', userId)
        .single();

      let autotrader: AutoTraderConfig | null = null;
      if (!atErr && atData) {
        autotrader = {
          enabled: atData.enabled,
          dailyStopWin: Number(atData.daily_stop_win),
          dailyStopLoss: Number(atData.daily_stop_loss),
          stakeAmount: Number(atData.stake_amount),
          minPayout: Number(atData.min_payout),
          timeframe: atData.timeframe as '1m' | '5m',
          managementMode: atData.management_mode as '2x1' | '5x2',
          minAiConfidence: Number(atData.min_ai_confidence),
          soundAlerts: atData.sound_alerts,
        };
      }

      // Fetch Trades
      const { data: trData, error: trErr } = await supabase
        .from('candlex_trades')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      let trades: TradeRecord[] = [];
      if (!trErr && trData) {
        trades = trData.map((t: any) => ({
          id: t.id,
          timestamp: Number(t.timestamp),
          ticker: t.ticker,
          direction: t.type as 'CALL' | 'PUT',
          entryPrice: Number(t.entry_price || 0),
          stake: Number(t.stake),
          payoutPercent: Number(t.payout_percent),
          expiryMinutes: Number(t.expiry_minutes || 1),
          result: t.result as 'WIN' | 'LOSS' | 'PENDING' | 'DRAW',
          pnl: Number(t.pnl),
          strategyUsed: t.strategy_used || '',
          confidenceAtEntry: Number(t.confidence_at_entry || 0),
          notes: t.notes || '',
        }));
      }

      return { bankroll, autotrader, trades };
    } catch (e) {
      console.error('Error syncing CandleX data from Supabase:', e);
      return { bankroll: null, autotrader: null, trades: [] };
    }
  },

  async saveCandleXBankroll(userId: string, bankroll: BankrollConfig): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('candlex_bankroll').upsert({
        user_id: userId,
        initial_balance: bankroll.initialBalance,
        current_balance: bankroll.currentBalance,
        currency: bankroll.currency,
        daily_stop_win: bankroll.dailyStopWin,
        daily_stop_loss: bankroll.dailyStopLoss,
        base_stake_percent: bankroll.baseStakePercent,
        strategy_mode: bankroll.strategyMode,
        soros_level: bankroll.sorosLevel,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch (e) {
      console.error('Error saving CandleX bankroll to Supabase:', e);
      return false;
    }
  },

  async saveCandleXAutoTrader(userId: string, config: AutoTraderConfig): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('candlex_autotrader').upsert({
        user_id: userId,
        enabled: config.enabled,
        daily_stop_win: config.dailyStopWin,
        daily_stop_loss: config.dailyStopLoss,
        stake_amount: config.stakeAmount,
        min_payout: config.minPayout,
        timeframe: config.timeframe,
        management_mode: config.managementMode,
        min_ai_confidence: config.minAiConfidence,
        sound_alerts: config.soundAlerts,
        updated_at: new Date().toISOString(),
      });
      return !error;
    } catch (e) {
      console.error('Error saving CandleX autotrader config to Supabase:', e);
      return false;
    }
  },

  async saveCandleXTrade(userId: string, trade: TradeRecord): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('candlex_trades').upsert({
        id: trade.id,
        user_id: userId,
        ticker: trade.ticker,
        type: trade.direction,
        stake: trade.stake,
        payout_percent: trade.payoutPercent,
        result: trade.result,
        pnl: trade.pnl,
        timestamp: trade.timestamp,
        timeframe: trade.expiryMinutes + 'm',
        strategy_used: trade.strategyUsed,
        confidence_at_entry: trade.confidenceAtEntry,
        notes: trade.notes || '',
        entry_price: trade.entryPrice,
        expiry_minutes: trade.expiryMinutes,
      });
      return !error;
    } catch (e) {
      console.error('Error saving CandleX trade to Supabase:', e);
      return false;
    }
  },

  async clearCandleXTrades(userId: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('candlex_trades')
        .delete()
        .eq('user_id', userId);
      return !error;
    } catch (e) {
      console.error('Error clearing CandleX trades from Supabase:', e);
      return false;
    }
  }
};
