import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Wand2,
  Mic } from
'lucide-react';
import { HandDrawnButton } from '../../components/HandDrawnButton';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { HandDrawnInput } from '../../components/HandDrawnInput';
interface Lesson {
  id: string;
  title: string;
  objective: string;
  teaching_prompt: string;
  source_audio_ref: string;
  source_transcript: string;
}
const initialLessons: Lesson[] = [
{
  id: '1',
  title: 'Greetings & Introductions',
  objective: 'Learn basic hellos',
  teaching_prompt: 'Act as a friendly local...',
  source_audio_ref: 'audio_123.mp3',
  source_transcript: 'Hola, ¿cómo estás?'
},
{
  id: '2',
  title: 'At the Market',
  objective: 'Buy fruits and vegetables',
  teaching_prompt: 'Act as a market vendor...',
  source_audio_ref: '',
  source_transcript: ''
},
{
  id: '3',
  title: 'Asking for Directions',
  objective: 'Navigate the city',
  teaching_prompt: 'Act as a helpful stranger...',
  source_audio_ref: '',
  source_transcript: ''
}];

export function AdminLessonsPage() {
  const { courseId } = useParams();
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLesson, setCurrentLesson] = useState<Partial<Lesson>>({});
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSummarising, setIsSummarising] = useState(false);
  const handleOpenModal = (lesson?: Lesson) => {
    if (lesson) {
      setCurrentLesson(lesson);
    } else {
      setCurrentLesson({});
    }
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentLesson({});
  };
  const handleSave = () => {
    if (currentLesson.id) {
      setLessons(
        lessons.map((l) =>
        l.id === currentLesson.id ?
        {
          ...l,
          ...currentLesson
        } as Lesson :
        l
        )
      );
    } else {
      const newLesson: Lesson = {
        ...currentLesson,
        id: Math.random().toString(36).substr(2, 9)
      } as Lesson;
      setLessons([...lessons, newLesson]);
    }
    handleCloseModal();
  };
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this lesson?')) {
      setLessons(lessons.filter((l) => l.id !== id));
    }
  };
  const moveLesson = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newLessons = [...lessons];
      [newLessons[index - 1], newLessons[index]] = [
      newLessons[index],
      newLessons[index - 1]];

      setLessons(newLessons);
    } else if (direction === 'down' && index < lessons.length - 1) {
      const newLessons = [...lessons];
      [newLessons[index + 1], newLessons[index]] = [
      newLessons[index],
      newLessons[index + 1]];

      setLessons(newLessons);
    }
  };
  const handleTranscribe = async () => {
    if (!currentLesson.source_audio_ref) return;
    
    setIsTranscribing(true);
    try {
      // In a real implementation, this would call the backend API
      // For now, we'll use the mock to show the concept
      const mockTranscript = `Transcribed: This is a mock transcription of ${currentLesson.source_audio_ref}`;
      setCurrentLesson((prev) => ({
        ...prev,
        source_transcript: mockTranscript
      }));
    } catch (error) {
      console.error('Transcription failed:', error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSummarise = async () => {
    if (!currentLesson.source_transcript) return;
    
    setIsSummarising(true);
    try {
      // In a real implementation, this would call the backend AI summarization
      const mockSummary = `Summarized objective based on transcript: Practice ${currentLesson.title || 'the lesson'}`;
      setCurrentLesson((prev) => ({
        ...prev,
        objective: mockSummary
      }));
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setIsSummarising(false);
    }
  };
  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-gray-500 mb-6 font-medium">
        <Link
          to="/admin/courses"
          className="hover:text-[#1A1A1A] transition-colors">

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
          className="shrink-0">

          <Plus size={18} /> Add Lesson
        </HandDrawnButton>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson, idx) =>
        <HandDrawnCard
          key={lesson.id}
          rotate="none"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">

            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col gap-1">
                <button
                onClick={() => moveLesson(idx, 'up')}
                disabled={idx === 0}
                className="p-1 text-gray-400 hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors">

                  <ArrowUp size={18} />
                </button>
                <button
                onClick={() => moveLesson(idx, 'down')}
                disabled={idx === lessons.length - 1}
                className="p-1 text-gray-400 hover:text-[#1A1A1A] disabled:opacity-30 disabled:hover:text-gray-400 transition-colors">

                  <ArrowDown size={18} />
                </button>
              </div>

              <div className="w-10 h-10 rounded-full border-2 border-[#1A1A1A] bg-[#FAFAF8] flex items-center justify-center font-bold shrink-0 hand-drawn-border">
                {idx + 1}
              </div>

              <div>
                <h3 className="font-heading text-xl font-bold">
                  {lesson.title}
                </h3>
                <p className="text-gray-600 text-sm">{lesson.objective}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <HandDrawnButton
              variant="outline"
              onClick={() => handleOpenModal(lesson)}
              className="px-3 py-2">

                <Edit2 size={16} />
              </HandDrawnButton>
              <HandDrawnButton
              variant="outline"
              onClick={() => handleDelete(lesson.id)}
              className="px-3 py-2 text-[#DC2626] hover:bg-red-50 border-transparent hover:border-[#DC2626]">

                <Trash2 size={16} />
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        )}
        {lessons.length === 0 &&
        <div className="text-center p-12 border-2 border-dashed border-gray-300 hand-drawn-border text-gray-500">
            No lessons yet. Click "Add Lesson" to create one.
          </div>
        }
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <HandDrawnCard
          className="w-full max-w-2xl bg-white my-8"
          rotate="none">

            <h2 className="font-heading text-2xl font-bold mb-6">
              {currentLesson.id ? 'Edit Lesson' : 'Create New Lesson'}
            </h2>

            <div className="space-y-6">
              <HandDrawnInput
              label="Lesson Title"
              value={currentLesson.title || ''}
              onChange={(e) =>
              setCurrentLesson({
                ...currentLesson,
                title: e.target.value
              })
              }
              placeholder="e.g., Ordering Coffee" />


              <HandDrawnInput
              label="Learning Objective"
              value={currentLesson.objective || ''}
              onChange={(e) =>
              setCurrentLesson({
                ...currentLesson,
                objective: e.target.value
              })
              }
              placeholder="What will the user learn?" />


              <div className="border-t-2 border-dashed border-gray-200 pt-6">
                <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <Wand2 size={20} className="text-[#F59E0B]" /> AI Coach
                  Configuration
                </h3>

                <HandDrawnInput
                label="Teaching Prompt (System Prompt)"
                multiline
                rows={4}
                value={currentLesson.teaching_prompt || ''}
                onChange={(e) =>
                setCurrentLesson({
                  ...currentLesson,
                  teaching_prompt: e.target.value
                })
                }
                placeholder="Instructions for the AI coach..."
                className="font-mono text-sm" />

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
                  setCurrentLesson({
                    ...currentLesson,
                    source_audio_ref: e.target.value
                  })
                  }
                  placeholder="s3://... or audio ID" />


                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-end">
                      <label className="font-heading font-bold text-[#1A1A1A] text-lg">
                        Source Transcript
                      </label>
                      <div className="flex gap-2">
                        <button
                        type="button"
                        onClick={handleTranscribe}
                        disabled={
                        isTranscribing || !currentLesson.source_audio_ref
                        }
                        className="text-xs font-bold px-3 py-1 border-2 border-[#1A1A1A] hand-drawn-border-pill hover:bg-gray-100 disabled:opacity-50 transition-colors flex items-center gap-1">

                          {isTranscribing ?
                        'Transcribing...' :
                        'Transcribe Audio'}
                        </button>
                        <button
                        type="button"
                        onClick={handleSummarise}
                        disabled={
                        isSummarising || !currentLesson.source_transcript
                        }
                        className="text-xs font-bold px-3 py-1 border-2 border-[#1A1A1A] bg-[#F59E0B]/20 hand-drawn-border-pill hover:bg-[#F59E0B]/30 disabled:opacity-50 transition-colors flex items-center gap-1">

                          {isSummarising ? 'Summarising...' : 'Auto-Summarise'}
                        </button>
                      </div>
                    </div>
                    <textarea
                    className="w-full bg-transparent border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                    rows={4}
                    value={currentLesson.source_transcript || ''}
                    onChange={(e) =>
                    setCurrentLesson({
                      ...currentLesson,
                      source_transcript: e.target.value
                    })
                    }
                    placeholder="Transcript of the source audio..." />

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
              disabled={!currentLesson.title}>

                Save Lesson
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      }
    </div>);

}