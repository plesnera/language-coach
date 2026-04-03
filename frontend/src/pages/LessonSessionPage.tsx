import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SessionPage from "../components/session/SessionPage";
import { API_BASE } from "../config/endpoints";

interface LessonData {
  id: string;
  title: string;
  objective: string;
  teaching_prompt: string;
  image_url: string | null;
}

const LessonSessionPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{
    courseId: string;
    lessonId: string;
  }>();
  const { user } = useAuth();
  const [lesson, setLesson] = useState<LessonData | null>(null);

  useEffect(() => {
    if (!courseId || !lessonId || !user?.token) return;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/courses/${courseId}/lessons/${lessonId}`,
          { headers: { Authorization: `Bearer ${user.token}` } },
        );
        if (res.ok) setLesson(await res.json());
      } catch {
        // lesson stays null — header will show fallback
      }
    })();
  }, [courseId, lessonId, user?.token]);

  // Build the context message that tells the agent what lesson to teach.
  const systemContext = lesson
    ? [
        `[LESSON CONTEXT]`,
        `Lesson: ${lesson.title}`,
        `Objective: ${lesson.objective}`,
        ``,
        `Teaching instructions:`,
        lesson.teaching_prompt,
        ``,
        `Begin the lesson with a short, friendly intro like: "Let's get going with ${lesson.title}! Whenever you get stuck, just say it in English and I'll help you." Then proceed to teach according to the instructions above.`,
      ].join("\n")
    : undefined;

  return (
    <SessionPage
      title={lesson?.title ?? "Loading…"}
      subtitle={lesson?.objective}
      systemContext={systemContext}
    >
      {lesson?.image_url && (
        <div className="flex justify-center mb-4">
          <img
            src={`${API_BASE}${lesson.image_url}`}
            alt={lesson.title}
            className="max-w-md w-full h-auto rounded border-2 border-[#1A1A1A] object-cover"
          />
        </div>
      )}
      {lesson && (
        <div className="text-center">
          <h2
            className="font-heading text-2xl font-bold text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Lora', serif" }}
          >
            {lesson.title}
          </h2>
          <p className="text-gray-600">{lesson.objective}</p>
        </div>
      )}
    </SessionPage>
  );
};

export default LessonSessionPage;
