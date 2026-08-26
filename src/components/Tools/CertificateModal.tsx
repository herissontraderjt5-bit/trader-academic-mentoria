import React, { useState, useRef } from 'react';
import { 
  Award, 
  X, 
  Printer, 
  ShieldCheck, 
  Lock, 
  MessageCircle,
  Sparkles,
  TrendingUp,
  BarChart2,
  Globe
} from 'lucide-react';
import { User, PlatformSettings } from '../../types';
import logoImg from '../../assets/logo.png';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  settings: PlatformSettings;
  overallProgress: { completed: number; total: number; percentage: number };
}

export type CertCategory = 'b3' | 'binarias' | 'forex' | 'cripto';

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  overallProgress,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CertCategory>('binarias');
  const certificateRef = useRef<HTMLDivElement>(null);

  const formatDateForCert = () => {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}   /   ${month}   /   ${year}`;
  };

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
    const catName = selectedCategory === 'b3' 
      ? 'B3 (Mini-Índice/Dólar)' 
      : selectedCategory === 'binarias' 
        ? 'Opções Binárias' 
        : selectedCategory === 'forex' 
          ? 'Forex' 
          : 'Criptomoedas';
    const msg = encodeURIComponent(`Olá! Sou o aluno ${currentUser.name} (${currentUser.email}). Gostaria de solicitar a liberação do meu Certificado de Conclusão em ${catName} na plataforma.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  // SVGs for the content icons
  const iconCandlestick = (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M 6 3 L 6 21 M 3 6 H 9 V 18 H 3 Z M 18 3 L 18 21 M 15 9 H 21 V 15 H 15 Z" />
    </svg>
  );

  const iconGestao = (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M 3 3 V 21 H 21 M 7 17 L 11 11 L 15 14 L 21 6 M 21 6 H 16 M 21 6 V 11" />
    </svg>
  );

  const iconFluxo = (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M 17 4 L 21 8 L 17 12 M 21 8 H 3 M 7 20 L 3 16 L 7 12 M 3 16 H 21" />
    </svg>
  );

  const iconMapbook = (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M 4 19.5 A 2.5 2.5 0 0 1 6.5 17 H 20 M 4 19.5 A 2.5 2.5 0 0 0 6.5 22 H 20 M 4 19.5 V 3.5 A 2.5 2.5 0 0 1 6.5 1 H 20 V 17 H 6.5" />
    </svg>
  );

  const iconMentalidade = (
    <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M 17 21 V 19 A 4 4 0 0 0 13 15 H 5 A 4 4 0 0 0 1 19 V 21 M 9 11 A 4 4 0 1 0 9 3 A 4 4 0 1 0 9 11 Z M 23 21 V 19 A 4 4 0 0 0 19 15 H 17 M 16 3.13 A 4 4 0 0 1 16 10.88" />
    </svg>
  );

  // Configuration for each certificate category replica
  const certConfig = {
    b3: {
      badge: 'CERTIFICADO B3',
      courseName: 'B3',
      themeColor: '#4caf50', // Emerald Green
      textAccent: 'text-[#4caf50]',
      borderStyle: 'border-[#4caf50]/20',
      badgeBg: 'text-[#4caf50]',
      ribbonBg: 'text-[#2e7d32]',
      laurelColor: 'text-[#4caf50]/80',
      nameColor: 'text-[#dfb24c]', // Keep student name premium gold
      isDarkTheme: true,
      icons: [
        { label: 'SMC', text: 'SMC' },
        { label: 'FLUXO', svg: iconFluxo },
        { label: 'MAPBOOK ICT', svg: iconMapbook },
        { label: 'GESTÃO', svg: iconGestao }
      ]
    },
    binarias: {
      badge: 'CERTIFICADO OPÇÕES BINÁRIAS',
      courseName: 'OPÇÕES BINÁRIAS',
      themeColor: '#dfb24c', // Gold
      textAccent: 'text-[#dfb24c]',
      borderStyle: 'border-[#dfb24c]/20',
      badgeBg: 'text-[#dfb24c]',
      ribbonBg: 'text-[#9a7b30]',
      laurelColor: 'text-[#dfb24c]/80',
      nameColor: 'text-[#dfb24c]',
      isDarkTheme: true,
      icons: [
        { label: 'VELA A VELA', svg: iconCandlestick },
        { label: 'GESTÃO', svg: iconGestao },
        { label: 'PRICE ACTION', svg: iconCandlestick },
        { label: 'MENTALIDADE', svg: iconMentalidade }
      ]
    },
    forex: {
      badge: 'CERTIFICADO FOREX',
      courseName: 'FOREX',
      themeColor: '#0a3161', // Dark Blue
      textAccent: 'text-[#0a3161]',
      borderStyle: 'border-[#0a3161]/20',
      badgeBg: 'text-[#0a3161]',
      ribbonBg: 'text-[#184d85]',
      laurelColor: 'text-[#0a3161]/70',
      nameColor: 'text-[#0a3161]',
      isDarkTheme: false,
      icons: [
        { label: 'SMC', text: 'SMC' },
        { label: 'GESTÃO', svg: iconGestao },
        { label: 'MENTALIDADE', svg: iconMentalidade }
      ]
    },
    cripto: {
      badge: 'CERTIFICADO CRIPTO MOEDAS',
      courseName: 'CRIPTO MOEDAS',
      themeColor: '#a855f7', // Purple
      textAccent: 'text-[#a855f7]',
      borderStyle: 'border-[#a855f7]/20',
      badgeBg: 'text-[#a855f7]',
      ribbonBg: 'text-[#7e22ce]',
      laurelColor: 'text-[#a855f7]/80',
      nameColor: 'text-[#dfb24c]',
      isDarkTheme: true,
      icons: [
        { label: 'SMC', text: 'SMC' },
        { label: 'FLUXO', svg: iconFluxo },
        { label: 'PRICE ACTION', svg: iconCandlestick },
        { label: 'MENTALIDADE', svg: iconMentalidade }
      ]
    },
  }[selectedCategory];

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:static">
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Montserrat:wght@300;400;600;700;900&family=Alex+Brush&display=swap');
          .font-cert-title { font-family: 'Cinzel', serif; }
          .font-cert-sans { font-family: 'Montserrat', sans-serif; }
          .font-cert-sig { font-family: 'Alex Brush', cursive; }
          
          @media print {
            .print-hidden { display: none !important; }
            body { background: white !important; color: black !important; }
          }
        `}
      </style>
      
      <div className="w-full max-w-4xl bg-[#0c0c12] border border-[#272737] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto print:border-0 print:shadow-none print:max-w-none print:w-full print:bg-white">
        
        {/* Modal Header Bar (Hidden on Print) */}
        <div className="p-4 sm:p-6 bg-[#13131c] border-b border-[#242433] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print-hidden">
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
            /* REPLICA UNLOCKED CERTIFICATE CANVAS */
            <div
              ref={certificateRef}
              className={`w-full max-w-3xl aspect-[1.414/1] rounded-3xl relative overflow-hidden select-none border-[12px] double ${certConfig.borderStyle} flex flex-col justify-between p-6 sm:p-10 shadow-2xl print:border-[12px] print:border-black print:rounded-none print:shadow-none print:aspect-[1.414/1] print:w-full print:h-auto ${
                certConfig.isDarkTheme 
                  ? 'bg-gradient-to-br from-[#07070b] via-[#0d0d12] to-[#040406] text-white' 
                  : 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-[#0f3057]'
              }`}
            >
              {/* Financial Candlestick Watermark Background */}
              <div className="absolute inset-0 opacity-[0.025] pointer-events-none flex items-center justify-around">
                <svg className="w-full h-full text-current" viewBox="0 0 800 600" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M 100 200 L 100 400 M 80 250 H 120 V 350 H 80 Z" />
                  <path d="M 200 150 L 200 350 M 180 200 H 220 V 300 H 180 Z" />
                  <path d="M 300 300 L 300 500 M 280 350 H 320 V 450 H 280 Z" />
                  <path d="M 400 250 L 400 450 M 380 300 H 420 V 400 H 380 Z" />
                  <path d="M 500 100 L 500 300 M 480 150 H 520 V 250 H 480 Z" />
                  <path d="M 600 200 L 600 400 M 580 250 H 620 V 350 H 580 Z" />
                  <path d="M 700 150 L 700 350 M 680 200 H 720 V 300 H 680 Z" />
                </svg>
              </div>

              {/* Decorative Corner Ornaments */}
              <svg className={`absolute top-4 left-4 w-12 h-12 ${certConfig.textAccent} opacity-40`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 10 10 L 90 10 L 90 30 M 10 10 L 10 90 L 30 90 M 20 20 L 80 20 L 80 30 M 20 20 L 20 80 L 30 80" />
              </svg>
              <svg className={`absolute top-4 right-4 w-12 h-12 ${certConfig.textAccent} opacity-40 transform scale-x-[-1]`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 10 10 L 90 10 L 90 30 M 10 10 L 10 90 L 30 90 M 20 20 L 80 20 L 80 30 M 20 20 L 20 80 L 30 80" />
              </svg>
              <svg className={`absolute bottom-4 left-4 w-12 h-12 ${certConfig.textAccent} opacity-40 transform scale-y-[-1]`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 10 10 L 90 10 L 90 30 M 10 10 L 10 90 L 30 90 M 20 20 L 80 20 L 80 30 M 20 20 L 20 80 L 30 80" />
              </svg>
              <svg className={`absolute bottom-4 right-4 w-12 h-12 ${certConfig.textAccent} opacity-40 transform scale-x-[-1] scale-y-[-1]`} viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M 10 10 L 90 10 L 90 30 M 10 10 L 10 90 L 30 90 M 20 20 L 80 20 L 80 30 M 20 20 L 20 80 L 30 80" />
              </svg>

              {/* Left Brand Logo Side */}
              <div className="absolute left-6 sm:left-10 top-1/2 -translate-y-1/2 flex flex-col items-center">
                <img 
                  src={logoImg} 
                  alt="Logo Academic Trader" 
                  className={`w-20 sm:w-28 h-auto object-contain filter drop-shadow-lg ${certConfig.isDarkTheme ? '' : 'brightness-90 contrast-125'}`} 
                />
              </div>

              {/* Right Seal Badge Side */}
              <div className="absolute right-6 sm:right-10 top-[18%] flex flex-col items-center">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
                  {/* Ribbon tails */}
                  <svg className={`absolute bottom-[-12px] sm:bottom-[-15px] w-10 h-10 sm:w-14 sm:h-14 ${certConfig.ribbonBg}`} viewBox="0 0 100 100" fill="currentColor">
                    <path d="M 30 20 L 15 90 L 35 80 L 50 90 L 50 20 Z" />
                    <path d="M 70 20 L 85 90 L 65 80 L 50 90 L 50 20 Z" />
                  </svg>
                  {/* Seal body with starburst */}
                  <svg className={`absolute w-16 h-16 sm:w-20 sm:h-20 ${certConfig.badgeBg}`} viewBox="0 0 100 100" fill="currentColor">
                    <path d="M 50 0 L 56 12 L 69 7 L 71 21 L 84 21 L 81 34 L 92 41 L 85 53 L 92 65 L 81 72 L 84 85 L 71 85 L 69 99 L 56 94 L 50 106 L 44 94 L 31 99 L 29 85 L 16 85 L 19 72 L 8 65 L 15 53 L 8 41 L 19 34 L 16 21 L 29 21 L 31 7 L 44 12 Z" />
                    <circle cx="50" cy="50" r="36" fill={certConfig.isDarkTheme ? "#0a0a0f" : "#f1f5f9"} stroke="currentColor" stroke-width="4" />
                  </svg>
                  {/* Graduation cap */}
                  <svg className={`absolute w-7 h-7 sm:w-8 sm:h-8 ${certConfig.badgeBg}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
                    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
                  </svg>
                </div>
              </div>

              {/* Main Content Layout */}
              <div className="relative z-10 w-full flex flex-col justify-between h-full py-4 px-20 sm:px-28">
                
                {/* Header */}
                <div className="flex flex-col items-center">
                  <h1 className="text-xl sm:text-[34px] font-bold tracking-widest leading-none font-cert-title text-current uppercase">
                    Certificado
                  </h1>
                  
                  {/* Subtitle with lines */}
                  <div className="flex items-center gap-3 w-full justify-center mt-1 sm:mt-1.5">
                    <span className={`w-6 sm:w-10 h-[1.5px] ${certConfig.isDarkTheme ? 'bg-white/30' : 'bg-[#0a3161]/30'}`}></span>
                    <span className="text-[10px] sm:text-xs font-bold tracking-widest font-cert-title opacity-85">
                      DE CONCLUSÃO
                    </span>
                    <span className={`w-6 sm:w-10 h-[1.5px] ${certConfig.isDarkTheme ? 'bg-white/30' : 'bg-[#0a3161]/30'}`}></span>
                  </div>
                  
                  <p className="text-[8px] sm:text-[10px] font-bold font-cert-sans tracking-[0.2em] opacity-60 mt-2 sm:mt-3 uppercase">
                    A MENTORIA
                  </p>
                  <p className={`text-xs sm:text-[16px] font-black tracking-widest font-cert-title ${certConfig.textAccent} mt-0.5 uppercase`}>
                    TRADER ACADEMIC
                  </p>
                  <p className="text-[7px] sm:text-[9px] font-black font-cert-sans tracking-[0.2em] opacity-50 mt-2 sm:mt-3 uppercase">
                    CERTIFICA QUE
                  </p>
                </div>

                {/* Student Name */}
                <div className="flex flex-col items-center my-1 sm:my-2">
                  <h2 className={`text-[20px] sm:text-[38px] font-bold font-cert-title tracking-wide uppercase leading-tight text-center py-1.5 px-4 rounded-xl ${certConfig.nameColor}`}>
                    {currentUser.name}
                  </h2>
                </div>

                {/* Course details */}
                <div className="flex flex-col items-center">
                  <p className="text-[8px] sm:text-[10px] font-semibold font-cert-sans tracking-[0.15em] opacity-60 uppercase">
                    CONCLUIU COM ÊXITO O CURSO DE
                  </p>
                  <p className={`text-md sm:text-[26px] font-black tracking-widest font-cert-title ${certConfig.textAccent} mt-0.5 sm:mt-1 uppercase`}>
                    {certConfig.courseName}
                  </p>
                  <p className="text-[7px] sm:text-[9px] font-extrabold font-cert-sans tracking-[0.15em] opacity-40 mt-1 sm:mt-2 uppercase">
                    COM OS CONTEÚDOS:
                  </p>
                </div>

                {/* Icons Area */}
                <div className="flex justify-center items-center gap-4 sm:gap-6 my-2 sm:my-4">
                  {certConfig.icons.map((ic, i) => (
                    <div key={i} className="flex flex-col items-center text-center w-14 sm:w-16">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 ${certConfig.borderStyle} flex items-center justify-center ${certConfig.textAccent} bg-white/5`}>
                        {ic.svg ? ic.svg : <span className="font-black text-[10px] sm:text-xs font-cert-sans">{ic.text}</span>}
                      </div>
                      <span className="text-[6px] sm:text-[8px] font-black font-cert-sans tracking-wide opacity-75 mt-1 sm:mt-1.5 uppercase whitespace-nowrap">
                        {ic.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Section */}
                <div className="flex justify-between items-end mt-2 pt-2 sm:pt-3 border-t border-current/10">
                  {/* Left Mentor info */}
                  <div className="flex flex-col text-left">
                    <span className={`text-[16px] sm:text-[22px] font-bold font-cert-sig leading-none ${certConfig.textAccent}`}>
                      Herisson Vinicius S D Silva
                    </span>
                    <span className={`w-32 h-[1px] my-0.5 ${certConfig.isDarkTheme ? 'bg-white/20' : 'bg-[#0a3161]/20'}`}></span>
                    <span className="text-[7px] sm:text-[8px] font-bold font-cert-sans opacity-90 leading-tight">
                      HERISSON VINICIUS S D SILVA
                    </span>
                    <span className={`text-[6px] sm:text-[7px] font-semibold font-cert-sans ${certConfig.textAccent} tracking-wider mt-0.5 uppercase`}>
                      MENTOR
                    </span>
                  </div>

                  {/* Center Wreath */}
                  <div className="flex justify-center opacity-90">
                    <svg className={`w-20 h-10 sm:w-24 sm:h-12 ${certConfig.laurelColor}`} viewBox="0 0 100 50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M 50 40 C 35 40 25 30 25 15" />
                      <path d="M 25 15 C 22 17 18 17 18 15 C 18 13 22 13 25 15" fill="currentColor" />
                      <path d="M 27 22 C 23 24 20 22 20 20 C 20 18 24 18 27 22" fill="currentColor" />
                      <path d="M 31 29 C 27 31 24 28 24 26 C 24 24 28 24 31 29" fill="currentColor" />
                      <path d="M 38 35 C 34 36 32 33 32 31 C 32 29 36 29 38 35" fill="currentColor" />
                      <path d="M 50 40 C 65 40 75 30 75 15" />
                      <path d="M 75 15 C 78 17 82 17 82 15 C 82 13 78 13 75 15" fill="currentColor" />
                      <path d="M 73 22 C 77 24 80 22 80 20 C 80 18 76 18 73 22" fill="currentColor" />
                      <path d="M 69 29 C 73 31 76 28 76 26 C 76 24 72 24 69 29" fill="currentColor" />
                      <path d="M 62 35 C 66 36 68 33 68 31 C 68 29 64 29 62 35" fill="currentColor" />
                      <polygon points="50,37 52,41 57,41 53,44 55,48 50,45 45,48 47,44 43,41 48,41" fill="currentColor" stroke="none" />
                    </svg>
                  </div>

                  {/* Right Date info */}
                  <div className="flex flex-col items-center text-center">
                    <span className="text-[6px] sm:text-[8px] font-bold font-cert-sans opacity-50 tracking-wider uppercase">
                      DATA
                    </span>
                    
                    {/* Fixed centered date string above the underline */}
                    <span className="text-[10px] sm:text-[13px] font-extrabold font-cert-sans leading-none tracking-wide pt-1 mt-0.5">
                      {formatDateForCert()}
                    </span>
                    
                    <span className="text-[6px] sm:text-[7px] font-bold font-cert-sans opacity-45 tracking-widest -mt-0.5">
                      _____/_____/_____
                    </span>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
