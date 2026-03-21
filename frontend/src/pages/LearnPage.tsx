import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppNavbar } from '../components/AppNavbar';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnButton } from '../components/HandDrawnButton';
import {
  SquigglyLine,
  BookDoodle,
  GlobeDoodle,
  SpeechBubble,
  MicrophoneDoodle,
} from '../components/DoodleDecorations';
import { ChevronRight, Loader2, BookOpen, MessageSquare, Mic } from 'lucide-react';

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : '';

// ---- Types ----

interface Language {
  id: string;
  name: string;
  enabled: boolean;
}

interface Course {
  id: string;
  language_id: string;
  title: string;
  description: string;
  sort_order: number;
}

interface Lesson {
  id: string;
  title: string;
  objective: string;
  teaching_prompt: string;
  sort_order: number;
  image_url?: string;
}

interface Topic {
  id: string;
  language_id: string;
  title: string;
  description: string;
  conversation_prompt: string;
  sort_order: number;
  image_url?: string;
}

interface CourseProgress {
  id: string; // course_id
  current_lesson_index: number;
  lessons_completed: number;
  total_time_seconds: number;
}

interface ProgressData {
  lessons_completed: number;
  total_time_seconds: number;
  total_conversations: number;
  sessions_by_mode: Record<string, number>;
  course_progress: CourseProgress[];
}

type Mode = 'lessons' | 'topics' | 'freestyle';

/** Simple flag lookup by language name. */
const FLAG_MAP: Record<string, string> = {
  spanish: '🇪🇸',
  french: '🇫🇷',
  japanese: '🇯🇵',
  german: '🇩🇪',
  italian: '🇮🇹',
  portuguese: '🇵🇹',
  chinese: '🇨🇳',
  korean: '🇰🇷',
  arabic: '🇸🇦',
  hindi: '🇮🇳',
  russian: '🇷🇺',
  english: '🇬🇧',
};
const getFlag = (name: string) => FLAG_MAP[name.toLowerCase()] ?? '🌍';

const MODE_TABS: { key: Mode; label: string; icon: React.ReactNode }[] = [
  { key: 'lessons', label: 'Lessons', icon: <BookOpen size={18} /> },
  { key: 'topics', label: 'Topics', icon: <MessageSquare size={18} /> },
  { key: 'freestyle', label: 'Freestyle', icon: <Mic size={18} /> },
];

