import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppNavbar } from '../components/AppNavbar';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnButton } from '../components/HandDrawnButton';
import {
  SquigglyLine,
  MicrophoneDoodle,
  GlobeDoodle,
} from '../components/DoodleDecorations';
import { Mic, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.DEV
  ? `http://${window.location.hostname}:8000`
  : '';

interface Language {
  id: string;
  name: string;
  enabled: boolean;
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

export function FreestylePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLangId, setSelectedLangId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${user?.token}` };

  const loadLanguages = useCallback(async () => {
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

  const selectedLang = languages.find((l) => l.id === selectedLangId);

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
        <GlobeDoodle className="absolute bottom-40 left-10 w-32 h-32 text-[#DC2626] opacity-20 -rotate-12 hidden lg:block" />

        {/* Language selector */}
        <div className="mb-10">
          <div className="inline-block relative mb-8">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1A1A1A]">
              Freestyle
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

        {/* Freestyle card */}
        {selectedLang && (
          <div className="max-w-2xl mx-auto">
            <HandDrawnCard rotate="none" className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-[#DC2626]/10 border-2 border-[#1A1A1A] flex items-center justify-center hand-drawn-border">
                <MicrophoneDoodle className="w-10 h-10 text-[#DC2626]" />
              </div>
              <h2 className="font-heading text-3xl font-bold text-[#1A1A1A] mb-3">
                Free Conversation
              </h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Have an open-ended conversation in {selectedLang.name} about
                anything you like. Your AI coach will guide you and help correct
                mistakes along the way.
              </p>
              <HandDrawnButton
                variant="primary"
                className="text-lg px-8 py-3"
                onClick={() => navigate(`/freestyle/session?lang=${selectedLangId}`)}
              >
                Start Talking <Mic size={20} />
              </HandDrawnButton>
            </HandDrawnCard>
          </div>
        )}
      </main>
    </div>
  );
}

export default FreestylePage;
