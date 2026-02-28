import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/DashboardPage.scss";

interface Language {
  id: string;
  name: string;
}

interface ProgressStats {
  lessons_completed: number;
  total_time_seconds: number;
  total_conversations: number;
  sessions_by_mode: Record<string, number>;
}

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

const FLAG_MAP: Record<string, string> = {
  es: "\ud83c\uddea\ud83c\uddf8",
  fr: "\ud83c\uddeb\ud83c\uddf7",
  de: "\ud83c\udde9\ud83c\uddea",
  it: "\ud83c\uddee\ud83c\uddf9",
  pt: "\ud83c\uddf5\ud83c\uddf9",
};

const modes = [
  {
    key: "learn",
    icon: "school",
    title: "Beginner Track",
    description: "Start from scratch with structured lessons",
    route: "/learn",
  },
  {
    key: "topics",
    icon: "forum",
    title: "Topic Conversation",
    description: "Pick a topic and practice",
    route: "/topics",
  },
  {
    key: "talk",
    icon: "record_voice_over",
    title: "Free Talk",
    description: "Talk about anything",
    route: "/talk",
  },
  {
    key: "history",
    icon: "history",
    title: "History",
    description: "Review past conversations",
    route: "/history",
  },
] as const;

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLang, setSelectedLang] = useState("es");
  const [stats, setStats] = useState<ProgressStats | null>(null);

  const headers = useCallback(
    () => ({ Authorization: `Bearer ${user?.token}` }),
    [user?.token],
  );

  useEffect(() => {
    (async () => {
      try {
        const [langRes, progressRes] = await Promise.all([
          fetch(`${API_BASE}/api/languages/`, { headers: headers() }),
          fetch(`${API_BASE}/api/progress/`, { headers: headers() }),
        ]);
        if (langRes.ok) {
          const langs = await langRes.json();
          setLanguages(langs);
          if (langs.length > 0 && !langs.find((l: Language) => l.id === selectedLang)) {
            setSelectedLang(langs[0].id);
          }
        }
        if (progressRes.ok) setStats(await progressRes.json());
      } catch (err) {
        console.error("Dashboard load failed", err);
      }
    })();
  }, [headers, selectedLang]);

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    return mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div className="greeting">
          <h1>Hola, {user?.displayName || "Learner"} \ud83d\udc4b</h1>
          {languages.length > 1 ? (
            <select
              className="language-selector"
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value)}
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {FLAG_MAP[l.id] || ""} {l.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="language-badge">
              {FLAG_MAP[selectedLang] || ""} {languages.find((l) => l.id === selectedLang)?.name || "Spanish"}
            </p>
          )}
        </div>
        <button className="logout-button" onClick={logout}>
          <span className="material-symbols-outlined">logout</span>
        </button>
      </header>

      {stats && (stats.total_conversations > 0 || stats.lessons_completed > 0) && (
        <section className="stats-bar">
          <div className="stat">
            <span className="stat-value">{stats.lessons_completed}</span>
            <span className="stat-label">Lessons</span>
          </div>
          <div className="stat">
            <span className="stat-value">{stats.total_conversations}</span>
            <span className="stat-label">Sessions</span>
          </div>
          <div className="stat">
            <span className="stat-value">{formatTime(stats.total_time_seconds)}</span>
            <span className="stat-label">Study time</span>
          </div>
        </section>
      )}

      <section className="mode-grid">
        {modes.map((mode) => (
          <button
            key={mode.key}
            className="mode-card"
            onClick={() => navigate(mode.route)}
          >
            <span className="material-symbols-outlined mode-icon">
              {mode.icon}
            </span>
            <h2>{mode.title}</h2>
            <p>{mode.description}</p>
          </button>
        ))}
      </section>

      {user?.role === "admin" && (
        <button
          className="mode-card admin-link"
          onClick={() => navigate("/admin")}
          style={{ marginTop: "1.5rem", maxWidth: "720px", width: "100%" }}
        >
          <span className="material-symbols-outlined mode-icon">admin_panel_settings</span>
          <h2>Admin Panel</h2>
          <p>Manage courses, topics, prompts, and users</p>
        </button>
      )}
    </div>
  );
};

export default DashboardPage;
