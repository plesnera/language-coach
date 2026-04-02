import React, { FormEvent, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { HandDrawnButton } from "../components/HandDrawnButton";
import { HandDrawnCard } from "../components/HandDrawnCard";
import { HandDrawnInput } from "../components/HandDrawnInput";
import {
  SquigglyLine,
  MicrophoneDoodle,
  GlobeDoodle,
  StarDoodle,
} from "../components/DoodleDecorations";
import { useAuth } from "../contexts/AuthContext";
import {
  canStartGuestSession,
  getGuestSessionsRemaining,
  recordGuestSessionStart,
  GUEST_SESSION_LIMIT,
} from "../utils/guestAccess";

type LanguageOption = {
  id: string;
  name: string;
  flag: string;
};

type GoalOption = {
  id: string;
  label: string;
  helper: string;
  opener: string;
};

const MAX_TOPIC_LENGTH = 140;

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: "spanish", name: "Spanish", flag: "🇪🇸" },
  { id: "french", name: "French", flag: "🇫🇷" },
  { id: "japanese", name: "Japanese", flag: "🇯🇵" },
  { id: "german", name: "German", flag: "🇩🇪" },
];

const GOAL_OPTIONS: GoalOption[] = [
  {
    id: "confidence",
    label: "Build speaking confidence",
    helper: "Short, encouraging back-and-forth with gentle corrections.",
    opener: "Let's keep this simple and natural so you can speak confidently.",
  },
  {
    id: "travel",
    label: "Prepare for travel conversations",
    helper: "Useful phrases for daily situations while traveling.",
    opener: "Great choice — we'll focus on practical phrases you can use right away.",
  },
  {
    id: "smalltalk",
    label: "Practice everyday small talk",
    helper: "Friendly real-life conversation starters and responses.",
    opener: "Perfect. We'll practice short, natural small-talk exchanges.",
  },
];

function buildPreview(
  language: LanguageOption,
  goal: GoalOption,
  topic: string,
): string {
  return [
    `${goal.opener}`,
    `In ${language.name}, let's start with: "${topic}".`,
    "I'll give you one sentence to try, then we will improve it together.",
  ].join(" ");
}

