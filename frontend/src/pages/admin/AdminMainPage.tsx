import React, { useEffect, useMemo, useState } from 'react';
import { Globe2, Loader2, MessageSquare, Plus, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { HandDrawnButton } from '../../components/HandDrawnButton';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { HandDrawnInput } from '../../components/HandDrawnInput';
import { SquigglyLine } from '../../components/DoodleDecorations';
import { API_BASE } from '../../config/endpoints';

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
}

interface Topic {
  id: string;
  language_id: string;
  title: string;
  description: string;
  conversation_prompt: string;
  sort_order: number;
}

interface LessonListItem extends Lesson {
  course_id: string;
  course_title: string;
  course_sort_order: number;
}

interface LanguageDraft {
  id: string;
  name: string;
  enabled: boolean;
}

interface LessonDraft {
  title: string;
  objective: string;
  teaching_prompt: string;
  course_id: string;
}

interface TopicDraft {
  title: string;
  description: string;
  conversation_prompt: string;
}

const sortLanguages = (items: Language[]) =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

const sortCourses = (items: Course[]) =>
  [...items].sort(
    (a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title),
  );

const sortTopics = (items: Topic[]) =>
  [...items].sort(
    (a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title),
  );

const sortLessons = (items: LessonListItem[]) =>
  [...items].sort(
    (a, b) =>
      a.course_sort_order - b.course_sort_order ||
      a.sort_order - b.sort_order ||
      a.title.localeCompare(b.title),
  );

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === 'string' && data.detail.trim()) {
      return data.detail;
    }
  } catch {
    // no-op
  }
  return fallback;
};

