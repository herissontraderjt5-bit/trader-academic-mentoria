import React, { useState, useMemo } from 'react';
import { Module, User } from '../types';
import { ModuleCard } from './ModuleCard';
import { Filter, Layers, Flame, Lock, CheckCircle2 } from 'lucide-react';

interface ModuleGridProps {
  modules: Module[];
  currentUser: User;
  onSelectModule: (module: Module) => void;
  onPlayFirstUncompleted: (module: Module) => void;
}

export const ModuleGrid: React.FC<ModuleGridProps> = ({
  modules,
  currentUser,
  onSelectModule,
  onPlayFirstUncompleted,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Extract unique categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(modules.map(m => m.category)));
    return ['all', ...list];
  }, [modules]);

  // Filter modules
  const filteredModules = useMemo(() => {
    if (selectedCategory === 'all') return modules;
    return modules.filter(m => m.category === selectedCategory);
  }, [modules, selectedCategory]);

  return (
    <section className="mb-16">
      {/* Section Header with Category Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 bg-orange-600 rounded-full"></div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase">
              Módulos da Mentoria
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400">
            Grade completa de aulas gravadas organizadas para sua evolução consistente.
          </p>
        </div>

        {/* Categories Horizontal Scroll / Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 border border-orange-500/40'
                  : 'bg-zinc-900/80 text-zinc-400 border border-white/5 hover:text-white hover:border-zinc-700'
              }`}
            >
              {cat === 'all' ? 'Todos os Módulos' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Vertical Cards */}
      {filteredModules.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 rounded-2xl border border-white/5">
          <p className="text-zinc-400 text-sm">Nenhum módulo encontrado nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
          {filteredModules.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              currentUser={currentUser}
              onSelectModule={onSelectModule}
              onPlayFirstUncompleted={onPlayFirstUncompleted}
            />
          ))}
        </div>
      )}
    </section>
  );
};
