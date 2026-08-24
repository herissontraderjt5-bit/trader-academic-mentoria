import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Download, 
  MessageSquare, 
  FileText, 
  Edit3, 
  Send, 
  ThumbsUp, 
  Share2, 
  Clock, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  Maximize2,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { Module, Lesson, User, PlatformSettings } from '../types';
import { extractYouTubeId, formatDuration } from '../utils/youtube';
import { storageService } from '../services/storage';

const ensureExternalLink = (url: string) => {
  if (!url || url === '#') return '#';
  const trimmed = url.trim();
  if (/^(https?:)?\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

interface VideoPlayerViewProps {
  currentModule: Module;
  currentLesson: Lesson;
  currentUser: User;
  modules: Module[];
  settings: PlatformSettings;
  onBackToHome: () => void;
  onSelectLesson: (moduleId: string, lessonId: string) => void;
  onToggleComplete: (lessonId: string) => void;
  onSaveNote: (lessonId: string, noteText: string) => void;
  onAddComment: (moduleId: string, lessonId: string, text: string) => void;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  currentModule,
  currentLesson,
  currentUser,
  modules,
  settings,
  onBackToHome,
  onSelectLesson,
  onToggleComplete,
  onSaveNote,
  onAddComment,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'comments' | 'notes'>('overview');
  const [commentInput, setCommentInput] = useState('');
  const [userNote, setUserNote] = useState('');
  const [isNoteSaved, setIsNoteSaved] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false);

  // Load private note for this lesson
  useEffect(() => {
    const saved = currentUser.notes[currentLesson.id] || '';
    setUserNote(saved);
  }, [currentLesson.id, currentUser.notes]);

  const isCompleted = currentUser.progress.completedLessonIds.includes(currentLesson.id);

  // Next and Previous lesson calculations
  const currentIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
  const prevLesson = currentIndex > 0 ? currentModule.lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < currentModule.lessons.length - 1 ? currentModule.lessons[currentIndex + 1] : null;

  // Handle complete toggle with confetti
  const handleToggleComplete = () => {
    onToggleComplete(currentLesson.id);
    if (!isCompleted) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff6b00', '#ffaa40', '#ffffff', '#10b981']
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Save private note
  const handleSaveNote = () => {
    onSaveNote(currentLesson.id, userNote);
    setIsNoteSaved(true);
    setTimeout(() => setIsNoteSaved(false), 2500);
  };

  // Post comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;

    onAddComment(currentModule.id, currentLesson.id, commentInput.trim());
    setCommentInput('');
  };

  const youtubeVideoId = extractYouTubeId(currentLesson.youtubeUrl);

  return (
    <div className="min-h-screen bg-[#07070a] text-white flex flex-col">
      
      {/* Top Header Bar */}
      <div className="sticky top-0 z-30 bg-[#0c0c12]/95 backdrop-blur-md border-b border-[#20202e] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Back & Breadcrumb */}
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#171722] hover:bg-[#ff6b00] text-gray-300 hover:text-black border border-[#272737] hover:border-[#ff6b00] text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar aos Módulos</span>
            </button>

            <div className="flex items-center gap-1.5 text-xs text-gray-400 truncate">
              <span className="text-gray-500 hidden md:inline">/</span>
              <span className="text-[#ff8800] font-semibold truncate hidden md:inline">
                {currentModule.title.split(':')[0]}
              </span>
              <span className="text-gray-500">/</span>
              <span className="text-white font-medium truncate">
                {currentLesson.title}
              </span>
            </div>
          </div>

          {/* Quick Module Switch Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="hidden lg:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#14141c] hover:bg-[#1f1f2a] border border-[#252533] text-gray-300 text-xs font-medium cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>{isTheaterMode ? 'Modo Normal' : 'Modo Cinema'}</span>
            </button>

            <button
              onClick={handleToggleComplete}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                  : 'bg-[#ff6b00] text-black hover:bg-[#ff8800]'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">
                {isCompleted ? 'Aula Concluída' : 'Concluir Aula'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className={`flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 grid gap-6 ${
        isTheaterMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-12'
      }`}>
        
        {/* Left / Center Column: Video Player & Tabs */}
        <div className={isTheaterMode ? 'w-full' : 'lg:col-span-8'}>
          
          {/* Responsive 16:9 YouTube Video Embed */}
          <div className="rounded-3xl overflow-hidden bg-black border border-[#262638] shadow-2xl relative aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
              title={currentLesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            ></iframe>
          </div>

          {/* Navigation Controls Bar below video */}
          <div className="flex flex-wrap items-center justify-between gap-3 my-4 p-3 rounded-2xl bg-[#111118] border border-[#222230]">
            <button
              disabled={!prevLesson}
              onClick={() => prevLesson && onSelectLesson(currentModule.id, prevLesson.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                prevLesson 
                  ? 'bg-[#1a1a26] text-gray-200 hover:bg-[#252538] hover:text-white cursor-pointer' 
                  : 'bg-transparent text-gray-600 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Aula Anterior</span>
            </button>

            <button
              onClick={handleToggleComplete}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isCompleted
                  ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                  : 'bg-[#ff6b00]/15 border border-[#ff6b00]/40 text-[#ff8800] hover:bg-[#ff6b00] hover:text-black'
              }`}
            >
              <CheckCircle className={`w-4 h-4 ${isCompleted ? 'text-emerald-400' : ''}`} />
              <span>{isCompleted ? '✓ Marcada como Concluída' : 'Marcar como Concluída'}</span>
            </button>

            <button
              disabled={!nextLesson}
              onClick={() => nextLesson && onSelectLesson(currentModule.id, nextLesson.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                nextLesson 
                  ? 'bg-[#1a1a26] text-[#ff8800] hover:bg-[#ff6b00] hover:text-black cursor-pointer' 
                  : 'bg-transparent text-gray-600 cursor-not-allowed'
              }`}
            >
              <span>Próxima Aula</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Lesson Title & Module Meta */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#ff8800] uppercase tracking-wide font-mono mb-1">
              <span>{currentModule.title}</span>
              <span>•</span>
              <span className="text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {currentLesson.durationMinutes} min
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white leading-snug">
              {currentLesson.title}
            </h1>
          </div>

          {/* Interactive Lesson Tabs */}
          <div className="rounded-3xl bg-[#111118] border border-[#242433] overflow-hidden">
            {/* Tab navigation buttons */}
            <div className="flex border-b border-[#222230] overflow-x-auto scrollbar-none bg-[#0e0e14]">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-[#ff6b00] text-[#ff8800] bg-[#171722]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Visão Geral</span>
              </button>

              <button
                onClick={() => setActiveTab('materials')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer relative ${
                  activeTab === 'materials'
                    ? 'border-[#ff6b00] text-[#ff8800] bg-[#171722]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>Materiais & Anexos</span>
                {currentLesson.materials && currentLesson.materials.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#ff6b00] text-black text-[10px] font-bold">
                    {currentLesson.materials.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('comments')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeTab === 'comments'
                    ? 'border-[#ff6b00] text-[#ff8800] bg-[#171722]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Comentários</span>
                <span className="text-gray-500 text-[10px]">
                  ({(currentLesson.comments || []).length})
                </span>
              </button>

              <button
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  activeTab === 'notes'
                    ? 'border-[#ff6b00] text-[#ff8800] bg-[#171722]'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Edit3 className="w-4 h-4" />
                <span>Minhas Anotações</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 sm:p-6">
              
              {/* Tab 1: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-gray-200 mb-2">Descrição da Aula</h3>
                    <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                      {currentLesson.description}
                    </p>
                  </div>

                  {/* Key Takeaways */}
                  {currentLesson.keyTakeaways && currentLesson.keyTakeaways.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#161622] border border-[#272738]">
                      <h4 className="text-xs font-bold text-[#ff8800] uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" />
                        <span>Pontos-Chave & Regras de Execução</span>
                      </h4>
                      <ul className="space-y-2">
                        {currentLesson.keyTakeaways.map((item, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-gray-300 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00] mt-1.5 shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Operational Reminder Notice */}
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-amber-300">Aviso de Gestão de Risco</h5>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Lembre-se de sempre testar qualquer setup operacional novo no simulador da sua corretora antes de colocar capital real em risco.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Materials & Downloads */}
              {activeTab === 'materials' && (
                <div className="space-y-3">
                  {(!currentLesson.materials || currentLesson.materials.length === 0) ? (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      Não há arquivos anexos específicos para esta aula. Veja os materiais no Módulo 9.
                    </div>
                  ) : (
                    currentLesson.materials.map((mat) => (
                      <div
                        key={mat.id}
                        className="p-4 rounded-2xl bg-[#161622] border border-[#272738] flex items-center justify-between gap-4 hover:border-[#ff6b00]/50 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#ff6b00]/15 border border-[#ff6b00]/30 flex items-center justify-center text-[#ff8800]">
                            {mat.type === 'link' ? (
                              <ExternalLink className="w-5 h-5" />
                            ) : (
                              <Download className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white">{mat.title}</h4>
                            <p className="text-xs text-gray-400 uppercase font-mono">
                              {mat.type === 'link' ? 'Link Externo' : mat.type} {mat.size ? `• ${mat.size}` : ''}
                            </p>
                          </div>
                        </div>

                        <a
                          href={ensureExternalLink(mat.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#222233] hover:bg-[#ff6b00] text-gray-200 hover:text-black font-bold text-xs transition-colors"
                        >
                          <span>{mat.type === 'link' ? 'Acessar' : 'Baixar'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: Comments & Doubts */}
              {activeTab === 'comments' && (
                <div className="space-y-6">
                  {/* Post Comment Input */}
                  <form onSubmit={handleAddComment} className="flex gap-3">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-xl object-cover ring-1 ring-[#ff6b00]"
                    />
                    <div className="flex-1">
                      <textarea
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="Deixe sua dúvida sobre o setup ou compartilhe seu feedback com a comunidade..."
                        rows={2}
                        className="w-full p-3 rounded-2xl bg-[#161622] border border-[#272738] text-white text-xs placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b00] resize-none"
                      ></textarea>
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#ff8800] text-black font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Publicar Comentário</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Comments Thread */}
                  <div className="space-y-3.5 pt-4 border-t border-[#222230]">
                    {(!currentLesson.comments || currentLesson.comments.length === 0) ? (
                      <div className="text-center py-6 text-gray-500 text-xs">
                        Seja o primeiro a deixar uma dúvida ou comentário sobre esta aula!
                      </div>
                    ) : (
                      currentLesson.comments.map((comm) => (
                        <div key={comm.id} className="p-3.5 rounded-2xl bg-[#151520] border border-[#242435]">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={comm.userAvatar}
                                alt={comm.userName}
                                className="w-7 h-7 rounded-lg object-cover"
                              />
                              <div>
                                <span className="text-xs font-bold text-white leading-none">
                                  {comm.userName}
                                </span>
                                {comm.userRole === 'admin' && (
                                  <span className="ml-1.5 px-1.5 py-0.2 rounded bg-[#ff6b00]/20 text-[#ff8800] text-[9px] font-extrabold border border-[#ff6b00]/30 uppercase font-mono">
                                    Mentor VIP
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-400">{comm.date}</span>
                          </div>
                          <p className="text-xs text-gray-300 leading-relaxed pl-9">{comm.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Private Student Notes */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">Caderno de Estudos Privado</h4>
                      <p className="text-[11px] text-gray-400">
                        Suas anotações são automáticas e visíveis somente para você.
                      </p>
                    </div>
                    {isNoteSaved && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Salvo com sucesso!
                      </span>
                    )}
                  </div>

                  <textarea
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Escreva aqui seus insights sobre o setup, gatilhos de entrada, regras de stop e anotações para o pregão de amanhã..."
                    rows={7}
                    className="w-full p-4 rounded-2xl bg-[#161622] border border-[#272738] text-white text-xs leading-relaxed placeholder:text-gray-500 focus:outline-none focus:border-[#ff6b00] font-sans"
                  ></textarea>

                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveNote}
                      className="px-4 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#ff8800] text-black font-bold text-xs transition-colors cursor-pointer"
                    >
                      Salvar Minhas Anotações
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Column: Playlist Sidebar (Lessons & Modules) */}
        {!isTheaterMode && (
          <div className="lg:col-span-4">
            <div className="sticky top-20 rounded-3xl bg-[#111118] border border-[#242433] overflow-hidden shadow-2xl">
              
              {/* Header: Current Module Title & Progress */}
              <div className="p-4 bg-[#14141e] border-b border-[#222230]">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span className="text-[#ff8800] font-semibold uppercase font-mono">Conteúdo do Módulo</span>
                  <span>{currentModule.lessons.length} aulas</span>
                </div>
                <h3 className="text-sm font-bold text-white line-clamp-1">
                  {currentModule.title}
                </h3>
              </div>

              {/* Lesson Playlist Items */}
              <div className="max-h-[580px] overflow-y-auto p-2 space-y-1.5">
                {currentModule.lessons.map((lesson, idx) => {
                  const isCurrent = lesson.id === currentLesson.id;
                  const isDone = currentUser.progress.completedLessonIds.includes(lesson.id);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => onSelectLesson(currentModule.id, lesson.id)}
                      className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                        isCurrent
                          ? 'bg-[#ff6b00]/15 border border-[#ff6b00]/50 shadow-inner'
                          : 'bg-[#151520] hover:bg-[#1c1c28] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        {/* Checkbox or number */}
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                            isDone
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                              : isCurrent
                              ? 'bg-[#ff6b00] text-black'
                              : 'bg-[#222230] text-gray-400'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        <div className="overflow-hidden">
                          <h4
                            className={`text-xs font-semibold truncate ${
                              isCurrent ? 'text-[#ffaa40] font-bold' : 'text-gray-200 group-hover:text-white'
                            }`}
                          >
                            {lesson.title}
                          </h4>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {lesson.durationMinutes} min
                          </span>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ff6b00] text-black font-extrabold tracking-wider shrink-0 uppercase">
                          Assistindo
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Other modules quick drawer */}
              <div className="p-3 bg-[#0e0e14] border-t border-[#222230]">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-mono">
                  Outros Módulos:
                </p>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {modules.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onSelectLesson(m.id, m.lessons[0]?.id || '')}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer ${
                        m.id === currentModule.id
                          ? 'bg-[#1d1d2b] text-[#ff8800] font-bold'
                          : 'text-gray-400 hover:bg-[#161622] hover:text-white'
                      }`}
                    >
                      <span className="truncate">{m.title.split(':')[0]}</span>
                      <span className="text-[10px] text-gray-500 font-mono">{m.lessons.length} aulas</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
