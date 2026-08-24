import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Play, 
  Clock, 
  Layers, 
  FileText, 
  Link as LinkIcon, 
  X, 
  Image as ImageIcon, 
  Sparkles, 
  Check, 
  ArrowUp, 
  ArrowDown,
  Upload,
  Camera,
  RotateCcw,
  Undo2,
  GripVertical
} from 'lucide-react';
import { Module, Lesson, Tier, Material } from '../../types';
import { extractYouTubeId } from '../../utils/youtube';
import { compressImageFile } from '../../utils/imageCompressor';
import { supabaseService } from '../../services/supabaseService';
import { storageService } from '../../services/storage';
import { INITIAL_MODULES } from '../../data/initialData';

interface AdminModulesProps {
  modules: Module[];
  onUpdateModules: (modules: Module[]) => void;
}

// Preset vertical covers for fast selection by mentor
const PRESET_COVERS = [
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1516245834210-c4c142787335?q=80&w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
];

export const AdminModules: React.FC<AdminModulesProps> = ({
  modules,
  onUpdateModules,
}) => {
  const [selectedModuleForLessons, setSelectedModuleForLessons] = useState<Module | null>(null);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isCompressingCover, setIsCompressingCover] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const coverFileInputRef = useRef<HTMLInputElement>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const refreshFromSupabase = async () => {
    setIsRefreshing(true);
    try {
      if (supabaseService.isConfigured()) {
        const remoteMods = await supabaseService.getModules();
        if (remoteMods && remoteMods.length > 0) {
          onUpdateModules(remoteMods);
          storageService.saveModules(remoteMods);
        } else if (INITIAL_MODULES.length > 0) {
          // If remote is empty, seed with initial modules
          await supabaseService.saveModules(INITIAL_MODULES);
          onUpdateModules(INITIAL_MODULES);
          storageService.saveModules(INITIAL_MODULES);
        }
      }
    } catch (e) {
      console.error('Error refreshing modules from Supabase:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (window.confirm('Deseja restaurar todos os 7 módulos padrão oficiais da mentoria?')) {
      const restored = storageService.restoreInitialModules();
      onUpdateModules(restored);
    }
  };

  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    try {
      setIsCompressingCover(true);
      const compressed = await compressImageFile(file, 600, 800, 0.75);
      setModuleForm(prev => ({ ...prev, coverImage: compressed }));
    } catch (err: any) {
      alert(err.message || 'Erro ao carregar a imagem.');
    } finally {
      setIsCompressingCover(false);
    }
  };

  // Form states for Module
  const [moduleForm, setModuleForm] = useState<{
    title: string;
    subtitle: string;
    description: string;
    coverImage: string;
    category: string;
    requiredTier: Tier;
    badgeText: string;
    price: number | '';
  }>({
    title: '',
    subtitle: '',
    description: '',
    coverImage: PRESET_COVERS[0],
    category: 'Análise Técnica',
    requiredTier: 'VIP',
    badgeText: '',
    price: '',
  });

  // Form states for Lesson
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [lessonForm, setLessonForm] = useState<{
    title: string;
    description: string;
    youtubeUrl: string;
    durationMinutes: number;
    takeaways: string;
    materialTitle: string;
    materialUrl: string;
    materialType: 'pdf' | 'spreadsheet' | 'link' | 'indicator';
  }>({
    title: '',
    description: '',
    youtubeUrl: '',
    durationMinutes: 25,
    takeaways: '',
    materialTitle: '',
    materialUrl: '',
    materialType: 'pdf',
  });

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMaterialFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('O tamanho do arquivo excede o limite de 15MB.');
      return;
    }

    setIsUploadingFile(true);
    try {
      if (!supabaseService.isConfigured()) {
        throw new Error('Supabase não está configurado. Por favor, adicione as credenciais do Supabase no arquivo .env.');
      }
      
      const fileUrl = await supabaseService.uploadMaterialFile(file);
      
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      let detectedType: 'pdf' | 'spreadsheet' | 'indicator' | 'link' = 'pdf';
      if (['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
        detectedType = 'spreadsheet';
      } else if (['nel', 'txt'].includes(ext)) {
        detectedType = 'indicator';
      } else if (['zip', 'rar', 'pdf'].includes(ext)) {
        detectedType = 'pdf';
      }

      setLessonForm(prev => ({
        ...prev,
        materialTitle: file.name,
        materialUrl: fileUrl,
        materialType: detectedType
      }));

      alert('Arquivo enviado com sucesso!');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Erro ao realizar upload do arquivo.');
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Open Create / Edit Module Modal
  const handleOpenModuleModal = (mod?: Module) => {
    if (mod) {
      setEditingModule(mod);
      setModuleForm({
        title: mod.title,
        subtitle: mod.subtitle || '',
        description: mod.description,
        coverImage: mod.coverImage,
        category: mod.category,
        requiredTier: mod.requiredTier,
        badgeText: mod.badgeText || '',
        price: mod.price || '',
      });
    } else {
      setEditingModule(null);
      setModuleForm({
        title: `Módulo ${modules.length + 1}: `,
        subtitle: 'Subtítulo do módulo',
        description: 'Descrição completa dos tópicos abordados...',
        coverImage: PRESET_COVERS[modules.length % PRESET_COVERS.length],
        category: 'Setups & Operacional',
        requiredTier: 'Starter' as Tier,
        badgeText: 'NOVO',
        price: '',
      });
    }
    setIsModuleModalOpen(true);
  };

  // Save Module
  const handleSaveModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleForm.title.trim()) return;

    if (editingModule) {
      const updated = modules.map((m) =>
        m.id === editingModule.id
          ? {
              ...m,
              title: moduleForm.title,
              subtitle: moduleForm.subtitle,
              description: moduleForm.description,
              coverImage: moduleForm.coverImage,
              category: moduleForm.category,
              requiredTier: moduleForm.requiredTier,
              badgeText: moduleForm.badgeText,
              price: moduleForm.price === '' ? undefined : Number(moduleForm.price),
            }
          : m
      );
      onUpdateModules(updated);
    } else {
      const newMod: Module = {
        id: 'mod-' + Date.now(),
        title: moduleForm.title,
        subtitle: moduleForm.subtitle,
        description: moduleForm.description,
        coverImage: moduleForm.coverImage,
        category: moduleForm.category,
        order: modules.length + 1,
        requiredTier: moduleForm.requiredTier,
        badgeText: moduleForm.badgeText,
        price: moduleForm.price === '' ? undefined : Number(moduleForm.price),
        lessons: [],
      };
      onUpdateModules([...modules, newMod]);
    }

    setIsModuleModalOpen(false);
  };

  // Delete Module
  const handleDeleteModule = (moduleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este módulo e todas as suas aulas?')) {
      const filtered = modules.filter((m) => m.id !== moduleId);
      onUpdateModules(filtered);
      if (selectedModuleForLessons?.id === moduleId) {
        setSelectedModuleForLessons(null);
      }
    }
  };

  // Open Lesson Modal
  const handleOpenLessonModal = (les?: Lesson) => {
    if (les) {
      setEditingLesson(les);
      setLessonForm({
        title: les.title,
        description: les.description,
        youtubeUrl: les.youtubeUrl,
        durationMinutes: les.durationMinutes,
        takeaways: les.keyTakeaways ? les.keyTakeaways.join('\n') : '',
        materialTitle: les.materials?.[0]?.title || '',
        materialUrl: les.materials?.[0]?.url || '',
        materialType: les.materials?.[0]?.type || 'pdf',
      });
    } else {
      const currentLessons = selectedModuleForLessons?.lessons || [];
      setEditingLesson(null);
      setLessonForm({
        title: `Aula 0${currentLessons.length + 1}: `,
        description: 'Descrição e objetivos da aula...',
        youtubeUrl: 'https://www.youtube.com/watch?v=kY31FpT-hOU',
        durationMinutes: 30,
        takeaways: 'Regra de Stop 2:1\nConfirmação no fechamento do candle',
        materialTitle: 'Material de Apoio.pdf',
        materialUrl: '#',
        materialType: 'pdf',
      });
    }
    setIsLessonModalOpen(true);
  };

  // Save Lesson
  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleForLessons || !lessonForm.title.trim()) return;

    const materials: Material[] = [];
    if (lessonForm.materialTitle.trim()) {
      materials.push({
        id: 'mat-' + Date.now(),
        title: lessonForm.materialTitle.trim(),
        url: lessonForm.materialUrl.trim() || '#',
        type: lessonForm.materialType,
        size: '1.2 MB'
      });
    }

    const takeaways = lessonForm.takeaways
      .split('\n')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    let updatedLessons = [...selectedModuleForLessons.lessons];

    if (editingLesson) {
      updatedLessons = updatedLessons.map(l => 
        l.id === editingLesson.id 
          ? {
              ...l,
              title: lessonForm.title,
              description: lessonForm.description,
              youtubeUrl: lessonForm.youtubeUrl,
              durationMinutes: Number(lessonForm.durationMinutes) || 20,
              keyTakeaways: takeaways,
              materials: materials.length > 0 ? materials : l.materials
            }
          : l
      );
    } else {
      const newLesson: Lesson = {
        id: 'les-' + Date.now(),
        moduleId: selectedModuleForLessons.id,
        title: lessonForm.title,
        description: lessonForm.description,
        youtubeUrl: lessonForm.youtubeUrl,
        durationMinutes: Number(lessonForm.durationMinutes) || 20,
        order: updatedLessons.length + 1,
        materials,
        keyTakeaways: takeaways,
        comments: []
      };
      updatedLessons.push(newLesson);
    }

    const updatedModules = modules.map(m => 
      m.id === selectedModuleForLessons.id ? { ...m, lessons: updatedLessons } : m
    );

    onUpdateModules(updatedModules);
    setSelectedModuleForLessons({ ...selectedModuleForLessons, lessons: updatedLessons });
    setIsLessonModalOpen(false);
  };

  // Delete Lesson
  const handleDeleteLesson = (lessonId: string) => {
    if (!selectedModuleForLessons) return;
    if (window.confirm('Excluir esta aula?')) {
      const updatedLessons = selectedModuleForLessons.lessons.filter(l => l.id !== lessonId);
      const updatedModules = modules.map(m => 
        m.id === selectedModuleForLessons.id ? { ...m, lessons: updatedLessons } : m
      );
      onUpdateModules(updatedModules);
      setSelectedModuleForLessons({ ...selectedModuleForLessons, lessons: updatedLessons });
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!selectedModuleForLessons || draggedIndex === null || draggedIndex === targetIndex) return;

    const lessons = [...selectedModuleForLessons.lessons];
    const draggedItem = lessons[draggedIndex];
    
    // Remove the item from its original position
    lessons.splice(draggedIndex, 1);
    // Insert the item at the target position
    lessons.splice(targetIndex, 0, draggedItem);

    // Re-adjust order property for each lesson
    const updatedLessons = lessons.map((l, idx) => ({
      ...l,
      order: idx + 1,
    }));

    const updatedModules = modules.map(m => 
      m.id === selectedModuleForLessons.id ? { ...m, lessons: updatedLessons } : m
    );

    onUpdateModules(updatedModules);
    setSelectedModuleForLessons({ ...selectedModuleForLessons, lessons: updatedLessons });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Manual sorting handler (Up/Down buttons)
  const handleMoveLesson = (index: number, direction: 'up' | 'down') => {
    if (!selectedModuleForLessons) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= selectedModuleForLessons.lessons.length) return;

    const lessons = [...selectedModuleForLessons.lessons];
    const item = lessons[index];
    lessons.splice(index, 1);
    lessons.splice(targetIndex, 0, item);

    const updatedLessons = lessons.map((l, idx) => ({
      ...l,
      order: idx + 1,
    }));

    const updatedModules = modules.map(m => 
      m.id === selectedModuleForLessons.id ? { ...m, lessons: updatedLessons } : m
    );

    onUpdateModules(updatedModules);
    setSelectedModuleForLessons({ ...selectedModuleForLessons, lessons: updatedLessons });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Gerenciador de Módulos & Aulas (YouTube)
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Crie novos módulos com capas verticais e vincule vídeos do YouTube com materiais para download.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={refreshFromSupabase}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs transition-all border border-white/5 cursor-pointer uppercase tracking-wider disabled:opacity-50"
            title="Sincronizar com o banco Supabase"
          >
            <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
            <span>{isRefreshing ? 'Sincronizando...' : 'Sincronizar Banco'}</span>
          </button>

          <button
            onClick={handleRestoreDefaults}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs transition-all border border-white/5 cursor-pointer uppercase tracking-wider"
            title="Restaurar grade padrão de 7 módulos da mentoria"
          >
            <Undo2 className="w-4 h-4 text-orange-400" />
            <span>Restaurar Padrão</span>
          </button>

          <button
            onClick={() => handleOpenModuleModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#ff8800] text-black font-extrabold text-xs transition-all shadow-lg shadow-orange-500/25 cursor-pointer uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Criar Novo Módulo</span>
          </button>
        </div>
      </div>

      {/* Modules List Grid */}
      {modules.length === 0 ? (
        <div className="p-12 rounded-3xl bg-[#111118] border border-[#242433] text-center space-y-4 max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-orange-600/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Nenhum Módulo Encontrado</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Você pode restaurar a grade de 7 módulos oficiais da mentoria ou criar um novo módulo do zero.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={handleRestoreDefaults}
              className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all shadow-lg shadow-orange-600/20 cursor-pointer uppercase tracking-wider"
            >
              Restaurar 7 Módulos Oficiais
            </button>
            <button
              onClick={() => handleOpenModuleModal()}
              className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-all cursor-pointer uppercase tracking-wider"
            >
              Criar Módulo
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod) => (
          <div
            key={mod.id}
            className="rounded-3xl bg-[#111118] border border-[#242433] overflow-hidden flex flex-col justify-between hover:border-[#ff6b00]/60 transition-all shadow-xl"
          >
            {/* Top Half: Vertical preview and badges */}
            <div className="relative aspect-[16/9] sm:aspect-[4/3] bg-black overflow-hidden">
              <img
                src={mod.coverImage}
                alt={mod.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#111118] via-transparent to-transparent"></div>
              
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-[#ff6b00] text-black font-extrabold text-[10px] uppercase font-mono">
                  {mod.requiredTier}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-black/70 text-gray-300 font-bold text-[10px] uppercase font-mono">
                  {mod.category}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3">
                <span className="text-[11px] text-gray-400 font-mono">
                  {mod.lessons.length} Aulas cadastradas
                </span>
                <h3 className="text-base font-bold text-white leading-tight line-clamp-1">
                  {mod.title}
                </h3>
              </div>
            </div>

            {/* Bottom Content & Actions */}
            <div className="p-4 space-y-3">
              <p className="text-xs text-gray-400 line-clamp-2">
                {mod.subtitle || mod.description}
              </p>

              <div className="pt-2 border-t border-[#1e1e2c] flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedModuleForLessons(mod)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-[#ff6b00]/15 hover:bg-[#ff6b00] text-[#ff8800] hover:text-black font-bold text-xs transition-colors cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Gerenciar Aulas ({mod.lessons.length})</span>
                </button>

                <button
                  onClick={() => handleOpenModuleModal(mod)}
                  className="p-2 rounded-xl bg-[#181824] hover:bg-[#252538] text-gray-300 hover:text-white cursor-pointer"
                  title="Editar Módulo"
                >
                  <Edit className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteModule(mod.id)}
                  className="p-2 rounded-xl bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white cursor-pointer"
                  title="Excluir Módulo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Drawer / Modal: Manage Lessons for Selected Module */}
      {selectedModuleForLessons && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-4xl bg-[#111118] border border-[#2d2d3f] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="p-6 bg-[#151520] border-b border-[#242433] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#ff8800] font-mono font-bold uppercase">
                  Aulas do {selectedModuleForLessons.title.split(':')[0]}
                </span>
                <h3 className="text-lg font-bold text-white">{selectedModuleForLessons.title}</h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenLessonModal()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#ff8800] text-black font-extrabold text-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Adicionar Aula</span>
                </button>

                <button
                  onClick={() => setSelectedModuleForLessons(null)}
                  className="p-2 rounded-xl bg-[#1e1e2c] text-gray-300 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Lessons List in this Module */}
            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {selectedModuleForLessons.lessons.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-xs">
                  Nenhuma aula cadastrada ainda neste módulo. Clique em &quot;Adicionar Aula&quot; acima!
                </div>
              ) : (
                selectedModuleForLessons.lessons.map((les, index) => (
                  <div
                    key={les.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`p-4 rounded-2xl bg-[#161622] border border-[#272738] flex items-center justify-between gap-4 hover:border-[#ff6b00]/40 transition-all cursor-move select-none ${
                      draggedIndex === index ? 'opacity-40 border-dashed border-[#ff6b00]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <GripVertical className="w-4 h-4 text-gray-500 cursor-grab active:cursor-grabbing shrink-0" />
                      <div className="w-8 h-8 rounded-xl bg-[#ff6b00]/15 flex items-center justify-center text-[#ff8800] font-bold text-xs shrink-0">
                        {index + 1}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="text-sm font-bold text-white truncate">{les.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1 font-mono shrink-0">
                            <Clock className="w-3 h-3 text-[#ff6b00]" />
                            {les.durationMinutes} min
                          </span>
                          <span className="text-gray-500 truncate max-w-xs font-mono text-[11px] hidden sm:inline">
                            {les.youtubeUrl}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveLesson(index, 'up')}
                        className={`p-2 rounded-xl bg-[#20202e] hover:bg-[#252538] text-gray-400 hover:text-white transition-colors ${
                          index === 0 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title="Mover para cima"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === selectedModuleForLessons.lessons.length - 1}
                        onClick={() => handleMoveLesson(index, 'down')}
                        className={`p-2 rounded-xl bg-[#20202e] hover:bg-[#252538] text-gray-400 hover:text-white transition-colors ${
                          index === selectedModuleForLessons.lessons.length - 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                        title="Mover para baixo"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenLessonModal(les)}
                        className="p-2 rounded-xl bg-[#20202e] hover:bg-[#ff6b00] text-gray-300 hover:text-black transition-colors cursor-pointer"
                        title="Editar Aula"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLesson(les.id)}
                        className="p-2 rounded-xl bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white transition-colors cursor-pointer"
                        title="Excluir Aula"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

      {/* Modal: Create/Edit Module */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#111118] border border-[#2d2d3f] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 bg-[#151520] border-b border-[#242433] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingModule ? 'Editar Módulo' : 'Novo Módulo de Mentoria'}
              </h3>
              <button
                onClick={() => setIsModuleModalOpen(false)}
                className="p-2 rounded-xl bg-[#1e1e2c] text-gray-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModule} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                  Título do Módulo
                </label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="Ex: Módulo 10: Estratégias Institucionais no WDO"
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                  Subtítulo / Chamada Rápida
                </label>
                <input
                  type="text"
                  value={moduleForm.subtitle}
                  onChange={(e) => setModuleForm({ ...moduleForm, subtitle: e.target.value })}
                  placeholder="Ex: Identificação de absorção no livro de ofertas"
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                    Categoria
                  </label>
                  <select
                    value={moduleForm.category}
                    onChange={(e) => setModuleForm({ ...moduleForm, category: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                  >
                    <option value="Comece por Aqui">Comece por Aqui</option>
                    <option value="Fundamentos">Fundamentos</option>
                    <option value="Análise Técnica">Análise Técnica</option>
                    <option value="Tape Reading">Tape Reading</option>
                    <option value="Gestão de Risco">Gestão de Risco</option>
                    <option value="Psicologia & Mindset">Psicologia & Mindset</option>
                    <option value="Setups & Operacional">Setups & Operacional</option>
                    <option value="Operações Ao Vivo">Operações Ao Vivo</option>
                    <option value="Materiais VIP">Materiais VIP</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                    Plano Mínimo para Acesso
                  </label>
                  <select
                    value={moduleForm.requiredTier}
                    onChange={(e) => setModuleForm({ ...moduleForm, requiredTier: e.target.value as Tier })}
                    className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                  >
                    <option value="Free">Free (Opções Binárias)</option>
                    <option value="VIP">VIP</option>
                    <option value="Vitalício">Vitalício (Todos os Módulos)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                    Preço Avulso (R$) - Deixe em branco se for incluso no plano
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={moduleForm.price}
                    onChange={(e) => setModuleForm({ ...moduleForm, price: e.target.value ? Number(e.target.value) : '' })}
                    placeholder="Ex: 299.90"
                    className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                  Selo de Destaque (Badge)
                </label>
                <input
                  type="text"
                  value={moduleForm.badgeText}
                  onChange={(e) => setModuleForm({ ...moduleForm, badgeText: e.target.value })}
                  placeholder="Ex: NOVO, EXCLUSIVO, MAIS ASSISTIDO"
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              {/* Vertical Cover Upload & Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-300 uppercase font-mono">
                  Foto Vertical de Capa do Módulo
                </label>

                <input
                  type="file"
                  ref={coverFileInputRef}
                  onChange={handleCoverFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-[#161622] border border-[#272738]">
                  <div className="w-24 aspect-[3/4] rounded-xl overflow-hidden relative shadow-lg border border-orange-500/40 shrink-0 bg-black">
                    {moduleForm.coverImage ? (
                      <img
                        src={moduleForm.coverImage}
                        alt="Capa Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[9px]">Sem Capa</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <button
                      type="button"
                      disabled={isCompressingCover}
                      onClick={() => coverFileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-orange-600/20 uppercase tracking-wider"
                    >
                      {isCompressingCover ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Processando Foto Otimizada...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4" />
                          <span>Enviar Foto do Seu Aparelho (Galeria / Arquivos)</span>
                        </>
                      )}
                    </button>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Ou cole a URL direta da foto da capa..."
                        value={moduleForm.coverImage}
                        onChange={(e) => setModuleForm({ ...moduleForm, coverImage: e.target.value })}
                        className="flex-1 p-2.5 rounded-xl bg-[#0d0d14] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-zinc-400 font-mono block mb-1.5">
                    Ou escolha uma sugestão pré-definida:
                  </span>
                  <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                    {PRESET_COVERS.map((url, i) => (
                      <button
                        type="button"
                        key={i}
                        onClick={() => setModuleForm({ ...moduleForm, coverImage: url })}
                        className={`aspect-[3/4] rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          moduleForm.coverImage === url ? 'border-[#ff6b00] scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                  Descrição Completa
                </label>
                <textarea
                  rows={3}
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#222230]">
                <button
                  type="button"
                  onClick={() => setIsModuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c1c28] text-gray-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#ff8800] text-black font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Salvar Módulo
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Create/Edit Lesson */}
      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#111118] border border-[#2d2d3f] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 bg-[#151520] border-b border-[#242433] flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingLesson ? 'Editar Aula' : 'Nova Aula do YouTube'}
              </h3>
              <button
                onClick={() => setIsLessonModalOpen(false)}
                className="p-2 rounded-xl bg-[#1e1e2c] text-gray-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLesson} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                  Título da Aula
                </label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  placeholder="Ex: Aula 01: Gatilho de Entrada no Trap de Abertura"
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                    Link do Vídeo no YouTube (ou ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={lessonForm.youtubeUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, youtubeUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=kY31FpT-hOU"
                    className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    value={lessonForm.durationMinutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, durationMinutes: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                  Descrição & Resumo
                </label>
                <textarea
                  rows={2}
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  placeholder="Explique o objetivo e o que será aprendido nesta aula..."
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase font-mono">
                  Pontos-Chave / Checklist (1 por linha)
                </label>
                <textarea
                  rows={2}
                  value={lessonForm.takeaways}
                  onChange={(e) => setLessonForm({ ...lessonForm, takeaways: e.target.value })}
                  placeholder="Stop técnico atrás do candle&#10;Entrada no rompimento da máxima&#10;Alvo 2 para 1"
                  className="w-full p-3 rounded-xl bg-[#161622] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                ></textarea>
              </div>

              {/* Material Anexo */}
              <div className="p-4 rounded-2xl bg-[#171724] border border-[#272739] space-y-3">
                <span className="text-xs font-bold text-[#ff8800] uppercase font-mono">
                  Material de Apoio para Download (Opcional)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase font-mono">
                      Nome do Material
                    </label>
                    <input
                      type="text"
                      value={lessonForm.materialTitle}
                      onChange={(e) => setLessonForm({ ...lessonForm, materialTitle: e.target.value })}
                      placeholder="Nome do arquivo (ex: Planilha_Gestao.xlsx)"
                      className="w-full p-2.5 rounded-xl bg-[#111118] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase font-mono">
                      Tipo de Arquivo
                    </label>
                    <select
                      value={lessonForm.materialType}
                      onChange={(e) => setLessonForm({ ...lessonForm, materialType: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl bg-[#111118] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                    >
                      <option value="pdf">PDF</option>
                      <option value="spreadsheet">Planilha Excel</option>
                      <option value="indicator">Regra / Indicador .nel</option>
                      <option value="link">Link Externo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase font-mono">
                    URL / Link de Download do Arquivo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={lessonForm.materialUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, materialUrl: e.target.value })}
                      placeholder="Cole o link ou clique em 'Enviar Arquivo' para carregar do seu dispositivo..."
                      className="flex-1 p-2.5 rounded-xl bg-[#111118] border border-[#272738] text-white text-xs focus:outline-none focus:border-[#ff6b00]"
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleMaterialFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-[#ff6b00] hover:bg-[#ff8800] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors uppercase tracking-wider shrink-0 animate-in fade-in"
                    >
                      {isUploadingFile ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Enviar Arquivo</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-1 font-mono">
                    Opcional: Envie PDFs, planilhas ou indicadores diretamente para o Storage do seu Supabase.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#222230]">
                <button
                  type="button"
                  onClick={() => setIsLessonModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#1c1c28] text-gray-300 hover:text-white text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#ff6b00] hover:bg-[#ff8800] text-black font-extrabold text-xs transition-colors cursor-pointer"
                >
                  Salvar Aula
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
