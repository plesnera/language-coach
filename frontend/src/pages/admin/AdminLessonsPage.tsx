import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface Lesson {
  id: string;
  title: string;
  objective: string;
  teaching_prompt: string;
  sort_order: number;
  source_audio_ref: string | null;
  source_transcript: string | null;
}

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

const emptyLesson: Omit<Lesson, "id"> = {
  title: "",
  objective: "",
  teaching_prompt: "",
  sort_order: 0,
  source_audio_ref: null,
  source_transcript: null,
};

const AdminLessonsPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [editing, setEditing] = useState<Partial<Lesson> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summarising, setSummarising] = useState(false);

  const headers = useCallback(
    () => ({
      Authorization: `Bearer ${user?.token}`,
      "Content-Type": "application/json",
    }),
    [user?.token],
  );

  const load = useCallback(async () => {
    const res = await fetch(
      `${API_BASE}/api/admin/courses/${courseId}/lessons`,
      { headers: headers() },
    );
    if (res.ok) setLessons(await res.json());
  }, [courseId, headers]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setError(null);
    const isNew = !editing.id;
    const url = isNew
      ? `${API_BASE}/api/admin/courses/${courseId}/lessons`
      : `${API_BASE}/api/admin/courses/${courseId}/lessons/${editing.id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: headers(),
      body: JSON.stringify(
        isNew
          ? editing
          : {
              title: editing.title,
              objective: editing.objective,
              teaching_prompt: editing.teaching_prompt,
              sort_order: editing.sort_order,
              source_audio_ref: editing.source_audio_ref,
              source_transcript: editing.source_transcript,
            },
      ),
    });
    if (!res.ok) {
      const b = await res.json().catch(() => null);
      setError(b?.detail || "Save failed");
      return;
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    await fetch(
      `${API_BASE}/api/admin/courses/${courseId}/lessons/${id}`,
      { method: "DELETE", headers: headers() },
    );
    load();
  };

  const reorder = async (index: number, direction: -1 | 1) => {
    const ids = lessons.map((l) => l.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    await fetch(
      `${API_BASE}/api/admin/courses/${courseId}/lessons/reorder`,
      {
        method: "PUT",
        headers: headers(),
        body: JSON.stringify({ lesson_ids: ids }),
      },
    );
    load();
  };

  const handleSummarise = async () => {
    if (!editing?.source_transcript) return;
    setSummarising(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/admin/summarise`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          transcript_text: editing.source_transcript,
          prompt_text: "Summarise this language lesson transcript into a detailed teaching prompt that a language tutor AI can use. Include key concepts, example sentences, and exercises.",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEditing({ ...editing, teaching_prompt: data.summary });
      } else {
        setError("Summarisation failed");
      }
    } finally {
      setSummarising(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button className="admin-btn secondary small" onClick={() => navigate("/admin/courses")}>
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 style={{ margin: 0 }}>Lessons</h1>
        </div>
        <button className="admin-btn" onClick={() => setEditing({ ...emptyLesson, sort_order: lessons.length })}>
          <span className="material-symbols-outlined">add</span> New Lesson
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {editing && (
        <div className="admin-card">
          <div className="admin-form">
            <label>Title</label>
            <input
              value={editing.title ?? ""}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            <label>Objective</label>
            <input
              value={editing.objective ?? ""}
              onChange={(e) => setEditing({ ...editing, objective: e.target.value })}
            />
            <label>Source Transcript</label>
            <textarea
              rows={4}
              value={editing.source_transcript ?? ""}
              onChange={(e) => setEditing({ ...editing, source_transcript: e.target.value })}
              placeholder="Paste transcript text here..."
            />
            <div className="admin-form-actions">
              <button
                className="admin-btn small"
                disabled={!editing.source_transcript || summarising}
                onClick={handleSummarise}
              >
                {summarising ? "Summarising..." : "AI Summarise → Teaching Prompt"}
              </button>
            </div>
            <label>Teaching Prompt</label>
            <textarea
              rows={8}
              value={editing.teaching_prompt ?? ""}
              onChange={(e) => setEditing({ ...editing, teaching_prompt: e.target.value })}
              placeholder="Instructions for the AI tutor..."
            />
            <label>Source Audio Ref</label>
            <input
              value={editing.source_audio_ref ?? ""}
              onChange={(e) => setEditing({ ...editing, source_audio_ref: e.target.value || null })}
              placeholder="Optional GCS path or filename"
            />
            <label>Sort Order</label>
            <input
              type="number"
              value={editing.sort_order ?? 0}
              onChange={(e) => setEditing({ ...editing, sort_order: +e.target.value })}
            />
            <div className="admin-form-actions">
              <button className="admin-btn" onClick={save}>Save</button>
              <button className="admin-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {lessons.length === 0 ? (
        <p className="admin-empty">No lessons yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Objective</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {lessons.map((l, i) => (
              <tr key={l.id}>
                <td>{l.sort_order}</td>
                <td>{l.title}</td>
                <td>{l.objective.slice(0, 60)}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <button className="admin-btn small secondary" disabled={i === 0} onClick={() => reorder(i, -1)}>↑</button>{" "}
                  <button className="admin-btn small secondary" disabled={i === lessons.length - 1} onClick={() => reorder(i, 1)}>↓</button>{" "}
                  <button className="admin-btn small" onClick={() => setEditing(l)}>Edit</button>{" "}
                  <button className="admin-btn small danger" onClick={() => remove(l.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminLessonsPage;
