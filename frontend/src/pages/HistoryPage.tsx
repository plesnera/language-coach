import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/HistoryPage.scss";

interface Message {
  role: string;
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  mode: string;
  language_id: string;
  topic_id: string | null;
  messages: Message[];
  created_at: string;
}

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

const modeLabels: Record<string, string> = {
  beginner: "Beginner Track",
  topic: "Topic Conversation",
  freestyle: "Free Talk",
};

const HistoryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/conversations/`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });
      if (res.ok) setConversations(await res.json());
    } catch (err) {
      console.error("Failed to load conversations", err);
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => { load(); }, [load]);

  const openConversation = async (id: string) => {
    const res = await fetch(`${API_BASE}/api/conversations/${id}`, {
      headers: { Authorization: `Bearer ${user?.token}` },
    });
    if (res.ok) setSelected(await res.json());
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="history-page">
      <header className="history-header">
        <button className="back-button" onClick={() => navigate("/")}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1>Conversation History</h1>
      </header>

      {loading ? (
        <p className="history-empty">Loading…</p>
      ) : selected ? (
        <div className="conversation-detail">
          <button className="back-link" onClick={() => setSelected(null)}>
            <span className="material-symbols-outlined">arrow_back</span> Back to list
          </button>
          <div className="detail-meta">
            <span className="mode-badge">{modeLabels[selected.mode] || selected.mode}</span>
            <span className="date">{formatDate(selected.created_at)}</span>
          </div>
          <div className="messages">
            {selected.messages.length === 0 ? (
              <p className="history-empty">No messages recorded.</p>
            ) : (
              selected.messages.map((m, i) => (
                <div key={i} className={`message ${m.role}`}>
                  <span className="role-label">{m.role === "user" ? "You" : "Coach"}</span>
                  <p>{m.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      ) : conversations.length === 0 ? (
        <p className="history-empty">No conversations yet. Start a session to see your history here.</p>
      ) : (
        <div className="conversation-list">
          {conversations.map((c) => (
            <button
              key={c.id}
              className="conversation-card"
              onClick={() => openConversation(c.id)}
            >
              <div className="card-top">
                <span className="mode-badge">{modeLabels[c.mode] || c.mode}</span>
                <span className="date">{formatDate(c.created_at)}</span>
              </div>
              <p className="preview">
                {c.messages.length > 0
                  ? c.messages[0].text.slice(0, 100) + "…"
                  : "No messages"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
