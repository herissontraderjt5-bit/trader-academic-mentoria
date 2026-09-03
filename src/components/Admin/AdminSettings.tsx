import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  Cpu, 
  AlertTriangle, 
  Sparkles, 
  Zap, 
  Wrench, 
  Clock, 
  Eye,
  Lock,
  Users,
  BarChart2
} from 'lucide-react';
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

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Comissão por Indicação (%)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.referralCommissionPercent ?? 10.0}
                onChange={(e) => setFormData({ ...formData, referralCommissionPercent: parseFloat(e.target.value) || 0 })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Valor Mínimo para Saque (R$)
              </label>
              <input
                type="number"
                step="1"
                required
                value={formData.minWithdrawalAmount ?? 50.0}
                onChange={(e) => setFormData({ ...formData, minWithdrawalAmount: parseFloat(e.target.value) || 0 })}
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

        {/* CandleX-IA Maintenance & Update System */}
        <div className="space-y-5 pt-6 border-t border-[#222230]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-black shadow-lg shadow-orange-500/20">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Status & Atualização CandleX-IA
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono">
                    IA NEURAL
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  Configure avisos de manutenção, atualizações do modelo e bloqueio temporário do terminal CandleX.
                </p>
              </div>
            </div>

            {/* Status Beacon */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono ${
              formData.candlexMaintenanceMode
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${formData.candlexMaintenanceMode ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`}></span>
              <span>{formData.candlexMaintenanceMode ? 'EM MANUTENÇÃO' : 'OPERACIONAL 100%'}</span>
            </div>
          </div>

          {/* Master Toggle Banner */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
            formData.candlexMaintenanceMode
              ? 'bg-gradient-to-r from-amber-950/40 via-[#181210] to-[#120a06] border-amber-500/40 shadow-lg shadow-amber-500/5'
              : 'bg-[#15151f] border-[#252538]'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${formData.candlexMaintenanceMode ? 'text-amber-400' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Modo de Manutenção / Atualização da IA
                  </span>
                </div>
                <p className="text-[11px] text-gray-400">
                  {formData.candlexMaintenanceMode
                    ? 'O terminal CandleX-IA está BLOQUEADO para alunos com aviso interativo de atualização na tela.'
                    : 'O terminal CandleX-IA está totalmente DISPONÍVEL para todos os alunos operarem normalmente.'}
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.candlexMaintenanceMode ?? false}
                  onChange={(e) => setFormData({ ...formData, candlexMaintenanceMode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                <span className="ml-3 text-xs font-bold text-gray-300 font-mono">
                  {formData.candlexMaintenanceMode ? 'Ativado' : 'Desativado'}
                </span>
              </label>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-400" />
              Predefinições Rápidas de Atualização (Clique para aplicar)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  candlexMaintenanceMode: true,
                  candlexMaintenanceTitle: 'Atenção: CandleX-IA em Atualização Neural',
                  candlexMaintenanceMessage: 'Nossa inteligência artificial está recebendo uma nova rodada de aprendizado neural com leitura aprofundada de SMC (Smart Money Concepts), Order Blocks e Fair Value Gaps institucional.',
                  candlexMaintenanceEta: 'Previsão de retorno: Em aproximadamente 30 minutos',
                  candlexAiVersion: 'v2.6.0 Neural Ultra',
                  candlexMaintenanceProgress: 85,
                  candlexAllowAdminBypass: true,
                })}
                className="p-2.5 rounded-xl bg-[#171724] hover:bg-[#202033] border border-[#2d2d42] hover:border-orange-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 group-hover:text-orange-300">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Atualização SMC</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">Recalibração dos algoritmos neurais</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  candlexMaintenanceMode: true,
                  candlexMaintenanceTitle: 'Atenção: CandleX-IA em Manutenção dos Servidores',
                  candlexMaintenanceMessage: 'Estamos realizando uma manutenção preventiva na infraestrutura de servidores para garantir menor latência e sincronização de candles em tempo real ultrarrápida.',
                  candlexMaintenanceEta: 'Previsão de retorno: Hoje às 22:00',
                  candlexAiVersion: 'v2.5.9 Server Sync',
                  candlexMaintenanceProgress: 55,
                  candlexAllowAdminBypass: true,
                })}
                className="p-2.5 rounded-xl bg-[#171724] hover:bg-[#202033] border border-[#2d2d42] hover:border-amber-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 group-hover:text-amber-300">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Manutenção Servidor</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">Otimização de latência e feeds</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  candlexMaintenanceMode: true,
                  candlexMaintenanceTitle: 'Validação de Assertividade e Confluências',
                  candlexMaintenanceMessage: 'O motor de confluências probabilísticas está em processo final de validação em backtest de alta frequência para máxima taxa de acerto.',
                  candlexMaintenanceEta: 'Previsão de retorno: 15 minutos',
                  candlexAiVersion: 'v2.6.2 Quantum Alpha',
                  candlexMaintenanceProgress: 92,
                  candlexAllowAdminBypass: true,
                })}
                className="p-2.5 rounded-xl bg-[#171724] hover:bg-[#202033] border border-[#2d2d42] hover:border-cyan-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Calibração 92%</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">Fase final de testes de assertividade</p>
              </button>

              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  candlexMaintenanceMode: false,
                })}
                className="p-2.5 rounded-xl bg-[#171724] hover:bg-emerald-950/30 border border-[#2d2d42] hover:border-emerald-500/50 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Liberar 100% (Normal)</span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">Desativa aviso e libera terminal</p>
              </button>
            </div>
          </div>

          {/* Form Fields for Custom Maintenance Notice */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Título do Aviso de Atualização
              </label>
              <input
                type="text"
                value={formData.candlexMaintenanceTitle ?? 'Atenção: CandleX-IA está em manutenção e atualização'}
                onChange={(e) => setFormData({ ...formData, candlexMaintenanceTitle: e.target.value })}
                placeholder="Ex: Atenção: CandleX-IA está em manutenção e atualização"
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Mensagem Explicativa aos Alunos
              </label>
              <textarea
                rows={3}
                value={formData.candlexMaintenanceMessage ?? ''}
                onChange={(e) => setFormData({ ...formData, candlexMaintenanceMessage: e.target.value })}
                placeholder="Descreva aos alunos o que está sendo atualizado (ex: recalibração de algoritmos, novos filtros SMC, etc)..."
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                Previsão de Retorno (ETA)
              </label>
              <input
                type="text"
                value={formData.candlexMaintenanceEta ?? 'Previsão de retorno: Hoje às 22:00'}
                onChange={(e) => setFormData({ ...formData, candlexMaintenanceEta: e.target.value })}
                placeholder="Ex: Hoje às 22:00 ou Em aproximadamente 30 min"
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-orange-400" />
                Versão da IA em Destaque
              </label>
              <input
                type="text"
                value={formData.candlexAiVersion ?? 'v2.6.0 Neural Ultra'}
                onChange={(e) => setFormData({ ...formData, candlexAiVersion: e.target.value })}
                placeholder="Ex: v2.6.0 Neural Ultra"
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-300 font-mono uppercase">
                  Progresso da Atualização
                </label>
                <span className="text-xs font-bold text-orange-400 font-mono">
                  {formData.candlexMaintenanceProgress ?? 85}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.candlexMaintenanceProgress ?? 85}
                onChange={(e) => setFormData({ ...formData, candlexMaintenanceProgress: parseInt(e.target.value) || 0 })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-[#171724] border border-[#272738]">
              <div>
                <span className="block text-xs font-bold text-white font-mono uppercase">
                  Acesso Antecipado do Administrador
                </span>
                <span className="text-[11px] text-gray-400">
                  Permitir que o Admin teste o terminal mesmo em manutenção
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input
                  type="checkbox"
                  checked={formData.candlexAllowAdminBypass ?? true}
                  onChange={(e) => setFormData({ ...formData, candlexAllowAdminBypass: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-orange-400" />
                Prévia ao Vivo do Aviso (Visualização do Aluno)
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {formData.candlexMaintenanceMode ? '● Modo Ativo' : '○ Modo Inativo (Simulação)'}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-b from-[#18110b] to-[#0d0d14] border border-orange-500/30 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-2xl rounded-full pointer-events-none"></div>
              
              <div className="flex items-start gap-3.5 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-500/20 text-orange-400 border border-orange-500/30 uppercase font-mono">
                      {formData.candlexAiVersion || 'v2.6.0 Neural'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono">
                      ATUALIZAÇÃO EM ANDAMENTO
                    </span>
                  </div>

                  <h4 className="text-sm font-black text-white tracking-tight">
                    {formData.candlexTitle || formData.candlexMaintenanceTitle || 'Atenção: CandleX-IA está em manutenção e atualização'}
                  </h4>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {formData.candlexMaintenanceMessage || 'Nossa inteligência artificial está passando por uma recalibração neural com novos modelos de análise institucional SMC...'}
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/5">
                    <div className="flex items-center gap-2 text-[11px] text-amber-300 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formData.candlexMaintenanceEta || 'Previsão de retorno: Hoje às 22:00'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-400 font-mono">Progresso:</span>
                      <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-amber-400"
                          style={{ width: `${formData.candlexMaintenanceProgress ?? 85}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] font-bold text-orange-400 font-mono">
                        {formData.candlexMaintenanceProgress ?? 85}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Student Access Control (IA, Gestão & Mentoria) */}
        <div className="space-y-4 pt-6 border-t border-[#222230]">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#ff8800]" />
            <h3 className="text-sm font-bold text-[#ff8800] uppercase tracking-wider font-mono">
              Controle de Liberação de Acesso aos Alunos
            </h3>
          </div>

          <div className="p-5 rounded-2xl bg-[#15151f] border border-[#252538] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider block">
                  Exigir Liberação Manual pelo Administrador para Novos Cadastros
                </span>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Ao ativar esta opção, qualquer pessoa que se cadastrar na plataforma ficará <strong>SEM ACESSO</strong> à <strong>IA CandleX</strong>, à <strong>Planilha de Gestão</strong> e às aulas da <strong>Mentoria Gratuita</strong> até que você libere o acesso individualmente no painel de membros.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={formData.requireAdminReleaseForNewUsers ?? true}
                  onChange={(e) => setFormData({ ...formData, requireAdminReleaseForNewUsers: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff6b00]"></div>
                <span className="ml-3 text-xs font-bold text-gray-300 font-mono">
                  {formData.requireAdminReleaseForNewUsers ?? true ? 'Ativado' : 'Desativado'}
                </span>
              </label>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0d0d14] border border-[#222233] text-xs font-mono text-gray-300 space-y-1.5">
              <div className="flex items-center gap-2 text-[#ff8800] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Como funciona a liberação:</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                1. No menu <strong>Alunos / Membros</strong>, você verá 3 botões rápidos em cada aluno: <strong>[IA]</strong>, <strong>[Gestão]</strong> e <strong>[Mentoria]</strong>.<br />
                2. Basta clicar para liberar ou bloquear qualquer ferramenta individualmente para o aluno em tempo real.
              </p>
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
