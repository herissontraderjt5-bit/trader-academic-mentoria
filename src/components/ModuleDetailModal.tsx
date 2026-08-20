import React from 'react';
import { X, Play, Lock, CheckCircle2, Clock, FileText, ArrowRight, ShieldCheck, Download, MessageSquare } from 'lucide-react';
import { Module, User, Lesson, PlatformSettings } from '../types';
import { storageService } from '../services/storage';

interface ModuleDetailModalProps {
  module: Module | null;
  currentUser: User;
  settings: PlatformSettings;
  onClose: () => void;
  onSelectLesson: (moduleId: string, lessonId: string) => void;
  onOpenSupport: (module?: Module | null) => void;
}

export const ModuleDetailModal: React.FC<ModuleDetailModalProps> = ({
  module,
  currentUser,
  settings,
  onClose,
  onSelectLesson,
  onOpenSupport,
}) => {
  if (!module) return null;

  const lessons = module.lessons || [];
  const hasAccess = storageService.hasAccessToModule(currentUser, module);
  const { completed, total, percentage } = storageService.calculateModuleProgress(currentUser, module);
  const totalDuration = lessons.reduce((acc, curr) => acc + (curr?.durationMinutes || 0), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#111118] border border-[#272737] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 hover:bg-[#ff6b00] text-gray-300 hover:text-black border border-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 sm:p-8 bg-[#14141e] border-b border-[#242433]">
          
          {/* Left Column: Vertical Cover Image */}
          <div className="md:col-span-1">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden relative shadow-xl border border-[#2e2e42]">
              <img
                src={module.coverImage}
                alt={module.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              
              <div className="absolute bottom-3 left-3 right-3">
                <span className="px-2.5 py-1 rounded bg-[#ff6b00] text-black text-[10px] font-extrabold uppercase tracking-wider shadow">
                  {module.badgeText || module.category}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Module Info & Progress */}
          <div className="md:col-span-2 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-xs font-bold text-[#ff8800] uppercase tracking-wider font-mono">
                  {module.category}
                </span>
                <span>•</span>
                <span className="text-xs text-gray-400 font-mono">
                  Plano Mínimo: {module.requiredTier}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-tight mb-2">
                {module.title}
              </h2>

              <p className="text-sm text-[#ffaa40] font-medium mb-3">
                {module.subtitle}
              </p>

              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed mb-6">
                {module.description}
              </p>
            </div>

            <div>
              {/* Stats Strip */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-[#0c0c12] border border-[#222230] mb-4">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Aulas</span>
                  <p className="text-sm font-bold text-white">{module.lessons.length} aulas</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Duração</span>
                  <p className="text-sm font-bold text-white">{totalDuration} min</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">Progresso</span>
                  <p className="text-sm font-bold text-[#ff6b00] font-mono">{percentage}%</p>
                </div>
              </div>

              {/* Progress bar */}
              {hasAccess ? (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{completed} de {total} concluídas</span>
                    <span className="text-[#ff6b00] font-bold">{percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#222230] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#ff6b00] to-[#ffaa40] rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-orange-950/40 border border-orange-500/40 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs text-orange-200 font-semibold">
                    <Lock className="w-4 h-4 text-orange-400 shrink-0" />
                    <span>
                      {module.price 
                        ? `Módulo Avulso: R$ ${Number(module.price).toFixed(2).replace('.', ',')}` 
                        : `Módulo exclusivo do Plano ${module.requiredTier}`}
                    </span>
                  </div>
                  <button
                    onClick={() => onOpenSupport(module)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 cursor-pointer uppercase transition-all flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" />
                    <span>Liberar Módulo (R$ ${Number(module.price ?? 499.90).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lessons List Section */}
        <div className="p-6 sm:p-8 max-h-[420px] overflow-y-auto bg-[#0f0f16]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider font-mono">
              Grade de Aulas ({module.lessons.length})
            </h3>
            <span className="text-xs text-gray-400">
              Clique em qualquer aula para reproduzir
            </span>
          </div>

          <div className="space-y-2.5">
            {module.lessons.map((lesson, idx) => {
              const isCompleted = currentUser.progress.completedLessonIds.includes(lesson.id);

              return (
                <div
                  key={lesson.id}
                  onClick={() => {
                    if (hasAccess) {
                      onSelectLesson(module.id, lesson.id);
                      onClose();
                    } else {
                      onOpenSupport(module);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 cursor-pointer group ${
                    hasAccess
                      ? 'bg-[#151520] border-[#252535] hover:border-[#ff6b00]/60 hover:bg-[#1a1a28]'
                      : 'bg-[#121219] border-[#1e1e28] opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Index / Play Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-colors shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                          : hasAccess
                          ? 'bg-[#222230] text-gray-300 group-hover:bg-[#ff6b00] group-hover:text-black'
                          : 'bg-[#1e1e28] text-gray-600'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : hasAccess ? (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      ) : (
                        <Lock className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white group-hover:text-[#ff8800] transition-colors line-clamp-1">
                        {lesson.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {lesson.durationMinutes} minutos
                        </span>
                        {lesson.materials && lesson.materials.length > 0 && (
                          <span className="flex items-center gap-1 text-[#ff8800]">
                            <FileText className="w-3.5 h-3.5" />
                            {lesson.materials.length} Material(is)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Button */}
                  <div className="shrink-0">
                    {hasAccess ? (
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#222230] group-hover:bg-[#ff6b00] text-gray-300 group-hover:text-black font-bold text-xs transition-colors">
                        <span>Assistir</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5" /> Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
