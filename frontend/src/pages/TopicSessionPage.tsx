import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import SessionPage from "../components/session/SessionPage";
import { useAuth } from "../contexts/AuthContext";

interface Topic {
  id: string;
  title: string;
  description: string;
  conversation_prompt?: string;
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

  const systemContext = useMemo(() => {
    if (!topic) return undefined;
    const topicPrompt = topic.conversation_prompt
      ? ` Here is the conversation guide for this topic: ${topic.conversation_prompt}`
      : "";
    return (
      `The user has selected a conversation topic from the app menu: "${topic.title}". ` +
      `${topic.description}` +
      topicPrompt +
      " Transfer them to the topic_agent immediately and begin the conversation " +
      "about this topic. Do NOT ask what they want to do — they have already chosen."
    );
  }, [topic]);

  return (
    <SessionPage
      title={topic?.title ?? "Topic Conversation"}
      subtitle={topic?.description}
      systemContext={systemContext}
    />
  );
};

export default TopicSessionPage;
