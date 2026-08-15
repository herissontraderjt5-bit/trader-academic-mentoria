import React, { useState } from 'react';
import { 
  Radio, 
  X, 
  Users, 
  MessageSquare, 
  Send, 
  Volume2, 
  ShieldCheck, 
  Sparkles,
  Edit3,
  Clock,
  Calendar,
  Check
} from 'lucide-react';
import { LiveSession, User } from '../../types';
import { extractYouTubeId } from '../../utils/youtube';

interface LiveRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveSessions: LiveSession[];
  currentUser: User;
  onUpdateLiveSessions?: (sessions: LiveSession[]) => void;
}

export const LiveRoomModal: React.FC<LiveRoomModalProps> = ({
  isOpen,
  onClose,
  liveSessions,
  currentUser,
  onUpdateLiveSessions,
}) => {
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);

  const currentLive = liveSessions[0] || {
    id: 'live-default',
    title: 'Sala Operacional Ao Vivo - Abertura de Mercado & Payroll',
    date: 'Segunda a Sexta-feira',
    time: '08:45 às 11:30 BRT',
    topic: 'Leitura de Abertura do Mini-Índice (WIN) e Mini-Dólar (WDO)',
    status: 'live',
    youtubeUrl: 'https://www.youtube.com/watch?v=kY31FpT-hOU',
    instructor: 'Mestre Trader'
  };

  const [editForm, setEditForm] = useState({
    title: currentLive.title,
    date: currentLive.date,
    time: currentLive.time,
    topic: currentLive.topic,
    youtubeUrl: currentLive.youtubeUrl || '',
    instructor: currentLive.instructor,
    status: currentLive.status || 'live',
  });

  const [chatMessages, setChatMessages] = useState<Array<{ user: string; text: string; time: string; isMentor?: boolean }>>([
    { user: 'Mestre Trader', text: 'Bom dia traders! Mercado abrindo com gap de 400 pontos no WIN. Aguardem o fechamento do 1º candle de 15min.', time: '08:52', isMentor: true },
    { user: 'Carlos Silva', text: 'Bom dia equipe! Planilha de risco já ajustada para 5 contratos.', time: '08:54' },
    { user: 'Fernanda Rocha', text: 'De olho na VWAP de ontem no 128.800.', time: '08:56' },
    { user: 'Mestre Trader', text: 'Perfeito Fernanda. Se rejeitar a VWAP com volume, temos nosso Setup 02 armado.', time: '08:58', isMentor: true },
  ]);

  const [inputMessage, setInputMessage] = useState('');

  if (!isOpen) return null;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      user: currentUser.name,
      text: inputMessage.trim(),
      time: new Date().toLocaleTimeString().slice(0, 5),
      isMentor: currentUser.role === 'admin'
    };

    setChatMessages(prev => [...prev, newMsg]);
    setInputMessage('');
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateLiveSessions) return;

    const updated = liveSessions.length > 0
      ? liveSessions.map((s, idx) => idx === 0 ? { ...s, ...editForm } : s)
      : [{ id: 'live-default', ...editForm }];

    onUpdateLiveSessions(updated as LiveSession[]);
    setIsEditingSchedule(false);
  };

  const videoId = extractYouTubeId(currentLive.youtubeUrl || '');

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-6xl bg-[#111118] border border-orange-500/30 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-[#14141e] border-b border-[#242433] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-400 text-xs font-bold font-mono">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
              <span>{currentLive.status === 'live' ? 'AO VIVO AGORA' : 'SALA OPERACIONAL'}</span>
            </div>

            <div>
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                {currentLive.title}
              </h3>
              <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                <span className="text-orange-400 font-bold">{currentLive.date}</span>
                <span>•</span>
                <span className="text-orange-400 font-bold">{currentLive.time}</span>
                <span>•</span>
                <span>Instrutor: {currentLive.instructor}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onUpdateLiveSessions && (
              <button
                onClick={() => {
                  setEditForm({
                    title: currentLive.title,
                    date: currentLive.date,
                    time: currentLive.time,
                    topic: currentLive.topic,
                    youtubeUrl: currentLive.youtubeUrl || '',
                    instructor: currentLive.instructor,
                    status: currentLive.status || 'live',
                  });
                  setIsEditingSchedule(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-600/20 hover:bg-orange-600 text-orange-300 hover:text-white border border-orange-500/40 text-xs font-bold transition-all cursor-pointer"
                title="Definir Horário e Link da Sala"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Definir Horário (ADM)</span>
                <span className="sm:hidden">Horário</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#1e1e2c] text-zinc-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Canvas: Video Stream + Live Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
          
          {/* Left / Center: Live Video Stream */}
          <div className="lg:col-span-8 p-4 sm:p-6 bg-black flex flex-col justify-between">
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#262638] shadow-2xl bg-black">
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
                  title={currentLive.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 p-6 text-center">
                  <Radio className="w-12 h-12 text-red-500/60 mb-2 animate-pulse" />
                  <p className="text-sm font-bold text-white">Transmissão Preparando Início</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    Horário agendado: {currentLive.date} às {currentLive.time}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-[#12121b] border border-[#222230] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Sala Operacional Exclusiva para Membros VIP</span>
              </div>

              <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                <Users className="w-4 h-4 text-orange-500" />
                <span>142 Traders Conectados</span>
              </div>
            </div>
          </div>

          {/* Right: Live Chat Box */}
          <div className="lg:col-span-4 bg-[#0d0d14] border-t lg:border-t-0 lg:border-l border-[#222230] flex flex-col justify-between h-[380px] lg:h-auto">
            
            <div className="p-3.5 bg-[#12121b] border-b border-[#20202e] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white font-mono">
                <MessageSquare className="w-4 h-4 text-orange-500" />
                <span>Chat do Pregão Ao Vivo</span>
              </div>
              <span className="text-[10px] text-zinc-500 font-mono">MODERADO</span>
            </div>

            {/* Chat message stream */}
            <div className="p-3.5 space-y-3 overflow-y-auto flex-1">
              {chatMessages.map((msg, i) => (
                <div key={i} className="text-xs leading-relaxed">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`font-bold ${msg.isMentor ? 'text-orange-400' : 'text-zinc-300'}`}>
                      {msg.user}
                    </span>
                    {msg.isMentor && (
                      <span className="text-[9px] px-1.5 rounded bg-orange-500/20 text-orange-400 font-mono uppercase font-bold">
                        Mentor
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-600 font-mono">{msg.time}</span>
                  </div>
                  <p className="text-zinc-300 pl-1 border-l-2 border-orange-500/30">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="p-3 bg-[#12121b] border-t border-[#20202e] flex gap-2">
              <input
                type="text"
                placeholder="Enviar mensagem no chat ao vivo..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-black/60 border border-[#272738] rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-orange-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold cursor-pointer transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

          </div>

        </div>

      </div>

      {/* Quick Edit Schedule Modal */}
      {isEditingSchedule && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111118] border border-orange-500/40 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-white">Definir Horário & Link da Sala Ao Vivo</h3>
              </div>
              <button
                onClick={() => setIsEditingSchedule(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Título da Sala</label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Dias</label>
                  <input
                    type="text"
                    required
                    value={editForm.date}
                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                    placeholder="Segunda a Sexta-feira"
                    className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-300 mb-1">Horário</label>
                  <input
                    type="text"
                    required
                    value={editForm.time}
                    onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                    placeholder="08:45 às 11:30 BRT"
                    className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-orange-400 font-bold font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Link do YouTube / Live</label>
                <input
                  type="text"
                  required
                  value={editForm.youtubeUrl}
                  onChange={(e) => setEditForm({ ...editForm, youtubeUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-2.5 rounded-xl bg-black border border-white/10 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsEditingSchedule(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold shadow-lg"
                >
                  Salvar Novo Horário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
