import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppNavbar } from '../components/AppNavbar';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnButton } from '../components/HandDrawnButton';
import {
  SquigglyLine,
  BookDoodle,
  GlobeDoodle,
} from '../components/DoodleDecorations';
import { CheckCircle2, ChevronRight, Loader2, Lock, Mic, Wifi } from 'lucide-react';

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
const LEARN_PREVIEW_LESSONS = [
  {
    title: 'Greetings in context',
    objective: 'Practice a natural hello + follow-up exchange with an AI language coach.',
  },
  {
    title: 'Ordering at a café',
    objective: 'Learn high-frequency phrases through a realistic dialogue scenario.',
  },
  {
    title: 'Asking for directions',
    objective: 'Build confidence with guided turn-by-turn conversation practice.',
  },
];

function LearnGuestPreview() {
  const nextTarget = encodeURIComponent('/learn');
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
      <AppNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative">
        <BookDoodle className="absolute top-20 right-10 w-24 h-24 text-[#F59E0B] opacity-30 rotate-12 hidden lg:block" />
        <GlobeDoodle className="absolute bottom-40 left-10 w-32 h-32 text-[#DC2626] opacity-20 -rotate-12 hidden lg:block" />

        <div className="mb-10">
          <div className="inline-block relative mb-5">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1A1A1A]">
              Learn
            </h1>
            <SquigglyLine className="absolute -bottom-3 left-0 w-full h-3 text-[#DC2626]" />
          </div>
          <p className="text-gray-700 max-w-3xl">
            Try a preview of dialogue-based lessons. You will practice real
            conversations with a specialized AI coach in your target language.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <HandDrawnCard dashed className="bg-[#F59E0B]/10">
            <h2 className="font-heading text-2xl font-bold mb-3">How it works</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#1A1A1A]" aria-hidden="true" />
                Dialogue-based lessons with a specialized AI coach in the language you are learning.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#1A1A1A]" aria-hidden="true" />
                Real-time speaking practice with corrective guidance and better phrase suggestions.
              </li>
            </ul>
          </HandDrawnCard>

          <HandDrawnCard rotate="right">
            <h2 className="font-heading text-2xl font-bold mb-3">Requirements</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Mic size={18} className="mt-0.5 shrink-0 text-[#1A1A1A]" aria-hidden="true" />
                Audio-enabled browser with microphone access.
              </li>
              <li className="flex items-start gap-2">
                <Wifi size={18} className="mt-0.5 shrink-0 text-[#1A1A1A]" aria-hidden="true" />
                Stable internet access for live conversation sessions.
              </li>
            </ul>
          </HandDrawnCard>
        </div>

        <HandDrawnCard rotate="none">
          <h2 className="font-heading text-2xl font-bold mb-3">Preview curriculum</h2>
          <p className="text-gray-600 mb-5">
            Create a free account to unlock these interactive lessons and save your progress.
          </p>
          <div className="space-y-3">
            {LEARN_PREVIEW_LESSONS.map((lesson, index) => (
              <div
                key={lesson.title}
                className="border-2 border-[#1A1A1A] hand-drawn-border-alt bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold">{lesson.title}</h3>
                    <p className="text-gray-600">{lesson.objective}</p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                  <Lock size={16} aria-hidden="true" />
                  Account required
                </span>
              </div>
            ))}
          </div>
        </HandDrawnCard>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link to={`/intro?next=${nextTarget}`} className="w-full sm:w-auto">
            <HandDrawnButton className="w-full sm:w-auto" variant="secondary">
              Try guest intro
            </HandDrawnButton>
          </Link>
          <Link to={`/signup?next=${nextTarget}`} className="w-full sm:w-auto">
            <HandDrawnButton className="w-full sm:w-auto" variant="primary">
              Create free account
            </HandDrawnButton>
          </Link>
          <Link to={`/login?next=${nextTarget}`} className="w-full sm:w-auto">
            <HandDrawnButton className="w-full sm:w-auto" variant="outline">
              Log In
            </HandDrawnButton>
          </Link>
        </div>
      </main>
    </div>
  );
}

export function LearnPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user;

  // ---- Shared state ----
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const headers = { Authorization: `Bearer ${user?.token}` };

  // ---- Fetch languages + progress on mount ----
  const loadInitial = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      setError(null);
      return;
    }
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

  // ---- Fetch courses when selected language changes ----
  useEffect(() => {
    if (!selectedLangId) return;
    let cancelled = false;
    (async () => {
      try {
        const coursesRes = await fetch(
          `${API_BASE}/api/courses/?language_id=${selectedLangId}`,
          { headers },
        );
        if (!cancelled) {
          if (coursesRes.ok) {
            const data: Course[] = await coursesRes.json();
            setCourses(data);
            setSelectedCourseId(data.length > 0 ? data[0].id : null);
          } else {
            setCourses([]);
            setSelectedCourseId(null);
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
  if (isGuest) {
    return <LearnGuestPreview />;
  }
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

        {selectedLang && (
          <div>
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
      </main>
    </div>
  );
}

export default LearnPage;
