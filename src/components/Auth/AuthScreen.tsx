import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Phone, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles,
  ExternalLink,
  HelpCircle,
  Headphones,
  KeyRound,
  Check,
  X
} from 'lucide-react';
import { storageService } from '../../services/storage';
import { supabaseService } from '../../services/supabaseService';
import { User, PlatformSettings } from '../../types';
import { TermsModal } from './TermsModal';
import { BrandLogo } from '../BrandLogo';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
  settings: PlatformSettings;
  allUsers: User[];
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onAuthSuccess,
  settings,
  allUsers
}) => {
  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>(() => {
    const hasRef = new URLSearchParams(window.location.search).has('ref') || !!localStorage.getItem('trader_academic_referred_by');
    return hasRef ? 'register' : 'login';
  });

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);


  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [regReferral, setRegReferral] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref') || localStorage.getItem('trader_academic_referred_by') || '';
  });

  // Modals & UI States
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState('');

  // Status & Feedback Messages
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Phone Mask Formatter: (11) 99999-9999
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 6) {
      value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    setRegPhone(value);
  };

  // PASSWORD VALIDATION RULES FOR REGISTRATION:
  // 1. Min 6 characters
  // 2. Contains numbers
  // 3. Contains at least 1 uppercase letter
  // 4. Contains letters/characters
  const passwordCriteria = useMemo(() => {
    const minLength = regPassword.length >= 6;
    const hasUpperCase = /[A-Z]/.test(regPassword);
    const hasNumber = /[0-9]/.test(regPassword);
    const hasChar = /[a-z!@#$%^&*(),.?":{}|<>]/.test(regPassword);
    const isMatching = regPassword !== '' && regPassword === regConfirmPassword;

    let score = 0;
    if (minLength) score++;
    if (hasUpperCase) score++;
    if (hasNumber) score++;
    if (hasChar) score++;

    const isAllValid = minLength && hasUpperCase && hasNumber && hasChar;

    return {
      minLength,
      hasUpperCase,
      hasNumber,
      hasChar,
      isMatching,
      score,
      isAllValid
    };
  }, [regPassword, regConfirmPassword]);

  // LOGIN SUBMIT REAL VIA SUPABASE
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Por favor, informe seu email e senha.');
      return;
    }

    setIsLoading(true);

    try {
      if (supabaseService.isConfigured()) {
        const res = await supabaseService.loginWithEmail(loginEmail, loginPassword);
        if (res.success && res.user) {
          setSuccessMessage(`Bem-vindo de volta, ${res.user.name.split(' ')[0]}!`);
          setTimeout(() => {
            onAuthSuccess(res.user!);
          }, 500);
        } else {
          setErrorMessage(res.message || 'Erro ao realizar login. Verifique suas credenciais.');
          setIsLoading(false);
        }
        return;
      }

      // Fallback local
      const res = storageService.login(loginEmail, loginPassword);
      if (res.success && res.user) {
        setSuccessMessage(`Bem-vindo de volta, ${res.user.name.split(' ')[0]}!`);
        setTimeout(() => {
          onAuthSuccess(res.user!);
        }, 500);
      } else {
        setErrorMessage(res.message || 'Erro ao realizar login. Verifique suas credenciais.');
        setIsLoading(false);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao realizar login.');
      setIsLoading(false);
    }
  };

  // REGISTER SUBMIT REAL VIA SUPABASE
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Validations
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!passwordCriteria.isAllValid) {
      setErrorMessage('A senha não cumpre todos os requisitos de segurança mínimos.');
      return;
    }

    if (!passwordCriteria.isMatching) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('Você deve aceitar os Termos de Responsabilidade para criar sua conta.');
      return;
    }

    setIsLoading(true);

    try {
      const referredBy = regReferral.trim() || undefined;
      if (supabaseService.isConfigured()) {
        const res = await supabaseService.registerWithEmail({
          name: regName,
          email: regEmail,
          whatsapp: regPhone,
          password: regPassword,
          termsAccepted: true,
          referredById: referredBy,
        });

        if (res.success && res.user) {
          const currentStudents = storageService.getStudents();
          if (!currentStudents.some(u => u.id === res.user!.id || u.email.toLowerCase() === res.user!.email.toLowerCase())) {
            storageService.saveStudents([res.user, ...currentStudents]);
          }
          setSuccessMessage('Conta criada com sucesso!');
          setTimeout(() => {
            onAuthSuccess(res.user!);
          }, 600);
          return;
        } else {
          setErrorMessage(res.message || 'Erro ao registrar no Supabase.');
          setIsLoading(false);
          return;
        }
      }

      // Fallback local
      const res = storageService.register({
        name: regName,
        email: regEmail,
        whatsapp: regPhone,
        password: regPassword,
        termsAccepted: true,
        referredById: referredBy,
      });

      if (res.success && res.user) {
        setSuccessMessage('Conta criada com sucesso!');
        setTimeout(() => {
          onAuthSuccess(res.user!);
        }, 600);
      } else {
        setErrorMessage(res.message || 'Erro ao criar conta.');
        setIsLoading(false);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Erro ao criar conta.');
      setIsLoading(false);
    }
  };

  // GOOGLE OAUTH REAL VIA SUPABASE
  const handleGoogleAuthReal = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!supabaseService.isConfigured()) {
      setErrorMessage('O Supabase precisa estar configurado para autenticação real do Google.');
      setIsLoading(false);
      return;
    }

    const res = await supabaseService.loginWithGoogle();
    if (!res.success) {
      setErrorMessage(res.message || 'Erro ao iniciar login com Google.');
      setIsLoading(false);
    }
  };


  // FORGOT PASSWORD SUBMIT
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;

    try {
      if (supabaseService.isConfigured()) {
        const res = await supabaseService.resetPasswordForEmail(forgotEmail);
        if (res.success) {
          setForgotSuccessMessage(`Um link seguro de redefinição de senha foi enviado para ${forgotEmail}. Verifique sua caixa de entrada.`);
        } else {
          alert(`Erro ao solicitar recuperação: ${res.message || 'Verifique o e-mail informado.'}`);
        }
        return;
      }

      // Fallback local
      setForgotSuccessMessage(`Um link de redefinição local foi simulado para ${forgotEmail}.`);
    } catch (err: any) {
      alert(`Erro: ${err.message || 'Ocorreu um erro inesperado.'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Dynamic Background Auras */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none animate-pulse duration-1000"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container Card */}
      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-6 flex flex-col items-center justify-center">
          <BrandLogo 
            layout="col" 
            size="110px" 
            subtext={settings.tagline || 'Portal Exclusivo de Membros & Mentoria VIP'} 
          />
        </div>

        {/* Auth Box */}
        <div className="bg-[#0e0e12]/90 backdrop-blur-xl border border-orange-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          
          {/* Security SSL Pill */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/5 text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>Ambiente Seguro SSL 256-bit</span>
            </div>
            <span className="text-zinc-500 font-mono">v3.5 VIP</span>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-zinc-950/80 border border-white/5 mb-6">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Entrar na Conta
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Criar Conta VIP
            </button>
          </div>

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{successMessage}</span>
            </div>
          )}



          {/* TAB 1: LOGIN FORM */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4 mt-4">
              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1.5">
                  Email de Acesso
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-zinc-950/80 border border-white/10 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-orange-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setForgotSuccessMessage('');
                      setIsForgotModalOpen(true);
                    }}
                    className="text-[11px] text-orange-400 hover:text-orange-300 font-medium hover:underline cursor-pointer"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    placeholder="Sua senha de acesso"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-2xl bg-zinc-950/80 border border-white/10 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-orange-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-950 border-white/20 text-orange-600 focus:ring-orange-500 focus:ring-offset-0"
                  />
                  <span>Lembrar minhas credenciais</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/30 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Acessando plataforma...' : 'Entrar na Plataforma'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB 2: REGISTER FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5 mt-4">
              
              {/* Nome Completo */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1">
                  Nome Completo
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Seu nome e sobrenome"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="seu.email@exemplo.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Telefone / WhatsApp */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="(11) 99999-9999"
                    value={regPhone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-white placeholder:text-zinc-600 text-xs font-mono font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    placeholder="Crie uma senha forte"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter & Checklist */}
                {regPassword.length > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl bg-zinc-950/90 border border-white/5 space-y-1.5">
                    
                    {/* Strength Bar */}
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span className="text-zinc-400">Força da Senha:</span>
                      <span className={`font-bold ${
                        passwordCriteria.score >= 4 ? 'text-emerald-400' :
                        passwordCriteria.score >= 3 ? 'text-amber-400' : 'text-red-400'
                      }`}>
                        {passwordCriteria.score >= 4 ? 'Excelente' : passwordCriteria.score >= 3 ? 'Média' : 'Fraca'}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-1 h-1">
                      <div className={`h-full rounded-full transition-all ${passwordCriteria.score >= 1 ? 'bg-red-500' : 'bg-zinc-800'}`}></div>
                      <div className={`h-full rounded-full transition-all ${passwordCriteria.score >= 2 ? 'bg-amber-500' : 'bg-zinc-800'}`}></div>
                      <div className={`h-full rounded-full transition-all ${passwordCriteria.score >= 3 ? 'bg-amber-400' : 'bg-zinc-800'}`}></div>
                      <div className={`h-full rounded-full transition-all ${passwordCriteria.score >= 4 ? 'bg-emerald-500' : 'bg-zinc-800'}`}></div>
                    </div>

                    {/* Checklist Requirements */}
                    <div className="grid grid-cols-2 gap-1 pt-1.5 text-[10px] font-mono">
                      <div className={`flex items-center gap-1 ${passwordCriteria.minLength ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {passwordCriteria.minLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>Mínimo 6 dígitos</span>
                      </div>

                      <div className={`flex items-center gap-1 ${passwordCriteria.hasUpperCase ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {passwordCriteria.hasUpperCase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>1 Letra Maiúscula</span>
                      </div>

                      <div className={`flex items-center gap-1 ${passwordCriteria.hasNumber ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>Números (0-9)</span>
                      </div>

                      <div className={`flex items-center gap-1 ${passwordCriteria.hasChar ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        {passwordCriteria.hasChar ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        <span>Letras / Caracteres</span>
                      </div>
                    </div>

                  </div>
                )}
              </div>

              {/* Repetir a Senha */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1">
                  Repetir a Senha (Confirmação)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Repita sua senha"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className={`w-full pl-10 pr-10 py-2.5 rounded-2xl bg-zinc-950/80 border text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none transition-all ${
                      regConfirmPassword && passwordCriteria.isMatching
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : regConfirmPassword && !passwordCriteria.isMatching
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-white/10 focus:border-orange-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Matching indicator */}
                {regConfirmPassword.length > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-mono">
                    {passwordCriteria.isMatching ? (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> As senhas conferem
                      </span>
                    ) : (
                      <span className="text-red-400 flex items-center gap-1">
                        <X className="w-3 h-3" /> As senhas não coincidem
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Código de Indicação (Opcional) */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 uppercase font-mono mb-1">
                  Código de Indicação (Opcional)
                </label>
                <div className="relative">
                  <Sparkles className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Código de quem indicou você"
                    value={regReferral}
                    onChange={(e) => setRegReferral(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl bg-zinc-950/80 border border-white/10 text-white placeholder:text-zinc-600 text-xs font-medium focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Termos de Responsabilidade Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-950/60 border border-white/5 cursor-pointer hover:border-orange-500/30 transition-all">
                  <input
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded bg-zinc-950 border-white/20 text-orange-600 focus:ring-orange-500 focus:ring-offset-0 shrink-0 cursor-pointer"
                  />
                  <div className="text-[11px] text-zinc-300 leading-tight">
                    <span>Li e concordo com os </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsTermsModalOpen(true);
                      }}
                      className="text-orange-400 hover:text-orange-300 font-bold underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      Termos de Responsabilidade & Risco
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                    <span> e Políticas de Privacidade.</span>
                  </div>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/30 cursor-pointer disabled:opacity-50 mt-2"
              >
                <span>{isLoading ? 'Cadastrando Aluno...' : 'Cadastrar & Liberar Acesso'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Suporte WhatsApp Button */}
          <div className="pt-4 mt-4 border-t border-white/5 text-center">
            <a
              href={`https://wa.me/${(settings.supportWhatsapp || '5511999999999').replace(/\D/g, '')}?text=Olá!%20Preciso%20de%20suporte%20para%20acessar%20minha%20conta%20na%20plataforma.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer hover:scale-[1.02]"
              title="Falar com o Suporte pelo WhatsApp"
            >
              <Headphones className="w-4 h-4 text-emerald-400" />
              <span>Precisa de ajuda? Falar com Suporte no WhatsApp</span>
            </a>
          </div>

        </div>

        {/* Footer info */}
        <div className="text-center mt-6 space-y-1 text-xs text-zinc-500 font-mono">
          <p>© {new Date().getFullYear()} {settings.platformName || 'Trader Academic'}. Todos os direitos reservados.</p>
          <p className="text-[10px] text-zinc-600">Educação Financeira de Alta Performance.</p>
        </div>

      </div>

      {/* Terms of Responsibility Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={() => setTermsAccepted(true)}
      />



      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0e0e12] border border-orange-500/30 rounded-3xl p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <KeyRound className="w-5 h-5 text-orange-500" />
                <span>Recuperar Senha de Acesso</span>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {forgotSuccessMessage ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs">
                  {forgotSuccessMessage}
                </div>
                <button
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 text-white font-bold text-xs uppercase"
                >
                  Voltar ao Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <p className="text-xs text-zinc-300">
                  Informe o email cadastrado na plataforma para receber as instruções de redefinição de senha:
                </p>

                <input
                  type="email"
                  required
                  placeholder="seu.email@exemplo.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
                />

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase shadow-lg shadow-orange-600/30"
                  >
                    Enviar Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