export function AdminMainPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${user?.token ?? ''}`,
      'Content-Type': 'application/json',
    }),
    [user?.token],
  );

  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [loadingContext, setLoadingContext] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);

  const [languageDraft, setLanguageDraft] = useState<LanguageDraft>({
    id: '',
    name: '',
    enabled: true,
  });
  const [lessonDraft, setLessonDraft] = useState<LessonDraft>({
    title: '',
    objective: '',
    teaching_prompt: '',
    course_id: '',
  });
  const [topicDraft, setTopicDraft] = useState<TopicDraft>({
    title: '',
    description: '',
    conversation_prompt: '',
  });

  const [languageError, setLanguageError] = useState<string | null>(null);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [topicError, setTopicError] = useState<string | null>(null);
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [savingTopic, setSavingTopic] = useState(false);

  const selectedLanguage = useMemo(
    () => languages.find((language) => language.id === selectedLangId) ?? null,
    [languages, selectedLangId],
  );

  useEffect(() => {
    if (!user?.token) return;
    const controller = new AbortController();

    const loadLanguages = async () => {
      setLoadingLanguages(true);
      setPageError(null);
      try {
        const response = await fetch(`${API_BASE}/api/admin/languages`, {
          headers,
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, 'Failed to load languages.'));
        }
        const data = sortLanguages((await response.json()) as Language[]);
        if (controller.signal.aborted) return;
        setLanguages(data);
        setSelectedLangId((current) => {
          if (current && data.some((language) => language.id === current)) {
            return current;
          }
          return data[0]?.id ?? null;
        });
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setPageError((error as Error).message || 'Failed to load languages.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingLanguages(false);
        }
      }
    };

    loadLanguages();
    return () => controller.abort();
  }, [headers, user?.token]);

  useEffect(() => {
    if (!user?.token || !selectedLangId) {
      setCourses([]);
      setLessons([]);
      setTopics([]);
      return;
    }

    const controller = new AbortController();

    const loadLanguageContext = async () => {
      setLoadingContext(true);
      setPageError(null);
      try {
        const [coursesResponse, topicsResponse] = await Promise.all([
          fetch(`${API_BASE}/api/admin/courses?language_id=${selectedLangId}`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE}/api/admin/topics?language_id=${selectedLangId}`, {
            headers,
            signal: controller.signal,
          }),
        ]);

        if (!coursesResponse.ok) {
          throw new Error(await getErrorMessage(coursesResponse, 'Failed to load lessons.'));
        }
        if (!topicsResponse.ok) {
          throw new Error(await getErrorMessage(topicsResponse, 'Failed to load topics.'));
        }

        const languageCourses = sortCourses((await coursesResponse.json()) as Course[]);
        const languageTopics = sortTopics((await topicsResponse.json()) as Topic[]);

        const lessonRows = await Promise.all(
          languageCourses.map(async (course) => {
            const response = await fetch(
              `${API_BASE}/api/admin/courses/${course.id}/lessons`,
              { headers, signal: controller.signal },
            );
            if (!response.ok) {
              throw new Error('Failed to load lessons.');
            }
            const courseLessons = (await response.json()) as Lesson[];
            return courseLessons.map<LessonListItem>((lesson) => ({
              ...lesson,
              course_id: course.id,
              course_title: course.title,
              course_sort_order: course.sort_order,
            }));
          }),
        );

        if (controller.signal.aborted) return;
        setCourses(languageCourses);
        setTopics(languageTopics);
        setLessons(sortLessons(lessonRows.flat()));
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
        setPageError((error as Error).message || 'Failed to load language content.');
      } finally {
        if (!controller.signal.aborted) {
          setLoadingContext(false);
        }
      }
    };

    loadLanguageContext();
    return () => controller.abort();
  }, [headers, selectedLangId, user?.token]);

  const openLanguageModal = () => {
    setLanguageError(null);
    setLanguageDraft({ id: '', name: '', enabled: true });
    setIsLanguageModalOpen(true);
  };

  const openLessonModal = () => {
    setLessonError(null);
    setLessonDraft({
      title: '',
      objective: '',
      teaching_prompt: '',
      course_id: courses[0]?.id ?? '',
    });
    setIsLessonModalOpen(true);
  };

  const openTopicModal = () => {
    setTopicError(null);
    setTopicDraft({ title: '', description: '', conversation_prompt: '' });
    setIsTopicModalOpen(true);
  };

  const handleCreateLanguage = async () => {
    const id = languageDraft.id.trim();
    const name = languageDraft.name.trim();
    if (!id || !name) {
      setLanguageError('Language ID and name are required.');
      return;
    }

    setSavingLanguage(true);
    setLanguageError(null);
    try {
      const response = await fetch(`${API_BASE}/api/admin/languages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id,
          name,
          enabled: languageDraft.enabled,
        }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to create language.'));
      }
      const createdLanguage = (await response.json()) as Language;
      setLanguages((current) => sortLanguages([...current, createdLanguage]));
      setSelectedLangId(createdLanguage.id);
      setIsLanguageModalOpen(false);
    } catch (error) {
      setLanguageError((error as Error).message || 'Failed to create language.');
    } finally {
      setSavingLanguage(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!selectedLangId) {
      setLessonError('Select a language first.');
      return;
    }
    const title = lessonDraft.title.trim();
    if (!title) {
      setLessonError('Lesson title is required.');
      return;
    }

    setSavingLesson(true);
    setLessonError(null);
    try {
      let targetCourseId = lessonDraft.course_id;
      let nextCourses = courses;

      if (!targetCourseId) {
        const defaultCourseTitle = `${selectedLanguage?.name ?? selectedLangId} Core Lessons`;
        const createCourseResponse = await fetch(`${API_BASE}/api/admin/courses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            language_id: selectedLangId,
            title: defaultCourseTitle,
            description: 'Auto-created to store lessons from the admin main page.',
            sort_order: courses.length,
          }),
        });
        if (!createCourseResponse.ok) {
          throw new Error(await getErrorMessage(createCourseResponse, 'Failed to create course.'));
        }
        const createdCourse = (await createCourseResponse.json()) as Course;
        nextCourses = sortCourses([...courses, createdCourse]);
        targetCourseId = createdCourse.id;
        setCourses(nextCourses);
      }

      const targetCourse = nextCourses.find((course) => course.id === targetCourseId);
      if (!targetCourse) {
        throw new Error('No valid course selected for this lesson.');
      }

      const sortOrder = lessons.filter((lesson) => lesson.course_id === targetCourseId).length;
      const createLessonResponse = await fetch(
        `${API_BASE}/api/admin/courses/${targetCourseId}/lessons`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            title,
            objective: lessonDraft.objective.trim(),
            teaching_prompt: lessonDraft.teaching_prompt.trim(),
            sort_order: sortOrder,
          }),
        },
      );
      if (!createLessonResponse.ok) {
        throw new Error(await getErrorMessage(createLessonResponse, 'Failed to create lesson.'));
      }

      const createdLesson = (await createLessonResponse.json()) as Lesson;
      const lessonRow: LessonListItem = {
        ...createdLesson,
        course_id: targetCourse.id,
        course_title: targetCourse.title,
        course_sort_order: targetCourse.sort_order,
      };
      setLessons((current) => sortLessons([...current, lessonRow]));
      setIsLessonModalOpen(false);
    } catch (error) {
      setLessonError((error as Error).message || 'Failed to create lesson.');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!selectedLangId) {
      setTopicError('Select a language first.');
      return;
    }
    const title = topicDraft.title.trim();
    if (!title) {
      setTopicError('Topic title is required.');
      return;
    }

    setSavingTopic(true);
    setTopicError(null);
    try {
      const response = await fetch(`${API_BASE}/api/admin/topics`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          language_id: selectedLangId,
          title,
          description: topicDraft.description.trim(),
          conversation_prompt: topicDraft.conversation_prompt.trim(),
          sort_order: topics.length,
        }),
      });
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Failed to create topic.'));
      }

      const createdTopic = (await response.json()) as Topic;
      setTopics((current) => sortTopics([...current, createdTopic]));
      setIsTopicModalOpen(false);
    } catch (error) {
      setTopicError((error as Error).message || 'Failed to create topic.');
    } finally {
      setSavingTopic(false);
    }
  };

  if (loadingLanguages) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="relative inline-block">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            Admin Main
          </h1>
          <SquigglyLine className="absolute -bottom-2 left-0 w-full h-2 text-[#DC2626]" />
        </div>
        <p className="mt-4 text-gray-600">
          Select a language to manage its lessons and topics.
        </p>
        {selectedLanguage && (
          <p className="mt-2 text-sm font-semibold text-[#1A1A1A]">
            Active language: {selectedLanguage.name}
          </p>
        )}
      </div>

      {pageError && (
        <div className="mb-6 text-sm font-medium text-[#DC2626] border-2 border-[#DC2626] bg-red-50 hand-drawn-border-alt px-4 py-3">
          {pageError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <HandDrawnCard rotate="none" className="p-0 overflow-hidden">
          <div className="p-4 border-b-2 border-[#1A1A1A] bg-[#FAFAF8] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Globe2 size={18} className="text-[#DC2626]" />
              <h2 className="font-heading text-xl font-bold">Languages</h2>
            </div>
            <HandDrawnButton
              variant="outline"
              className="px-3 py-1.5 text-sm"
              onClick={openLanguageModal}
            >
              <Plus size={16} /> Add
            </HandDrawnButton>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {languages.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No languages yet.</p>
            ) : (
              languages.map((language) => {
                const selected = language.id === selectedLangId;
                return (
                  <button
                    key={language.id}
                    className={`w-full text-left px-4 py-3 border-b-2 border-[#1A1A1A] last:border-b-0 transition-colors ${
                      selected
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white hover:bg-gray-50 text-[#1A1A1A]'
                    }`}
                    onClick={() => {
                      navigate(`/admin/languages/${language.id}`);
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{language.name}</span>
                      <span className="text-xs font-mono opacity-80">{language.id}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </HandDrawnCard>

        <HandDrawnCard rotate="none" className="p-0 overflow-hidden">
          <div className="p-4 border-b-2 border-[#1A1A1A] bg-[#FAFAF8] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-[#F59E0B]" />
              <h2 className="font-heading text-xl font-bold">Lessons</h2>
            </div>
            <HandDrawnButton
              variant="outline"
              className="px-3 py-1.5 text-sm"
              onClick={openLessonModal}
              disabled={!selectedLangId}
            >
              <Plus size={16} /> Add
            </HandDrawnButton>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loadingContext ? (
              <div className="p-4 flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Loading lessons...
              </div>
            ) : lessons.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">
                No lessons for this language yet.
              </p>
            ) : (
              lessons.map((lesson) => (
                <button
                  key={lesson.id}
                  className="w-full text-left px-4 py-3 border-b-2 border-[#1A1A1A] last:border-b-0 hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    navigate(
                      `/admin/courses/${lesson.course_id}/lessons?edit=${encodeURIComponent(lesson.id)}`,
                    )
                  }
                >
                  <p className="font-semibold text-[#1A1A1A]">{lesson.title}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{lesson.objective}</p>
                  <p className="text-xs mt-2 inline-block px-2 py-1 border-2 border-[#1A1A1A] hand-drawn-border-pill bg-white">
                    {lesson.course_title}
                  </p>
                </button>
              ))
            )}
          </div>
        </HandDrawnCard>

        <HandDrawnCard rotate="none" className="p-0 overflow-hidden">
          <div className="p-4 border-b-2 border-[#1A1A1A] bg-[#FAFAF8] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare size={18} className="text-[#F59E0B]" />
              <h2 className="font-heading text-xl font-bold">Topics</h2>
            </div>
            <HandDrawnButton
              variant="outline"
              className="px-3 py-1.5 text-sm"
              onClick={openTopicModal}
              disabled={!selectedLangId}
            >
              <Plus size={16} /> Add
            </HandDrawnButton>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {loadingContext ? (
              <div className="p-4 flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 size={16} className="animate-spin" />
                Loading topics...
              </div>
            ) : topics.length === 0 ? (
              <p className="p-4 text-sm text-gray-500">No topics for this language yet.</p>
            ) : (
              topics.map((topic) => (
                <button
                  key={topic.id}
                  className="w-full text-left px-4 py-3 border-b-2 border-[#1A1A1A] last:border-b-0 hover:bg-gray-50 transition-colors"
                  onClick={() =>
                    navigate(
                      `/admin/topics?language_id=${encodeURIComponent(topic.language_id)}&edit=${encodeURIComponent(topic.id)}`,
                    )
                  }
                >
                  <p className="font-semibold text-[#1A1A1A]">{topic.title}</p>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{topic.description}</p>
                </button>
              ))
            )}
          </div>
        </HandDrawnCard>
      </div>

      {isLanguageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <HandDrawnCard className="w-full max-w-lg bg-white" rotate="none">
            <h2 className="font-heading text-2xl font-bold mb-6">Add Language</h2>
            <div className="space-y-4">
              <HandDrawnInput
                label="Language ID"
                value={languageDraft.id}
                onChange={(event) =>
                  setLanguageDraft((current) => ({
                    ...current,
                    id: event.target.value,
                  }))
                }
                placeholder="e.g., es"
              />
              <HandDrawnInput
                label="Language Name"
                value={languageDraft.name}
                onChange={(event) =>
                  setLanguageDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g., Spanish"
              />
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={languageDraft.enabled}
                  onChange={(event) =>
                    setLanguageDraft((current) => ({
                      ...current,
                      enabled: event.target.checked,
                    }))
                  }
                />
                Enabled
              </label>
              {languageError && (
                <p className="text-sm font-medium text-[#DC2626]">{languageError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <HandDrawnButton
                variant="outline"
                onClick={() => setIsLanguageModalOpen(false)}
              >
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
                variant="primary"
                onClick={handleCreateLanguage}
                disabled={savingLanguage}
              >
                {savingLanguage ? 'Saving…' : 'Save Language'}
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <HandDrawnCard className="w-full max-w-xl bg-white my-8" rotate="none">
            <h2 className="font-heading text-2xl font-bold mb-6">Add Lesson</h2>
            <div className="space-y-4">
              {courses.length > 0 ? (
                <div className="flex flex-col gap-2">
                  <label className="font-heading font-bold text-[#1A1A1A] text-lg">
                    Course
                  </label>
                  <select
                    className="w-full bg-transparent border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                    value={lessonDraft.course_id}
                    onChange={(event) =>
                      setLessonDraft((current) => ({
                        ...current,
                        course_id: event.target.value,
                      }))
                    }
                  >
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.title}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  No courses exist for this language yet. Saving this lesson will create a
                  default course automatically.
                </p>
              )}

              <HandDrawnInput
                label="Lesson Title"
                value={lessonDraft.title}
                onChange={(event) =>
                  setLessonDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g., Greetings and Introductions"
              />
              <HandDrawnInput
                label="Learning Objective"
                multiline
                rows={2}
                value={lessonDraft.objective}
                onChange={(event) =>
                  setLessonDraft((current) => ({
                    ...current,
                    objective: event.target.value,
                  }))
                }
                placeholder="What should the learner be able to do?"
              />
              <HandDrawnInput
                label="Teaching Prompt"
                multiline
                rows={4}
                value={lessonDraft.teaching_prompt}
                onChange={(event) =>
                  setLessonDraft((current) => ({
                    ...current,
                    teaching_prompt: event.target.value,
                  }))
                }
                placeholder="Instructions for the AI coach"
              />
              {lessonError && (
                <p className="text-sm font-medium text-[#DC2626]">{lessonError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <HandDrawnButton variant="outline" onClick={() => setIsLessonModalOpen(false)}>
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
                variant="primary"
                onClick={handleCreateLesson}
                disabled={savingLesson}
              >
                {savingLesson ? 'Saving…' : 'Save Lesson'}
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      )}

      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <HandDrawnCard className="w-full max-w-lg bg-white my-8" rotate="none">
            <h2 className="font-heading text-2xl font-bold mb-6">Add Topic</h2>
            <div className="space-y-4">
              <HandDrawnInput
                label="Topic Title"
                value={topicDraft.title}
                onChange={(event) =>
                  setTopicDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g., Travel"
              />
              <HandDrawnInput
                label="Description"
                multiline
                rows={2}
                value={topicDraft.description}
                onChange={(event) =>
                  setTopicDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder="Brief description of the topic"
              />
              <HandDrawnInput
                label="Conversation Prompt"
                multiline
                rows={4}
                value={topicDraft.conversation_prompt}
                onChange={(event) =>
                  setTopicDraft((current) => ({
                    ...current,
                    conversation_prompt: event.target.value,
                  }))
                }
                placeholder="Instructions for the AI conversation"
              />
              {topicError && (
                <p className="text-sm font-medium text-[#DC2626]">{topicError}</p>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <HandDrawnButton variant="outline" onClick={() => setIsTopicModalOpen(false)}>
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
                variant="primary"
                onClick={handleCreateTopic}
                disabled={savingTopic}
              >
                {savingTopic ? 'Saving…' : 'Save Topic'}
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      )}
    </div>
  );
}

export default AdminMainPage;