export function LearnPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ---- Shared state ----
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('lessons');

  // ---- Lessons state ----
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  // ---- Topics state ----
  const [topics, setTopics] = useState<Topic[]>([]);

  const headers = { Authorization: `Bearer ${user?.token}` };

  // ---- Fetch languages + progress on mount ----
  const loadInitial = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [langRes, progRes] = await Promise.all([
        fetch(`${API_BASE}/api/languages/`, { headers }),
        fetch(`${API_BASE}/api/progress/`, { headers }),
      ]);
      if (!langRes.ok) throw new Error('Failed to load languages');
      const langs: Language[] = await langRes.json();
      setLanguages(langs);
      if (progRes.ok) setProgress(await progRes.json());
      if (langs.length > 0 && !selectedLangId) {
        setSelectedLangId(langs[0].id);
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  // ---- Fetch courses + topics when selected language changes ----
  useEffect(() => {
    if (!selectedLangId) return;
    let cancelled = false;
    (async () => {
      try {
        const [coursesRes, topicsRes] = await Promise.all([
          fetch(`${API_BASE}/api/courses/?language_id=${selectedLangId}`, { headers }),
          fetch(`${API_BASE}/api/topics/?language_id=${selectedLangId}`, { headers }),
        ]);
        if (!cancelled) {
          if (coursesRes.ok) {
            const data: Course[] = await coursesRes.json();
            setCourses(data);
            setSelectedCourseId(data.length > 0 ? data[0].id : null);
          } else {
            setCourses([]);
            setSelectedCourseId(null);
          }
          if (topicsRes.ok) {
            setTopics(await topicsRes.json());
          } else {
            setTopics([]);
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedLangId, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Fetch lessons when selected course changes ----
  useEffect(() => {
    if (!selectedCourseId) { setLessons([]); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/courses/${selectedCourseId}/lessons`,
          { headers },
        );
        if (!res.ok) throw new Error('Failed to load lessons');
        const data: Lesson[] = await res.json();
        if (!cancelled) setLessons(data);
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCourseId, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Derived helpers ----
  const courseProgress = (courseId: string): CourseProgress | undefined =>
    progress?.course_progress.find((cp) => cp.id === courseId);

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);
  const selectedLang = languages.find((l) => l.id === selectedLangId);

  const isLessonCompleted = (lessonIdx: number, courseId: string): boolean => {
    const cp = courseProgress(courseId);
    return cp ? lessonIdx < cp.lessons_completed : false;
  };

  // ---- Render ----
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center">
          <HandDrawnCard className="max-w-md text-center">
            <p className="text-[#DC2626] font-bold mb-4">{error}</p>
            <HandDrawnButton variant="primary" onClick={loadInitial}>
              Retry
            </HandDrawnButton>
          </HandDrawnCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
      <AppNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative">
        {/* Decorative elements */}
        <BookDoodle className="absolute top-20 right-10 w-24 h-24 text-[#F59E0B] opacity-30 rotate-12 hidden lg:block" />
        <GlobeDoodle className="absolute bottom-40 left-10 w-32 h-32 text-[#DC2626] opacity-20 -rotate-12 hidden lg:block" />

        {/* ---- Language selector ---- */}
        <div className="mb-10">
          <div className="inline-block relative mb-8">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1A1A1A]">
              Learn
            </h1>
            <SquigglyLine className="absolute -bottom-3 left-0 w-full h-3 text-[#DC2626]" />
          </div>

          {languages.length === 0 ? (
            <p className="text-gray-500">No languages available yet. Ask an admin to add some!</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {languages.map((lang) => {
                const isSelected = selectedLangId === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLangId(lang.id)}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 border-2 border-[#1A1A1A]
                      hand-drawn-border-alt font-medium transition-colors
                      ${isSelected
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white text-[#1A1A1A] hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-xl">{getFlag(lang.name)}</span>
                    {lang.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ---- Mode tabs ---- */}
        {selectedLang && (
          <>
            <div className="flex gap-2 mb-10 border-b-2 border-[#1A1A1A]/10 pb-1">
              {MODE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setMode(tab.key)}
                  className={`
                    flex items-center gap-2 px-5 py-3 font-heading text-lg font-bold
                    border-b-3 transition-colors -mb-[3px]
                    ${mode === tab.key
                      ? 'border-[#DC2626] text-[#1A1A1A]'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ---- LESSONS TAB ---- */}
            {mode === 'lessons' && (
              <div>
                {/* Course selector */}
                {courses.length > 1 && (
                  <div className="mb-8 flex flex-wrap gap-3">
                    {courses.map((course) => (
                      <HandDrawnButton
                        key={course.id}
                        variant={course.id === selectedCourseId ? 'primary' : 'outline'}
                        onClick={() => setSelectedCourseId(course.id)}
                      >
                        {course.title}
                      </HandDrawnButton>
                    ))}
                  </div>
                )}

                {selectedCourse ? (
                  <>
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h2 className="font-heading text-3xl font-bold text-[#1A1A1A]">
                          {selectedCourse.title}
                        </h2>
                        {selectedCourse.description && (
                          <p className="text-gray-600 mt-1">{selectedCourse.description}</p>
                        )}
                      </div>
                      {courses.length > 1 && (
                        <div className="flex gap-2">
                          {courses.map((c) => (
                            <span
                              key={c.id}
                              className={`w-3 h-3 rounded-full ${
                                c.id === selectedCourseId ? 'bg-[#1A1A1A]' : 'bg-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {lessons.length === 0 ? (
                      <p className="text-gray-500">No lessons in this course yet.</p>
                    ) : (
                      <div className="space-y-4">
                        {lessons.map((lesson, idx) => {
                          const completed = isLessonCompleted(idx, selectedCourse.id);
                          return (
                            <HandDrawnCard
                              key={lesson.id}
                              rotate={
                                idx % 3 === 0 ? 'left' : idx % 2 === 0 ? 'right' : 'none'
                              }
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                                completed ? 'opacity-75 bg-gray-50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-4">
                                <div
                                  className={`w-10 h-10 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center font-bold shrink-0 ${
                                    completed
                                      ? 'bg-[#1A1A1A] text-white'
                                      : 'bg-white'
                                  }`}
                                >
                                  {completed ? '✓' : idx + 1}
                                </div>
                                {lesson.image_url && (
                                  <img 
                                    src={`${API_BASE}${lesson.image_url}`} 
                                    alt={lesson.title} 
                                    className="w-16 h-16 object-cover rounded-md border-2 border-[#1A1A1A] hand-drawn-border shrink-0"
                                  />
                                )}
                                <div>
                                  <h3 className="font-heading text-xl font-bold mb-1">
                                    {lesson.title}
                                  </h3>
                                  <p className="text-gray-600">{lesson.objective}</p>
                                </div>
                              </div>

                              <HandDrawnButton
                                variant={completed ? 'outline' : 'primary'}
                                className="sm:w-auto w-full shrink-0"
                                onClick={() =>
                                  navigate(
                                    `/learn/session/${selectedCourse.id}/${lesson.id}`,
                                  )
                                }
                              >
                                {completed ? 'Review' : 'Start'}
                                {!completed && <ChevronRight size={18} />}
                              </HandDrawnButton>
                            </HandDrawnCard>
                          );
                        })}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">No courses available for this language yet.</p>
                )}
              </div>
            )}

            {/* ---- TOPICS TAB ---- */}
            {mode === 'topics' && (
              <div>
                <div className="text-center mb-10 relative">
                  <SpeechBubble className="absolute -top-4 right-0 w-20 h-20 text-[#DC2626] opacity-15 rotate-12 hidden md:block" />
                  <h2 className="font-heading text-3xl font-bold text-[#1A1A1A] mb-2">
                    Pick a Topic
                  </h2>
                  <p className="text-gray-600 max-w-xl mx-auto">
                    Choose a conversation topic to practice {selectedLang.name} with your AI coach.
                  </p>
                </div>

                {topics.length === 0 ? (
                  <p className="text-gray-500 text-center">No topics available for {selectedLang.name} yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {topics.map((topic, idx) => (
                      <HandDrawnCard
                        key={topic.id}
                        rotate={idx % 2 === 0 ? 'left' : 'right'}
                        className="flex flex-col h-full"
                      >
                        {topic.image_url && (
                          <div className="w-full h-32 mb-4 border-2 border-[#1A1A1A] hand-drawn-border overflow-hidden rounded-md shrink-0">
                            <img
                              src={`${API_BASE}${topic.image_url}`}
                              alt={topic.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <h3 className="font-heading text-xl font-bold mb-2">
                          {topic.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-6 flex-1">
                          {topic.description}
                        </p>
                        <HandDrawnButton
                          variant="outline"
                          className="w-full mt-auto"
                          onClick={() => navigate(`/topics/${topic.id}`)}
                        >
                          Start <ChevronRight size={18} />
                        </HandDrawnButton>
                      </HandDrawnCard>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ---- FREESTYLE TAB ---- */}
            {mode === 'freestyle' && (
              <div className="max-w-2xl mx-auto">
                <HandDrawnCard rotate="none" className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#DC2626]/10 border-2 border-[#1A1A1A] flex items-center justify-center hand-drawn-border">
                    <MicrophoneDoodle className="w-10 h-10 text-[#DC2626]" />
                  </div>
                  <h2 className="font-heading text-3xl font-bold text-[#1A1A1A] mb-3">
                    Free Conversation
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Have an open-ended conversation in {selectedLang.name} about
                    anything you like. Your AI coach will guide you and help correct
                    mistakes along the way.
                  </p>
                  <HandDrawnButton
                    variant="primary"
                    className="text-lg px-8 py-3"
                    onClick={() => navigate('/freestyle')}
                  >
                    Start Talking <Mic size={20} />
                  </HandDrawnButton>
                </HandDrawnCard>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default LearnPage;
