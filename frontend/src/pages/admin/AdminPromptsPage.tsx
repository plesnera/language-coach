import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";

interface Prompt {
  id: string;
  language_id: string;
  type: string;
  name: string;
  prompt_text: string;
  is_active: boolean;
}

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

const PROMPT_TYPES = ["beginner", "topic", "freestyle", "summarisation"];

const empty: Omit<Prompt, "id"> = {
  language_id: "es",
  type: "beginner",
  name: "",
  prompt_text: "",
  is_active: false,
};

const AdminPromptsPage: React.FC = () => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [editing, setEditing] = useState<Partial<Prompt> | null>(null);
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
      `${API_BASE}/api/admin/prompts?language_id=es`,
      { headers: headers() },
    );
    if (res.ok) setPrompts(await res.json());
  }, [headers]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!editing) return;
    setError(null);
    const isNew = !editing.id;
    const url = isNew
      ? `${API_BASE}/api/admin/prompts`
      : `${API_BASE}/api/admin/prompts/${editing.id}`;
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: headers(),
      body: JSON.stringify(
        isNew
          ? editing
          : { name: editing.name, prompt_text: editing.prompt_text },
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

  const activate = async (id: string) => {
    await fetch(`${API_BASE}/api/admin/prompts/${id}/activate`, {
      method: "POST",
      headers: headers(),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this prompt?")) return;
    await fetch(`${API_BASE}/api/admin/prompts/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    load();
  };

  // Group prompts by type
  const grouped = PROMPT_TYPES.map((type) => ({
    type,
    items: prompts.filter((p) => p.type === type),
  }));

  return (
    <div className="admin-page">
      <h1>System Prompts</h1>
      <div className="admin-toolbar">
        <span>{prompts.length} prompt(s)</span>
        <button className="admin-btn" onClick={() => setEditing({ ...empty })}>
          <span className="material-symbols-outlined">add</span> New Prompt
        </button>
      </div>

      {error && <p className="admin-error">{error}</p>}

      {editing && (
        <div className="admin-card">
          <div className="admin-form">
            {!editing.id && (
              <>
                <label>Type</label>
                <select
                  value={editing.type ?? "beginner"}
                  onChange={(e) => setEditing({ ...editing, type: e.target.value })}
                >
                  {PROMPT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </>
            )}
            <label>Name</label>
            <input
              value={editing.name ?? ""}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <label>Prompt Text</label>
            <textarea
              rows={10}
              value={editing.prompt_text ?? ""}
              onChange={(e) => setEditing({ ...editing, prompt_text: e.target.value })}
            />
            <div className="admin-form-actions">
              <button className="admin-btn" onClick={save}>Save</button>
              <button className="admin-btn secondary" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {grouped.map(({ type, items }) => (
        <div key={type} style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", color: "#5f6368", textTransform: "capitalize", margin: "0 0 0.5rem" }}>
            {type}
          </h2>
          {items.length === 0 ? (
            <p className="admin-empty" style={{ padding: "1rem" }}>No {type} prompts.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>
                      {p.is_active ? (
                        <span style={{ color: "#1e8e3e", fontWeight: 600 }}>Active</span>
                      ) : (
                        <button className="admin-btn small secondary" onClick={() => activate(p.id)}>
                          Activate
                        </button>
                      )}
                    </td>
                    <td>
                      <button className="admin-btn small" onClick={() => setEditing(p)}>Edit</button>{" "}
                      <button className="admin-btn small danger" onClick={() => remove(p.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  );
};

export default AdminPromptsPage;
