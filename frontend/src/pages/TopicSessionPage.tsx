import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SessionPage from "../components/session/SessionPage";

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

interface TopicData {
  id: string;
  title: string;
  description: string;
  conversation_prompt: string;
}

const TopicSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [topic, setTopic] = useState<TopicData | null>(null);

  useEffect(() => {
    if (!id || !user?.token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/topics/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (res.ok) setTopic(await res.json());
      } catch {
        // topic stays null
      }
    })();
  }, [id, user?.token]);

  const systemContext = topic
    ? [
        `[TOPIC CONTEXT]`,
        `Topic: ${topic.title}`,
        `Description: ${topic.description}`,
        ``,
        `Conversation instructions:`,
        topic.conversation_prompt,
        ``,
        `Begin with a short, friendly intro like: "Let's get going with our topic: ${topic.title}! Whenever you get stuck, just say it in English and I'll help you." Then guide the conversation according to the instructions above.`,
      ].join("\n")
    : undefined;

  return (
    <SessionPage
      title={topic?.title ?? "Loading\u2026"}
      subtitle={topic?.description}
      systemContext={systemContext}
    />
  );
};

export default TopicSessionPage;
