import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, BookOpen } from 'lucide-react';
import { HandDrawnButton } from '../../components/HandDrawnButton';
import { HandDrawnCard } from '../../components/HandDrawnCard';
import { HandDrawnInput } from '../../components/HandDrawnInput';
import { SquigglyLine } from '../../components/DoodleDecorations';
interface Course {
  id: string;
  title: string;
  language: string;
  lessonCount: number;
  status: 'Active' | 'Draft';
  description: string;
}
const initialCourses: Course[] = [
{
  id: '1',
  title: 'Spanish Basics',
  language: 'Spanish',
  lessonCount: 12,
  status: 'Active',
  description: 'Beginner friendly Spanish.'
},
{
  id: '2',
  title: 'French Essentials',
  language: 'French',
  lessonCount: 8,
  status: 'Active',
  description: 'Core French vocabulary.'
},
{
  id: '3',
  title: 'Japanese Starter',
  language: 'Japanese',
  lessonCount: 5,
  status: 'Draft',
  description: 'Introduction to Hiragana.'
},
{
  id: '4',
  title: 'German Foundations',
  language: 'German',
  lessonCount: 0,
  status: 'Draft',
  description: 'Basic German grammar.'
}];

export function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Partial<Course>>({});
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  const handleOpenModal = (course?: Course) => {
    if (course) {
      setCurrentCourse(course);
    } else {
      setCurrentCourse({
        status: 'Draft',
        language: 'Spanish'
      });
    }
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentCourse({});
  };
  const handleSave = () => {
    if (currentCourse.id) {
      setCourses(
        courses.map((c) =>
        c.id === currentCourse.id ?
        {
          ...c,
          ...currentCourse
        } as Course :
        c
        )
      );
    } else {
      const newCourse: Course = {
        ...currentCourse,
        id: Math.random().toString(36).substr(2, 9),
        lessonCount: 0
      } as Course;
      setCourses([...courses, newCourse]);
    }
    handleCloseModal();
  };
  const confirmDelete = (id: string) => {
    setCourseToDelete(id);
    setIsDeleteModalOpen(true);
  };
  const handleDelete = () => {
    if (courseToDelete) {
      setCourses(courses.filter((c) => c.id !== courseToDelete));
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    }
  };
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
          className="shrink-0">

          <Plus size={18} /> Add Course
        </HandDrawnButton>
      </div>

      <div className="bg-white border-2 border-[#1A1A1A] hand-drawn-border-alt hand-drawn-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAF8] border-b-2 border-[#1A1A1A]">
                <th className="p-4 font-heading font-bold text-lg">
                  Course Title
                </th>
                <th className="p-4 font-heading font-bold text-lg">Language</th>
                <th className="p-4 font-heading font-bold text-lg">Lessons</th>
                <th className="p-4 font-heading font-bold text-lg">Status</th>
                <th className="p-4 font-heading font-bold text-lg text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, idx) =>
              <tr
                key={course.id}
                className={`border-b-2 border-[#1A1A1A] last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>

                  <td className="p-4">
                    <Link
                    to={`/admin/courses/${course.id}/lessons`}
                    className="font-bold hover:text-[#DC2626] flex items-center gap-2">

                      <BookOpen size={16} className="text-gray-400" />
                      {course.title}
                    </Link>
                  </td>
                  <td className="p-4">{course.language}</td>
                  <td className="p-4">{course.lessonCount}</td>
                  <td className="p-4">
                    <span
                    className={`
                      inline-block px-3 py-1 text-xs font-bold border-2 border-[#1A1A1A] hand-drawn-border-pill
                      ${course.status === 'Active' ? 'bg-[#10B981]/20 text-[#047857]' : 'bg-gray-200 text-gray-700'}
                    `}>

                      {course.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/courses/${course.id}/lessons`}>
                        <button
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-[#1A1A1A] hand-drawn-border"
                        title="Manage Lessons">

                          <BookOpen size={18} />
                        </button>
                      </Link>
                      <button
                      onClick={() => handleOpenModal(course)}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors border-2 border-transparent hover:border-[#1A1A1A] hand-drawn-border"
                      title="Edit">

                        <Edit2 size={18} />
                      </button>
                      <button
                      onClick={() => confirmDelete(course.id)}
                      className="p-2 hover:bg-red-100 text-[#DC2626] rounded-full transition-colors border-2 border-transparent hover:border-[#DC2626] hand-drawn-border"
                      title="Delete">

                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {courses.length === 0 &&
              <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No courses found. Create one to get started.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen &&
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
              setCurrentCourse({
                ...currentCourse,
                title: e.target.value
              })
              }
              placeholder="e.g., Spanish Basics" />


              <div className="flex flex-col gap-2">
                <label className="font-heading font-bold text-[#1A1A1A] text-lg">
                  Language
                </label>
                <select
                className="w-full bg-transparent border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50"
                value={currentCourse.language || 'Spanish'}
                onChange={(e) =>
                setCurrentCourse({
                  ...currentCourse,
                  language: e.target.value
                })
                }>

                  <option>Spanish</option>
                  <option>French</option>
                  <option>Japanese</option>
                  <option>German</option>
                  <option>Italian</option>
                </select>
              </div>

              <HandDrawnInput
              label="Description"
              multiline
              rows={3}
              value={currentCourse.description || ''}
              onChange={(e) =>
              setCurrentCourse({
                ...currentCourse,
                description: e.target.value
              })
              }
              placeholder="Brief description of the course..." />


              <div className="flex items-center gap-3 pt-2">
                <input
                type="checkbox"
                id="status-toggle"
                className="w-5 h-5 border-2 border-[#1A1A1A] rounded-sm accent-[#1A1A1A]"
                checked={currentCourse.status === 'Active'}
                onChange={(e) =>
                setCurrentCourse({
                  ...currentCourse,
                  status: e.target.checked ? 'Active' : 'Draft'
                })
                } />

                <label
                htmlFor="status-toggle"
                className="font-bold cursor-pointer">

                  Active (visible to users)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <HandDrawnButton variant="outline" onClick={handleCloseModal}>
                Cancel
              </HandDrawnButton>
              <HandDrawnButton
              variant="primary"
              onClick={handleSave}
              disabled={!currentCourse.title}>

                Save Course
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      }

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <HandDrawnCard
          className="w-full max-w-sm bg-white border-[#DC2626]"
          rotate="left">

            <h2 className="font-heading text-2xl font-bold mb-4 text-[#DC2626]">
              Are you sure?
            </h2>
            <p className="text-gray-600 mb-8">
              This will permanently delete the course and all its lessons. This
              action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <HandDrawnButton
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}>

                Cancel
              </HandDrawnButton>
              <HandDrawnButton
              variant="primary"
              className="bg-[#DC2626] hover:bg-red-800"
              onClick={handleDelete}>

                Delete
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      }
    </div>);

}