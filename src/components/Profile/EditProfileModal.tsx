import React, { useState, useRef } from 'react';
import { 
  X, 
  User as UserIcon, 
  Camera, 
  Upload, 
  Phone, 
  Mail, 
  Lock, 
  TrendingUp, 
  DollarSign, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Award
} from 'lucide-react';
import { User } from '../../types';
import { getAvatarUrl } from '../../utils/avatar';
import { compressImageFile } from '../../utils/imageCompressor';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSaveProfile: (updatedData: Partial<User>) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSaveProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'trading' | 'security'>('profile');
  
  // Basic info state
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [whatsapp, setWhatsapp] = useState(currentUser.whatsapp || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [avatarUrlInput, setAvatarUrlInput] = useState('');
  
  // Trading profile state
  const [tradingMarket, setTradingMarket] = useState(currentUser.tradingMarket || 'Mini-Índice & Dólar (B3)');
  const [tradingStyle, setTradingStyle] = useState(currentUser.tradingStyle || 'Day Trader (Price Action)');
  const [dailyTarget, setDailyTarget] = useState(currentUser.dailyTarget || 'R$ 500,00 / dia');
  const [bio, setBio] = useState(currentUser.bio || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // UI state
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Phone masking helper
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 11) val = val.slice(0, 11);
    
    if (val.length <= 2) {
      setWhatsapp(val);
    } else if (val.length <= 7) {
      setWhatsapp(`(${val.slice(0, 2)}) ${val.slice(2)}`);
    } else {
      setWhatsapp(`(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`);
    }
  };

  // Image upload via file input
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    try {
      const compressed = await compressImageFile(file, 400, 400, 0.8);
      setAvatar(compressed);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar imagem.');
    }
  };

  // Save handler
  const handleSave = () => {
    setErrorMessage('');
    setPasswordError('');

    if (!name.trim()) {
      setErrorMessage('O nome não pode ficar vazio.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Insira um endereço de email válido.');
      return;
    }

    const updates: Partial<User> = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      whatsapp: whatsapp.trim(),
      avatar: avatar || currentUser.avatar,
      tradingMarket,
      tradingStyle,
      dailyTarget,
      bio: bio.trim(),
    };

    // If attempting to change password
    if (newPassword || confirmNewPassword) {
      if (newPassword.length < 6) {
        setPasswordError('A nova senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setPasswordError('A confirmação da nova senha não confere.');
        return;
      }
      updates.password = newPassword;
    }

    setIsSaving(true);
    setTimeout(() => {
      onSaveProfile(updates);
      setIsSaving(false);
      setSuccessMessage('Perfil atualizado com sucesso!');
      
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-zinc-950 border border-orange-500/30 rounded-3xl shadow-2xl shadow-orange-950/40 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow Header */}
        <div className="relative p-6 bg-gradient-to-r from-orange-950/40 via-zinc-900 to-black border-b border-orange-900/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 shadow-lg shadow-orange-500/10">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight uppercase">
                Meu Perfil & Configurações
              </h2>
              <p className="text-xs text-zinc-400">
                Gerencie seus dados pessoais, foto, número e estratégia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/5 bg-zinc-900/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Dados Pessoais & Foto</span>
          </button>

          <button
            onClick={() => setActiveTab('trading')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'trading'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Perfil Trader & Metas</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'security'
                ? 'border-orange-500 text-orange-400'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Segurança & Senha</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-center gap-3 text-red-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-bold">{successMessage}</span>
            </div>
          )}

          {/* TAB 1: PROFILE & PHOTO */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              
              {/* Photo Section */}
              <div className="p-5 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-orange-400 font-mono">
                  Foto de Perfil / Avatar
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="relative group">
                    <img 
                      src={getAvatarUrl(avatar || currentUser.avatar)} 
                      alt="Avatar Preview" 
                      className="w-24 h-24 rounded-2xl object-cover ring-2 ring-orange-500/50 shadow-xl shadow-orange-950/50 group-hover:opacity-85 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity text-white text-xs font-bold gap-1 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Trocar</span>
                    </button>
                  </div>

                  <div className="flex-1 space-y-3 w-full">
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-orange-600/20"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carregar Foto do Computador/Celular</span>
                      </button>

                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar('')}
                          className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-red-950 text-zinc-300 hover:text-red-400 border border-white/10 hover:border-red-500/40 text-xs font-semibold transition-all cursor-pointer"
                        >
                          Remover Foto de Perfil
                        </button>
                      )}
                    </div>

                    {/* URL Input */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ou cole o link direto da sua imagem (URL)..."
                        value={avatarUrlInput}
                        onChange={(e) => setAvatarUrlInput(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl bg-black border border-white/10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (avatarUrlInput.trim()) {
                            setAvatar(avatarUrlInput.trim());
                            setAvatarUrlInput('');
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Data Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-orange-400" />
                    <span>Nome Completo</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Carlos Silva Trader"
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp / Telefone</span>
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={handlePhoneChange}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Email de Acesso</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seuemail@exemplo.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Membership Status Badge */}
              <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-zinc-400 block font-mono">Nível de Acesso</span>
                    <span className="text-sm font-black text-white">{currentUser.tier} • {currentUser.status}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-zinc-400 block font-mono">Membro Desde</span>
                  <span className="text-xs font-bold text-zinc-200">{currentUser.joinedAt}</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TRADING PROFILE & TARGETS */}
          {activeTab === 'trading' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-orange-950/20 border border-orange-500/20 text-xs text-orange-200">
                Configure sua rotina e objetivos de trader para personalizar sua jornada acadêmica na plataforma.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                    <span>Mercado Principal</span>
                  </label>
                  <select
                    value={tradingMarket}
                    onChange={(e) => setTradingMarket(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="Mini-Índice & Dólar (B3)">Mini-Índice & Dólar (B3)</option>
                    <option value="Ações Brasileiras (Swing/Day Trade)">Ações Brasileiras (Swing/Day Trade)</option>
                    <option value="Forex Internacional (EURUSD, XAUUSD)">Forex Internacional (EURUSD, XAUUSD)</option>
                    <option value="Criptomoedas & Futuros (BTC, ETH)">Criptomoedas & Futuros (BTC, ETH)</option>
                    <option value="Mercado Americano (SP500, Nasdaq)">Mercado Americano (SP500, Nasdaq)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Estilo Operacional</span>
                  </label>
                  <select
                    value={tradingStyle}
                    onChange={(e) => setTradingStyle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  >
                    <option value="Day Trader (Price Action Puro)">Day Trader (Price Action Puro)</option>
                    <option value="Scalper (Fluxo Tape Reading)">Scalper (Fluxo Tape Reading)</option>
                    <option value="Swing Trader (Gráfico Diário/Semanal)">Swing Trader (Gráfico Diário/Semanal)</option>
                    <option value="Trader Híbrido (Análise Técnica + Macro)">Trader Híbrido (Análise Técnica + Macro)</option>
                    <option value="Iniciante / Estudante em Formação">Iniciante / Estudante em Formação</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Meta de Ganho Diária / Alvo Desejado</span>
                  </label>
                  <input
                    type="text"
                    value={dailyTarget}
                    onChange={(e) => setDailyTarget(e.target.value)}
                    placeholder="Ex: R$ 500,00 / dia ou $ 200,00"
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5">
                    Biografia / Seu Objetivo na Mentoria
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Ex: Buscando consistência no mini-índice e dominar gerenciamento de risco..."
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 text-xs text-zinc-400">
                Para alterar sua senha de acesso, preencha os campos abaixo. Deixe em branco se não desejar alterar sua senha atual.
              </div>

              {passwordError && (
                <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5 flex items-center justify-between">
                    <span>Nova Senha</span>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-orange-400 hover:text-orange-300 text-[11px] font-sans flex items-center gap-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                    </button>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha (mínimo 6 caracteres)"
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase font-mono mb-1.5">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repita a nova senha para confirmação"
                    className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-900/30 border border-white/5 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-xs text-zinc-400">
                  Suas credenciais são criptografadas e protegidas pelo sistema de segurança da plataforma.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-zinc-900/80 border-t border-white/5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-all cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white text-xs font-black tracking-wider uppercase transition-all shadow-lg shadow-orange-600/30 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
