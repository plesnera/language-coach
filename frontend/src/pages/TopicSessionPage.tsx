import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SessionPage from "../components/session/SessionPage";
import { useAuth } from "../contexts/AuthContext";

interface Topic {
  id: string;
  title: string;
  description: string;
}

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

const TopicSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);

  useEffect(() => {
    const fetchTopic = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/topics/?language_id=es`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          },
        );
        if (res.ok) {
          const topics: Topic[] = await res.json();
          setTopic(topics.find((t) => t.id === id) ?? null);
        }
      } catch (err) {
        console.error("Failed to fetch topic", err);
      }
    };
    fetchTopic();
  }, [id, user?.token]);

  return (
    <SessionPage
      title={topic?.title ?? "Topic Conversation"}
      subtitle={topic?.description}
    />
  );
};

export default TopicSessionPage;
