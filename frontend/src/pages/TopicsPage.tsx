import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../styles/TopicsPage.scss";

interface Topic {
  id: string;
  title: string;
  description: string;
}

interface UploadedDoc {
  id: string;
  filename: string;
  preview: string;
}

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

const ALLOWED_EXT = [".pdf", ".txt", ".md", ".docx"];

const TopicsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [uploads, setUploads] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [topicsRes, docsRes] = await Promise.all([
          fetch(`${API_BASE}/api/topics/?language_id=es`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
          fetch(`${API_BASE}/api/documents/`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
        ]);
        if (topicsRes.ok) setTopics(await topicsRes.json());
        if (docsRes.ok) {
          const docs = await docsRes.json();
          setUploads(
            docs.map((d: Record<string, string>) => ({
              id: d.id,
              filename: d.filename,
              preview: (d.extracted_text || "").slice(0, 120),
            })),
          );
        }
      } catch (err) {
        console.error("Failed to fetch data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.token]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      setUploadError(`Unsupported file type. Allowed: ${ALLOWED_EXT.join(", ")}`);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${API_BASE}/api/documents/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${user?.token}` },
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail || `Upload failed (${res.status})`);
      }
      const doc: UploadedDoc = await res.json();
      setUploads((prev) => [doc, ...prev]);
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="topics-page">
      <header className="topics-header">
        <button className="back-button" onClick={() => navigate("/")}>
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1>Pick a Topic</h1>
      </header>

      {/* Upload section */}
      <section className="upload-section">
        <label className="upload-button" aria-disabled={uploading}>
          <span className="material-symbols-outlined">upload_file</span>
          {uploading ? "Uploading…" : "Upload Document"}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_EXT.join(",")}
            onChange={handleUpload}
            disabled={uploading}
            hidden
          />
        </label>
        {uploadError && <p className="upload-error">{uploadError}</p>}
      </section>

      {loading ? (
        <p className="topics-loading">Loading topics…</p>
      ) : (
        <>
          {/* Uploaded documents */}
          {uploads.length > 0 && (
            <section className="uploads-list">
              <h2 className="section-title">Your Uploads</h2>
              <div className="topics-grid">
                {uploads.map((d) => (
                  <div key={d.id} className="topic-card uploaded-card">
                    <h2>
                      <span className="material-symbols-outlined">description</span>
                      {d.filename}
                    </h2>
                    <p>{d.preview}…</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Existing topics */}
          {topics.length === 0 && uploads.length === 0 ? (
            <p className="topics-empty">No topics available yet.</p>
          ) : (
            topics.length > 0 && (
              <section>
                <h2 className="section-title">Topics</h2>
                <div className="topics-grid">
                  {topics.map((t) => (
                    <button
                      key={t.id}
                      className="topic-card"
                      onClick={() => navigate(`/topics/${t.id}`)}
                    >
                      <h2>{t.title}</h2>
                      <p>{t.description}</p>
                    </button>
                  ))}
                </div>
              </section>
            )
          )}
        </>
      )}
    </div>
  );
};

export default TopicsPage;
