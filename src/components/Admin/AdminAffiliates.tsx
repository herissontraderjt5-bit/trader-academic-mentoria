import React, { useState } from 'react';
import { Users, DollarSign, Percent, Save, Search, UserCheck } from 'lucide-react';
import { User, PlatformSettings } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { storageService } from '../../services/storage';

interface AdminAffiliatesProps {
  users: User[];
  settings: PlatformSettings;
  onUpdateUsers: (users: User[]) => void;
  onUpdateSettings: (settings: PlatformSettings) => void;
}

export const AdminAffiliates: React.FC<AdminAffiliatesProps> = ({
  users,
  settings,
  onUpdateUsers,
  onUpdateSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOnlyActive, setFilterOnlyActive] = useState(true);
  
  // Local states for inputs being edited
  const [editingBalances, setEditingBalances] = useState<Record<string, number>>({});
  const [editingTotalEarned, setEditingTotalEarned] = useState<Record<string, number>>({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  // Global settings local states
  const [commissionPercent, setCommissionPercent] = useState(settings.referralCommissionPercent ?? 10.0);
  const [minWithdrawal, setMinWithdrawal] = useState(settings.minWithdrawalAmount ?? 50.0);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Get users referred by a specific parent ID
  const getReferredUsers = (parentId: string) => {
    return users.filter(u => u.referredById === parentId);
  };

  // Filter affiliates list
  const filteredAffiliates = users.filter(u => {
    const referredList = getReferredUsers(u.id);
    const hasReferrals = referredList.length > 0;
    
    // Search filter
    const matchesSearch = 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (filterOnlyActive) {
      return hasReferrals && matchesSearch;
    }
    return matchesSearch;
  });

  // Handle saving global settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const updatedSettings = {
        ...settings,
        referralCommissionPercent: commissionPercent,
        minWithdrawalAmount: minWithdrawal
      };
      onUpdateSettings(updatedSettings);
      storageService.saveSettings(updatedSettings);
      alert('Configurações de comissão atualizadas com sucesso!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle saving individual affiliate balance & total earned
  const handleSaveAffiliateData = async (userId: string) => {
    const userToUpdate = users.find(u => u.id === userId);
    if (!userToUpdate) return;

    setSavingUserId(userId);
    try {
      const newBalance = editingBalances[userId] !== undefined ? editingBalances[userId] : (userToUpdate.referralBalance ?? 0);
      const newTotalEarned = editingTotalEarned[userId] !== undefined ? editingTotalEarned[userId] : (userToUpdate.totalEarned ?? 0);

      const updatedUser: User = {
        ...userToUpdate,
        referralBalance: Number(newBalance),
        totalEarned: Number(newTotalEarned)
      };

      // Update in state
      const updatedUsers = users.map(u => u.id === userId ? updatedUser : u);
      onUpdateUsers(updatedUsers);

      // Save to localStorage & Supabase
      storageService.saveStudents(updatedUsers);
      if (supabaseService.isConfigured()) {
        await supabaseService.upsertProfile(updatedUser);
      }

      alert(`Saldos de ${userToUpdate.name} atualizados com sucesso!`);
    } catch (e) {
      console.error(e);
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white uppercase tracking-tight">
          Gestão de Afiliados & Indicações
        </h2>
        <p className="text-xs text-zinc-400">
          Monitore indicações, defina porcentagens de comissões e ajuste manualmente os saldos dos alunos.
        </p>
      </div>

      {/* Global Config Card */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-white/5 space-y-4">
        <h3 className="text-xs font-black text-[#ff8800] uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Percent className="w-4 h-4" />
          <span>Configuração Global de Afiliados</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1 font-mono uppercase">
              Porcentagem de Comissão (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={commissionPercent}
              onChange={(e) => setCommissionPercent(parseFloat(e.target.value) || 0)}
              className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 mb-1 font-mono uppercase">
              Saque Mínimo PIX (R$)
            </label>
            <input
              type="number"
              step="1"
              value={minWithdrawal}
              onChange={(e) => setMinWithdrawal(parseFloat(e.target.value) || 0)}
              className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={isSavingSettings}
            className="py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 cursor-pointer shadow shadow-orange-600/20 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Regras</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-white/5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterOnlyActive(!filterOnlyActive)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
              filterOnlyActive
                ? 'bg-orange-600/10 text-orange-400 border-orange-500/20'
                : 'bg-zinc-900 text-zinc-400 border-white/5'
            }`}
          >
            {filterOnlyActive ? 'Mostrar Todos os Alunos' : 'Filtrar Só Quem Indicou'}
          </button>
        </div>

      </div>

      {/* Affiliates Table */}
      <div className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden">
        {filteredAffiliates.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            Nenhum afiliado encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-[#0f0f15] text-[10px] text-zinc-400 font-black uppercase tracking-wider">
                  <th className="p-4">Afiliado / Padrinho</th>
                  <th className="p-4">Alunos Indicados</th>
                  <th className="p-4">Saldo Disponível (R$)</th>
                  <th className="p-4">Total Ganhos (R$)</th>
                  <th className="p-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredAffiliates.map((aff) => {
                  const referredList = getReferredUsers(aff.id);
                  const isSaving = savingUserId === aff.id;

                  // Get current value from editing states or default to user values
                  const currentBalance = editingBalances[aff.id] !== undefined ? editingBalances[aff.id] : (aff.referralBalance ?? 0);
                  const currentTotalEarned = editingTotalEarned[aff.id] !== undefined ? editingTotalEarned[aff.id] : (aff.totalEarned ?? 0);

                  return (
                    <tr key={aff.id} className="hover:bg-white/[0.01] transition-colors">
                      {/* Name & Email */}
                      <td className="p-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <span>{aff.name}</span>
                          {aff.role === 'admin' && (
                            <span className="text-[9px] bg-red-950 text-red-400 border border-red-500/20 px-1 py-0.2 rounded font-mono font-bold uppercase">ADM</span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{aff.email}</div>
                      </td>

                      {/* Referred users */}
                      <td className="p-4">
                        {referredList.length === 0 ? (
                          <span className="text-zinc-500 text-[10px] italic">Nenhuma indicação</span>
                        ) : (
                          <div className="space-y-1 max-w-xs">
                            <div className="text-[10px] font-bold text-emerald-400">
                              {referredList.length} {referredList.length === 1 ? 'indicado' : 'indicados'}:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {referredList.map((ref) => (
                                <span
                                  key={ref.id}
                                  className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono"
                                  title={ref.email}
                                >
                                  {ref.name.split(' ')[0]} ({ref.tier})
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Referral Balance (Editable) */}
                      <td className="p-4">
                        <div className="relative max-w-[120px]">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-[10px]">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={currentBalance}
                            onChange={(e) => setEditingBalances({
                              ...editingBalances,
                              [aff.id]: parseFloat(e.target.value) || 0
                            })}
                            className="w-full pl-7 pr-2.5 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-orange-500 text-right"
                          />
                        </div>
                      </td>

                      {/* Total Earned (Editable) */}
                      <td className="p-4">
                        <div className="relative max-w-[120px]">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 font-mono text-[10px]">R$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={currentTotalEarned}
                            onChange={(e) => setEditingTotalEarned({
                              ...editingTotalEarned,
                              [aff.id]: parseFloat(e.target.value) || 0
                            })}
                            className="w-full pl-7 pr-2.5 py-1.5 rounded-xl bg-zinc-950 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-orange-500 text-right"
                          />
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <button
                          disabled={isSaving}
                          onClick={() => handleSaveAffiliateData(aff.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ml-auto shadow shadow-orange-600/20 disabled:opacity-50"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>{isSaving ? 'Gravando...' : 'Salvar'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
