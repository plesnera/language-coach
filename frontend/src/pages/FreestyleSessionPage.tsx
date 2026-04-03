import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import SessionPage from "../components/session/SessionPage";
import { HandDrawnCard } from "../components/HandDrawnCard";
import { HandDrawnButton } from "../components/HandDrawnButton";
import { getGuestSessionsRemaining } from "../utils/guestAccess";
import { API_BASE } from "../config/endpoints";

interface Language {
  id: string;
  name: string;
  enabled: boolean;
}
const LANGUAGE_NAME_BY_ID: Record<string, string> = {
  spanish: "Spanish",
  french: "French",
  japanese: "Japanese",
  german: "German",
};

const FreestyleSessionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const langId = (searchParams.get("lang") ?? "").toLowerCase();
  const requestedNextPath = searchParams.get("next");
  const authQuery = requestedNextPath
    ? `?next=${encodeURIComponent(requestedNextPath)}`
    : "";
  const { user } = useAuth();
  const isGuest = !user;
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
  const languageName = language?.name ?? LANGUAGE_NAME_BY_ID[langId] ?? "Spanish";
  const systemContext = [
    `[FREESTYLE CONTEXT]`,
    `Language: ${languageName}`,
    ``,
    `You are a friendly language coach for ${languageName}. The student wants to have a free, open-ended conversation in ${languageName}.`,
    `Let them lead the conversation — talk about anything they like. Gently correct mistakes, suggest better phrasing, and introduce new vocabulary naturally.`,
    ``,
    `Begin with a short, friendly intro like: \"Let's chat in ${languageName}! You can talk about anything — whenever you get stuck, just say it in English and I'll help you.\"`,
    ...(isGuest
      ? [
          ``,
          `After the first successful exchange, mention that account creation unlocks personalized curriculum, progress tracking, and chat sessions based on uploaded content.`,
        ]
      : []),
  ].join("\n");
  const remainingGuestSessions = getGuestSessionsRemaining();

  return (
    <SessionPage
      title={`Freestyle — ${languageName}`}
      subtitle="Open-ended conversation with your AI coach"
      systemContext={systemContext}
      backTo="/freestyle"
    >
      {isGuest && (
        <div className="space-y-4 max-w-4xl mx-auto">
          <HandDrawnCard dashed className="bg-[#F59E0B]/10">
            <h2 className="font-heading text-2xl font-bold mb-2">Guest mode is active</h2>
            <p className="text-gray-700 mb-4">
              You can continue as a guest, but creating a free account unlocks full
              continuity and saved progression.
            </p>
            <p className="text-sm font-semibold text-[#1A1A1A]">
              Remaining guest sessions: {remainingGuestSessions}
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link to={`/signup${authQuery}`} className="w-full sm:w-auto">
                <HandDrawnButton variant="primary" className="w-full sm:w-auto">
                  Create free account
                </HandDrawnButton>
              </Link>
              <Link to={`/login${authQuery}`} className="w-full sm:w-auto">
                <HandDrawnButton variant="outline" className="w-full sm:w-auto">
                  Log In
                </HandDrawnButton>
              </Link>
            </div>
          </HandDrawnCard>
          <HandDrawnCard rotate="right">
            <h3 className="font-heading text-xl font-bold mb-3">
              Account benefits
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckCircle2
                  size={18}
                  className="text-[#1A1A1A] mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>Personalized curriculum tailored to your current level</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  size={18}
                  className="text-[#1A1A1A] mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>Progress tracking across all sessions</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2
                  size={18}
                  className="text-[#1A1A1A] mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <span>Topic chats based on content you upload</span>
              </li>
            </ul>
          </HandDrawnCard>
        </div>
      )}
    </SessionPage>
  );
};

export default FreestyleSessionPage;
