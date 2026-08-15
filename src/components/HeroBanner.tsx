import React from 'react';
import { Play, TrendingUp, Radio, Users, CheckCircle, Sparkles, ArrowRight, Flame } from 'lucide-react';
import { User, Module, PlatformSettings } from '../types';

interface HeroBannerProps {
  currentUser: User;
  modules: Module[];
  settings: PlatformSettings;
  overallProgress: { completed: number; total: number; percentage: number };
  onResumeWatching: () => void;
  onOpenLive: () => void;
  onOpenUpgrade?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  currentUser,
  modules,
  settings,
  overallProgress,
  onResumeWatching,
  onOpenLive,
  onOpenUpgrade,
}) => {
  // Find last watched or next uncompleted lesson
  let targetLessonTitle = 'Introdução ao Mercado & Boas-Vindas';
  let targetModuleTitle = 'Módulo 1';

  if (currentUser.progress.lastWatchedLessonId && currentUser.progress.lastWatchedModuleId) {
    const mod = modules.find(m => m.id === currentUser.progress.lastWatchedModuleId);
    if (mod) {
      targetModuleTitle = mod.title.split(':')[0] || mod.title;
      const les = mod.lessons.find(l => l.id === currentUser.progress.lastWatchedLessonId);
      if (les) targetLessonTitle = les.title;
    }
  }

  return (
    <div className="relative rounded-3xl overflow-hidden mb-10 border border-orange-900/30 shadow-2xl bg-black">
      {/* Background Graphic & Gradients */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-screen scale-105 filter blur-[1px]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1600&auto=format&fit=crop')`
        }}
      ></div>

      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        
        {/* Left: Mentor Brand & Headlines */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-600/10 border border-orange-600/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Plataforma Oficial de Mentoria</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.15] mb-3">
            {settings.bannerHeadline.split(' ')[0]}{' '}
            <span className="text-orange-500">
              {settings.bannerHeadline.split(' ').slice(1).join(' ')}
            </span>
          </h1>

          <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6 font-normal">
            {settings.bannerSubtext}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 max-w-lg">
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 shadow-lg">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold uppercase mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                <span>Módulos</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{modules.length} Módulos</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 shadow-lg">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold uppercase mb-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>Progresso</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">{overallProgress.percentage}%</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 shadow-lg">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-bold uppercase mb-1">
                <Radio className="w-3.5 h-3.5 text-red-500" />
                <span>Sala Ao Vivo</span>
              </div>
              <p className="text-xl sm:text-2xl font-black text-white">08:45 BRT</p>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onResumeWatching}
              className="flex items-center gap-3 px-6 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-600/30 hover:scale-[1.02] cursor-pointer"
            >
              <div className="w-6 h-6 rounded-full bg-black/30 flex items-center justify-center">
                <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
              </div>
              <span>CONTINUAR ASSISTINDO</span>
            </button>

            {currentUser.tier === 'Free' && onOpenUpgrade ? (
              <button
                onClick={onOpenUpgrade}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 hover:scale-[1.02] transition-all cursor-pointer"
              >
                <Flame className="w-4 h-4 fill-white text-white" />
                <span>LIBERAR VIP NO WHATSAPP</span>
              </button>
            ) : (
              <button
                onClick={onOpenLive}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Sala Operacional</span>
                <ArrowRight className="w-4 h-4 text-zinc-400 ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* Right: "Continuar de Onde Parou" Interactive Card */}
        <div className="w-full lg:max-w-xs xl:max-w-sm">
          <div className="p-5 rounded-2xl bg-zinc-900/80 border border-orange-900/30 shadow-2xl relative overflow-hidden group hover:border-orange-500/60 transition-all">
            <div className="absolute top-0 right-0 p-3">
              <span className="px-2 py-0.5 rounded-full bg-orange-600/20 text-orange-400 text-[10px] font-extrabold tracking-wider border border-orange-500/30 font-mono">
                ÚLTIMA AULA
              </span>
            </div>

            <p className="text-xs text-orange-400 font-bold mb-1 uppercase tracking-wide">
              {targetModuleTitle}
            </p>
            <h3 className="text-base font-bold text-white leading-snug line-clamp-2 mb-4 group-hover:text-orange-400 transition-colors">
              {targetLessonTitle}
            </h3>

            {/* Micro Progress Bar */}
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-[11px] text-zinc-400">
                <span>Progresso Geral</span>
                <span className="font-mono text-white font-bold">{overallProgress.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${overallProgress.percentage}%` }}
                ></div>
              </div>
            </div>

            <button
              onClick={onResumeWatching}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-600/15 hover:bg-orange-600 border border-orange-500/40 text-orange-400 hover:text-white font-bold text-xs transition-all cursor-pointer uppercase tracking-wider"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Retomar Aula</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
