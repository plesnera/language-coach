import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, BookOpen, Loader2 } from 'lucide-react';
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

export function AdminCoursesPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${user?.token}`,
    'Content-Type': 'application/json',
  };

  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({});
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // ---- Load languages on mount ----
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/languages`, { headers });
        if (res.ok) {
          const langs: Language[] = await res.json();
          setLanguages(langs);
          const preferredLangId = searchParams.get('language_id');
          const hasPreferredLanguage = preferredLangId
            ? langs.some((lang) => lang.id === preferredLangId)
            : false;
          if (langs.length > 0) {
            setSelectedLangId(hasPreferredLanguage ? preferredLangId : langs[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load languages', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Load courses when language changes ----
  const loadCourses = useCallback(async () => {
    if (!selectedLangId) return;
    try {
      const res = await fetch(
        `${API_BASE}/api/admin/courses?language_id=${selectedLangId}`,
        { headers },
      );
      if (res.ok) setCourses(await res.json());
    } catch (err) {
      console.error('Failed to load courses', err);
    }
  }, [selectedLangId, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // ---- Modal helpers ----
  const handleOpenModal = (course?: Course) => {
    if (course) {
      setCurrentCourse(course);
    } else {
      setCurrentCourse({ language_id: selectedLangId ?? '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCourse({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (currentCourse.id) {
        await fetch(`${API_BASE}/api/admin/courses/${currentCourse.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            title: currentCourse.title,
            description: currentCourse.description,
          }),
        });
      } else {
        const response = await fetch(`${API_BASE}/api/admin/courses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            language_id: currentCourse.language_id || selectedLangId,
            title: currentCourse.title,
            description: currentCourse.description || '',
            sort_order: courses.length,
          }),
        });
        
        if (response.ok) {
          const newCourse = await response.json();
          // Redirect to the lessons page for the newly created course
          handleCloseModal();
          navigate(`/admin/courses/${newCourse.id}/lessons`);
          return;
        }
      }
      await loadCourses();
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save course', err);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setCourseToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    try {
      await fetch(`${API_BASE}/api/admin/courses/${courseToDelete}`, {
        method: 'DELETE',
        headers,
      });
      await loadCourses();
    } catch (err) {
      console.error('Failed to delete course', err);
    } finally {
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    }
  };

  const selectedLang = languages.find((l) => l.id === selectedLangId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div className="relative inline-block">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-[#1A1A1A]">
            Course Management
          </h1>
          <SquigglyLine className="absolute -bottom-2 left-0 w-full h-2 text-[#DC2626]" />
        </div>
        <HandDrawnButton
          variant="primary"
          onClick={() => handleOpenModal()}
          className="shrink-0"
        >
          <Plus size={18} /> Add Course
        </HandDrawnButton>
      </div>

      {/* Hierarchy explanation */}
      <HandDrawnCard className="mb-6 bg-[#F59E0B]/10 border-[#F59E0B] border-2">
        <p className="text-sm text-gray-700">
          <strong>Courses</strong> are containers that organize your lessons. Each course can contain multiple lessons.
          Click a course title or the <BookOpen className="inline w-4 h-4" /> icon to manage its lessons.
        </p>
      </HandDrawnCard>

      {/* Language filter */}
      {languages.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setSelectedLangId(lang.id)}
              className={`
                px-4 py-2 border-2 border-[#1A1A1A] hand-drawn-border-alt font-medium text-sm transition-colors
                ${selectedLangId === lang.id
                  ? 'bg-[#1A1A1A] text-white'
                  : 'bg-white text-[#1A1A1A] hover:bg-gray-50'
                }
              `}
            >
              {lang.name}
            </button>
          ))}
        </div>
      )}

      <div className="bg-white border-2 border-[#1A1A1A] hand-drawn-border-alt hand-drawn-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAF8] border-b-2 border-[#1A1A1A]">
                <th className="p-4 font-heading font-bold text-lg">Course Title</th>
                <th className="p-4 font-heading font-bold text-lg">Description</th>
                <th className="p-4 font-heading font-bold text-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, idx) => (
                <tr
                  key={course.id}
                  className={`border-b-2 border-[#1A1A1A] last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="p-4">
                    <Link
                      to={`/admin/courses/${course.id}/lessons`}
                      className="font-bold hover:text-[#DC2626] flex items-center gap-2 group"
                    >
                      <BookOpen size={16} className="text-gray-400 group-hover:text-[#DC2626]" />
                      {course.title}
                      <span className="ml-2 text-xs bg-[#F59E0B] text-white px-2 py-0.5 rounded-full font-medium">
                        Manage Lessons
                      </span>
                    </Link>
                  </td>
                  <td className="p-4 text-gray-600 text-sm max-w-xs truncate">
                    {course.description}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/courses/${course.id}/lessons`}>
                        <button
                          className="p-2 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-[#1A1A1A] hand-drawn-border"
                          title="Manage Lessons"
                        >
                          <BookOpen size={18} />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleOpenModal(course)}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-[#1A1A1A] hand-drawn-border"
                        title="Edit"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => confirmDelete(course.id)}
                        className="p-2 hover:bg-red-100 text-[#DC2626] rounded-full transition-colors border-2 border-transparent hover:border-[#DC2626] hand-drawn-border"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No courses found{selectedLang ? ` for ${selectedLang.name}` : ''}. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <HandDrawnCard className="w-full max-w-lg bg-white" rotate="none">
            <h2 className="font-heading text-2xl font-bold mb-6">
              {currentCourse.id ? 'Edit Course' : 'Create New Course'}
            </h2>
            <div className="space-y-4">
              <HandDrawnInput
                label="Course Title"
                value={currentCourse.title || ''}
                onChange={(e) =>
                  setCurrentCourse({ ...currentCourse, title: e.target.value })
                }
                placeholder="e.g., Spanish Basics"
              />
              <HandDrawnInput
                label="Description"
                multiline
                rows={3}
                value={currentCourse.description || ''}
                onChange={(e) =>
                  setCurrentCourse({ ...currentCourse, description: e.target.value })
                }
                placeholder="Brief description of the course..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <HandDrawnButton variant="outline" onClick={handleCloseModal}>
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
                variant="primary"
                onClick={handleSave}
                disabled={!currentCourse.title || saving}
              >
                {saving ? 'Saving…' : 'Save Course'}
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
              This will permanently delete the course and all its lessons. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <HandDrawnButton variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
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

export default AdminCoursesPage;
