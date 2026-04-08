import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import SessionPage from "../components/session/SessionPage";
import { HandDrawnCard } from "../components/HandDrawnCard";
import { HandDrawnButton } from "../components/HandDrawnButton";
import { getGuestSessionsRemaining } from "../utils/guestAccess";

const LANGUAGE_NAME_BY_ID: Record<string, string> = {
  spanish: "Spanish",
  french: "French",
  japanese: "Japanese",
  german: "German",
};

const GOAL_CONTEXT_BY_ID: Record<string, string> = {
  confidence: "Build speaking confidence",
  travel: "Prepare for travel conversations",
  smalltalk: "Practice everyday small talk",
};

const MAX_TOPIC_LENGTH = 140;

function sanitizeTopic(input: string | null): string {
  const normalized = (input ?? "").trim();
  if (!normalized) {
    return "everyday conversation";
  }
  return normalized.slice(0, MAX_TOPIC_LENGTH);
}

const GuestIntroSessionPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const languageId = (searchParams.get("lang") ?? "").toLowerCase();
  const goalId = (searchParams.get("goal") ?? "").toLowerCase();
  const requestedNextPath = searchParams.get("next");
  const authQuery = requestedNextPath
    ? `?next=${encodeURIComponent(requestedNextPath)}`
    : "";
  const topic = sanitizeTopic(searchParams.get("topic"));

  const language = LANGUAGE_NAME_BY_ID[languageId] ?? "Spanish";
  const goal = GOAL_CONTEXT_BY_ID[goalId] ?? "Build speaking confidence";
  const remainingGuestSessions = getGuestSessionsRemaining();

  const systemContext = [
    "[GUEST INTRO SESSION]",
    `Language: ${language}`,
    `Goal: ${goal}`,
    `Starter topic: ${topic}`,
    "",
    "This is a guest preview for a new learner.",
    "Start with one short useful sentence, then ask a simple follow-up question.",
    "Keep guidance concise and encouraging.",
    "After one successful exchange, explain that an account unlocks:",
    "- Personalized curriculum",
    "- Progress tracking over time",
    "- Topic chats based on user-uploaded content",
  ].join("\n");

  // Upsell content that will be rendered below the voice interface
  const upsellContent = (
    <div className="space-y-4 max-w-4xl mx-auto mt-8">
      <HandDrawnCard rotate="right">
        <h3 className="font-heading text-xl font-bold mb-3">
          What you unlock by signing up
        </h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2">
            <CheckCircle2
              size={18}
              className="text-[#1A1A1A] mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span>A personalized curriculum adapted to your level</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2
              size={18}
              className="text-[#1A1A1A] mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span>Progress tracking so you can see measurable improvement</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2
              size={18}
              className="text-[#1A1A1A] mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <span>Practice chats based on content you upload</span>
          </li>
        </ul>
      </HandDrawnCard>

      <HandDrawnCard dashed className="bg-[#F59E0B]/10">
        <h2 className="font-heading text-2xl font-bold mb-2">Guest mode is active</h2>
        <p className="text-gray-700 mb-4">
          You can practice right now without creating an account. If you want
          to keep your progress, you can sign up at any time.
        </p>
        <p className="text-sm font-semibold text-[#1A1A1A] mb-4">
          Remaining guest sessions: {remainingGuestSessions}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to={`/signup${authQuery}`} className="w-full sm:w-auto">
            <HandDrawnButton className="w-full sm:w-auto" variant="primary">
              Create free account
            </HandDrawnButton>
          </Link>
          <Link to={`/login${authQuery}`} className="w-full sm:w-auto">
            <HandDrawnButton className="w-full sm:w-auto" variant="outline">
              Log in
            </HandDrawnButton>
          </Link>
        </div>
      </HandDrawnCard>
    </div>
  );

  return (
    <SessionPage
      title={`Guest intro — ${language}`}
      subtitle={`${goal}. No signup required for this session.`}
      systemContext={systemContext}
      backTo="/intro"
      upsellContent={upsellContent}
    >
      {/* Empty children - voice interface will render first, upsell below */}
    </SessionPage>
  );
};

export default GuestIntroSessionPage;
