import React from "react";
import { Maximize2, Minimize2, ExternalLink, RefreshCw, X } from "lucide-react";

interface WindowShellProps {
  id?: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  onPopout?: () => void;
  onRefresh?: () => void;
  onClose?: () => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export const WindowShell: React.FC<WindowShellProps> = ({
  id,
  title,
  subtitle,
  icon,
  badge,
  actions,
  onPopout,
  onRefresh,
  onClose,
  isMaximized,
  onToggleMaximize,
  children,
  className = "",
  headerClassName = "",
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col h-full bg-slate-950 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl transition-all ${className}`}
    >
      {/* Window Header */}
      <div
        className={`px-4 py-3 bg-slate-900/90 border-b border-slate-800/90 flex items-center justify-between gap-3 shrink-0 select-none ${headerClassName}`}
      >
        {/* Left: Icon, Title & Badge */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-slate-800/90 border border-slate-700/60 flex items-center justify-center shrink-0 shadow-sm">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold text-slate-100 truncate tracking-tight">
                {title}
              </h2>
              {badge}
            </div>
            {subtitle && (
              <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {actions}

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Atualizar janela"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {onPopout && (
            <button
              onClick={onPopout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Destacar em janela independente (Dual Monitor)"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer"
              title={isMaximized ? "Restaurar tamanho" : "Maximizar janela"}
            >
              {isMaximized ? (
                <Minimize2 className="w-3.5 h-3.5" />
              ) : (
                <Maximize2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer ml-0.5"
              title="Fechar módulo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 min-h-0 overflow-hidden relative flex flex-col">
        {children}
      </div>
    </div>
  );
};
