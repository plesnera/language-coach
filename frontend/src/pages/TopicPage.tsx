import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppNavbar } from '../components/AppNavbar';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnButton } from '../components/HandDrawnButton';
import {
  SquigglyLine,
  SpeechBubble,
  GlobeDoodle,
} from '../components/DoodleDecorations';
import { CheckCircle2, ChevronRight, Loader2, Lock, Mic, Wifi } from 'lucide-react';

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : '';

interface Language {
  id: string;
  name: string;
  enabled: boolean;
}

interface Topic {
  id: string;
  language_id: string;
  title: string;
  description: string;
  conversation_prompt: string;
  sort_order: number;
  image_url?: string;
}

const FLAG_MAP: Record<string, string> = {
  spanish: '🇪🇸',
  french: '🇫🇷',
  japanese: '🇯🇵',
  german: '🇩🇪',
  italian: '🇮🇹',
  portuguese: '🇵🇹',
  chinese: '🇨🇳',
  korean: '🇰🇷',
  arabic: '🇸🇦',
  hindi: '🇮🇳',
  russian: '🇷🇺',
  english: '🇬🇧',
};

const getFlag = (name: string) => FLAG_MAP[name.toLowerCase()] ?? '🌍';
const TOPIC_PREVIEW_ITEMS = [
  {
    title: 'Travel planning',
    description: 'Practice practical dialogues for itineraries, transit, and check-in.',
  },
  {
    title: 'Food and dining',
    description: 'Role-play ordering, preferences, and everyday restaurant conversations.',
  },
  {
    title: 'Work and introductions',
    description: 'Build confidence introducing yourself and discussing your background.',
  },
];

function TopicGuestPreview() {
  const nextTarget = encodeURIComponent('/topics');
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
      <AppNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative">
        <SpeechBubble className="absolute top-20 right-10 w-24 h-24 text-[#DC2626] opacity-20 rotate-12 hidden lg:block" />
        <GlobeDoodle className="absolute bottom-40 left-10 w-32 h-32 text-[#F59E0B] opacity-20 -rotate-12 hidden lg:block" />

        <div className="mb-10">
          <div className="inline-block relative mb-5">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1A1A1A]">
              Topics
            </h1>
            <SquigglyLine className="absolute -bottom-3 left-0 w-full h-3 text-[#DC2626]" />
          </div>
          <p className="text-gray-700 max-w-3xl">
            Explore guided topic conversations. Each dialogue is powered by a
            specialized AI coach in the language you are practicing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <HandDrawnCard dashed className="bg-[#F59E0B]/10">
            <h2 className="font-heading text-2xl font-bold mb-3">How it works</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#1A1A1A]" aria-hidden="true" />
                Dialogue-based practice around meaningful topics instead of isolated vocabulary drills.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[#1A1A1A]" aria-hidden="true" />
                The AI coach adapts replies and gives targeted phrasing improvements.
              </li>
            </ul>
          </HandDrawnCard>

          <HandDrawnCard rotate="right">
            <h2 className="font-heading text-2xl font-bold mb-3">Requirements</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <Mic size={18} className="mt-0.5 shrink-0 text-[#1A1A1A]" aria-hidden="true" />
                Audio-enabled browser with microphone access.
              </li>
              <li className="flex items-start gap-2">
                <Wifi size={18} className="mt-0.5 shrink-0 text-[#1A1A1A]" aria-hidden="true" />
                Stable internet connection for realtime voice interaction.
              </li>
            </ul>
          </HandDrawnCard>
        </div>

        <HandDrawnCard rotate="none">
          <h2 className="font-heading text-2xl font-bold mb-3">Preview topics</h2>
          <p className="text-gray-600 mb-5">
            Create a free account to unlock interactive topic sessions and saved progress.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TOPIC_PREVIEW_ITEMS.map((topic, idx) => (
              <div
                key={topic.title}
                className="border-2 border-[#1A1A1A] hand-drawn-border-alt bg-white p-4 flex flex-col h-full"
              >
                <p className="text-sm font-semibold text-gray-500 mb-1">Topic {idx + 1}</p>
                <h3 className="font-heading text-xl font-bold mb-2">{topic.title}</h3>
                <p className="text-gray-600 flex-1">{topic.description}</p>
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
                  <Lock size={16} aria-hidden="true" />
                  Account required
                </p>
              </div>
            ))}
          </div>
        </HandDrawnCard>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link to={`/intro?next=${nextTarget}`} className="w-full sm:w-auto">
            <HandDrawnButton className="w-full sm:w-auto" variant="secondary">
              Try guest intro
            </HandDrawnButton>
          </Link>
          <Link to={`/signup?next=${nextTarget}`} className="w-full sm:w-auto">
            <HandDrawnButton className="w-full sm:w-auto" variant="primary">
              Create free account
            </HandDrawnButton>
          </Link>
          <Link to={`/login?next=${nextTarget}`} className="w-full sm:w-auto">
            <HandDrawnButton className="w-full sm:w-auto" variant="outline">
              Log In
            </HandDrawnButton>
          </Link>
        </div>
      </main>
    </div>
  );
}

