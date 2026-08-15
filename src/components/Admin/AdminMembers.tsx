import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Edit, 
  Trash2, 
  CheckCircle2, 
  X, 
  Check, 
  KeyRound, 
  Sliders, 
  RotateCcw, 
  Phone, 
  Mail, 
  Calendar,
  Sparkles,
  Award,
  BarChart2,
  Globe,
  TrendingUp
} from 'lucide-react';
import { User, Module, Tier, StudentStatus } from '../../types';
import { supabaseService } from '../../services/supabaseService';
import { storageService } from '../../services/storage';
import { getAvatarUrl } from '../../utils/avatar';

interface AdminMembersProps {
  users: User[];
  modules: Module[];
  onUpdateUsers: (users: User[]) => void;
}

export const AdminMembers: React.FC<AdminMembersProps> = ({
  users,
  modules,
  onUpdateUsers,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal states
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [customAccessUser, setCustomAccessUser] = useState<User | null>(null);
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [isOverrideActive, setIsOverrideActive] = useState(false);

  // Certificate Release Modal State
  const [certReleaseUser, setCertReleaseUser] = useState<User | null>(null);
  const [selectedCerts, setSelectedCerts] = useState<('b3' | 'binarias' | 'forex')[]>([]);

  const handleOpenCertRelease = (user: User) => {
    setCertReleaseUser(user);
    setSelectedCerts(user.allowedCertificates || []);
  };

  const handleSaveCertRelease = () => {
    if (!certReleaseUser) return;
    const updated = users.map((u) => {
      if (u.id === certReleaseUser.id) {
        const uUpdated = {
          ...u,
          allowedCertificates: selectedCerts,
        };
        if (supabaseService.isConfigured()) {
          supabaseService.upsertProfile(uUpdated);
        }
        return uUpdated;
      }
      return u;
    });
    onUpdateUsers(updated);
    storageService.saveStudents(updated);
    setCertReleaseUser(null);
  };

  const toggleCertSelection = (cert: 'b3' | 'binarias' | 'forex') => {
    setSelectedCerts((prev) =>
      prev.includes(cert) ? prev.filter((c) => c !== cert) : [...prev, cert]
    );
  };

  // New user form
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    whatsapp: '',
    tier: 'Free' as Tier,
    status: 'Ativo' as StudentStatus,
  });

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.whatsapp && u.whatsapp.includes(searchQuery));
    const matchesTier = filterTier === 'all' || u.tier === filterTier;
    const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
    return matchesSearch && matchesTier && matchesStatus;
  });

  // Open Custom Access Modal for a user
  const handleOpenCustomAccess = (user: User) => {
    setCustomAccessUser(user);
    if (user.customAllowedModuleIds && user.customAllowedModuleIds.length > 0) {
      setSelectedModuleIds(user.customAllowedModuleIds);
      setIsOverrideActive(true);
    } else {
      const tierHierarchy: Record<string, number> = { 'Free': 1, 'VIP': 2, 'Vitalício': 3 };
      const userLevel = tierHierarchy[user.tier] || 1;
      const defaultIds = modules
        .filter(m => (tierHierarchy[m.requiredTier] || 1) <= userLevel)
        .map(m => m.id);
      setSelectedModuleIds(defaultIds);
      setIsOverrideActive(false);
    }
  };

  // Save Custom Access
  const handleSaveCustomAccess = () => {
    if (!customAccessUser) return;

    let targetUpdated: User | null = null;
    const updated = users.map((u) => {
      if (u.id === customAccessUser.id) {
        targetUpdated = {
          ...u,
          customAllowedModuleIds: isOverrideActive ? selectedModuleIds : undefined,
        };
        return targetUpdated;
      }
      return u;
    });

    onUpdateUsers(updated);
    if (targetUpdated && supabaseService.isConfigured()) {
      supabaseService.upsertProfile(targetUpdated);
    }
    setCustomAccessUser(null);
  };

  // Toggle Module Selection in Custom Access Modal
  const toggleModuleSelection = (moduleId: string) => {
    setIsOverrideActive(true);
    if (selectedModuleIds.includes(moduleId)) {
      setSelectedModuleIds(selectedModuleIds.filter((id) => id !== moduleId));
    } else {
      setSelectedModuleIds([...selectedModuleIds, moduleId]);
    }
  };

  // Toggle Status (Ativo / Bloqueado)
  const handleToggleStatus = (userId: string) => {
    let targetUpdated: User | null = null;
    const updated = users.map((u) => {
      if (u.id === userId) {
        targetUpdated = {
          ...u,
          status: u.status === 'Ativo' ? ('Bloqueado' as StudentStatus) : ('Ativo' as StudentStatus),
        };
        return targetUpdated;
      }
      return u;
    });
    onUpdateUsers(updated);
    if (targetUpdated && supabaseService.isConfigured()) {
      supabaseService.upsertProfile(targetUpdated);
    }
  };

  // Change Tier
  const handleChangeTier = (userId: string, newTier: Tier) => {
    let targetUpdated: User | null = null;
    const updated = users.map((u) => {
      if (u.id === userId) {
        targetUpdated = {
          ...u,
          tier: newTier,
        };
        return targetUpdated;
      }
      return u;
    });
    onUpdateUsers(updated);
    if (targetUpdated && supabaseService.isConfigured()) {
      supabaseService.upsertProfile(targetUpdated);
    }
  };

  // Delete User
  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja remover este aluno?')) {
      const updated = users.filter((u) => u.id !== userId);
      onUpdateUsers(updated);
      storageService.deleteStudent(userId);
    }
  };

  // Add User Submission
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.email) return;

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: newUserForm.name,
      email: newUserForm.email,
      whatsapp: newUserForm.whatsapp,
      tier: newUserForm.tier,
      status: newUserForm.status,
      role: 'student',
      avatar: '',
      joinedAt: new Date().toLocaleDateString('pt-BR'),
      progress: {
        completedLessonIds: [],
        lastWatchedModuleId: modules[0]?.id || '',
        lastWatchedLessonId: modules[0]?.lessons[0]?.id || '',
      },
      notes: {},
    };

    onUpdateUsers([newUser, ...users]);
    if (supabaseService.isConfigured()) {
      supabaseService.upsertProfile(newUser);
    }
    setIsAddUserModalOpen(false);
    setNewUserForm({
      name: '',
      email: '',
      whatsapp: '',
      tier: 'Free',
      status: 'Ativo',
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gestão de Alunos & Acessos
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Controle de matrículas, liberação granular de módulos e status de pagamento.
          </p>
        </div>

        <button
          onClick={() => setIsAddUserModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all shadow-lg shadow-orange-600/30 cursor-pointer uppercase tracking-wider"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Aluno</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
        <div className="flex items-center bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 flex-1 sm:max-w-md">
          <Search className="w-4 h-4 text-zinc-400 mr-2" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou WhatsApp..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-white placeholder:text-zinc-500 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-300 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos os Planos</option>
            <option value="Free">Free (Opções Binárias)</option>
            <option value="VIP">VIP</option>
            <option value="Vitalício">Vitalício</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-300 text-xs focus:outline-none focus:border-orange-500"
          >
            <option value="all">Todos os Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Bloqueado">Bloqueado</option>
          </select>
        </div>
      </div>

      {/* Members Directory Table */}
      <div className="rounded-2xl bg-zinc-900/50 border border-white/5 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-zinc-900/80 text-[11px] font-bold text-zinc-500 uppercase font-mono tracking-wider">
                <th className="py-3.5 px-4 sm:px-6">Aluno</th>
                <th className="py-3.5 px-4">Plano / Categoria</th>
                <th className="py-3.5 px-4">Acessos</th>
                <th className="py-3.5 px-4">Progresso</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    Nenhum aluno encontrado com esses filtros.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCustom = user.customAllowedModuleIds && user.customAllowedModuleIds.length > 0;
                  const totalLessonsCount = modules.reduce((acc, m) => acc + m.lessons.length, 0);
                  const progressPct = totalLessonsCount > 0 
                    ? Math.round((user.progress.completedLessonIds.length / totalLessonsCount) * 100) 
                    : 0;

                  return (
                    <tr key={user.id} className="hover:bg-zinc-800/40 transition-colors">
                      
                      {/* Name & Contact */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={getAvatarUrl(user.avatar)}
                            alt={user.name}
                            className="w-10 h-10 rounded-xl object-cover ring-1 ring-orange-500/50"
                          />
                          <div>
                            <h4 className="font-bold text-white leading-tight flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {user.role === 'admin' && (
                                <span className="px-1.5 py-0.2 rounded bg-red-950 text-red-400 text-[9px] font-mono border border-red-500/40 uppercase">
                                  Admin
                                </span>
                              )}
                            </h4>
                            <p className="text-zinc-400 text-[11px]">{user.email}</p>
                            {user.whatsapp && (
                              <span className="text-[10px] text-orange-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-2.5 h-2.5" />
                                {user.whatsapp}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tier Selector */}
                      <td className="py-4 px-4">
                        <select
                          value={user.tier}
                          onChange={(e) => handleChangeTier(user.id, e.target.value as Tier)}
                          className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:border-orange-500 cursor-pointer"
                        >
                          <option value="Free">Free</option>
                          <option value="VIP">VIP</option>
                          <option value="Vitalício">Vitalício</option>
                        </select>
                      </td>

                      {/* Custom Access Button & Indicator */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleOpenCustomAccess(user)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCustom
                              ? 'bg-orange-600/20 text-orange-400 border border-orange-500/50'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/5'
                          }`}
                        >
                          <Sliders className="w-3.5 h-3.5" />
                          <span>{isCustom ? 'Personalizado' : 'Padrão'}</span>
                        </button>
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-4">
                        <div className="w-28">
                          <div className="flex justify-between text-[10px] text-zinc-400 font-mono mb-1">
                            <span>{user.progress.completedLessonIds.length} aulas</span>
                            <span className="text-orange-400 font-bold">{progressPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${progressPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(user.id)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            user.status === 'Ativo'
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-900'
                              : 'bg-red-950 text-red-400 border border-red-500/40 hover:bg-red-900'
                          }`}
                        >
                          {user.status}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenCertRelease(user)}
                            className={`p-2 rounded-xl border transition-all cursor-pointer ${
                              user.allowedCertificates && user.allowedCertificates.length > 0
                                ? 'bg-orange-600/20 text-orange-400 border-orange-500/40 hover:bg-orange-600/30'
                                : 'bg-zinc-800 text-zinc-300 hover:text-orange-400 hover:bg-zinc-700 border-white/5'
                            }`}
                            title="Liberar Certificados (B3, Opções Binárias, Forex)"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenCustomAccess(user)}
                            className="p-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-orange-400 hover:bg-zinc-700 border border-white/5 transition-all cursor-pointer"
                            title="Gerenciar Módulos"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-red-400 hover:bg-zinc-700 border border-white/5 transition-all cursor-pointer"
                            title="Excluir Aluno"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Custom Access per Member */}
      {customAccessUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl bg-[#0a0a0a] border border-orange-900/30 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-orange-500" />
                  <span>Liberar Módulos Personalizados</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Aluno: <strong className="text-white">{customAccessUser.name}</strong> ({customAccessUser.tier})
                </p>
              </div>
              <button
                onClick={() => setCustomAccessUser(null)}
                className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="p-3 rounded-xl bg-orange-600/10 border border-orange-600/20 text-xs text-orange-400 flex items-center justify-between">
                <div>
                  <span className="font-bold">Regra de Acesso Ativa: </span>
                  <span>{isOverrideActive ? 'Manual (Personalizada)' : `Automática (Plano ${customAccessUser.tier})`}</span>
                </div>
                {isOverrideActive && (
                  <button
                    onClick={() => {
                      const tierHierarchy: Record<string, number> = { 'Free': 1, 'VIP': 2, 'Vitalício': 3 };
                      const userLevel = tierHierarchy[customAccessUser.tier] || 1;
                      const defaultIds = modules
                        .filter(m => (tierHierarchy[m.requiredTier] || 1) <= userLevel)
                        .map(m => m.id);
                      setSelectedModuleIds(defaultIds);
                      setIsOverrideActive(false);
                    }}
                    className="flex items-center gap-1 text-[11px] underline font-bold"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Resetar para Plano
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {modules.map((mod) => {
                  const isSelected = selectedModuleIds.includes(mod.id);
                  return (
                    <div
                      key={mod.id}
                      onClick={() => toggleModuleSelection(mod.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        isSelected
                          ? 'bg-orange-600/10 border-orange-500/50 text-white'
                          : 'bg-zinc-900 border-white/5 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-orange-600 text-white' : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          <Check className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">{mod.title}</h4>
                          <p className="text-[10px] text-zinc-500">Requer: {mod.requiredTier} • {mod.lessons.length} aulas</p>
                        </div>
                      </div>

                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                        isSelected ? 'bg-orange-600/20 text-orange-400' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {isSelected ? 'Liberado' : 'Bloqueado'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex items-center justify-end gap-3 bg-zinc-900/60">
              <button
                onClick={() => setCustomAccessUser(null)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCustomAccess}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-lg shadow-orange-600/30 cursor-pointer uppercase tracking-wider"
              >
                Salvar Acessos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add New Student */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0a0a0a] border border-orange-900/30 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-500" />
                <span>Matricular Novo Aluno</span>
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Albuquerque"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5">
                  E-mail do Aluno (Login)
                </label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@email.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5">
                  WhatsApp (DDD + Número)
                </label>
                <input
                  type="text"
                  placeholder="11999998888"
                  value={newUserForm.whatsapp}
                  onChange={(e) => setNewUserForm({ ...newUserForm, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5">
                    Plano Adquirido
                  </label>
                  <select
                    value={newUserForm.tier}
                    onChange={(e) => setNewUserForm({ ...newUserForm, tier: e.target.value as Tier })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Free">Free (Opções Binárias)</option>
                    <option value="VIP">VIP</option>
                    <option value="Vitalício">Vitalício</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5">
                    Status Inicial
                  </label>
                  <select
                    value={newUserForm.status}
                    onChange={(e) => setNewUserForm({ ...newUserForm, status: e.target.value as StudentStatus })}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-lg shadow-orange-600/30 uppercase tracking-wider"
                >
                  Cadastrar Aluno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Certificate Release per Member */}
      {certReleaseUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-[#0a0a0a] border border-orange-900/30 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-orange-500" />
                  <span>Liberar Certificados Oficiais</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Aluno: <strong className="text-white">{certReleaseUser.name}</strong> ({certReleaseUser.tier})
                </p>
              </div>
              <button
                onClick={() => setCertReleaseUser(null)}
                className="p-2 rounded-xl bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Selecione os certificados que deseja liberar para download por este aluno, independente do progresso:
              </p>

              <div className="space-y-3">
                <div
                  onClick={() => toggleCertSelection('b3')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedCerts.includes('b3')
                      ? 'bg-orange-600/10 border-orange-500/50 text-white'
                      : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <div>
                      <h4 className="text-xs font-black">Certificado B3 (Mini-Índice & Dólar)</h4>
                      <p className="text-[10px] text-zinc-400">Operações no Mercado Nacional</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${selectedCerts.includes('b3') ? 'bg-orange-500 border-orange-500 text-white' : 'border-zinc-700'}`}>
                    {selectedCerts.includes('b3') && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div
                  onClick={() => toggleCertSelection('binarias')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedCerts.includes('binarias')
                      ? 'bg-emerald-600/10 border-emerald-500/50 text-white'
                      : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BarChart2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="text-xs font-black">Certificado Opções Binárias</h4>
                      <p className="text-[10px] text-zinc-400">Price Action Avançado M1/M5</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${selectedCerts.includes('binarias') ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-zinc-700'}`}>
                    {selectedCerts.includes('binarias') && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>

                <div
                  onClick={() => toggleCertSelection('forex')}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedCerts.includes('forex')
                      ? 'bg-blue-600/10 border-blue-500/50 text-white'
                      : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="text-xs font-black">Certificado Forex</h4>
                      <p className="text-[10px] text-zinc-400">Mercado Internacional de Câmbio</p>
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${selectedCerts.includes('forex') ? 'bg-blue-500 border-blue-500 text-white' : 'border-zinc-700'}`}>
                    {selectedCerts.includes('forex') && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex items-center justify-between gap-3 bg-zinc-900/40">
              <button
                type="button"
                onClick={() => setSelectedCerts(['b3', 'binarias', 'forex'])}
                className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
              >
                Liberar Todos
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCertReleaseUser(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCertRelease}
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer transition-all shadow-lg shadow-orange-600/20"
                >
                  Salvar Liberados
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
