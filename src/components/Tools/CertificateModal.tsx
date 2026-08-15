import React, { useRef } from 'react';
import { Award, X, Printer, Download, Sparkles, CheckCircle2, ShieldCheck, Flame } from 'lucide-react';
import { User, PlatformSettings } from '../../types';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  settings: PlatformSettings;
  overallProgress: { completed: number; total: number; percentage: number };
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
  overallProgress,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const certificateCode = `TA-CERT-${currentUser.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#111118] border border-[#2d2d3f] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-6 bg-[#151520] border-b border-[#242433] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#ff6b00]" />
            <h3 className="text-base font-bold text-white">Certificado de Conclusão da Mentoria</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#ff8800] text-black font-extrabold text-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1e1e2c] text-gray-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Preview Canvas */}
        <div className="p-6 sm:p-10 flex items-center justify-center bg-[#0a0a0f]">
          <div
            ref={certificateRef}
            className="w-full max-w-3xl aspect-[1.414/1] bg-gradient-to-br from-[#0e0e14] via-[#14141e] to-[#0a0a0f] border-8 border-[#ff6b00]/60 rounded-2xl p-8 sm:p-12 relative flex flex-col justify-between shadow-[0_0_50px_rgba(255,107,0,0.15)] text-center"
          >
            {/* Background Seal Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Award className="w-96 h-96 text-[#ff6b00]" />
            </div>

            {/* Certificate Top Header */}
            <div>
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/30 text-white">
                  <Flame className="w-7 h-7 fill-current" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="w-8 h-[2px] bg-[#ff6b00]"></span>
                <span className="text-xs font-black tracking-widest text-[#ff8800] uppercase font-mono">
                  TRADER ACADEMIC • FORMAÇÃO OFICIAL
                </span>
                <span className="w-8 h-[2px] bg-[#ff6b00]"></span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-wider font-serif">
                CERTIFICADO DE FORMAÇÃO
              </h1>
              <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-mono">
                MERCADOS FUTUROS • PRICE ACTION • GESTÃO DE RISCO
              </p>
            </div>

            {/* Certificate Body */}
            <div className="my-6 space-y-3">
              <p className="text-xs sm:text-sm text-gray-300 italic">
                Certificamos para os devidos fins que o aluno(a)
              </p>

              <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ff6b00] to-[#ffaa40] font-sans tracking-wide">
                {currentUser.name}
              </h2>

              <p className="text-xs sm:text-sm text-gray-300 max-w-xl mx-auto leading-relaxed">
                concluiu com êxito todos os módulos teóricos e operacionais da mentoria{' '}
                <strong className="text-white">Trader Academic</strong>, dominando técnicas avançadas de análise técnica, leitura de fluxo (Tape Reading), disciplina psicológica e gestão de risco profissional com índice de assertividade aprovado.
              </p>
            </div>

            {/* Certificate Footer */}
            <div className="flex items-end justify-between pt-6 border-t border-[#262638] text-left">
              <div>
                <p className="text-xs text-gray-400 font-mono">Código de Autenticidade:</p>
                <p className="text-xs font-bold text-[#ff8800] font-mono">{certificateCode}</p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  Emitido em {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>

              <div className="text-center">
                <div className="w-40 border-b border-gray-400 mb-1 mx-auto"></div>
                <p className="text-xs font-bold text-white">{settings.mentorName}</p>
                <p className="text-[10px] text-gray-400 font-mono">Trader Responsável & Mentor</p>
              </div>

              <div className="hidden sm:flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-2 border-[#ff6b00] flex items-center justify-center text-[#ff6b00] bg-[#ff6b00]/10 shadow-lg shadow-orange-500/20">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <span className="text-[9px] text-gray-400 font-mono mt-1 uppercase font-bold">Verificado</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
