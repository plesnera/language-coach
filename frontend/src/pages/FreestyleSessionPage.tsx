import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SessionPage from "../components/session/SessionPage";

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : "";

interface Language {
  id: string;
  name: string;
  enabled: boolean;
}

const FreestyleSessionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const langId = searchParams.get("lang");
  const { user } = useAuth();
  const [language, setLanguage] = useState<Language | null>(null);

  useEffect(() => {
    if (!langId || !user?.token) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/languages/`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (res.ok) {
          const langs: Language[] = await res.json();
          const found = langs.find((l) => l.id === langId);
          if (found) setLanguage(found);
        }
      } catch {
        // language stays null
      }
    })();
  }, [langId, user?.token]);

  const systemContext = language
    ? [
        `[FREESTYLE CONTEXT]`,
        `Language: ${language.name}`,
        ``,
        `You are a friendly language coach for ${language.name}. The student wants to have a free, open-ended conversation in ${language.name}.`,
        `Let them lead the conversation — talk about anything they like. Gently correct mistakes, suggest better phrasing, and introduce new vocabulary naturally.`,
        ``,
        `Begin with a short, friendly intro like: "Let's chat in ${language.name}! You can talk about anything — whenever you get stuck, just say it in English and I'll help you."`,
      ].join("\n")
    : undefined;

  return (
    <SessionPage
      title={language ? `Freestyle — ${language.name}` : "Loading…"}
      subtitle="Open-ended conversation with your AI coach"
      systemContext={systemContext}
    />
  );
};

export default FreestyleSessionPage;
