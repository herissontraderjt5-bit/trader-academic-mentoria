import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Lock, 
  Flame, 
  ArrowRight,
  HelpCircle,
  CreditCard
} from 'lucide-react';
import { PlatformSettings } from '../../types';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PlatformSettings;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  settings,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const vipPrice = '499,90';
  const vipPriceInstallment = '12x de R$ 49,90';

  const handleOpenCaktoCheckout = () => {
    setIsProcessing(true);
    const checkoutUrl = settings.caktoCheckoutUrl || 'https://pay.cakto.com.br/checkout/trader-academic-vip';
    
    // Redireciona diretamente para o checkout oficial da Cakto em nova aba
    window.open(checkoutUrl, '_blank');

    setTimeout(() => {
      setIsProcessing(false);
    }, 1000);
  };

  const handleOpenWhatsapp = () => {
    const phone = settings.supportWhatsapp || '5511999999999';
    const message = encodeURIComponent(`Olá! Tenho dúvidas sobre o checkout da mentoria Trader Academic.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-zinc-950 border border-orange-500/40 rounded-3xl shadow-2xl shadow-orange-950/60 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="relative p-6 bg-gradient-to-r from-orange-950/60 via-zinc-900 to-black border-b border-orange-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-600/30 ring-2 ring-orange-500/30">
              <Flame className="w-7 h-7 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase tracking-widest font-mono">
                  CHECKOUT CAKTO
                </span>
                <span className="text-xs text-zinc-400">Pagamento Seguro 256-bit</span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Formação VIP Completa - Mentoria
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
        <div className="p-6 space-y-6">
          {/* Plan Comparison Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Free Plan Box */}
            <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col justify-between opacity-80">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-zinc-400 uppercase">Seu Plano Atual</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300">FREE</span>
                </div>
                <h3 className="text-lg font-black text-white mb-1">Plano Free</h3>
                <p className="text-xs text-zinc-400 mb-4">Acesso exclusivo ao módulo de introdução a Opções Binárias.</p>
                
                <ul className="space-y-2 text-xs text-zinc-300">
                  <li className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Módulo de Opções Binárias Liberado</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-500 line-through">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Módulos de B3 (Índice & Dólar)</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-500 line-through">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Salas de Operações Ao Vivo</span>
                  </li>
                  <li className="flex items-center gap-2 text-zinc-500 line-through">
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    <span>Planilhas & Indicadores VIP</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5">
                <span className="text-lg font-black text-zinc-400">R$ 0,00</span>
              </div>
            </div>

            {/* VIP Plan Box (Featured) */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-orange-950/40 via-zinc-900 to-black border-2 border-orange-500 flex flex-col justify-between shadow-xl shadow-orange-950/40 relative">
              <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 text-black text-[10px] font-black uppercase tracking-wider shadow">
                MAIS RECOMENDADO
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-orange-400 uppercase">Acesso Completo</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-500 text-black">VIP</span>
                </div>
                <h3 className="text-xl font-black text-white mb-1">Plano VIP Completo</h3>
                <p className="text-xs text-orange-200 mb-4">Acesso irrestrito a todos os módulos, mentorias e salas ao vivo.</p>
                
                <ul className="space-y-2 text-xs text-zinc-200">
                  <li className="flex items-center gap-2 text-orange-400 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-orange-400" />
                    <span>Módulo de Opções Binárias + Todos os Módulos</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Price Action Avançado & Tape Reading</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Salas de Operações Ao Vivo & Gravações</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Pack de Planilhas, Indicadores e Certificado</span>
                  </li>
                  <li className="flex items-center gap-2 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Grupo VIP no Telegram & Discord</span>
                  </li>
                </ul>
              </div>

              <div className="mt-4 pt-4 border-t border-orange-500/30 flex items-baseline justify-between">
                <div>
                  <span className="text-2xl sm:text-3xl font-black text-white font-mono">R$ {vipPrice}</span>
                  <span className="text-[11px] text-orange-400 block font-sans">ou {vipPriceInstallment}</span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">PAGAMENTO SEGURO</span>
              </div>
            </div>

          </div>

          {/* Cakto Payment Info Banner */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-white/5 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-600/20 text-orange-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div className="text-xs text-zinc-300">
              <p className="font-bold text-white mb-0.5">Pagamento Processado via Cakto (Cartão de Crédito / PIX)</p>
              <p className="text-[11px] text-zinc-400">
                Ao clicar no botão abaixo, você será redirecionado para a página oficial de pagamento da Cakto. Assim que o pagamento for confirmado, seu plano VIP será ativado automaticamente pelo Webhook!
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-zinc-900/90 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleOpenWhatsapp}
            className="text-xs text-zinc-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Dúvidas? Falar com Suporte no WhatsApp</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleOpenCaktoCheckout}
              disabled={isProcessing}
              className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Redirecionando...</span>
                </>
              ) : (
                <>
                  <span>Ir para o Checkout da Cakto (Cartão / PIX)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
