import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

interface Course {
  id: string;
  language_id: string;
  title: string;
  description: string;
  sort_order: number;
}

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

const empty: Omit<Course, "id"> = {
  language_id: "es",
  title: "",
  description: "",
  sort_order: 0,
};

const AdminCoursesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [editing, setEditing] = useState<Partial<Course> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const headers = useCallback(
    () => ({
      Authorization: `Bearer ${user?.token}`,
      "Content-Type": "application/json",
    }),
    [user?.token],
  );

  const load = useCallback(async () => {
    const res = await fetch(
      `${API_BASE}/api/admin/courses?language_id=es`,
      { headers: headers() },
    );
    if (res.ok) setCourses(await res.json());
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setError(null);
    const isNew = !editing.id;
    const url = isNew
      ? `${API_BASE}/api/admin/courses`
      : `${API_BASE}/api/admin/courses/${editing.id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: headers(),
      body: JSON.stringify(
        isNew
          ? editing
          : { title: editing.title, description: editing.description, sort_order: editing.sort_order },
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
    if (!confirm("Delete this course and all its lessons?")) return;
    await fetch(`${API_BASE}/api/admin/courses/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    load();
  };

  return (
    <div className="admin-page">
      <h1>Courses</h1>
      <div className="admin-toolbar">
        <span>{courses.length} course(s)</span>
        <button className="admin-btn" onClick={() => setEditing({ ...empty })}>
          <span className="material-symbols-outlined">add</span> New Course
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
            <label>Description</label>
            <textarea
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
            <label>Sort Order</label>
            <input
              type="number"
              value={editing.sort_order ?? 0}
              onChange={(e) => setEditing({ ...editing, sort_order: +e.target.value })}
            />
            <div className="admin-form-actions">
              <button className="admin-btn" onClick={save}>Save</button>
              <button className="admin-btn secondary" onClick={() => setEditing(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <p className="admin-empty">No courses yet. Create one above.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>
                  <a
                    href={`/admin/courses/${c.id}/lessons`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/admin/courses/${c.id}/lessons`);
                    }}
                    style={{ color: "#1a73e8", cursor: "pointer" }}
                  >
                    {c.title}
                  </a>
                </td>
                <td>{c.description.slice(0, 80)}</td>
                <td>{c.sort_order}</td>
                <td>
                  <button
                    className="admin-btn small"
                    onClick={() => setEditing(c)}
                  >
                    Edit
                  </button>{" "}
                  <button
                    className="admin-btn small danger"
                    onClick={() => remove(c.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminCoursesPage;
