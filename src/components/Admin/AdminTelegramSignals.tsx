import React, { useState } from 'react';
import { 
  Send,
  Save,
  MessageCircle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  Image as ImageIcon,
  Radio
} from 'lucide-react';
import { TelegramSignalSettings } from '../../types';
import { telegramService } from '../../services/telegramService';
import { supabaseService } from '../../services/supabaseService';

export const AdminTelegramSignals: React.FC = () => {
  const [formData, setFormData] = useState<TelegramSignalSettings>({
    id: 'default',
    botToken: '',
    channelId: '',
    allowedPairs: ['EUR/USD', 'GBP/USD', 'USD/JPY'],
    morningStartTime: '08:00',
    morningEndTime: '12:00',
    afternoonStartTime: '13:00',
    afternoonEndTime: '18:00',
    nightStartTime: '19:00',
    nightEndTime: '23:00',
    startMessageTemplate: 'Bom dia Traders! Iniciando as operações do dia.',
    endMessageTemplate: 'Fim das operações do dia. Relatório diário:',
    preAlertMessageTemplate: 'Atenção! Possível sinal de {DIRECTION} em {TICKER} - {TIMEFRAME}',
    confirmationMessageTemplate: 'SINAL CONFIRMADO! 🟢 Entrada: {DIRECTION} | Ativo: {TICKER} | Tempo: {TIMEFRAME}',
    preAlertMinutes: 1,
    martingaleLevel: 0,
    emojiWin: '✅',
    emojiLoss: '❌',
    emojiDoji: '🔄',
    isActive: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<{loading: boolean, success?: boolean, error?: string}>({ loading: false });
  const [reportStatus, setReportStatus] = useState<{loading: boolean, success?: boolean, error?: string}>({ loading: false });

  React.useEffect(() => {
    async function fetchSettings() {
      const data = await supabaseService.getTelegramSignalSettings();
      if (data) {
        setFormData(data);
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, []);

  const [rawPairs, setRawPairs] = React.useState('');
  React.useEffect(() => {
    if (formData.allowedPairs.length > 0 && !rawPairs) {
      setRawPairs(formData.allowedPairs.join(', '));
    }
  }, [formData.allowedPairs.length]);

  const handlePairsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setRawPairs(rawValue);
    const pairs = rawValue.split(',').map(p => p.trim()).filter(p => p.length > 0);
    setFormData(prev => ({ ...prev, allowedPairs: pairs }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await supabaseService.saveTelegramSignalSettings(formData);
    if (success) {
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } else {
      alert("Erro ao salvar as configurações");
    }
  };

  const handleTestMessage = async () => {
    if (!formData.botToken || !formData.channelId) {
      setTestStatus({ loading: false, error: 'Configure o Token e o ID do Canal primeiro.' });
      return;
    }
    setTestStatus({ loading: true });
    try {
      const res = await telegramService.sendTestSignal(formData);
      if (res.success) {
        setTestStatus({ loading: false, success: true });
      } else {
        setTestStatus({ loading: false, error: res.message || 'Erro ao enviar mensagem' });
      }
    } catch (e: any) {
      setTestStatus({ loading: false, error: e.message });
    }
    setTimeout(() => setTestStatus({ loading: false }), 4000);
  };

  const handleSendReport = async () => {
    if (!formData.botToken || !formData.channelId) {
      setReportStatus({ loading: false, error: 'Configure o Token e o ID do Canal primeiro.' });
      return;
    }
    
    // Prompt to confirm
    if (!window.confirm('Deseja enviar o relatório de fechamento do dia agora?')) return;

    setReportStatus({ loading: true });
    try {
      // Just a mock of result (you could get it from trades DB)
      const mockResult = `Resultados de Hoje:
${formData.emojiWin} WIN: 12
${formData.emojiLoss} LOSS: 2
${formData.emojiDoji} DOJI: 1
Lucro Total: +R$ 450,00`;

      const msg = `${formData.endMessageTemplate}\n\n${mockResult}`;

      const res = await telegramService.sendMessage(formData, msg);
      if (res.success) {
        setReportStatus({ loading: false, success: true });
      } else {
        setReportStatus({ loading: false, error: res.message || 'Erro ao enviar relatório' });
      }
    } catch (e: any) {
      setReportStatus({ loading: false, error: e.message });
    }
    setTimeout(() => setReportStatus({ loading: false }), 4000);
  };

  if (isLoading) return <div className="p-8 text-zinc-400">Carregando configurações...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <MessageCircle className="w-8 h-8 text-[#0088cc]" />
          Sinais no Telegram
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 mt-1">
          Configure a integração com o BotFather, horários de operação e mensagens de relatórios automáticos/manuais.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#111118] border border-[#242433] space-y-6 relative overflow-hidden">
        
        {/* Toggle Ativação Geral */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-[#171724] border border-[#272738]">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${formData.isActive ? 'bg-[#0088cc]/20 text-[#0088cc]' : 'bg-zinc-800 text-zinc-500'}`}>
              <Send className="w-5 h-5" />
            </div>
            <div>
              <span className="block text-sm font-bold text-white font-mono uppercase">
                Integração do Bot
              </span>
              <span className="text-[11px] text-gray-400">
                Ligue para permitir o envio de sinais.
              </span>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0088cc]"></div>
          </label>
        </div>

        {/* Telegram Config */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#0088cc] uppercase tracking-wider font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Credenciais do BotFather
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Bot Token (API)
              </label>
              <input
                type="password"
                placeholder="Ex: 1234567890:AA...xyz"
                value={formData.botToken}
                onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                ID do Canal / Grupo
              </label>
              <input
                type="text"
                placeholder="Ex: -1001234567890"
                value={formData.channelId}
                onChange={(e) => setFormData({ ...formData, channelId: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc]"
              />
            </div>
          </div>
        </div>

        {/* Automation Configs */}
        <div className="space-y-4 pt-6 border-t border-[#222230]">
          <h3 className="text-sm font-bold text-[#0088cc] uppercase tracking-wider font-mono flex items-center gap-2">
            <Radio className="w-4 h-4" />
            Automação de Sinais VIP
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Antecedência Pré-Alerta (Minutos)
              </label>
              <select
                value={formData.preAlertMinutes}
                onChange={(e) => setFormData({ ...formData, preAlertMinutes: parseInt(e.target.value) })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc]"
              >
                <option value={0}>Sem Pré-Alerta (Manda Direto)</option>
                <option value={1}>1 Minuto Antes</option>
                <option value={2}>2 Minutos Antes</option>
                <option value={5}>5 Minutos Antes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Estratégia de Martingale (Gale)
              </label>
              <select
                value={formData.martingaleLevel}
                onChange={(e) => setFormData({ ...formData, martingaleLevel: parseInt(e.target.value) })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc]"
              >
                <option value={0}>Sem Gale (Mão Fixa)</option>
                <option value={1}>Até 1 Gale (G1)</option>
                <option value={2}>Até 2 Gales (G2)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Mensagem de Pré-Alerta
              </label>
              <textarea
                value={formData.preAlertMessageTemplate}
                onChange={(e) => setFormData({ ...formData, preAlertMessageTemplate: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc] min-h-[60px]"
                placeholder="Ex: Preparem-se! {TICKER} - {TIMEFRAME} - {DIRECTION}"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Mensagem de Confirmação (Sinal)
              </label>
              <textarea
                value={formData.confirmationMessageTemplate}
                onChange={(e) => setFormData({ ...formData, confirmationMessageTemplate: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc] min-h-[60px]"
                placeholder="Ex: ENTRADA CONFIRMADA! {DIRECTION} em {TICKER}"
              />
            </div>
            <p className="text-[10px] text-gray-500 font-mono">Variáveis suportadas: {"{TICKER}"}, {"{TIMEFRAME}"}, {"{DIRECTION}"}, {"{ENTRY_TIME}"}, {"{EXPIRY_TIME}"}</p>
          </div>

          <div className="space-y-3 pt-4 border-t border-[#222230]">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Mensagem de Início de Sessão
              </label>
              <textarea
                value={formData.startMessageTemplate || ''}
                onChange={(e) => setFormData({ ...formData, startMessageTemplate: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc] min-h-[60px]"
                placeholder="Ex: Iniciando as operações do dia..."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Mensagem de Fim de Sessão
              </label>
              <textarea
                value={formData.endMessageTemplate || ''}
                onChange={(e) => setFormData({ ...formData, endMessageTemplate: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc] min-h-[60px]"
                placeholder="Ex: Fim das operações da sessão."
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
                Mensagem de Resultado do Dia
              </label>
              <textarea
                value={formData.dailyResultMessageTemplate || ''}
                onChange={(e) => setFormData({ ...formData, dailyResultMessageTemplate: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc] min-h-[80px]"
                placeholder="Ex: RESULTADO DO DIA! Wins: {WINS} | Losses: {LOSSES}"
              />
            </div>
            <p className="text-[10px] text-gray-500 font-mono">Variáveis suportadas p/ Fim e Resultado: {"{WINS}"}, {"{LOSSES}"}, {"{ASSERTIVIDADE}"}</p>
          </div>
        </div>

        {/* Emojis & Formatação */}
        <div className="space-y-4 pt-6 border-t border-[#222230]">
          <h3 className="text-sm font-bold text-[#0088cc] uppercase tracking-wider font-mono flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            Formatação de Resultados (Emojis/Figuras)
          </h3>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-400 mb-1 font-mono uppercase">
                Emoji WIN
              </label>
              <input
                type="text"
                value={formData.emojiWin}
                onChange={(e) => setFormData({ ...formData, emojiWin: e.target.value })}
                className="w-full p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-white text-lg text-center focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-red-400 mb-1 font-mono uppercase">
                Emoji LOSS
              </label>
              <input
                type="text"
                value={formData.emojiLoss}
                onChange={(e) => setFormData({ ...formData, emojiLoss: e.target.value })}
                className="w-full p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-white text-lg text-center focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-amber-400 mb-1 font-mono uppercase">
                Emoji DOJI
              </label>
              <input
                type="text"
                value={formData.emojiDoji}
                onChange={(e) => setFormData({ ...formData, emojiDoji: e.target.value })}
                className="w-full p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-white text-lg text-center focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Sticker ID (WIN)
              </label>
              <input
                type="text"
                placeholder="Ex: CAACAgIAAxkBA..."
                value={formData.winStickerId || ''}
                onChange={(e) => setFormData({ ...formData, winStickerId: e.target.value })}
                className="w-full p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-red-400" /> Sticker ID (LOSS)
              </label>
              <input
                type="text"
                placeholder="Ex: CAACAgIAAxkBA..."
                value={formData.lossStickerId || ''}
                onChange={(e) => setFormData({ ...formData, lossStickerId: e.target.value })}
                className="w-full p-3 rounded-xl bg-red-950/20 border border-red-500/20 text-white text-xs focus:outline-none focus:border-red-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" /> Sticker ID (DOJI)
              </label>
              <input
                type="text"
                placeholder="Ex: CAACAgIAAxkBA..."
                value={formData.dojiStickerId || ''}
                onChange={(e) => setFormData({ ...formData, dojiStickerId: e.target.value })}
                className="w-full p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
              Pares Permitidos (separados por vírgula)
            </label>
            <input
              type="text"
              placeholder="EUR/USD, GBP/USD, USD/JPY"
              value={rawPairs}
              onChange={handlePairsChange}
              className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc]"
            />
          </div>
        </div>

        {/* Schedules */}
        <div className="space-y-4 pt-6 border-t border-[#222230]">
          <h3 className="text-sm font-bold text-[#0088cc] uppercase tracking-wider font-mono flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Horários das Sessões
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#171724] border border-[#272738] space-y-3">
              <span className="text-xs font-bold text-orange-400 font-mono uppercase">Manhã</span>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={formData.morningStartTime}
                  onChange={(e) => setFormData({ ...formData, morningStartTime: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#111118] border border-[#272738] text-white text-xs focus:outline-none"
                />
                <input
                  type="time"
                  value={formData.morningEndTime}
                  onChange={(e) => setFormData({ ...formData, morningEndTime: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#111118] border border-[#272738] text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#171724] border border-[#272738] space-y-3">
              <span className="text-xs font-bold text-amber-400 font-mono uppercase">Tarde</span>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={formData.afternoonStartTime}
                  onChange={(e) => setFormData({ ...formData, afternoonStartTime: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#111118] border border-[#272738] text-white text-xs focus:outline-none"
                />
                <input
                  type="time"
                  value={formData.afternoonEndTime}
                  onChange={(e) => setFormData({ ...formData, afternoonEndTime: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#111118] border border-[#272738] text-white text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#171724] border border-[#272738] space-y-3">
              <span className="text-xs font-bold text-indigo-400 font-mono uppercase">Noite</span>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={formData.nightStartTime}
                  onChange={(e) => setFormData({ ...formData, nightStartTime: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#111118] border border-[#272738] text-white text-xs focus:outline-none"
                />
                <input
                  type="time"
                  value={formData.nightEndTime}
                  onChange={(e) => setFormData({ ...formData, nightEndTime: e.target.value })}
                  className="w-full p-2 rounded-lg bg-[#111118] border border-[#272738] text-white text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 pt-6 border-t border-[#222230]">
          <h3 className="text-sm font-bold text-[#0088cc] uppercase tracking-wider font-mono flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Mensagens Padrão
          </h3>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
              Mensagem de Início de Sessão
            </label>
            <textarea
              rows={3}
              value={formData.startMessageTemplate}
              onChange={(e) => setFormData({ ...formData, startMessageTemplate: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc]"
              placeholder="Ex: Bom dia Traders! O mercado está aberto e vamos analisar as melhores oportunidades..."
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 font-mono uppercase">
              Mensagem de Fim de Sessão (Relatório Final)
            </label>
            <textarea
              rows={3}
              value={formData.endMessageTemplate}
              onChange={(e) => setFormData({ ...formData, endMessageTemplate: e.target.value })}
              className="w-full p-3 rounded-xl bg-[#171724] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#0088cc]"
              placeholder="Ex: Fechamos as análises de hoje! Confiram o placar das nossas indicações."
            ></textarea>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#222230]">
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTestMessage}
              disabled={testStatus.loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#171724] hover:bg-[#202033] border border-[#272738] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-[#0088cc]" />
              <span>{testStatus.loading ? 'Enviando...' : 'Testar Sinal'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendReport}
              disabled={reportStatus.loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#171724] hover:bg-[#202033] border border-[#272738] text-white text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>{reportStatus.loading ? 'Enviando...' : 'Enviar Relatório'}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {isSaved && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Configurações salvas!
              </span>
            )}
            {testStatus.success && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                Sinal testado!
              </span>
            )}
            {testStatus.error && (
              <span className="text-xs text-red-400 font-bold flex items-center gap-1">
                Erro no Teste: {testStatus.error}
              </span>
            )}
            {reportStatus.success && (
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                Relatório enviado!
              </span>
            )}
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0088cc] hover:bg-[#0099e6] text-white font-extrabold text-xs transition-colors shadow-lg shadow-[#0088cc]/20 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </div>

      </form>
    </div>
  );
};