export function IntroFlowPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const isGuest = !user;
  const requestedNextPath = searchParams.get("next");
  const authQuery = requestedNextPath
    ? `?next=${encodeURIComponent(requestedNextPath)}`
    : "";
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>(
    LANGUAGE_OPTIONS[0].id,
  );
  const [selectedGoalId, setSelectedGoalId] = useState<string>(
    GOAL_OPTIONS[0].id,
  );
  const [topic, setTopic] = useState<string>("Ordering coffee");
  const [showValidation, setShowValidation] = useState(false);
  const [coachPreview, setCoachPreview] = useState<string | null>(null);
  const [guestGateMessage, setGuestGateMessage] = useState<string | null>(null);
  const [remainingGuestSessions, setRemainingGuestSessions] = useState(
    getGuestSessionsRemaining(),
  );

  const selectedLanguage = useMemo(
    () =>
      LANGUAGE_OPTIONS.find((option) => option.id === selectedLanguageId) ??
      LANGUAGE_OPTIONS[0],
    [selectedLanguageId],
  );
  const selectedGoal = useMemo(
    () =>
      GOAL_OPTIONS.find((option) => option.id === selectedGoalId) ??
      GOAL_OPTIONS[0],
    [selectedGoalId],
  );

  const normalizedTopic = topic.trim();
  const topicTooLong = topic.length > MAX_TOPIC_LENGTH;
  const topicMissing = showValidation && normalizedTopic.length === 0;
  const topicError = topicMissing
    ? "Enter a topic to generate your first coaching reply."
    : topicTooLong
      ? `Keep the topic under ${MAX_TOPIC_LENGTH} characters.`
      : undefined;
  const canGenerate = normalizedTopic.length > 0 && !topicTooLong;

  const launchGuestSession = () => {
    if (isGuest) {
      if (!canStartGuestSession()) {
        setRemainingGuestSessions(getGuestSessionsRemaining());
        setGuestGateMessage(
          "Guest session limit reached. Create a free account to keep learning from where you left off.",
        );
        return;
      }
      recordGuestSessionStart();
      setRemainingGuestSessions(getGuestSessionsRemaining());
      setGuestGateMessage(null);
    }
    const params = new URLSearchParams({
      lang: selectedLanguage.id,
      goal: selectedGoal.id,
      topic: normalizedTopic || "everyday conversation",
    });
    if (requestedNextPath) {
      params.set("next", requestedNextPath);
    }
    navigate(`/intro/session?${params.toString()}`);
  };

  const handleGeneratePreview = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowValidation(true);
    if (!canGenerate) {
      return;
    }
    setCoachPreview(buildPreview(selectedLanguage, selectedGoal, normalizedTopic));
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <nav className="sticky top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-sm border-b-2 border-[#1A1A1A] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="font-heading font-bold italic text-2xl">
            language coach
          </Link>
          <div className="flex items-center gap-3">
            <Link to={`/login${authQuery}`}>
              <HandDrawnButton variant="outline" className="py-2 px-4 text-sm">
                Log In
              </HandDrawnButton>
            </Link>
            <Link to={`/signup${authQuery}`}>
              <HandDrawnButton variant="primary" className="py-2 px-4 text-sm">
                Sign Up
              </HandDrawnButton>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        <GlobeDoodle className="absolute top-10 right-8 w-24 h-24 text-[#F59E0B] opacity-25 rotate-12 hidden lg:block" />
        <StarDoodle className="absolute bottom-12 left-6 w-20 h-20 text-[#DC2626] opacity-20 -rotate-12 hidden lg:block" />

        <section className="max-w-3xl mb-8">
          <div className="inline-block relative mb-4">
            <h1 className="font-heading text-4xl md:text-5xl font-bold">
              Try a guest intro session
            </h1>
            <SquigglyLine className="absolute -bottom-3 left-0 w-full h-3 text-[#DC2626]" />
          </div>
          <p className="text-gray-700 text-lg leading-relaxed">
            Start with a quick no-signup trial. After your first value moment,
            you can continue as a guest or create an account to save your
            momentum.
          </p>
          {isGuest && (
            <p className="mt-3 text-sm font-semibold text-[#1A1A1A]">
              Guest sessions remaining: {remainingGuestSessions} / {GUEST_SESSION_LIMIT}
            </p>
          )}
        </section>

        <HandDrawnCard rotate="none" className="max-w-4xl">
          <form onSubmit={handleGeneratePreview} className="space-y-8">
            <fieldset>
              <legend className="font-heading font-bold text-2xl mb-3">
                1) Choose your language
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LANGUAGE_OPTIONS.map((option) => {
                  const selected = option.id === selectedLanguage.id;
                  return (
                    <label
                      key={option.id}
                      className={`border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-3 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[#F59E0B] ${
                        selected
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-white text-[#1A1A1A]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="intro-language"
                        value={option.id}
                        checked={selected}
                        onChange={() => setSelectedLanguageId(option.id)}
                        className="sr-only"
                      />
                      <span className="font-medium text-lg flex items-center gap-2">
                        <span aria-hidden="true">{option.flag}</span>
                        {option.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="font-heading font-bold text-2xl mb-3">
                2) Pick your goal
              </legend>
              <div className="space-y-3">
                {GOAL_OPTIONS.map((option) => {
                  const selected = option.id === selectedGoal.id;
                  return (
                    <label
                      key={option.id}
                      className={`block border-2 border-[#1A1A1A] hand-drawn-border-alt p-4 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[#F59E0B] ${
                        selected
                          ? "bg-[#1A1A1A] text-white"
                          : "bg-white text-[#1A1A1A]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="intro-goal"
                        value={option.id}
                        checked={selected}
                        onChange={() => setSelectedGoalId(option.id)}
                        className="sr-only"
                      />
                      <span className="block font-semibold">{option.label}</span>
                      <span
                        className={`block mt-1 text-sm ${
                          selected ? "text-gray-100" : "text-gray-600"
                        }`}
                      >
                        {option.helper}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <div className="max-w-2xl">
                <HandDrawnInput
                  label="3) What do you want to talk about first?"
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  error={topicError}
                  placeholder="Example: ordering coffee at a café"
                  aria-describedby="intro-topic-help intro-topic-count"
                />
              </div>
              <div className="flex justify-between mt-2 text-sm text-gray-600">
                <p id="intro-topic-help">
                  Keep it short and concrete for the fastest warm-up.
                </p>
                <p id="intro-topic-count" aria-live="polite">
                  {topic.length}/{MAX_TOPIC_LENGTH}
                </p>
              </div>
            </div>

            <HandDrawnButton
              type="submit"
              variant="primary"
              className="w-full sm:w-auto text-lg px-8"
            >
              Generate my first coaching reply
              <Sparkles size={18} />
            </HandDrawnButton>
          </form>
        </HandDrawnCard>

        <section className="mt-8 space-y-5" aria-live="polite">
          {coachPreview && (
            <>
              {guestGateMessage && (
                <p className="text-[#DC2626] font-semibold" role="status" aria-live="polite">
                  {guestGateMessage}
                </p>
              )}
              <HandDrawnCard rotate="right" className="max-w-4xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full border-2 border-[#1A1A1A] bg-[#DC2626]/10 flex items-center justify-center shrink-0">
                    <MicrophoneDoodle className="w-6 h-6 text-[#DC2626]" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="font-heading text-2xl font-bold">
                      Your first value moment
                    </h2>
                    <p className="text-gray-700 leading-relaxed">{coachPreview}</p>
                    <div className="pt-2">
                      <HandDrawnButton
                        variant="secondary"
                        className="text-base px-6"
                        onClick={launchGuestSession}
                        disabled={isGuest && remainingGuestSessions <= 0}
                      >
                        Continue as guest
                        <ArrowRight size={18} />
                      </HandDrawnButton>
                    </div>
                  </div>
                </div>
              </HandDrawnCard>

              <HandDrawnCard dashed className="max-w-4xl bg-[#F59E0B]/10">
                <h3 className="font-heading text-2xl font-bold mb-3">
                  Save your momentum
                </h3>
                <p className="text-gray-700 mb-4">
                  You can keep practicing as a guest. When you are ready, a free
                  account unlocks:
                </p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={18}
                      className="text-[#1A1A1A] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Personalized curriculum based on your level and goals</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={18}
                      className="text-[#1A1A1A] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>Progress tracking so you can measure improvement over time</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2
                      size={18}
                      className="text-[#1A1A1A] mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span>
                      Topic chats based on content you upload (articles, notes, and
                      study material)
                    </span>
                  </li>
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to={`/signup${authQuery}`} className="sm:w-auto w-full">
                    <HandDrawnButton variant="primary" className="w-full sm:w-auto">
                      Create free account
                    </HandDrawnButton>
                  </Link>
                  <Link to={`/login${authQuery}`} className="sm:w-auto w-full">
                    <HandDrawnButton variant="outline" className="w-full sm:w-auto">
                      I already have an account
                    </HandDrawnButton>
                  </Link>
                  <HandDrawnButton
                    variant="secondary"
                    className="w-full sm:w-auto"
                    onClick={launchGuestSession}
                    disabled={isGuest && remainingGuestSessions <= 0}
                  >
                    Continue as guest
                  </HandDrawnButton>
                </div>
              </HandDrawnCard>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default IntroFlowPage;
