import React, { useState, useRef } from 'react';
import { 
  Award, 
  X, 
  Printer, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Flame,
  Globe,
  TrendingUp,
  BarChart2,
  Download,
  MessageCircle
} from 'lucide-react';
import { User, PlatformSettings } from '../../types';
import { BrandLogo } from '../BrandLogo';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  settings: PlatformSettings;
  overallProgress: { completed: number; total: number; percentage: number };
}

export type CertCategory = 'b3' | 'binarias' | 'forex';

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  overallProgress,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CertCategory>('b3');
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Unlocked check: VIP + 100% progress OR explicitly allowed by Admin OR user is Admin
  const isCategoryUnlocked = (cat: CertCategory) => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.allowedCertificates?.includes(cat)) return true;
    if (currentUser.tier === 'VIP' && overallProgress.percentage >= 100) return true;
    return false;
  };

  const currentUnlocked = isCategoryUnlocked(selectedCategory);

  const handlePrint = () => {
    window.print();
  };

  const handleOpenWhatsapp = () => {
    const phone = settings.supportWhatsapp || '5511999999999';
    const catName = selectedCategory === 'b3' ? 'B3 (Mini-Índice/Dólar)' : selectedCategory === 'binarias' ? 'Opções Binárias' : 'Forex';
    const msg = encodeURIComponent(`Olá! Sou o aluno ${currentUser.name} (${currentUser.email}). Gostaria de solicitar a liberação do meu Certificado de Conclusão em ${catName} na plataforma.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const certConfig = {
    b3: {
      title: 'MERCADO NACIONAL B3 & FUTUROS',
      subtitle: 'MINI-ÍNDICE (WIN) • MINI-DÓLAR (WDO) • TAPE READING & FLUXO',
      badge: 'CERTIFICADO B3',
      description: 'concluiu com aproveitamento máximo a formação profissional em Operação de Mercados Futuros Nacionais (B3), demonstrando domínio em Leitura de Fluxo Institucional (Tape Reading), Price Action Avançado, Gestão de Risco e Controle Emocional em Pregão Ao Vivo.',
      codePrefix: 'TA-CERT-B3',
    },
    binarias: {
      title: 'OPÇÕES BINÁRIAS & PRICE ACTION',
      subtitle: 'ANÁLISE TÉCNICA M1/M5 • RETRAÇÃO • SUPORTE & RESISTÊNCIA',
      badge: 'CERTIFICADO OPÇÕES BINÁRIAS',
      description: 'concluiu com aproveitamento máximo a formação profissional em Opções Binárias, demonstrando amplo domínio em Operações de Retração em M1/M5, Leitura de Velas, Gestão de Banca sem Martingale e Disciplina Operacional.',
      codePrefix: 'TA-CERT-OB',
    },
    forex: {
      title: 'FOREX & MERCADO INTERNACIONAL',
      subtitle: 'PARES DE MOEDAS • ANÁLISE MACROECONÔMICA • GESTÃO DE LOTE',
      badge: 'CERTIFICADO FOREX',
      description: 'concluiu com aproveitamento máximo a formação em Operações no Mercado Internacional de Câmbio (Forex), demonstrando domínio em Análise Macroeconômica, Gestão de Lotes (Lot Size), Estrutura de Tendência de Longo Prazo e Gerenciamento de Risco Global.',
      codePrefix: 'TA-CERT-FX',
    },
  }[selectedCategory];

  const certCode = `${certConfig.codePrefix}-${currentUser.id.slice(-6).toUpperCase()}-2026`;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="w-full max-w-4xl bg-[#0c0c12] border border-[#272737] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto print:border-0 print:shadow-none print:max-w-none print:w-full print:bg-white">
        
        {/* Modal Header Bar (Hidden on Print) */}
        <div className="p-4 sm:p-6 bg-[#13131c] border-b border-[#242433] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Certificados de Conclusão Oficial
              </h3>
              <p className="text-xs text-zinc-400">
                Alunos VIP com 100% de progresso ou liberados pelo Administrador
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentUnlocked && (
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 cursor-pointer transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir / PDF</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs Bar (Hidden on Print) */}
        <div className="bg-[#09090e] px-4 sm:px-6 pt-3 border-b border-white/5 flex gap-2 overflow-x-auto print:hidden">
          <button
            onClick={() => setSelectedCategory('b3')}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedCategory === 'b3'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Certificado B3 (Mini-Índice & Dólar)</span>
            {isCategoryUnlocked('b3') && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => setSelectedCategory('binarias')}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedCategory === 'binarias'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Certificado Opções Binárias</span>
            {isCategoryUnlocked('binarias') && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>

          <button
            onClick={() => setSelectedCategory('forex')}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${
              selectedCategory === 'forex'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Certificado Forex</span>
            {isCategoryUnlocked('forex') && (
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            )}
          </button>
        </div>

        {/* Certificate Display Area */}
        <div className="p-4 sm:p-8 flex items-center justify-center bg-[#07070a] print:p-0 print:bg-white">
          {!currentUnlocked ? (
            /* LOCKED STATE CARD */
            <div className="w-full max-w-xl p-8 rounded-3xl bg-zinc-900/90 border border-orange-500/30 text-center space-y-5 animate-in zoom-in-95 my-8">
              <div className="w-16 h-16 rounded-2xl bg-orange-950/80 border border-orange-500/40 text-orange-500 flex items-center justify-center mx-auto shadow-xl shadow-orange-950/50">
                <Lock className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 text-[10px] font-black uppercase tracking-wider font-mono">
                  {certConfig.badge} BLOQUEADO
                </span>
                <h3 className="text-xl font-black text-white mt-2 uppercase tracking-tight">
                  Certificado Indisponível no Momento
                </h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  Para emitir e fazer o download do seu **{certConfig.badge}** oficial com selo verificado da Trader Academic, você precisa ser membro do **Plano VIP** e concluir 100% das aulas da mentoria (Progresso Atual: <strong className="text-orange-400 font-mono">{overallProgress.percentage}%</strong>), ou solicitar a disponibilidade diretamente ao Administrador.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleOpenWhatsapp}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/20 cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Pedir Liberação no WhatsApp</span>
                </button>
              </div>
            </div>
          ) : (
            /* UNLOCKED CERTIFICATE CANVAS */
            <div
              ref={certificateRef}
              className="w-full max-w-3xl aspect-[1.414/1] bg-gradient-to-br from-[#0c0c14] via-[#12121c] to-[#08080c] border-[6px] border-orange-500/60 rounded-3xl p-6 sm:p-10 relative flex flex-col justify-between shadow-[0_0_60px_rgba(249,115,22,0.2)] text-center overflow-hidden select-none print:border-4 print:border-black print:bg-white print:text-black print:shadow-none print:aspect-[1.414/1] print:w-full print:h-auto"
            >
              {/* Background Watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Award className="w-[450px] h-[450px] text-orange-500" />
              </div>

              {/* Decorative Corner Ornaments */}
              <div className="absolute top-4 left-4 w-12 h-12 border-t-2 border-l-2 border-orange-500/60 rounded-tl-xl pointer-events-none"></div>
              <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-orange-500/60 rounded-tr-xl pointer-events-none"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 border-b-2 border-l-2 border-orange-500/60 rounded-bl-xl pointer-events-none"></div>
              <div className="absolute bottom-4 right-4 w-12 h-12 border-b-2 border-r-2 border-orange-500/60 rounded-br-xl pointer-events-none"></div>

              {/* Certificate Top Header */}
              <div className="relative z-10">
                <div className="flex justify-center mb-3">
                  <BrandLogo className="h-10 sm:h-12 w-auto" size={48} showText={true} />
                </div>

                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="w-10 h-[2px] bg-orange-500/60"></span>
                  <span className="text-[10px] sm:text-xs font-black tracking-widest text-orange-400 uppercase font-mono">
                    TRADER ACADEMIC • CERTIFICAÇÃO PROFISSIONAL
                  </span>
                  <span className="w-10 h-[2px] bg-orange-500/60"></span>
                </div>

                <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-wider font-serif">
                  CERTIFICADO DE CONCLUSÃO
                </h1>
                <p className="text-[10px] sm:text-xs text-zinc-400 mt-1 uppercase tracking-widest font-mono font-bold">
                  {certConfig.subtitle}
                </p>
              </div>

              {/* Certificate Body Content */}
              <div className="relative z-10 my-4 space-y-3">
                <p className="text-xs sm:text-sm text-zinc-300 italic">
                  Certificamos para todos os devidos fins que o aluno(a)
                </p>

                <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 font-sans tracking-wide py-1">
                  {currentUser.name}
                </h2>

                <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto leading-relaxed">
                  {certConfig.description}
                </p>
              </div>

              {/* Certificate Footer Bar */}
              <div className="relative z-10 flex items-end justify-between pt-4 border-t border-white/10 text-left">
                <div>
                  <p className="text-[10px] text-zinc-500 uppercase font-mono">Código de Autenticidade:</p>
                  <p className="text-xs font-bold text-orange-400 font-mono">{certCode}</p>
                  <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                    Emitido em {new Date().toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Mentor Signature */}
                <div className="text-center">
                  <div className="w-44 border-b border-zinc-400 mb-1 mx-auto"></div>
                  <p className="text-xs font-extrabold text-white">{settings.mentorName || 'Herisson Trader'}</p>
                  <p className="text-[10px] text-orange-400 font-mono font-bold">Mentor Responsável & Master Trader</p>
                </div>

                {/* Verified Seal */}
                <div className="hidden sm:flex flex-col items-center">
                  <div className="w-11 h-11 rounded-full border-2 border-orange-500 flex items-center justify-center text-orange-400 bg-orange-500/10 shadow-lg shadow-orange-500/20">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] text-zinc-400 font-mono mt-1 uppercase font-bold tracking-wider">
                    Selo Oficial
                  </span>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
