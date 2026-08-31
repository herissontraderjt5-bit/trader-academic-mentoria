import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Save,
  Plus,
  Trash2,
  RotateCcw,
  Download,
  Upload,
  Calendar,
  DollarSign,
  Percent,
  Target,
  ShieldAlert,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { getCurrencySymbol } from '../../utils/formatters';

interface SettingsViewProps {
  onOpenInitialSetup: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenInitialSetup }) => {
  const {
    monthConfig,
    updateMonthConfig,
    monthlyStats,
    startNewMonth,
    resetToDemoData,
    clearAllData,
    formatCurrency,
  } = useTrading();

  // Form states
  const [initialBankroll, setInitialBankroll] = useState<number>(monthConfig.initialBankroll);
  const [currency, setCurrency] = useState<'BRL' | 'USD' | 'EUR'>(monthConfig.currency);
  const [monthlyGoalPercent, setMonthlyGoalPercent] = useState<number>(monthConfig.monthlyGoalPercent || 80);
  const [workingDays, setWorkingDays] = useState<number>(monthConfig.workingDays || 20);
  const [defaultPayout, setDefaultPayout] = useState<number>(monthConfig.defaultPayout || 87);

  // Custom Assets
  const [customAssets, setCustomAssets] = useState<string[]>(
    monthConfig.customAssets || ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'EUR/JPY', 'BTC/USDT']
  );
  const [newAssetInput, setNewAssetInput] = useState<string>('');

  // Custom Strategies
  const [customStrategies, setCustomStrategies] = useState<string[]>(
    monthConfig.customStrategies || ['Gestão 2x1', 'Gestão 5x2', 'Suporte e Resistência', 'Pullback', 'Fibonacci', 'MHI', 'Fluxo de Vela']
  );
  const [newStrategyInput, setNewStrategyInput] = useState<string>('');

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSaveGeneralConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateMonthConfig({
      initialBankroll: Number(initialBankroll),
      currency,
      monthlyGoalPercent: Number(monthlyGoalPercent),
      workingDays: Number(workingDays),
      defaultPayout: Number(defaultPayout),
      customAssets,
      customStrategies,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddAsset = () => {
    if (!newAssetInput.trim()) return;
    const clean = newAssetInput.trim().toUpperCase();
    if (!customAssets.includes(clean)) {
      const updated = [...customAssets, clean];
      setCustomAssets(updated);
      updateMonthConfig({ customAssets: updated });
    }
    setNewAssetInput('');
  };

  const handleRemoveAsset = (asset: string) => {
    const updated = customAssets.filter((a) => a !== asset);
    setCustomAssets(updated);
    updateMonthConfig({ customAssets: updated });
  };

  const handleAddStrategy = () => {
    if (!newStrategyInput.trim()) return;
    const clean = newStrategyInput.trim();
    if (!customStrategies.includes(clean)) {
      const updated = [...customStrategies, clean];
      setCustomStrategies(updated);
      updateMonthConfig({ customStrategies: updated });
    }
    setNewStrategyInput('');
  };

  const handleRemoveStrategy = (strat: string) => {
    const updated = customStrategies.filter((s) => s !== strat);
    setCustomStrategies(updated);
    updateMonthConfig({ customStrategies: updated });
  };

  // Close Month & Start New Month
  const handleCloseAndStartNew = () => {
    const currentFinalBankroll = monthlyStats.currentBankroll;
    const nextMonthNum = monthConfig.month === 12 ? 1 : monthConfig.month + 1;
    const nextYear = monthConfig.month === 12 ? monthConfig.year + 1 : monthConfig.year;
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const nextName = `${monthNames[nextMonthNum - 1]} de ${nextYear}`;

    if (
      window.confirm(
        `Deseja fechar o mês de ${monthConfig.name} e iniciar ${nextName}?\n\nO saldo final de ${formatCurrency(
          currentFinalBankroll
        )} será definido como a Banca Inicial do próximo mês.`
      )
    ) {
      startNewMonth(nextName, nextMonthNum, nextYear, currentFinalBankroll);
      alert(`Mês ${nextName} iniciado com sucesso com banca de ${formatCurrency(currentFinalBankroll)}!`);
    }
  };

  const currentSymbol = getCurrencySymbol(currency);

  return (
    <div className="space-y-6 pb-12" id="view-settings">
      {/* Header */}
      <div className="p-5 bg-[#121722] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Configurações do Sistema & Mês Operacional
            </h2>
            <p className="text-xs text-slate-400">
              Personalize banca inicial, meta mensal, dias trabalhados, moeda, ativos e estratégias
            </p>
          </div>
        </div>

        <button
          id="btn-close-and-start-new-month"
          onClick={handleCloseAndStartNew}
          className="px-4 py-2 rounded-lg text-xs font-black bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white shadow-lg shadow-orange-950 transition-all flex items-center gap-1.5"
        >
          <Calendar className="w-4 h-4" />
          Fechar Mês e Iniciar Novo Mês
        </button>
      </div>

      {/* Main Settings Form */}
      <form
        onSubmit={handleSaveGeneralConfig}
        className="p-5 bg-[#121722] border border-slate-800 rounded-xl space-y-5"
        id="form-settings"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Parâmetros Financeiros do Mês ({monthConfig.name})
          </h3>
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
              ✓ Configurações salvas com sucesso!
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
          {/* Moeda */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Moeda da Conta</label>
            <select
              id="select-settings-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-white font-semibold focus:border-orange-500 transition-colors"
            >
              <option value="BRL">BRL (R$) - Real Brasileiro</option>
              <option value="USD">USD ($) - Dólar Americano</option>
              <option value="EUR">EUR (€) - Euro</option>
            </select>
          </div>

          {/* Banca Inicial */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Banca Inicial ({currentSymbol})
            </label>
            <input
              id="input-settings-initial-bankroll"
              type="number"
              step="0.01"
              required
              value={initialBankroll}
              onChange={(e) => setInitialBankroll(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Meta Mensal % */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Meta Mensal (% da banca)</label>
            <input
              id="input-settings-monthly-goal-percent"
              type="number"
              step="0.5"
              required
              value={monthlyGoalPercent}
              onChange={(e) => setMonthlyGoalPercent(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-orange-500 transition-colors"
            />
          </div>

          {/* Quantidade de Dias Trabalhados */}
          <div>
            <label className="block font-semibold text-cyan-400 mb-1">
              Dias Trabalhados no Mês
            </label>
            <input
              id="input-settings-working-days"
              type="number"
              step="1"
              min="1"
              max="31"
              required
              value={workingDays}
              onChange={(e) => setWorkingDays(parseInt(e.target.value, 10) || 20)}
              className="w-full bg-[#0b0e14] border border-cyan-500/40 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-500 transition-colors"
            />
          </div>

          {/* Payout Padrão */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Payout Padrão (%)</label>
            <input
              id="input-settings-default-payout"
              type="number"
              step="1"
              min="1"
              max="100"
              value={defaultPayout}
              onChange={(e) => setDefaultPayout(parseFloat(e.target.value) || 87)}
              className="w-full bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="submit"
            id="btn-save-settings"
            className="px-5 py-2 rounded-lg text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            Salvar Alterações
          </button>
        </div>
      </form>

      {/* Custom Assets & Custom Strategies Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Ativos Cadastrados */}
        <div className="p-5 bg-[#121722] border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Pares de Moedas & Ativos Customizados
          </h3>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ex: AUD/CAD, USD/BRL, ETH/USDT"
              value={newAssetInput}
              onChange={(e) => setNewAssetInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAsset())}
              className="flex-1 bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white uppercase"
            />
            <button
              type="button"
              onClick={handleAddAsset}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-orange-500 text-white flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {customAssets.map((asset) => (
              <span
                key={asset}
                className="px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-slate-700 text-xs font-mono font-bold text-cyan-300 flex items-center gap-1.5"
              >
                {asset}
                <button
                  type="button"
                  onClick={() => handleRemoveAsset(asset)}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Estratégias Cadastradas */}
        <div className="p-5 bg-[#121722] border border-slate-800 rounded-xl space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Estratégias & Gatilhos Operacionais
          </h3>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Ex: Rompimento, LTA/LTB, Rejeição de Topo"
              value={newStrategyInput}
              onChange={(e) => setNewStrategyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddStrategy())}
              className="flex-1 bg-[#0b0e14] border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
            />
            <button
              type="button"
              onClick={handleAddStrategy}
              className="px-3 py-2 rounded-lg text-xs font-bold bg-orange-500 text-white flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {customStrategies.map((strat) => (
              <span
                key={strat}
                className="px-2.5 py-1 rounded-lg bg-[#0b0e14] border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
              >
                {strat}
                <button
                  type="button"
                  onClick={() => handleRemoveStrategy(strat)}
                  className="text-slate-500 hover:text-rose-400"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Danger Zone & Data Reset */}
      <div className="p-5 bg-[#121722] border border-rose-950 rounded-xl space-y-4">
        <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Área de Manutenção de Dados
        </h3>

        <p className="text-xs text-slate-400">
          Você pode restaurar o banco de dados para os dados profissionais de demonstração ou zerar todas as operações do mês atual.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Deseja recarregar o conjunto completo de dados de demonstração?')) {
                resetToDemoData();
                alert('Dados de demonstração restaurados com sucesso!');
              }
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar Dados Demo
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'ATENÇÃO: Deseja apagar todas as operações e movimentações cadastradas no mês atual?'
                )
              ) {
                clearAllData();
                alert('Mês limpo com sucesso.');
              }
            }}
            className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-950/60 hover:bg-rose-900 border border-rose-700 text-rose-300 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar Operações do Mês
          </button>
        </div>
      </div>
    </div>
  );
};