export function TopicPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isGuest = !user;

  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${user?.token}` };

  const loadLanguages = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      setError(null);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/api/languages/`, { headers });
      if (!res.ok) throw new Error('Failed to load languages');
      const langs: Language[] = await res.json();
      setLanguages(langs);
      if (langs.length > 0 && !selectedLangId) {
        setSelectedLangId(langs[0].id);
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadLanguages();
  }, [loadLanguages]);

  useEffect(() => {
    if (!selectedLangId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/topics/?language_id=${selectedLangId}`,
          { headers },
        );
        if (!cancelled) {
          if (res.ok) {
            setTopics(await res.json());
          } else {
            setTopics([]);
          }
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedLangId, user?.token]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectedLang = languages.find((l) => l.id === selectedLangId);
  if (isGuest) {
    return <TopicGuestPreview />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
        <AppNavbar />
        <div className="flex-1 flex items-center justify-center">
          <HandDrawnCard className="max-w-md text-center">
            <p className="text-[#DC2626] font-bold mb-4">{error}</p>
            <HandDrawnButton variant="primary" onClick={loadLanguages}>
              Retry
            </HandDrawnButton>
          </HandDrawnCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
      <AppNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative">
        <SpeechBubble className="absolute top-20 right-10 w-24 h-24 text-[#DC2626] opacity-20 rotate-12 hidden lg:block" />
        <GlobeDoodle className="absolute bottom-40 left-10 w-32 h-32 text-[#F59E0B] opacity-20 -rotate-12 hidden lg:block" />

        {/* Language selector */}
        <div className="mb-10">
          <div className="inline-block relative mb-8">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1A1A1A]">
              Topics
            </h1>
            <SquigglyLine className="absolute -bottom-3 left-0 w-full h-3 text-[#DC2626]" />
          </div>

          {languages.length === 0 ? (
            <p className="text-gray-500">No languages available yet.</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {languages.map((lang) => {
                const isSelected = selectedLangId === lang.id;
                return (
                  <button
                    key={lang.id}
                    onClick={() => setSelectedLangId(lang.id)}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 border-2 border-[#1A1A1A]
                      hand-drawn-border-alt font-medium transition-colors
                      ${isSelected
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-white text-[#1A1A1A] hover:bg-gray-50'
                      }
                    `}
                  >
                    <span className="text-xl">{getFlag(lang.name)}</span>
                    {lang.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Topics grid */}
        {selectedLang && (
          <div>
            <div className="text-center mb-10 relative">
              <h2 className="font-heading text-3xl font-bold text-[#1A1A1A] mb-2">
                Pick a Topic
              </h2>
              <p className="text-gray-600 max-w-xl mx-auto">
                Choose a conversation topic to practice {selectedLang.name} with your AI coach.
              </p>
            </div>

            {topics.length === 0 ? (
              <p className="text-gray-500 text-center">No topics available for {selectedLang.name} yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {topics.map((topic, idx) => (
                  <HandDrawnCard
                    key={topic.id}
                    rotate={idx % 2 === 0 ? 'left' : 'right'}
                    className="flex flex-col h-full"
                  >
                    {topic.image_url && (
                      <div className="w-full h-32 mb-4 border-2 border-[#1A1A1A] hand-drawn-border overflow-hidden rounded-md shrink-0">
                        <img
                          src={`${API_BASE}${topic.image_url}`}
                          alt={topic.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <h3 className="font-heading text-xl font-bold mb-2">
                      {topic.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-6 flex-1">
                      {topic.description}
                    </p>
                    <HandDrawnButton
                      variant="outline"
                      className="w-full mt-auto"
                      onClick={() => navigate(`/topics/${topic.id}`)}
                    >
                      Start <ChevronRight size={18} />
                    </HandDrawnButton>
                  </HandDrawnCard>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default TopicPage;
