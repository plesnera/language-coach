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
}

interface LibraryImage {
  id: string;
  filename: string;
  url: string;
  original_name: string;
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
    loadImageLibrary();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLesson({});
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await fetch(
        `${API_BASE}/api/admin/courses/${courseId}/lessons/${id}`,
        { method: 'DELETE', headers },
      );
      await loadLessons();
    } catch (err) {
      console.error('Failed to delete lesson', err);
    }
  };

  const moveLesson = async (index: number, direction: 'up' | 'down') => {
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= lessons.length) return;
    const newLessons = [...lessons];
    [newLessons[swapIdx], newLessons[index]] = [newLessons[index], newLessons[swapIdx]];
    setLessons(newLessons);
    // Persist new order
    try {
      await fetch(
        `${API_BASE}/api/admin/courses/${courseId}/lessons/reorder`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ lesson_ids: newLessons.map((l) => l.id) }),
        },
      );
    } catch (err) {
      console.error('Failed to reorder', err);
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
                  disabled={idx === 0}
                  className="p-1 text-gray-400 hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
                >
                  <ArrowUp size={18} />
                </button>
                <button
                  onClick={() => moveLesson(idx, 'down')}
                  disabled={idx === lessons.length - 1}
                  className="p-1 text-gray-400 hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors"
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
                onClick={() => handleDelete(lesson.id)}
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
    </div>
  );
}

export default AdminLessonsPage;
