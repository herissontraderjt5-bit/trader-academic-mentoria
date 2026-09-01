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
  lifetimePrice: 499.90,
  candlexMaintenanceMode: false,
  candlexMaintenanceTitle: 'Atenção: CandleX-IA está em manutenção e atualização',
  candlexMaintenanceMessage: 'Nossa inteligência artificial está passando por uma recalibração neural com novos modelos de análise institucional SMC e validação de confluências. O serviço será restabelecido em breve.',
  candlexMaintenanceEta: 'Previsão de retorno: Hoje às 22:00',
  candlexAiVersion: 'v2.6.0 Neural Ultra',
  candlexMaintenanceProgress: 85,
  candlexAllowAdminBypass: true,
};

export const INITIAL_MODULES: Module[] = [
  {
    id: 'mod-ob-free',
    title: 'Módulo: Formação Completa em Opções Binárias',
    subtitle: 'Do Zero aos Primeiros Lucros • Estratégias M1, M5, Suporte, Resistência & Gestão',
    description: 'Módulo 100% Liberado no Plano Free! Aprenda o funcionamento das corretoras (Pocket Option, Quotex, IQ Option), leitura de velas, gatilhos de retração, reversão, pullback e gestão matemática 2x1 sem gale.',
    coverImage: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=800&auto=format&fit=crop',
    category: 'Opções Binárias (Free)',
    order: 1,
    requiredTier: 'Free',
    badgeText: 'PLANO FREE LIBERADO',
    isNew: true,
    lessons: [
      {
        id: 'les-ob-1',
        moduleId: 'mod-ob-free',
        title: 'Aula 01: Introdução às Opções Binárias & Criação de Conta',
        description: 'Como funciona o mercado binário (Payout, Expiração, Paridades de Moedas OTC e Mercado Aberto). Configuração de gráficos e velas de 1 minuto.',
        youtubeUrl: 'https://www.youtube.com/watch?v=kY31FpT-hOU',
        durationMinutes: 22,
        order: 1,
        materials: [
          { id: 'mat-ob-1', title: 'Guia_Iniciante_Opcoes_Binarias.pdf', url: '#', type: 'pdf', size: '2.1 MB' },
          { id: 'mat-ob-2', title: 'Planilha_Gestao_Banca_Binarias_Free.xlsx', url: '#', type: 'spreadsheet', size: '1.2 MB' }
        ],
        keyTakeaways: [
          'Nunca opere com mais de 2% do seu capital total por clique.',
          'Evite horários de baixa volatilidade ou payouts abaixo de 80%.',
          'Sempre marque suportes e resistências em tempos maiores (M15 / H1).'
        ],
        comments: [
          {
            id: 'c-ob-1',
            userName: 'Lucas Mendes',
            userAvatar: '',
            userRole: 'student',
            date: 'Há 1 hora',
            text: 'Excelente explicação! Consegui configurar a plataforma e aplicar o gerenciamento de forma clara.',
            likes: 12
          }
        ]
      },
      {
        id: 'les-ob-2',
        moduleId: 'mod-ob-free',
        title: 'Aula 02: Price Action em M1 & M5 - Suporte, Resistência e Linhas de Tendência',
        description: 'Aprenda a traçar zonas de retração de vela, falsos rompimentos e a importância do histórico de toques (máximo 3 toques).',
        youtubeUrl: 'https://www.youtube.com/watch?v=F_3T216k5_U',
        durationMinutes: 32,
        order: 2,
        materials: [
          { id: 'mat-ob-3', title: 'Ebook_Gatilhos_Entrada_Retracao.pdf', url: '#', type: 'pdf', size: '3.4 MB' }
        ]
      },
      {
        id: 'les-ob-3',
        moduleId: 'mod-ob-free',
        title: 'Aula 03: Estratégia de Pullback e Rompimento com Confirmação de Volume',
        description: 'Como operar rompimentos verdadeiros e pegar a taxa no teste da região rompida.',
        youtubeUrl: 'https://www.youtube.com/watch?v=r_s9s88h9b0',
        durationMinutes: 28,
        order: 3
      },
      {
        id: 'les-ob-4',
        moduleId: 'mod-ob-free',
        title: 'Aula 04: Gestão de Banca 2x1 & Soros Nível 1 sem Martingale',
        description: 'A matemática para ser lucrativo mesmo acertando 50% a 60% das operações, eliminando o risco de quebrar a banca.',
        youtubeUrl: 'https://www.youtube.com/watch?v=b0VwJ3J5u34',
        durationMinutes: 25,
        order: 4
      }
    ]
  },
  {
    id: 'mod-1',
    title: 'Módulo 1: Boas-Vindas & Alinhamento de Expectativas VIP',
    subtitle: 'O mapa mental para a consistência e configuração de telas',
    description: 'Entenda os pilares da mentoria avançada, mentalidade de alta performance no mercado e configure seu ambiente operacional (Profit, MetaTrader, TradingView) como um profissional.',
    coverImage: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop',
    category: 'Formação VIP',
    order: 2,
    requiredTier: 'VIP',
    badgeText: 'VIP (R$ 499,90)',
    isNew: false,
    lessons: [
      {
        id: 'les-1-1',
        moduleId: 'mod-1',
        title: 'Aula 01: Boas-vindas à Mentoria Trader Academic VIP',
        description: 'Apresentação da metodologia, cronograma das aulas e como extrair o máximo do portal de membros.',
        youtubeUrl: 'https://www.youtube.com/watch?v=kY31FpT-hOU',
        durationMinutes: 18,
        order: 1,
        materials: [
          { id: 'mat-1', title: 'Guia do Aluno & Cronograma Oficial.pdf', url: '#', type: 'pdf', size: '2.4 MB' },
          { id: 'mat-2', title: 'Comunidade VIP no Telegram (Link Direto)', url: 'https://t.me/traderacademicvip', type: 'link' }
        ],
        keyTakeaways: [
          'Assista os módulos na ordem cronológica recomendada.',
          'Nunca opere na conta real antes de validar o gerenciamento de risco no simulador.',
          'Participe dos plantões de dúvidas semanais.'
        ]
      },
      {
        id: 'les-1-2',
        moduleId: 'mod-1',
        title: 'Aula 02: Configuração Profissional do Profit Pro & Telas',
        description: 'Passo a passo da montagem do layout operacional: Times & Trades, Livro Visual, SuperDOM e Gráficos de Candlestick e Renko.',
        youtubeUrl: 'https://www.youtube.com/watch?v=F_3T216k5_U',
        durationMinutes: 34,
        order: 2,
        materials: [
          { id: 'mat-3', title: 'Arquivo de Layout_Profit_Oficial.export', url: '#', type: 'indicator', size: '1.1 MB' }
        ]
      }
    ]
  },
  {
    id: 'mod-2',
    title: 'Módulo 2: Fundamentos do Mercado B3 & Mini-Contratos',
    subtitle: 'Mini-Índice (WIN), Mini-Dólar (WDO) e Horários Nobres',
    description: 'Compreenda a mecânica por trás da B3 e mercados futuros, precificação de contratos, pontuação, margens de garantia e horários institucionais.',
    coverImage: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop',
    category: 'Mercado B3',
    order: 3,
    requiredTier: 'VIP',
    badgeText: 'VIP',
    isNew: false,
    lessons: [
      {
        id: 'les-2-1',
        moduleId: 'mod-2',
        title: 'Aula 01: Como Funciona o Mini-Índice (WIN) e Mini-Dólar (WDO)',
        description: 'Variação em pontos, cálculo de ganho e perda por contrato, rollover de contratos e alavancagem inteligente.',
        youtubeUrl: 'https://www.youtube.com/watch?v=r_s9s88h9b0',
        durationMinutes: 28,
        order: 1
      },
      {
        id: 'les-2-2',
        moduleId: 'mod-2',
        title: 'Aula 02: Horários Nobres de Liquidez & Calendário Econômico',
        description: 'Abertura do mercado à vista (10h), abertura de Nova York (10h30), Payroll, CPI e decisões de taxa de juros.',
        youtubeUrl: 'https://www.youtube.com/watch?v=b0VwJ3J5u34',
        durationMinutes: 31,
        order: 2
      }
    ]
  },
  {
    id: 'mod-3',
    title: 'Módulo 3: Price Action Avançado & Estrutura Institucional',
    subtitle: 'Leitura pura do gráfico, fractais, topos, fundos e gatilhos de alta precisão',
    description: 'Aprenda a ler o contexto institucional sem se perder em indicadores confusos. Suportes e resistências dinâmicas, canais, lateralidades e rompimentos verdadeiros.',
    coverImage: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?q=80&w=800&auto=format&fit=crop',
    category: 'Análise Técnica VIP',
    order: 4,
    requiredTier: 'VIP',
    badgeText: 'VIP',
    isNew: false,
    lessons: [
      {
        id: 'les-3-1',
        moduleId: 'mod-3',
        title: 'Aula 01: Identificação de Tendências Fortes vs Mercados Laterais',
        description: 'Como classificar o estado do mercado logo nos primeiros 30 minutos de pregão.',
        youtubeUrl: 'https://www.youtube.com/watch?v=F_3T216k5_U',
        durationMinutes: 42,
        order: 1
      },
      {
        id: 'les-3-2',
        moduleId: 'mod-3',
        title: 'Aula 02: O Segredo dos Falsos Rompimentos (Traps Institucionais)',
        description: 'Onde os amadores colocam o stop e como os grandes bancos exploram essa liquidez para entrar pesado.',
        youtubeUrl: 'https://www.youtube.com/watch?v=r_s9s88h9b0',
        durationMinutes: 38,
        order: 2
      }
    ]
  },
  {
    id: 'mod-4',
    title: 'Módulo 4: Order Flow & Leitura de Fluxo (Tape Reading)',
    subtitle: 'Enxergando a pegada dos grandes bancos e tesourarias',
    description: 'Vá além do gráfico e veja o rastro dos grandes players: agressão no Times & Trades, absorção no Book de Ofertas e Volume at Price.',
    coverImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=800&auto=format&fit=crop',
    category: 'Tape Reading VIP',
    order: 5,
    requiredTier: 'VIP',
    badgeText: 'VIP EXCLUSIVO',
    isNew: true,
    lessons: [
      {
        id: 'les-4-1',
        moduleId: 'mod-4',
        title: 'Aula 01: Fundamentos de Tape Reading e Times & Trades',
        description: 'Identificando agressão de compra e venda e lotes ocultos (Iceberg orders).',
        youtubeUrl: 'https://www.youtube.com/watch?v=b0VwJ3J5u34',
        durationMinutes: 45,
        order: 1
      }
    ]
  },
  {
    id: 'mod-5',
    title: 'Módulo 5: Setups Proprietários & Gerenciamento R$ 499 VIP',
    subtitle: 'Estratégias testadas com mais de 75% de assertividade e gestão 3:1',
    description: 'Nossos 4 principais setups de entrada detalhados: Trap de Abertura, Reversão de VWAP, Pullback em Médias e Scalp no Dólar.',
    coverImage: 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=800&auto=format&fit=crop',
    category: 'Setups VIP',
    order: 6,
    requiredTier: 'VIP',
    badgeText: 'VIP',
    isNew: false,
    lessons: [
      {
        id: 'les-5-1',
        moduleId: 'mod-5',
        title: 'Aula 01: Setup 01 - O Trap de Abertura no Mini-Índice',
        description: 'Regras de entrada, stop técnico e alvos de 500 a 1000 pontos.',
        youtubeUrl: 'https://www.youtube.com/watch?v=r_s9s88h9b0',
        durationMinutes: 48,
        order: 1
      }
    ]
  },
  {
    id: 'mod-6',
    title: 'Módulo 6: Gravações de Salas Operacionais Ao Vivo & Indicadores',
    subtitle: 'Pregões reais comentados segundo a segundo e indicadores VIP para download',
    description: 'Veja na prática como lemos o mercado ao vivo em dias de alta volatilidade com execução em tempo real e faça o download das regras de coloração.',
    coverImage: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=800&auto=format&fit=crop',
    category: 'Ao Vivo & Ferramentas',
    order: 7,
    requiredTier: 'VIP',
    badgeText: 'AO VIVO GRAVADO',
    isLiveModule: true,
    isNew: true,
    lessons: [
      {
        id: 'les-6-1',
        moduleId: 'mod-6',
        title: 'Sala 01: Operando o Payroll ao Vivo (+1.850 Pontos no WIN)',
        description: 'Leitura da reação da taxa de desemprego dos EUA e execução precisa.',
        youtubeUrl: 'https://www.youtube.com/watch?v=b0VwJ3J5u34',
        durationMinutes: 62,
        order: 1
      }
    ]
  }
];

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
