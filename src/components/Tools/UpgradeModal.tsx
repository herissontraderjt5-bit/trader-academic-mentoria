import React, { useState, useEffect } from 'react';
import { 
  X, 
  CheckCircle2, 
  Lock, 
  MessageSquare, 
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { Module, User, PlatformSettings } from '../../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlatformSettings;
  targetModule?: Module | null;
  currentUser?: User | null;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  settings,
  targetModule,
  currentUser,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseType, setPurchaseType] = useState<'module' | 'lifetime'>('lifetime');

  useEffect(() => {
    if (isOpen) {
      setPurchaseType(targetModule ? 'module' : 'lifetime');
    }
  }, [isOpen, targetModule]);

  if (!isOpen) return null;

  const modulePriceNum = Number(targetModule?.price ?? 499.90);
  const modulePriceFormatted = isNaN(modulePriceNum) ? '499,90' : modulePriceNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const lifetimePriceNum = Number(settings.lifetimePrice ?? 499.90);
  const lifetimePriceFormatted = isNaN(lifetimePriceNum) ? '499,90' : lifetimePriceNum.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const moduleTitle = targetModule?.title || 'Formação VIP Completa - Mentoria';
  const studentName = currentUser?.name || 'Aluno';

  const handleOpenWhatsappPayment = () => {
    setIsProcessing(true);
    const phone = settings.supportWhatsapp || '5511999999999';
    
    const messageText = purchaseType === 'module' && targetModule
      ? `Olá! Meu nome é ${studentName}. Gostaria de adquirir o "${moduleTitle}" pelo valor de R$ ${modulePriceFormatted}. Como realizo o pagamento?`
      : `Olá! Meu nome é ${studentName}. Gostaria de assinar a Formação VIP Completa (Acesso Vitalício) pelo valor de R$ ${lifetimePriceFormatted}. Como realizo o pagamento?`;

    const message = encodeURIComponent(messageText);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${message}`, '_blank');

    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-zinc-950 border border-orange-500/40 rounded-3xl shadow-2xl shadow-orange-950/60 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="relative p-6 bg-gradient-to-r from-orange-950/60 via-zinc-900 to-black border-b border-orange-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-500 flex items-center justify-center text-white shadow-lg shadow-green-600/30 ring-2 ring-emerald-500/30">
              <MessageSquare className="w-6 h-6 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest font-mono">
                  SUPORTE E PAGAMENTO DIRETO
                </span>
              </div>
              <h2 className="text-lg font-black text-white uppercase tracking-tight line-clamp-1 mt-0.5">
                {targetModule ? 'Liberar Acesso ao Módulo' : 'Formação VIP Completa'}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Selector options */}
          {targetModule && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPurchaseType('module')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  purchaseType === 'module'
                    ? 'bg-emerald-950/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider font-mono text-zinc-400">
                    OPÇÃO 1
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${purchaseType === 'module' ? 'border-emerald-500' : 'border-zinc-700'}`}>
                    {purchaseType === 'module' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </div>
                </div>
                <p className="text-xs font-black line-clamp-1 mb-1">Apenas este Módulo</p>
                <span className="text-sm font-black font-mono text-white">R$ {modulePriceFormatted}</span>
              </button>

              <button
                type="button"
                onClick={() => setPurchaseType('lifetime')}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  purchaseType === 'lifetime'
                    ? 'bg-emerald-950/20 border-emerald-500 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[9px] font-black uppercase tracking-wider font-mono text-orange-400">
                    RECOMENDADA
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${purchaseType === 'lifetime' ? 'border-emerald-500' : 'border-zinc-700'}`}>
                    {purchaseType === 'lifetime' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </div>
                </div>
                <p className="text-xs font-black line-clamp-1 mb-1">Formação VIP Vitalícia</p>
                <span className="text-sm font-black font-mono text-orange-400">R$ {lifetimePriceFormatted}</span>
              </button>
            </div>
          )}

          {/* Featured Module / VIP Box */}
          <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-950/50 via-zinc-900 to-black border-2 border-emerald-500 flex flex-col justify-between shadow-xl shadow-emerald-950/40 relative">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono border border-emerald-500/30">
                {purchaseType === 'module' ? (targetModule?.category || 'Módulo Avulso') : 'Acesso VIP Vitalício'}
              </span>
              <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-orange-400" />
                Acesso Imediato
              </span>
            </div>

            <h3 className="text-xl font-black text-white leading-snug mb-2">
              {purchaseType === 'module' ? moduleTitle : 'Formação VIP Completa - Acesso Vitalício'}
            </h3>

            {(purchaseType === 'module' ? targetModule?.subtitle : 'Acesso ilimitado a todos os módulos, planilhas, atualizações e suporte VIP') && (
              <p className="text-xs text-emerald-300 font-medium mb-4 leading-relaxed">
                {purchaseType === 'module' ? targetModule?.subtitle : 'Acesso ilimitado a todos os módulos, planilhas, atualizações e suporte VIP.'}
              </p>
            )}

            <ul className="space-y-2.5 text-xs text-zinc-200 mb-6">
              {purchaseType === 'module' ? (
                <>
                  <li className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Acesso completo às aulas gravadas deste módulo</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Download de planilhas, indicadores e materiais em PDF do módulo</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2 text-emerald-400 font-bold">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Acesso vitalício completo a todos os módulos da plataforma</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Download de planilhas, indicadores e materiais em PDF de todos os cursos</span>
                  </li>
                </>
              )}
              <li className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Suporte tirar-dúvidas direto com os mentores</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Certificado de conclusão reconhecido</span>
              </li>
            </ul>

            {/* Price Box */}
            <div className="pt-4 border-t border-emerald-500/30 flex items-baseline justify-between">
              <div>
                <span className="text-xs text-zinc-400 block font-mono">
                  {purchaseType === 'module' ? 'VALOR DO MÓDULO' : 'VALOR DA FORMAÇÃO COMPLETA'}
                </span>
                <span className="text-3xl font-black text-white font-mono">
                  R$ {purchaseType === 'module' ? modulePriceFormatted : lifetimePriceFormatted}
                </span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-500/40">
                PAGAMENTO ÚNICO
              </span>
            </div>
          </div>

          {/* WhatsApp Payment Info Banner */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600/20 text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="text-xs text-zinc-300">
              <p className="font-bold text-white mb-0.5">Pagamento Seguro via WhatsApp (PIX ou Cartão)</p>
              <p className="text-[11px] text-zinc-400">
                Ao clicar no botão abaixo, você enviará uma mensagem no WhatsApp do suporte com o produto selecionado e seu nome para receber a chave PIX ou o link de pagamento.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-zinc-900/90 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
          >
            Voltar
          </button>

          <button
            type="button"
            onClick={handleOpenWhatsappPayment}
            disabled={isProcessing}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Abrindo WhatsApp...</span>
              </>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 fill-current" />
                <span>Pagar R$ {purchaseType === 'module' ? modulePriceFormatted : lifetimePriceFormatted} no WhatsApp</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
