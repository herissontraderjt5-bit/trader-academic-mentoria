import { Module, User, Announcement, LiveSession, PlatformSettings, TradeJournalEntry } from '../types';

export const INITIAL_SETTINGS: PlatformSettings = {
  platformName: 'Trader Academic',
  mentorName: 'Mestre Trader & Equipe',
  tagline: 'Da Teoria à Consistência Operacional nos Mercados Financeiros',
  supportWhatsapp: '5511999999999',
  telegramVipUrl: 'https://t.me/traderacademicvip',
  discordVipUrl: 'https://discord.gg/traderacademic',
  instagramUrl: 'https://instagram.com/traderacademic',
  bannerHeadline: 'DOMINE O MERCADO COM MÉTODO E DISCIPLINA',
  bannerSubtext: 'Acesse o curso gratuito de Opções Binárias e faça o upgrade para a Formação Completa VIP por apenas R$ 499,90.',
  primaryColor: '#ff6b00',
  caktoCheckoutUrl: 'https://pay.cakto.com.br/checkout/trader-academic-vip',
};

export const INITIAL_MODULES: Module[] = [];


export const INITIAL_STUDENTS: User[] = [
  {
    id: 'usr-admin-herisson',
    name: 'Herisson Trader (ADM)',
    email: 'herisson.trader.jt5@gmail.com',
    password: 'Trader@123',
    termsAccepted: true,
    termsAcceptedAt: '2025-01-15T10:00:00Z',
    avatar: '',
    role: 'admin',
    tier: 'VIP',
    status: 'Ativo',
    joinedAt: '2025-01-15',
    whatsapp: '551199887766',
    progress: {
      completedLessonIds: [],
      lastWatchedLessonId: '',
      lastWatchedModuleId: ''
    },
    notes: {}
  },
  {
    id: 'usr-admin-vinicius',
    name: 'Vinicius Sestrem (ADM)',
    email: 'viniciussestremmm@gmail.com',
    password: 'Trader@123',
    termsAccepted: true,
    termsAcceptedAt: '2025-01-15T10:00:00Z',
    avatar: '',
    role: 'admin',
    tier: 'VIP',
    status: 'Ativo',
    joinedAt: '2025-01-15',
    whatsapp: '551199887766',
    progress: {
      completedLessonIds: [],
      lastWatchedLessonId: '',
      lastWatchedModuleId: ''
    },
    notes: {}
  }
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: '🚨 NOVO MÓDULO FREE: Curso Completo de Opções Binárias Liberado!',
    content: 'O módulo completo de Opções Binárias (Price Action em M1/M5, suporte e resistência e gestão sem gale) está 100% liberado para todos os membros Free.',
    date: 'Hoje',
    type: 'material',
    linkText: 'Acessar Módulo Free de Binárias',
    linkUrl: '#',
    isPinned: true,
  },
  {
    id: 'ann-2',
    title: '💎 Garanta seu Acesso VIP por apenas R$ 499,90 (Pagamento Único)',
    content: 'Faça o upgrade para o Plano VIP e libere todos os módulos de Mini-Índice, Mini-Dólar, Tape Reading, Salas Ao Vivo e Setups Exclusivos.',
    date: 'Ontem',
    type: 'update',
    linkText: 'Fazer Upgrade VIP',
    linkUrl: '#',
    isPinned: true,
  }
];

export const INITIAL_LIVE_SESSIONS: LiveSession[] = [
  {
    id: 'live-1',
    title: 'Sala Operacional Ao Vivo: Pregão B3 & Abertura de NY',
    date: 'Amanhã',
    time: '08:50 às 11:30',
    topic: 'Operando Abertura do Mini-Índice e Mini-Dólar com Leitura de Fluxo Institucional (Exclusivo VIP)',
    status: 'upcoming',
    instructor: 'Mestre Trader',
    zoomUrl: 'https://zoom.us/j/traderacademicvip'
  }
];

export const INITIAL_JOURNAL: TradeJournalEntry[] = [
  {
    id: 'j-1',
    date: 'Hoje',
    asset: 'EURUSD',
    type: 'BUY',
    contracts: 1,
    entryPrice: 1.0825,
    exitPrice: 1.0832,
    resultCurrency: 185.00,
    setupName: 'Retração em M1 Suporte H1',
    outcome: 'GAIN',
    notes: 'Entrada perfeita no terceiro toque da região de suporte com payout 87%.'
  }
];
