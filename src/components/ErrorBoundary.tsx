import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  declare props: Props;
  declare state: State;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in React Component Tree:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = window.location.pathname;
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07070A] text-white flex flex-col items-center justify-center p-4 selection:bg-orange-500 font-sans">
          <div className="w-full max-w-lg bg-[#0E121B] border border-orange-500/40 rounded-3xl p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-orange-950/60 border border-orange-500/40 text-orange-400 flex items-center justify-center mx-auto shadow-xl">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                Recuperação de Estação
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                Ocorreu uma pequena instabilidade temporária na interface. Clique no botão abaixo para restaurar a sessão instantaneamente.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-black/60 p-3 rounded-xl border border-white/10 text-[11px] font-mono text-zinc-400 text-left max-h-24 overflow-y-auto">
                <span className="text-orange-400 font-bold">Diagnóstico: </span>
                {this.state.error.message}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer font-mono"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Restaurar Plataforma</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
