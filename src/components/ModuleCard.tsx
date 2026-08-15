import React from 'react';
import { Play, Lock, Sparkles, CheckCircle2, Clock, BookOpen } from 'lucide-react';
import { Module, User } from '../types';
import { storageService } from '../services/storage';

interface ModuleCardProps {
  module: Module;
  currentUser: User;
  onSelectModule: (module: Module) => void;
  onPlayFirstUncompleted: (module: Module) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  currentUser,
  onSelectModule,
  onPlayFirstUncompleted,
}) => {
  const hasAccess = storageService.hasAccessToModule(currentUser, module);
  const { completed, total, percentage } = storageService.calculateModuleProgress(currentUser, module);

  const isCompleted = percentage === 100 && total > 0;

  // Calculate total duration
  const totalDuration = module.lessons.reduce((acc, curr) => acc + curr.durationMinutes, 0);

  return (
    <div
      onClick={() => onSelectModule(module)}
      className={`group relative rounded-xl overflow-hidden cursor-pointer bg-zinc-900 border-2 transition-all duration-300 flex flex-col ${
        hasAccess 
          ? 'border-transparent hover:border-orange-500 hover:shadow-[0_15px_30px_-5px_rgba(234,88,12,0.3)] hover:-translate-y-1.5'
          : 'border-white/5 opacity-75 hover:opacity-100 hover:border-zinc-700'
      }`}
    >
      {/* Vertical Aspect Ratio Poster Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-black">
        
        {/* Module Poster Image */}
        <img
          src={module.coverImage}
          alt={module.title}
          className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
            hasAccess ? 'grayscale group-hover:grayscale-0' : 'grayscale'
          }`}
          loading="lazy"
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent"></div>

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          {module.badgeText ? (
            <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-bold text-[10px] uppercase tracking-wider shadow-md">
              {module.badgeText}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-zinc-300 font-bold text-[10px] uppercase tracking-wider border border-white/10">
              {module.category}
            </span>
          )}

          {/* Locked or Tier Badge */}
          {!hasAccess ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/90 border border-red-500/50 text-red-300 text-[10px] font-bold">
              <Lock className="w-3 h-3" />
              <span>{module.requiredTier}</span>
            </div>
          ) : isCompleted ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-[10px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Concluído</span>
            </div>
          ) : null}
        </div>

        {/* Hover Center Play / Lock Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
          {hasAccess ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlayFirstUncompleted(module);
              }}
              className="w-13 h-13 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xl shadow-orange-600/50 transform scale-75 group-hover:scale-100 transition-transform duration-300 hover:bg-orange-500 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-black/95 border border-orange-500/40 text-center text-xs text-orange-200 shadow-xl">
              <Lock className="w-5 h-5 mx-auto mb-1 text-orange-400" />
              <p className="font-bold">{module.price ? 'Módulo Avulso' : 'Plano VIP Exclusivo'}</p>
              <p className="text-[10px] text-zinc-400">
                {module.price ? `R$ ${module.price.toFixed(2).replace('.', ',')} • Acesso Imediato` : 'R$ 499,90 • Acesso Imediato'}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Info over Image */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="flex items-center gap-3 text-[11px] text-zinc-300 mb-1 font-medium">
            <span className="flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-orange-500" />
              {module.lessons.length} {module.lessons.length === 1 ? 'Aula' : 'Aulas'}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-zinc-400">
              <Clock className="w-3.5 h-3.5" />
              {totalDuration} min
            </span>
          </div>

          <h3 className="text-sm font-extrabold text-white leading-snug line-clamp-2 group-hover:text-orange-400 transition-colors">
            {module.title}
          </h3>
        </div>
      </div>

      {/* Card Footer with Details & Progress */}
      <div className="p-3.5 bg-zinc-900/90 flex-1 flex flex-col justify-between border-t border-white/5">
        <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
          {module.subtitle || module.description}
        </p>

        {/* Progress bar inside card */}
        {hasAccess && (
          <div className="mt-auto">
            <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1 font-mono">
              <span>{completed} de {total} aulas</span>
              <span className="text-orange-400 font-bold">{percentage}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-orange-500'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        )}

        {!hasAccess && (
          <div className="mt-auto py-1 px-2 rounded-lg bg-red-950/40 border border-red-500/20 text-[11px] text-red-300 font-semibold text-center">
            Bloqueado no seu plano atual
          </div>
        )}
      </div>
    </div>
  );
};
