import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Wand2,
  Mic,
  Loader2,
  ImagePlus,
  Upload,
  X,
  Grid3X3,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { HandDrawnButton } from '../../components/HandDrawnButton';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { HandDrawnInput } from '../../components/HandDrawnInput';

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : '';

interface Lesson {
  id: string;
  title: string;
  objective: string;
  teaching_prompt: string;
  sort_order: number;
  source_audio_ref: string | null;
  source_transcript: string | null;
  image_url: string | null;
  prompt_version?: number | null;
  prompt_last_edited_by?: string | null;
  prompt_source_type?: 'manual' | 'ai-assisted' | null;
  prompt_design_notes?: string | null;
  visual_aids?: Array<Record<string, unknown>> | null;
  ai_generation_context?: Record<string, unknown> | null;
}

interface LibraryImage {
  id: string;
  filename: string;
  url: string;
  original_name: string;
}

interface AILessonDraft {
  title: string;
  objective: string;
  teaching_prompt: string;
  prompt_design_notes: string;
  visual_aids: Array<Record<string, unknown>>;
  ai_generation_context: {
    language_id: string;
    learner_level: string;
    lesson_length_minutes: number;
    focus_skills: string[];
    constraints: string | null;
  };
}

export function AdminLessonsPage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json',
  };

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Partial<Lesson>>({});
  const [saving, setSaving] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarising, setIsSummarising] = useState(false);
  const [imageLibrary, setImageLibrary] = useState<LibraryImage[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [aiSourceContent, setAiSourceContent] = useState('');
  const [aiLearnerLevel, setAiLearnerLevel] = useState('beginner');
  const [aiLanguageId, setAiLanguageId] = useState('es');
  const [aiLessonLength, setAiLessonLength] = useState(10);
  const [aiFocusSkillsText, setAiFocusSkillsText] = useState('speaking, listening');
  const [aiConstraints, setAiConstraints] = useState('');
  const [aiDraft, setAiDraft] = useState<AILessonDraft | null>(null);
  const [aiInstruction, setAiInstruction] = useState('');
  const [aiHistory, setAiHistory] = useState<string[]>([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ---- Load lessons ----
  const loadLessons = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/courses/${courseId}/lessons`,
        { headers },
      );
      if (res.ok) setLessons(await res.json());
    } catch (err) {
      console.error('Failed to load lessons', err);
    } finally {
      setLoading(false);
    }
  }, [courseId, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadLessons();
  }, [loadLessons]);

  // ---- Image library ----
  const loadImageLibrary = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/images`, { headers });
      if (res.ok) setImageLibrary(await res.json());
    } catch (err) {
      console.error('Failed to load image library', err);
    }
  }, [user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/api/admin/images/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` },
        body: formData,
      });
      if (res.ok) {
        const record: LibraryImage = await res.json();
        setImageLibrary((prev) => [record, ...prev]);
        setCurrentLesson((prev) => ({ ...prev, image_url: record.url }));
      }
    } catch (err) {
      console.error('Failed to upload image', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // ---- Modal helpers ----
  const handleOpenModal = (lesson?: Lesson) => {
    setCurrentLesson(lesson ? { ...lesson } : {});
    setShowLibrary(false);
    setAiSourceContent('');
    setAiLearnerLevel('beginner');
    setAiLanguageId('es');
    setAiLessonLength(10);
    setAiFocusSkillsText('speaking, listening');
    setAiConstraints('');
    setAiDraft(null);
    setAiInstruction('');
    setAiHistory([]);
    setAiError(null);
    loadImageLibrary();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLesson({});
  };

  const parseFocusSkills = (value: string) =>
    value
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);

  const handleSourceFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith('.txt') || name.endsWith('.md')) {
      const text = await file.text();
      setAiSourceContent(text.slice(0, 30000));
      e.target.value = '';
      return;
    }
    if (name.endsWith('.pdf')) {
      setAiError('PDF upload is supported as a reference, but please paste extracted text for best results.');
      setAiSourceContent((prev) =>
        prev
          ? prev
          : `[PDF uploaded: ${file.name}] Please paste extracted text content below.`,
      );
    } else {
      setAiError('Unsupported file type. Use TXT, MD, or PDF.');
    }
    e.target.value = '';
  };

  const handleGenerateDraft = async () => {
    setAiError(null);
    if (!aiSourceContent.trim()) {
      setAiError('Add source content before generating a draft.');
      return;
    }
    setIsDrafting(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/lessons/ai/draft`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_content: aiSourceContent,
          language_id: aiLanguageId,
          learner_level: aiLearnerLevel,
          lesson_length_minutes: aiLessonLength,
          focus_skills: parseFocusSkills(aiFocusSkillsText),
          constraints: aiConstraints || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAiError(data?.detail || 'Could not generate draft.');
        return;
      }
      const data: AILessonDraft = await res.json();
      setAiDraft(data);
      setAiHistory((prev) => [...prev, 'Generated initial draft']);
    } catch {
      setAiError('Could not generate draft.');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleRefineDraft = async () => {
    setAiError(null);
    if (!aiDraft) {
      setAiError('Generate a draft first.');
      return;
    }
    if (!aiInstruction.trim()) {
      setAiError('Add an instruction to refine the draft.');
      return;
    }
    setIsRefining(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/lessons/ai/refine`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          current_draft: aiDraft,
          admin_instruction: aiInstruction,
          conversation_summary: aiHistory.join('\n'),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAiError(data?.detail || 'Could not refine draft.');
        return;
      }
      const data: AILessonDraft = await res.json();
      setAiDraft(data);
      setAiHistory((prev) => [...prev, `Instruction: ${aiInstruction.trim()}`]);
      setAiInstruction('');
    } catch {
      setAiError('Could not refine draft.');
    } finally {
      setIsRefining(false);
    }
  };

  const applyDraftToLesson = () => {
    if (!aiDraft) return;
    setCurrentLesson((prev) => ({
      ...prev,
      title: aiDraft.title || prev.title || '',
      objective: aiDraft.objective || prev.objective || '',
      teaching_prompt: aiDraft.teaching_prompt || prev.teaching_prompt || '',
      prompt_design_notes: aiDraft.prompt_design_notes || '',
      prompt_source_type: 'ai-assisted',
      visual_aids: aiDraft.visual_aids || [],
      ai_generation_context: aiDraft.ai_generation_context || null,
      prompt_version: Number(prev.prompt_version || 0) + 1,
      prompt_last_edited_by: user?.email || user?.uid || null,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (currentLesson.id) {
        await fetch(
          `${API_BASE}/api/admin/courses/${courseId}/lessons/${currentLesson.id}`,
          {
            method: 'PUT',
            headers,
            body: JSON.stringify({
              title: currentLesson.title,
              objective: currentLesson.objective,
              teaching_prompt: currentLesson.teaching_prompt,
              source_audio_ref: currentLesson.source_audio_ref,
              source_transcript: currentLesson.source_transcript,
              image_url: currentLesson.image_url,
              prompt_version: currentLesson.prompt_version ?? null,
              prompt_last_edited_by: currentLesson.prompt_last_edited_by ?? null,
              prompt_source_type: currentLesson.prompt_source_type ?? 'manual',
              prompt_design_notes: currentLesson.prompt_design_notes ?? null,
              visual_aids: currentLesson.visual_aids ?? [],
              ai_generation_context: currentLesson.ai_generation_context ?? null,
            }),
          },
        );
      } else {
        await fetch(`${API_BASE}/api/admin/courses/${courseId}/lessons`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title: currentLesson.title || '',
            objective: currentLesson.objective || '',
            teaching_prompt: currentLesson.teaching_prompt || '',
            sort_order: lessons.length,
            source_audio_ref: currentLesson.source_audio_ref || null,
            source_transcript: currentLesson.source_transcript || null,
            image_url: currentLesson.image_url || null,
            prompt_version: currentLesson.prompt_version ?? 1,
            prompt_last_edited_by: currentLesson.prompt_last_edited_by ?? user?.email ?? user?.uid ?? null,
            prompt_source_type: currentLesson.prompt_source_type ?? 'manual',
            prompt_design_notes: currentLesson.prompt_design_notes ?? null,
            visual_aids: currentLesson.visual_aids ?? [],
            ai_generation_context: currentLesson.ai_generation_context ?? null,
          }),
        });
      }
      await loadLessons();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save lesson', err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setLessonToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!lessonToDelete) return;
    try {
      await fetch(
        `${API_BASE}/api/admin/courses/${courseId}/lessons/${lessonToDelete}`,
        { method: 'DELETE', headers },
      );
      await loadLessons();
    } catch (err) {
      console.error('Failed to delete lesson', err);
    } finally {
      setIsDeleteModalOpen(false);
      setLessonToDelete(null);
    }
  };

  const moveLesson = async (index: number, direction: 'up' | 'down') => {
    if (reordering) return;
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;

    const previousLessons = [...lessons];
    const newLessons = [...lessons];
    [newLessons[swapIdx], newLessons[index]] = [newLessons[index], newLessons[swapIdx]];
    setLessons(newLessons);
    setReordering(true);
    setReorderError(null);

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/courses/${courseId}/lessons/reorder`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ lesson_ids: newLessons.map((l) => l.id) }),
        },
      );
      if (!res.ok) {
        setLessons(previousLessons);
        setReorderError("Couldn't reorder — please try again");
        setTimeout(() => setReorderError(null), 3000);
      }
    } catch (err) {
      console.error('Failed to reorder', err);
      setLessons(previousLessons);
      setReorderError("Couldn't reorder — please try again");
      setTimeout(() => setReorderError(null), 3000);
    } finally {
      setReordering(false);
    }
  };

  const handleTranscribe = async () => {
    if (!currentLesson.source_audio_ref) return;
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      // For now, use the mock endpoint with a placeholder
      const res = await fetch(`${API_BASE}/api/admin/transcribe`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${user?.token}` },
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentLesson((prev) => ({ ...prev, source_transcript: data.transcript }));
      }
    } catch {
      // Fallback: mock
      setCurrentLesson((prev) => ({
        ...prev,
        source_transcript: 'Transcription not available — upload audio via the API.',
      }));
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSummarise = async () => {
    if (!currentLesson.source_transcript) return;
    setIsSummarising(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/summarise`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ transcript_text: currentLesson.source_transcript }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentLesson((prev) => ({ ...prev, objective: data.summary }));
      }
    } catch {
      setCurrentLesson((prev) => ({
        ...prev,
        objective: 'Summarisation not available.',
      }));
    } finally {
      setIsSummarising(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-gray-500 mb-6 font-medium">
        <Link to="/admin/courses" className="hover:text-[#1A1A1A] transition-colors">
          Courses
        </Link>
        <ChevronRight size={16} />
        <span className="text-[#1A1A1A]">Manage Lessons</span>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A]">
          Course Lessons
        </h1>
        <HandDrawnButton
          variant="primary"
          onClick={() => handleOpenModal()}
          className="shrink-0"
        >
          <Plus size={18} /> Add Lesson
        </HandDrawnButton>
      </div>

      {reorderError && (
        <p className="text-[#DC2626] text-sm font-medium mt-2">{reorderError}</p>
      )}

      <div className="space-y-4">
        {lessons.map((lesson, idx) => (
          <HandDrawnCard
            key={lesson.id}
            rotate="none"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4"
          >
            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveLesson(idx, 'up')}
                  disabled={idx === 0 || reordering}
                  aria-label="Move lesson up"
                  className={`p-2 text-gray-400 hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors ${
                    reordering ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  onClick={() => moveLesson(idx, 'down')}
                  disabled={idx === lessons.length - 1 || reordering}
                  aria-label="Move lesson down"
                  className={`p-2 text-gray-400 hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors ${
                    reordering ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ArrowDown size={18} />
                </button>
              </div>

              <div className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] bg-[#FAFAF8] flex items-center justify-center font-bold shrink-0 hand-drawn-border">
                {idx + 1}
              </div>

              {lesson.image_url && (
                <img
                  src={`${API_BASE}${lesson.image_url}`}
                  alt=""
                  className="w-10 h-10 rounded border-2 border-[#1A1A1A] object-cover shrink-0"
                />
              )}

              <div>
                <h3 className="font-heading text-xl font-bold">{lesson.title}</h3>
                <p className="text-gray-600 text-sm">{lesson.objective}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <HandDrawnButton
                variant="outline"
                onClick={() => handleOpenModal(lesson)}
                className="px-3 py-2"
              >
                <Edit2 size={16} />
              </HandDrawnButton>
              <HandDrawnButton
                variant="outline"
                onClick={() => confirmDelete(lesson.id)}
                className="px-3 py-2 text-[#DC2626] hover:bg-red-50 border-transparent hover:border-[#DC2626]"
              >
                <Trash2 size={16} />
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        ))}
        {lessons.length === 0 && (
          <div className="text-center p-12 border-2 border-dashed border-gray-300 hand-drawn-border text-gray-500">
            No lessons yet. Click &quot;Add Lesson&quot; to create one.
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <HandDrawnCard className="w-full max-w-2xl bg-white my-8" rotate="none">
            <h2 className="font-heading text-2xl font-bold mb-6">
              {currentLesson.id ? 'Edit Lesson' : 'Create New Lesson'}
            </h2>

            <div className="space-y-6">
              <HandDrawnInput
                label="Lesson Title"
                value={currentLesson.title || ''}
                onChange={(e) =>
                  setCurrentLesson({ ...currentLesson, title: e.target.value })
                }
                placeholder="e.g., Ordering Coffee"
              />

              <HandDrawnInput
                label="Learning Objective"
                value={currentLesson.objective || ''}
                onChange={(e) =>
                  setCurrentLesson({ ...currentLesson, objective: e.target.value })
                }
                placeholder="What will the user learn?"
              />

              {/* ---- Lesson Image ---- */}
              <div className="border-t-2 border-dashed border-gray-200 pt-6">
                <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <ImagePlus size={20} className="text-[#DC2626]" /> Lesson Image
                </h3>

                {/* Preview */}
                {currentLesson.image_url ? (
                  <div className="relative inline-block mb-4">
                    <img
                      src={`${API_BASE}${currentLesson.image_url}`}
                      alt="Lesson"
                      className="w-40 h-28 object-cover rounded border-2 border-[#1A1A1A]"
                    />
                    <button
                      type="button"
                      onClick={() => setCurrentLesson({ ...currentLesson, image_url: null })}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-[#DC2626] text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="w-40 h-28 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 mb-4">
                    <ImagePlus size={24} />
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {/* Upload button */}
                  <label className="inline-flex items-center gap-1 text-sm font-bold px-4 py-2 border-2 border-[#1A1A1A] hand-drawn-border-alt cursor-pointer hover:bg-gray-100 transition-colors">
                    <Upload size={16} />
                    {uploading ? 'Uploading…' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>

                  {/* Library toggle */}
                  <button
                    type="button"
                    onClick={() => setShowLibrary(!showLibrary)}
                    className="inline-flex items-center gap-1 text-sm font-bold px-4 py-2 border-2 border-[#1A1A1A] hand-drawn-border-alt hover:bg-gray-100 transition-colors"
                  >
                    <Grid3X3 size={16} />
                    {showLibrary ? 'Hide Library' : 'Choose from Library'}
                  </button>
                </div>

                {/* Library grid */}
                {showLibrary && (
                  <div className="mt-4 border-2 border-[#1A1A1A] hand-drawn-border-alt p-3 max-h-48 overflow-y-auto">
                    {imageLibrary.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">
                        No images in library yet. Upload one above.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {imageLibrary.map((img) => (
                          <button
                            key={img.id}
                            type="button"
                            onClick={() => {
                              setCurrentLesson({ ...currentLesson, image_url: img.url });
                              setShowLibrary(false);
                            }}
                            className={`relative aspect-square rounded border-2 overflow-hidden transition-all hover:opacity-80 ${
                              currentLesson.image_url === img.url
                                ? 'border-[#DC2626] ring-2 ring-[#DC2626]/30'
                                : 'border-gray-200 hover:border-[#1A1A1A]'
                            }`}
                          >
                            <img
                              src={`${API_BASE}${img.url}`}
                              alt={img.original_name}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t-2 border-dashed border-gray-200 pt-6">
                <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <Wand2 size={20} className="text-[#F59E0B]" /> AI Coach Configuration
                </h3>
                <div className="mb-6 p-4 border-2 border-[#1A1A1A] hand-drawn-border-alt bg-[#FAFAF8]">
                  <h4 className="font-heading font-bold text-base mb-3">AI Assist Lesson Builder</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-bold mb-1">Source Content</label>
                      <textarea
                        className="w-full bg-white border-2 border-[#1A1A1A] hand-drawn-border-alt px-3 py-2 text-sm"
                        rows={4}
                        value={aiSourceContent}
                        onChange={(e) => setAiSourceContent(e.target.value)}
                        placeholder="Paste source material for this lesson design..."
                      />
                      <label className="inline-flex items-center gap-1 mt-2 text-xs font-bold px-3 py-1.5 border-2 border-[#1A1A1A] hand-drawn-border-alt cursor-pointer hover:bg-gray-100 transition-colors">
                        <Upload size={14} /> Upload TXT/MD/PDF
                        <input
                          type="file"
                          accept=".txt,.md,.pdf"
                          onChange={handleSourceFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <HandDrawnInput
                        label="Language ID"
                        value={aiLanguageId}
                        onChange={(e) => setAiLanguageId(e.target.value)}
                        placeholder="es"
                      />
                      <HandDrawnInput
                        label="Learner Level"
                        value={aiLearnerLevel}
                        onChange={(e) => setAiLearnerLevel(e.target.value)}
                        placeholder="beginner"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <HandDrawnInput
                        label="Lesson Length (minutes)"
                        type="number"
                        value={String(aiLessonLength)}
                        onChange={(e) => setAiLessonLength(Number(e.target.value || 10))}
                        placeholder="10"
                      />
                      <HandDrawnInput
                        label="Focus Skills (comma separated)"
                        value={aiFocusSkillsText}
                        onChange={(e) => setAiFocusSkillsText(e.target.value)}
                        placeholder="speaking, listening"
                      />
                    </div>
                    <HandDrawnInput
                      label="Constraints (optional)"
                      value={aiConstraints}
                      onChange={(e) => setAiConstraints(e.target.value)}
                      placeholder="Keep vocabulary A1, include roleplay"
                    />
                    <div className="flex flex-wrap gap-2">
                      <HandDrawnButton
                        variant="outline"
                        onClick={handleGenerateDraft}
                        disabled={isDrafting}
                      >
                        {isDrafting ? 'Generating…' : 'Generate Draft'}
                      </HandDrawnButton>
                      <HandDrawnButton
                        variant="outline"
                        onClick={applyDraftToLesson}
                        disabled={!aiDraft}
                      >
                        Apply Draft to Lesson
                      </HandDrawnButton>
                    </div>
                    {aiDraft && (
                      <div className="mt-2 p-3 border-2 border-dashed border-gray-300 hand-drawn-border-alt bg-white">
                        <p className="text-xs text-gray-500 mb-1">Current AI Draft</p>
                        <p className="text-sm font-bold">{aiDraft.title || '(Untitled)'}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-3">{aiDraft.objective}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-bold mb-1">Refine Instruction</label>
                      <textarea
                        className="w-full bg-white border-2 border-[#1A1A1A] hand-drawn-border-alt px-3 py-2 text-sm"
                        rows={2}
                        value={aiInstruction}
                        onChange={(e) => setAiInstruction(e.target.value)}
                        placeholder="e.g., simplify grammar and add more speaking drills"
                      />
                      <div className="mt-2">
                        <HandDrawnButton
                          variant="outline"
                          onClick={handleRefineDraft}
                          disabled={isRefining || !aiDraft}
                        >
                          {isRefining ? 'Refining…' : 'Refine Draft'}
                        </HandDrawnButton>
                      </div>
                    </div>
                    {aiError && (
                      <p className="text-xs text-[#DC2626] font-medium">{aiError}</p>
                    )}
                  </div>
                </div>
                <HandDrawnInput
                  label="Teaching Prompt (System Prompt)"
                  multiline
                  rows={4}
                  value={currentLesson.teaching_prompt || ''}
                  onChange={(e) =>
                    setCurrentLesson({ ...currentLesson, teaching_prompt: e.target.value })
                  }
                  placeholder="Instructions for the AI coach..."
                  className="font-mono text-sm"
                />
              </div>

              <div className="border-t-2 border-dashed border-gray-200 pt-6">
                <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <Mic size={20} className="text-[#DC2626]" /> Source Material
                </h3>
                <div className="space-y-4">
                  <HandDrawnInput
                    label="Source Audio Reference (URL/ID)"
                    value={currentLesson.source_audio_ref || ''}
                    onChange={(e) =>
                      setCurrentLesson({ ...currentLesson, source_audio_ref: e.target.value })
                    }
                    placeholder="s3://... or audio ID"
                  />
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <label className="font-heading font-bold text-[#1A1A1A] text-lg">
                        Source Transcript
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleTranscribe}
                          disabled={isTranscribing || !currentLesson.source_audio_ref}
                          className="text-xs font-bold px-3 py-1 border-2 border-[#1A1A1A] hand-drawn-border-pill hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {isTranscribing ? 'Transcribing...' : 'Transcribe Audio'}
                        </button>
                        <button
                          type="button"
                          onClick={handleSummarise}
                          disabled={isSummarising || !currentLesson.source_transcript}
                          className="text-xs font-bold px-3 py-1 border-2 border-[#1A1A1A] bg-[#F59E0B]/20 hand-drawn-border-pill hover:bg-[#F59E0B]/30 disabled:opacity-50 transition-colors flex items-center gap-1"
                        >
                          {isSummarising ? 'Summarising...' : 'Auto-Summarise'}
                        </button>
                      </div>
                    </div>
                    <textarea
                      className="w-full bg-transparent border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                      rows={4}
                      value={currentLesson.source_transcript || ''}
                      onChange={(e) =>
                        setCurrentLesson({ ...currentLesson, source_transcript: e.target.value })
                      }
                      placeholder="Transcript of the source audio..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t-2 border-[#1A1A1A]">
              <HandDrawnButton variant="outline" onClick={handleCloseModal}>
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
                variant="primary"
                onClick={handleSave}
                disabled={!currentLesson.title || saving}
              >
                {saving ? 'Saving…' : 'Save Lesson'}
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <HandDrawnCard className="w-full max-w-sm bg-white border-[#DC2626]" rotate="left">
            <h2 className="font-heading text-2xl font-bold mb-4 text-[#DC2626]">
              Are you sure?
            </h2>
            <p className="text-gray-600 mb-8">
              This will permanently delete the lesson. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <HandDrawnButton
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setLessonToDelete(null);
                }}
              >
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
                variant="primary"
                className="bg-[#DC2626] hover:bg-red-800"
                onClick={handleDelete}
              >
                Delete
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      )}
    </div>
  );
}

export default AdminLessonsPage;
