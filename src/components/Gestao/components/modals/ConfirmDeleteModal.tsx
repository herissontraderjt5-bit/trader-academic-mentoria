import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Excluir Definitivamente',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="modal-confirm-delete"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-md bg-[#121722] border border-slate-700 rounded-xl shadow-2xl overflow-hidden my-6">
        <div className="flex items-center justify-between px-5 py-4 bg-[#182030] border-b border-slate-700">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
          <div className="p-3 bg-rose-950/20 border border-rose-900/50 rounded-lg text-xs text-rose-300">
            Esta ação atualizará automaticamente todos os cálculos, assertividade e saldo da banca.
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              id="btn-confirm-delete-action"
              onClick={onConfirm}
              className="px-4 py-2 rounded-lg text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-950 transition-all flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
