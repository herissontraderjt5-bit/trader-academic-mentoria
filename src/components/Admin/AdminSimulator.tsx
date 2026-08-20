import React, { useState } from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  Zap, 
  Send, 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink,
  Code2,
  RefreshCw,
  AlertTriangle,
  Radio,
  FileJson,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { User, Module, Tier } from '../../types';
import { storageService } from '../../services/storage';

interface AdminSimulatorProps {
  users: User[];
  modules: Module[];
  onAddUser: (newUser: User) => void;
}

type Gateway = 'cakto' | 'kiwify' | 'hotmart';
type EventType = 'purchase_approved' | 'pix_generated' | 'refund' | 'subscription_renewed';

export const AdminSimulator: React.FC<AdminSimulatorProps> = ({
  users,
  modules,
  onAddUser,
}) => {
  const [gateway, setGateway] = useState<Gateway>('cakto');
  const [eventType, setEventType] = useState<EventType>('purchase_approved');
  
  // Buyer Data
  const [buyerName, setBuyerName] = useState('Vinicius Sestrem');
  const [buyerEmail, setBuyerEmail] = useState('aluno.cakto@email.com');
  const [buyerPhone, setBuyerPhone] = useState('5511998877665');
  const [buyerTier, setBuyerTier] = useState<Tier>('VIP');
  const [productAmount, setProductAmount] = useState('499.90');
  const [caktoSecretToken, setCaktoSecretToken] = useState('cakto_sec_89df7a6b4c12');
  
  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);
  const [showJsonPayload, setShowJsonPayload] = useState(false);

  // Dynamic Webhook URL based on current host
  const webhookUrl = `${window.location.origin}/api/webhooks/${gateway}`;

  // Generated JSON Payload Preview based on Gateway format
  const getSamplePayload = () => {
    if (gateway === 'cakto') {
      return {
        event: eventType === 'purchase_approved' ? 'order.paid' : eventType === 'refund' ? 'order.refunded' : 'order.pending',
        secret_key: caktoSecretToken,
        data: {
          id: `CKT-${Math.floor(100000 + Math.random() * 900000)}`,
          status: eventType === 'purchase_approved' ? 'paid' : eventType === 'refund' ? 'refunded' : 'waiting_payment',
          amount: parseFloat(productAmount) || 1997.00,
          payment_method: 'pix',
          created_at: new Date().toISOString(),
          product: {
            id: `prod_cakto_${buyerTier.toLowerCase().replace(/\s+/g, '_')}`,
            name: `Mentoria Trader Academic - ${buyerTier}`,
          },
          customer: {
            name: buyerName,
            email: buyerEmail,
            phone: buyerPhone,
            document: '123.456.789-00'
          }
        }
      };
    } else {
      return {
        order_status: eventType === 'purchase_approved' ? 'paid' : 'refunded',
        webhook_event_type: eventType === 'purchase_approved' ? 'order_approved' : 'order_refunded',
        Product: {
          product_id: `prod_${buyerTier.toLowerCase()}`,
          product_name: `Trader Academic ${buyerTier}`
        },
        Customer: {
          full_name: buyerName,
          email: buyerEmail,
          mobile: buyerPhone
        },
        Commissions: {
          charge_amount: parseFloat(productAmount) || 1997.00
        }
      };
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName || !buyerEmail) return;

    setIsSimulating(true);
    const transactionId = `${gateway.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const payload = getSamplePayload();

    setSimulationLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Enviando requisição HTTP POST real para ${webhookUrl}`,
      `[${new Date().toLocaleTimeString()}] 📦 Evento: ${eventType.toUpperCase()} | Transação: #${transactionId}`,
      `[${new Date().toLocaleTimeString()}] 👤 Comprador: ${buyerName} <${buyerEmail}> | Tel: ${buyerPhone}`,
      `[${new Date().toLocaleTimeString()}] ⏳ Aguardando resposta do endpoint Vercel + Supabase...`,
    ]);

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json().catch(() => null);

      if (response.ok && resData?.success) {
        const existingUser = users.find(u => u.email.toLowerCase() === buyerEmail.toLowerCase());
        const targetStatus = eventType === 'refund' ? 'Bloqueado' : 'Ativo';
        const targetTier = eventType === 'refund' ? 'Free' : buyerTier;
        let finalUserId = '';

        if (existingUser) {
          const updatedUser: User = {
            ...existingUser,
            tier: targetTier,
            status: targetStatus,
          };
          onAddUser(updatedUser);
          finalUserId = existingUser.id;
        } else {
          const newUserId = resData.user?.id || ('usr-' + Date.now());
          const newUser: User = {
            id: newUserId,
            name: buyerName,
            email: buyerEmail,
            whatsapp: buyerPhone,
            avatar: '',
            role: 'student',
            tier: targetTier,
            status: targetStatus,
            joinedAt: new Date().toISOString().split('T')[0],
            progress: { completedLessonIds: [] },
            notes: {},
          };
          onAddUser(newUser);
          finalUserId = newUserId;
        }

        // Process commission for new/updated users under referrals
        if (targetTier !== 'Free' && eventType !== 'refund' && finalUserId) {
          const settings = storageService.getSettings();
          const price = parseFloat(productAmount) || (targetTier === 'Vitalício' ? (settings.lifetimePrice ?? 499.90) : 197.00);
          storageService.processCommission(finalUserId, price);
        }

        setSimulationLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] 🟢 [HTTP 200 OK] Servidor respondeu: ${resData.message || 'Sucesso'}`,
          `[${new Date().toLocaleTimeString()}] ✅ Perfil sincronizado e liberado no banco Supabase!`,
        ]);
      } else {
        setSimulationLogs(prev => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] ⚠️ [HTTP ${response.status}] Resposta da API: ${resData?.error || 'Erro no processamento'}`,
        ]);
      }
    } catch (err: any) {
      setSimulationLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] 🔴 Erro ao disparar webhook: ${err.message}`,
      ]);
    } finally {
      setIsSimulating(false);
    }
  };

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-orange-600/20 text-orange-400 font-mono text-xs font-bold border border-orange-500/30 uppercase">
              Integrações Automáticas
            </span>
            <span className="text-zinc-500 text-xs font-mono">• Pagamentos & Webhooks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Integração de Webhook Cakto / Kiwify
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Libere o acesso dos alunos no mesmo segundo em que a compra for aprovada na Cakto, Kiwify ou Hotmart.
          </p>
        </div>

        {/* Gateway Badges */}
        <div className="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-white/5">
          <button
            onClick={() => setGateway('cakto')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              gateway === 'cakto'
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Cakto
          </button>
          <button
            onClick={() => setGateway('kiwify')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              gateway === 'kiwify'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Kiwify
          </button>
          <button
            onClick={() => setGateway('hotmart')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              gateway === 'hotmart'
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hotmart
          </button>
        </div>
      </div>

      {/* Webhook Endpoint Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-orange-950/40 via-zinc-900/60 to-zinc-950 border border-orange-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400 font-mono uppercase">
              <Zap className="w-4 h-4 fill-current" />
              <span>Sua URL de Webhook da {gateway.toUpperCase()} (POST)</span>
            </div>
            <p className="text-xs text-zinc-300">
              Copie este link e cole no painel da <strong className="text-white capitalize">{gateway}</strong> para receber notificações automáticas de vendas aprovadas.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full lg:w-auto">
            <div className="flex-1 lg:w-96 px-3.5 py-2.5 rounded-xl bg-black/80 border border-orange-500/30 font-mono text-xs text-orange-300 truncate">
              {webhookUrl}
            </div>
            <button
              onClick={copyWebhook}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-orange-600/30 cursor-pointer"
            >
              {copiedWebhookUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiedWebhookUrl ? 'Copiado!' : 'Copiar URL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Simulator on Left, Logs and Guide on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Form: Simulation & Test (7 cols) */}
        <div className="lg:col-span-6 p-6 rounded-3xl bg-zinc-900/70 border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-bold text-white">Simular Pagamento na {gateway.toUpperCase()}</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowJsonPayload(!showJsonPayload)}
              className="text-xs text-zinc-400 hover:text-orange-400 flex items-center gap-1 font-mono cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>{showJsonPayload ? 'Ocultar JSON' : 'Ver Payload JSON'}</span>
            </button>
          </div>

          {showJsonPayload && (
            <div className="p-3 bg-black/90 rounded-2xl border border-white/5 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-48">
              <pre>{JSON.stringify(getSamplePayload(), null, 2)}</pre>
            </div>
          )}

          <form onSubmit={handleSimulateWebhook} className="space-y-4">
            
            {/* Event Type */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1.5 font-mono uppercase">
                Tipo de Evento Disparado pela {gateway.toUpperCase()}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEventType('purchase_approved')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 cursor-pointer ${
                    eventType === 'purchase_approved'
                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-950 border-white/5 text-zinc-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Compra Aprovada (Paid)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEventType('refund')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 cursor-pointer ${
                    eventType === 'refund'
                      ? 'bg-red-950/50 border-red-500 text-red-300'
                      : 'bg-zinc-950 border-white/5 text-zinc-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>Reembolso / Cancelado</span>
                </button>
              </div>
            </div>

            {/* Buyer Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1 font-mono uppercase">
                  Nome do Comprador
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1 font-mono uppercase">
                  Email do Aluno (Login)
                </label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>
            </div>

            {/* Phone, Tier & Value */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1 font-mono uppercase">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={buyerPhone}
                  onChange={(e) => setBuyerPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1 font-mono uppercase">
                  Plano / Acesso
                </label>
                <select
                  value={buyerTier}
                  onChange={(e) => {
                    const newTier = e.target.value as Tier;
                    setBuyerTier(newTier);
                    if (newTier === 'VIP') {
                      setProductAmount('499.90');
                    } else {
                      setProductAmount('0.00');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500"
                >
                  <option value="Free">Plano Free (R$ 0,00)</option>
                  <option value="VIP">Plano VIP (R$ 499,90)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1 font-mono uppercase">
                  Valor Pago (R$)
                </label>
                <input
                  type="text"
                  value={productAmount}
                  onChange={(e) => setProductAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-white text-xs focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>
            </div>

            {/* Cakto Secret Token Config */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1 font-mono uppercase">
                Chave Secreta da Cakto (Secret Key para autenticação HMAC)
              </label>
              <input
                type="text"
                value={caktoSecretToken}
                onChange={(e) => setCaktoSecretToken(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-950 border border-white/10 text-zinc-400 text-xs font-mono focus:outline-none focus:border-orange-500"
                placeholder="Ex: ckt_sec_..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSimulating}
              className="w-full py-3.5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/30 cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>{isSimulating ? 'Processando Webhook...' : `Disparar Teste de Webhook ${gateway.toUpperCase()}`}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Real-time Webhook Console & Step-by-Step (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Console de Eventos */}
          <div className="p-6 rounded-3xl bg-[#08080a] border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-mono font-bold text-zinc-200">
                    Console de Webhook Listener ({gateway.toUpperCase()})
                  </span>
                </div>
                <span className="text-[10px] text-emerald-400 font-mono font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  HTTP 200 OK
                </span>
              </div>

              <div className="space-y-2 font-mono text-xs max-h-72 overflow-y-auto pr-1">
                {simulationLogs.length === 0 ? (
                  <div className="py-12 text-center text-zinc-500 space-y-2">
                    <Radio className="w-6 h-6 mx-auto text-zinc-600 animate-pulse" />
                    <p className="text-xs">Aguardando disparo de eventos da Cakto / Kiwify...</p>
                    <p className="text-[11px] text-zinc-600">Clique no botão de teste ao lado para disparar um evento.</p>
                  </div>
                ) : (
                  simulationLogs.map((log, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl text-[11px] leading-relaxed ${
                        log.includes('✅')
                          ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                          : log.includes('⚠️')
                          ? 'bg-red-950/40 text-red-300 border border-red-500/30'
                          : 'bg-zinc-900/90 text-zinc-300 border border-white/5'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>Endpoint: <code className="text-orange-400">/api/webhooks/{gateway}</code></span>
              <span className="text-emerald-400">Ativo & Monitorando</span>
            </div>
          </div>

          {/* Passo a Passo de Como Configurar na Cakto */}
          <div className="p-5 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>Como configurar no Painel da Cakto (Passo a Passo)</span>
            </h3>
            
            <ol className="space-y-2.5 text-xs text-zinc-300">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-600/20 text-orange-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">1</span>
                <span>Acesse sua conta na <strong>Cakto (app.cakto.com.br)</strong> e entre no produto de mentoria/curso.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-600/20 text-orange-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">2</span>
                <span>No menu lateral do produto, clique em <strong>Integrações</strong> ou <strong>Webhooks</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-600/20 text-orange-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">3</span>
                <span>Clique em <strong>Criar Webhook</strong>, cole a URL acima e selecione os eventos <strong>Venda Aprovada (Pix, Cartão, Boleto)</strong> e <strong>Reembolso</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-600/20 text-orange-400 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">4</span>
                <span>Pronto! Assim que o aluno pagar no checkout da Cakto, seu acesso é liberado instantaneamente.</span>
              </li>
            </ol>
          </div>

        </div>

      </div>

    </div>
  );
};
