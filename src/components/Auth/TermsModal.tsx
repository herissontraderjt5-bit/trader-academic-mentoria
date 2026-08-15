import React from 'react';
import { ShieldAlert, X, CheckCircle2, FileText, Lock, Scale, AlertTriangle } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose, onAccept }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0d0d11] border border-orange-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-zinc-950 via-[#121218] to-zinc-950 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600/20 text-orange-500 flex items-center justify-center border border-orange-500/30">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Termo de Responsabilidade & Isenção de Riscos
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                Trader Academic • Diretrizes Legais & Operacionais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-zinc-300 leading-relaxed font-sans pr-4">
          
          {/* Highlight Alert Box */}
          <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-red-300 text-xs uppercase font-mono">
                Aviso Importante sobre Mercado Financeiro & Renda Variável
              </h4>
              <p className="text-[11px] text-zinc-300">
                Operações em bolsa de valores (B3 - Mini-Índice, Mini-Dólar, Ações), Forex e Criptoativos envolvem alto grau de risco financeiro e volatilidade. Resultados passados não são garantia de rentabilidade futura.
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              <span>1. Caráter Estritamente Educacional</span>
            </h4>
            <p>
              Todo o conteúdo disponibilizado na plataforma <strong>Trader Academic</strong> (incluindo aulas gravadas, transmissões ao vivo, planilhas, indicadores, estudos gráficos e análises de pré-mercado) possui finalidade <strong>exclusivamente educacional e informativa</strong>.
            </p>
            <p>
              A plataforma, seus instrutores e mentores não realizam recomendações de compra ou venda de ativos (calls públicas de investimento), não realizam gestão de carteira e não garantem retornos financeiros aos alunos.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" />
              <span>2. Autonomia e Responsabilidade nas Decisões Operacionais</span>
            </h4>
            <p>
              O usuário declara e reconhece que é o <strong>único e exclusivo responsável</strong> por todas as decisões de entrada, saída, dimensionamento de lote e gerenciamento de risco efetuadas em sua conta em qualquer corretora ou ambiente simulado.
            </p>
            <p>
              Recomendamos fortemente a prática exaustiva em simulador de mercado e a aplicação rigorosa de técnicas de controle de risco antes de qualquer operação em conta real.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-orange-500" />
              <span>3. Propriedade Intelectual & Acesso Individual</span>
            </h4>
            <p>
              O acesso à área de membros é <strong>pessoal, individual e intransferível</strong>. É expressamente proibido o compartilhamento de credenciais de login, rateio de contas, gravação, reprodução não autorizada ou comercialização de qualquer material ou indicador.
            </p>
            <p>
              O descumprimento desta cláusula sujeita o infrator ao cancelamento imediato do acesso sem direito a reembolso e às medidas judiciais cíveis e criminais cabíveis.
            </p>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-500" />
              <span>4. Privacidade & Proteção de Dados (LGPD)</span>
            </h4>
            <p>
              Seus dados cadastrais (nome, email e telefone) são mantidos em ambiente seguro com criptografia e utilizados unicamente para validação de acesso, comunicações sobre o andamento das aulas e suporte pedagógico.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-zinc-950 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-zinc-500 font-mono">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs cursor-pointer transition-all"
            >
              Fechar
            </button>
            {onAccept && (
              <button
                onClick={() => {
                  onAccept();
                  onClose();
                }}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/30 cursor-pointer transition-all"
              >
                Concordar & Aceitar
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
