import React, { useState } from 'react';
import { Settings, Save, RotateCcw, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PlatformSettings } from '../../types';
import { storageService } from '../../services/storage';

interface AdminSettingsProps {
  settings: PlatformSettings;
  onUpdateSettings: (settings: PlatformSettings) => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [formData, setFormData] = useState<PlatformSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    storageService.saveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Restaurar todas as configurações e dados de demonstração originais?')) {
      storageService.resetAllData();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Configurações da Plataforma
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Personalize títulos, suporte de mentoria e links de canais exclusivos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#111118] border border-[#242433] space-y-6">
        
        {/* Brand & Identity */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#ff8800] uppercase tracking-wider font-mono">
            Identidade da Mentoria
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Nome da Plataforma
              </label>
              <input
                type="text"
                required
                value={formData.platformName}
                onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Nome do Mentor / Equipe
              </label>
              <input
                type="text"
                required
                value={formData.mentorName}
                onChange={(e) => setFormData({ ...formData, mentorName: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
              Slogan / Tagline
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
              Título Principal do Banner (Hero Headline)
            </label>
            <input
              type="text"
              value={formData.bannerHeadline}
              onChange={(e) => setFormData({ ...formData, bannerHeadline: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
              Subtexto do Banner
            </label>
            <textarea
              rows={2}
              value={formData.bannerSubtext}
              onChange={(e) => setFormData({ ...formData, bannerSubtext: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
            ></textarea>
          </div>
        </div>

        {/* Prices & Plans */}
        <div className="space-y-4 pt-6 border-t border-[#222230]">
          <h3 className="text-sm font-bold text-[#ff8800] uppercase tracking-wider font-mono">
            Configuração de Preços
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Valor do Plano Vitalício (R$)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.lifetimePrice ?? 499.90}
                onChange={(e) => setFormData({ ...formData, lifetimePrice: parseFloat(e.target.value) || 0 })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>
          </div>
        </div>

        {/* Support & Community Links */}
        <div className="space-y-4 pt-6 border-t border-[#222230]">
          <h3 className="text-sm font-bold text-[#ff8800] uppercase tracking-wider font-mono">
            Links de Suporte e Comunidade VIP
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Canal VIP do Telegram
              </label>
              <input
                type="text"
                value={formData.telegramVipUrl}
                onChange={(e) => setFormData({ ...formData, telegramVipUrl: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Servidor Discord VIP
              </label>
              <input
                type="text"
                value={formData.discordVipUrl}
                onChange={(e) => setFormData({ ...formData, discordVipUrl: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                WhatsApp de Suporte / Dúvidas
              </label>
              <input
                type="text"
                value={formData.supportWhatsapp}
                onChange={(e) => setFormData({ ...formData, supportWhatsapp: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Instagram Oficial
              </label>
              <input
                type="text"
                value={formData.instagramUrl}
                onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#222230]">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-500/30 text-red-300 text-xs font-bold cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Dados Padrão (Demo)</span>
          </button>

          <div className="flex items-center gap-3">
            {isSaved && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Configurações salvas!
              </span>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#ff6b00] hover:bg-[#ff8800] text-black font-extrabold text-xs transition-colors shadow-lg shadow-orange-500/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>

      </form>

    </div>
  );
};
