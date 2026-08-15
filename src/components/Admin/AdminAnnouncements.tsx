import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Bell, 
  Radio, 
  Pin, 
  Calendar, 
  Clock, 
  Link as LinkIcon, 
  X, 
  Edit3, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  Video,
  UserCheck,
  Play
} from 'lucide-react';
import { Announcement, LiveSession } from '../../types';

interface AdminAnnouncementsProps {
  announcements: Announcement[];
  liveSessions: LiveSession[];
  onUpdateAnnouncements: (ann: Announcement[]) => void;
  onUpdateLiveSessions: (sessions: LiveSession[]) => void;
}

export const AdminAnnouncements: React.FC<AdminAnnouncementsProps> = ({
  announcements,
  liveSessions,
  onUpdateAnnouncements,
  onUpdateLiveSessions,
}) => {
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [editingLiveId, setEditingLiveId] = useState<string | null>(null);

  // Form Announcement
  const [annForm, setAnnForm] = useState<{
    title: string;
    content: string;
    type: 'live' | 'alert' | 'material' | 'update';
    isPinned: boolean;
  }>({
    title: '',
    content: '',
    type: 'alert',
    isPinned: false,
  });

  // Form Live Session
  const [liveForm, setLiveForm] = useState<{
    title: string;
    date: string;
    time: string;
    topic: string;
    youtubeUrl: string;
    zoomUrl: string;
    instructor: string;
    status: 'upcoming' | 'live' | 'ended';
  }>({
    title: 'Sala Operacional Ao Vivo - Abertura B3 & NY',
    date: 'Segunda a Sexta-feira',
    time: '08:45 às 11:30 BRT',
    topic: 'Leitura de Abertura do Mini-Índice (WIN) e Mini-Dólar (WDO)',
    youtubeUrl: 'https://www.youtube.com/watch?v=kY31FpT-hOU',
    zoomUrl: '',
    instructor: 'Mestre Trader',
    status: 'upcoming',
  });

  // Open Live Modal for Editing
  const handleOpenEditLive = (session: LiveSession) => {
    setEditingLiveId(session.id);
    setLiveForm({
      title: session.title,
      date: session.date,
      time: session.time,
      topic: session.topic,
      youtubeUrl: session.youtubeUrl || '',
      zoomUrl: session.zoomUrl || '',
      instructor: session.instructor,
      status: session.status || 'upcoming',
    });
    setIsLiveModalOpen(true);
  };

  // Open Live Modal for New
  const handleOpenCreateLive = () => {
    setEditingLiveId(null);
    setLiveForm({
      title: 'Sala Operacional Ao Vivo - Pregão B3',
      date: 'Segunda a Sexta-feira',
      time: '08:45 às 11:30 BRT',
      topic: 'Operando Abertura de Mercado & Análise de Fluxo',
      youtubeUrl: 'https://www.youtube.com/watch?v=kY31FpT-hOU',
      zoomUrl: '',
      instructor: 'Mestre Trader',
      status: 'upcoming',
    });
    setIsLiveModalOpen(true);
  };

  // Save Announcement
  const handleSaveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annForm.title.trim()) return;

    const newAnn: Announcement = {
      id: 'ann-' + Date.now(),
      title: annForm.title,
      content: annForm.content,
      date: 'Hoje',
      type: annForm.type,
      isPinned: annForm.isPinned,
    };

    onUpdateAnnouncements([newAnn, ...announcements]);
    setIsAnnModalOpen(false);
    setAnnForm({ title: '', content: '', type: 'alert', isPinned: false });
  };

  const handleDeleteAnnouncement = (id: string) => {
    onUpdateAnnouncements(announcements.filter((a) => a.id !== id));
  };

  // Save Live Session (Create or Edit)
  const handleSaveLiveSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveForm.title.trim()) return;

    if (editingLiveId) {
      // Update existing
      const updated = liveSessions.map((s) => {
        if (s.id === editingLiveId) {
          return {
            ...s,
            title: liveForm.title,
            date: liveForm.date,
            time: liveForm.time,
            topic: liveForm.topic,
            youtubeUrl: liveForm.youtubeUrl,
            zoomUrl: liveForm.zoomUrl,
            instructor: liveForm.instructor,
            status: liveForm.status,
          };
        }
        return s;
      });
      onUpdateLiveSessions(updated);
    } else {
      // Create new
      const newLive: LiveSession = {
        id: 'live-' + Date.now(),
        title: liveForm.title,
        date: liveForm.date,
        time: liveForm.time,
        topic: liveForm.topic,
        status: liveForm.status,
        youtubeUrl: liveForm.youtubeUrl,
        zoomUrl: liveForm.zoomUrl,
        instructor: liveForm.instructor,
      };
      onUpdateLiveSessions([newLive, ...liveSessions]);
    }

    setIsLiveModalOpen(false);
    setEditingLiveId(null);
  };

  const handleDeleteLiveSession = (id: string) => {
    onUpdateLiveSessions(liveSessions.filter((l) => l.id !== id));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Avisos & Gestão de Salas Ao Vivo
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Defina os horários das salas operacionais, links de transmissão do YouTube e avisos para os alunos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreateLive}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all cursor-pointer hover:scale-105"
          >
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Definir Nova Sala Ao Vivo</span>
          </button>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (7 cols): Salas Ao Vivo (Priority) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-[#111118] border border-[#242433] space-y-5">
          <div className="flex items-center justify-between border-b border-[#222230] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-tight">
                  Salas Operacionais Ao Vivo
                </h2>
                <p className="text-xs text-zinc-400">Horários, Dias e Links de Transmissão</p>
              </div>
            </div>

            <button
              onClick={handleOpenCreateLive}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Sala</span>
            </button>
          </div>

          {liveSessions.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl p-6">
              <Radio className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
              <p className="text-sm font-bold text-zinc-300">Nenhuma sala ao vivo cadastrada</p>
              <p className="text-xs text-zinc-500 mt-1 mb-4">Cadastre a programação do pregão ao vivo para os alunos VIP.</p>
              <button
                onClick={handleOpenCreateLive}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"
              >
                Definir Primeiro Horário
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {liveSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-5 rounded-2xl bg-[#171724] border border-[#272738] hover:border-orange-500/40 transition-all space-y-3 relative group"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 font-mono ${
                        session.status === 'live'
                          ? 'bg-red-600 text-white animate-pulse'
                          : session.status === 'ended'
                          ? 'bg-zinc-800 text-zinc-400'
                          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${session.status === 'live' ? 'bg-white' : 'bg-current'}`}></span>
                        {session.status === 'live' ? 'AO VIVO AGORA' : session.status === 'ended' ? 'ENCERRADA' : 'PROGRAMADA'}
                      </span>

                      <span className="text-orange-400 font-bold flex items-center gap-1 font-mono text-xs">
                        <Clock className="w-3.5 h-3.5 text-orange-400" />
                        {session.time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditLive(session)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/30 text-xs font-bold transition-all cursor-pointer"
                        title="Editar Horário e Link"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Horário</span>
                      </button>

                      <button
                        onClick={() => handleDeleteLiveSession(session.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded-lg hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Excluir Sala"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-white">{session.title}</h4>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      <span className="text-zinc-500 font-mono">📅 Dias:</span> <strong className="text-zinc-200">{session.date}</strong>
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      <span className="text-zinc-500 font-mono">🎯 Tópico:</span> {session.topic}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      <span className="text-zinc-500 font-mono">👨‍🏫 Mentor:</span> {session.instructor}
                    </p>
                  </div>

                  {session.youtubeUrl && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate max-w-sm">
                        <Video className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="text-zinc-400 font-mono text-[11px] truncate">
                          {session.youtubeUrl}
                        </span>
                      </div>
                      <a
                        href={session.youtubeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-orange-400 hover:underline shrink-0 font-bold"
                      >
                        Testar Link ↗
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (5 cols): Mural de Avisos */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-[#111118] border border-[#242433] space-y-4">
          <div className="flex items-center justify-between border-b border-[#222230] pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white uppercase tracking-tight">Mural de Avisos</h2>
                <p className="text-xs text-zinc-400">Comunicados para todos os alunos</p>
              </div>
            </div>

            <button
              onClick={() => setIsAnnModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs cursor-pointer shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Aviso</span>
            </button>
          </div>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl bg-[#171724] border border-[#272738] relative group hover:border-white/20 transition-all"
              >
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                  <span className="font-bold text-orange-400 uppercase font-mono text-[10px] px-2 py-0.5 rounded bg-orange-500/10 border border-orange-500/20">
                    {ann.type} {ann.isPinned ? '• FIXADO' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500">{ann.date}</span>
                    <button
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-white">{ann.title}</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal: Live Session (Create or Edit Schedule) */}
      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-xl bg-[#111118] border border-orange-500/40 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-8">
            <div className="p-6 bg-[#151520] border-b border-[#242433] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                  <Radio className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-white uppercase tracking-tight">
                  {editingLiveId ? 'Editar Horário & Informações da Sala Ao Vivo' : 'Definir Nova Sala Ao Vivo'}
                </h3>
              </div>
              <button
                onClick={() => setIsLiveModalOpen(false)}
                className="p-2 rounded-xl bg-[#1e1e2c] text-zinc-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLiveSession} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase font-mono">
                  Título da Sala / Transmissão
                </label>
                <input
                  type="text"
                  required
                  value={liveForm.title}
                  onChange={(e) => setLiveForm({ ...liveForm, title: e.target.value })}
                  placeholder="Ex: Sala Operacional Ao Vivo - Abertura de Mercado & Mini-Índice"
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Quick Preset Buttons for Schedule / Times */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2">
                <label className="block text-[10px] font-bold text-orange-400 uppercase font-mono tracking-wider">
                  ⚡ Sugestões Rápidas de Horário:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Abertura B3 (08:45 às 11:30)', time: '08:45 às 11:30 BRT', days: 'Segunda a Sexta-feira' },
                    { label: 'Manhã Completa (08:50 às 12:00)', time: '08:50 às 12:00 BRT', days: 'Segunda a Sexta-feira' },
                    { label: 'Tarde / Fechamento (14:00 às 16:30)', time: '14:00 às 16:30 BRT', days: 'Toda Terça e Quinta' },
                    { label: 'Mentoria Noturna (19:30 às 21:30)', time: '19:30 às 21:30 BRT', days: 'Segundas e Quartas' },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLiveForm({ ...liveForm, time: preset.time, date: preset.days })}
                      className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-orange-600 hover:text-white border border-white/10 text-zinc-300 text-[10px] font-mono transition-all cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase font-mono">
                    Dias de Transmissão
                  </label>
                  <input
                    type="text"
                    required
                    value={liveForm.date}
                    onChange={(e) => setLiveForm({ ...liveForm, date: e.target.value })}
                    placeholder="Ex: Segunda a Sexta-feira"
                    className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase font-mono">
                    Horário da Sala
                  </label>
                  <input
                    type="text"
                    required
                    value={liveForm.time}
                    onChange={(e) => setLiveForm({ ...liveForm, time: e.target.value })}
                    placeholder="Ex: 08:45 às 11:30 BRT"
                    className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-orange-500 font-mono font-bold text-orange-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase font-mono">
                    Instrutor / Mentor Responsável
                  </label>
                  <input
                    type="text"
                    required
                    value={liveForm.instructor}
                    onChange={(e) => setLiveForm({ ...liveForm, instructor: e.target.value })}
                    placeholder="Ex: Mestre Trader & Equipe"
                    className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase font-mono">
                    Status da Sala
                  </label>
                  <select
                    value={liveForm.status}
                    onChange={(e) => setLiveForm({ ...liveForm, status: e.target.value as any })}
                    className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-orange-500"
                  >
                    <option value="upcoming">⏳ Programada (Em Breve)</option>
                    <option value="live">🔴 AO VIVO AGORA (Transmitindo)</option>
                    <option value="ended">🏁 Encerrada (Gravação)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase font-mono">
                  Tópico / Foco Operacional
                </label>
                <input
                  type="text"
                  required
                  value={liveForm.topic}
                  onChange={(e) => setLiveForm({ ...liveForm, topic: e.target.value })}
                  placeholder="Ex: Leitura de Fluxo WIN, Dólar e Notícias do Calendário Econômico"
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase font-mono">
                  Link de Transmissão (YouTube Live ou Vídeo)
                </label>
                <input
                  type="text"
                  required
                  value={liveForm.youtubeUrl}
                  onChange={(e) => setLiveForm({ ...liveForm, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=kY31FpT-hOU"
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-orange-500 font-mono text-zinc-300"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#222230]">
                <button
                  type="button"
                  onClick={() => setIsLiveModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-[#1c1c28] text-zinc-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-600/30"
                >
                  {editingLiveId ? 'Salvar Horário & Alterações' : 'Criar Sala Ao Vivo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Announcement */}
      {isAnnModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111118] border border-[#2d2d3f] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 bg-[#151520] border-b border-[#242433] flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Publicar Novo Aviso</h3>
              <button
                onClick={() => setIsAnnModalOpen(false)}
                className="p-2 rounded-xl bg-[#1e1e2c] text-zinc-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase font-mono">
                  Título do Aviso
                </label>
                <input
                  type="text"
                  required
                  value={annForm.title}
                  onChange={(e) => setAnnForm({ ...annForm, title: e.target.value })}
                  placeholder="Ex: 🚨 Atenção ao Payroll hoje às 09:30"
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase font-mono">
                  Tipo
                </label>
                <select
                  value={annForm.type}
                  onChange={(e) => setAnnForm({ ...annForm, type: e.target.value as any })}
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-orange-500"
                >
                  <option value="alert">Alerta Operacional</option>
                  <option value="live">Transmissão Ao Vivo</option>
                  <option value="material">Novo Material / Planilha</option>
                  <option value="update">Atualização de Conteúdo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 uppercase font-mono">
                  Mensagem Completa
                </label>
                <textarea
                  rows={4}
                  required
                  value={annForm.content}
                  onChange={(e) => setAnnForm({ ...annForm, content: e.target.value })}
                  placeholder="Escreva a mensagem que os alunos verão no mural..."
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-orange-500"
                ></textarea>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={annForm.isPinned}
                  onChange={(e) => setAnnForm({ ...annForm, isPinned: e.target.checked })}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="pinCheck" className="text-xs text-zinc-300 cursor-pointer">
                  Fixar aviso no topo da lista
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#222230]">
                <button
                  type="button"
                  onClick={() => setIsAnnModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c1c28] text-zinc-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Publicar Aviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
