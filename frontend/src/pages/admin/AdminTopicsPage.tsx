import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface Topic {
  id: string;
  language_id: string;
  title: string;
  description: string;
  conversation_prompt: string;
  sort_order: number;
}

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

const empty: Omit<Topic, "id"> = {
  language_id: "es",
  title: "",
  description: "",
  conversation_prompt: "",
  sort_order: 0,
};

const AdminTopicsPage: React.FC = () => {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [editing, setEditing] = useState<Partial<Topic> | null>(null);
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
      `${API_BASE}/api/admin/topics?language_id=es`,
      { headers: headers() },
    );
    if (res.ok) setTopics(await res.json());
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setError(null);
    const isNew = !editing.id;
    const url = isNew
      ? `${API_BASE}/api/admin/topics`
      : `${API_BASE}/api/admin/topics/${editing.id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: headers(),
      body: JSON.stringify(
        isNew
          ? editing
          : {
              title: editing.title,
              description: editing.description,
              conversation_prompt: editing.conversation_prompt,
              sort_order: editing.sort_order,
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
    if (!confirm("Delete this topic?")) return;
    await fetch(`${API_BASE}/api/admin/topics/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    load();
  };

  return (
    <div className="admin-page">
      <h1>Topics</h1>
      <div className="admin-toolbar">
        <span>{topics.length} topic(s)</span>
        <button className="admin-btn" onClick={() => setEditing({ ...empty })}>
          <span className="material-symbols-outlined">add</span> New Topic
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
              rows={2}
              value={editing.description ?? ""}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            />
            <label>Conversation Prompt</label>
            <textarea
              rows={6}
              value={editing.conversation_prompt ?? ""}
              onChange={(e) => setEditing({ ...editing, conversation_prompt: e.target.value })}
              placeholder="System instructions for the agent..."
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

      {topics.length === 0 ? (
        <p className="admin-empty">No topics yet.</p>
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
            {topics.map((t) => (
              <tr key={t.id}>
                <td>{t.title}</td>
                <td>{t.description.slice(0, 80)}</td>
                <td>{t.sort_order}</td>
                <td>
                  <button className="admin-btn small" onClick={() => setEditing(t)}>Edit</button>{" "}
                  <button className="admin-btn small danger" onClick={() => remove(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminTopicsPage;
