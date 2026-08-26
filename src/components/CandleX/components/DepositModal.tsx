import React, { useState } from "react";
import { X, Wallet, QrCode, CreditCard, ShieldCheck, CheckCircle2 } from "lucide-react";
import { soundManager } from "../utils/soundEffects";

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddFunds: (amount: number) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onAddFunds,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<"PIX" | "CRYPTO" | "CARD">("PIX");
  const [amount, setAmount] = useState<number>(100);
  const [successToast, setSuccessToast] = useState(false);

  if (!isOpen) return null;

  const handleDeposit = () => {
    onAddFunds(amount);
    setSuccessToast(true);
    soundManager.playOrderExecuted();
    setTimeout(() => {
      setSuccessToast(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-[#0E121B] border border-[#1E2638] rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1E2638] flex items-center justify-between bg-[#121622]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF7A00]/20 border border-[#FF7A00]/40 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-[#FF7A00]" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Depósito Instantâneo</h2>
              <p className="text-xs text-slate-400">PIX, Criptomoedas e Cartão de Crédito</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod("PIX")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                selectedMethod === "PIX"
                  ? "bg-[#141A26] border-[#FF7A00] text-[#FF7A00] font-black shadow-md shadow-[#FF7A00]/10"
                  : "bg-[#121622] border-[#1E2638] text-slate-400"
              }`}
            >
              <QrCode className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs block">PIX</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod("CRYPTO")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                selectedMethod === "CRYPTO"
                  ? "bg-[#141A26] border-[#FF7A00] text-[#FF7A00] font-black shadow-md shadow-[#FF7A00]/10"
                  : "bg-[#121622] border-[#1E2638] text-slate-400"
              }`}
            >
              <Wallet className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs block">USDT (TRC20)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMethod("CARD")}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                selectedMethod === "CARD"
                  ? "bg-[#141A26] border-[#FF7A00] text-[#FF7A00] font-black shadow-md shadow-[#FF7A00]/10"
                  : "bg-[#121622] border-[#1E2638] text-slate-400"
              }`}
            >
              <CreditCard className="w-5 h-5 mx-auto mb-1" />
              <span className="text-xs block">Cartão</span>
            </button>
          </div>

          {/* Amount input */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400">
              Valor do Depósito ($)
            </label>
            <input
              type="number"
              min="10"
              value={amount}
              onChange={(e) => setAmount(Math.max(10, parseFloat(e.target.value) || 10))}
              className="w-full bg-[#090C12] text-xl font-black font-mono text-white px-3 py-2 rounded-xl border border-[#1E2638] outline-none focus:border-[#FF7A00]"
            />
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[50, 100, 250, 500].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAmount(v)}
                  className={`py-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer ${
                    amount === v
                      ? "bg-[#FF7A00] text-slate-950"
                      : "bg-[#121622] text-slate-400 hover:text-white"
                  }`}
                >
                  ${v}
                </button>
              ))}
            </div>
          </div>

          {/* Security note */}
          <div className="text-[11px] text-slate-400 bg-[#090C12] p-3 rounded-xl border border-[#1E2638] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>Processamento criptografado de alta velocidade e creditação em segundos.</span>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleDeposit}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF8C00] via-[#FF7A00] to-[#E65100] hover:from-[#FFA022] hover:to-[#FF6D00] text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,122,0,0.35)] transition-all cursor-pointer active:scale-[0.98]"
          >
            {successToast ? "DEPÓSITO CONFIRMADO!" : `CONFIRMAR DEPÓSITO DE $${amount}`}
          </button>
        </div>
      </div>
    </div>
  );
};
