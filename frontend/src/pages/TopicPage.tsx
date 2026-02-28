import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppNavbar } from '../components/AppNavbar';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnButton } from '../components/HandDrawnButton';
import { HandDrawnInput } from '../components/HandDrawnInput';
import { SpeechBubble, PencilDoodle } from '../components/DoodleDecorations';
import { Upload } from 'lucide-react';

export function TopicPage() {
  const [customText, setCustomText] = useState('');
  const navigate = useNavigate();
  const topics = [
  {
    id: 'travel',
    icon: '✈️',
    name: 'Travel',
    desc: 'Airports, hotels, and sightseeing.'
  },
  {
    id: 'food',
    icon: '🍳',
    name: 'Food & Cooking',
    desc: 'Ordering at restaurants and recipes.'
  },
  {
    id: 'sports',
    icon: '⚽️',
    name: 'Sports',
    desc: 'Games, teams, and staying active.'
  },
  {
    id: 'music',
    icon: '🎵',
    name: 'Music',
    desc: 'Genres, instruments, and concerts.'
  },
  {
    id: 'movies',
    icon: '🎬',
    name: 'Movies',
    desc: 'Plot summaries and actor discussions.'
  },
  {
    id: 'tech',
    icon: '💻',
    name: 'Technology',
    desc: 'Gadgets, software, and the internet.'
  },
  {
    id: 'nature',
    icon: '🌲',
    name: 'Nature',
    desc: 'Weather, animals, and the outdoors.'
  },
  {
    id: 'culture',
    icon: '🏛️',
    name: 'Culture',
    desc: 'Traditions, holidays, and history.'
  }];

  return (
    <div className="min-h-screen flex flex-col">
      <AppNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative">
        <SpeechBubble className="absolute top-10 right-20 w-32 h-32 text-[#DC2626] opacity-10 rotate-12 hidden lg:block" />
        <PencilDoodle className="absolute bottom-40 left-10 w-24 h-24 text-[#F59E0B] opacity-20 -rotate-45 hidden lg:block" />

        <div className="text-center mb-12">
          <div className="inline-block relative">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
              Pick a Topic
            </h1>
            <svg
              className="absolute -top-6 -right-8 w-12 h-12 text-[#F59E0B]"
              viewBox="0 0 100 100"
              fill="none">

              <path
                d="M50 10 L 60 40 L 90 45 L 65 65 L 75 95 L 50 75 L 25 95 L 35 65 L 10 45 L 40 40 Z"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round" />

            </svg>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose a conversation topic or bring your own material to discuss!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {topics.map((topic, idx) =>
          <HandDrawnCard
            key={topic.name}
            rotate={idx % 2 === 0 ? 'left' : 'right'}
            className="flex flex-col h-full">

              <div className="text-4xl mb-4">{topic.icon}</div>
              <h3 className="font-heading text-xl font-bold mb-2">
                {topic.name}
              </h3>
              <p className="text-gray-600 text-sm mb-6 flex-1">{topic.desc}</p>
              <HandDrawnButton
                variant="outline"
                className="w-full mt-auto"
                onClick={() => navigate(`/topics/${topic.id}`)}>
                Start
              </HandDrawnButton>
            </HandDrawnCard>
          )}
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="font-heading text-3xl font-bold text-[#1A1A1A]">
              Upload Your Own
            </h2>
            <div className="h-0.5 flex-1 bg-[#1A1A1A] opacity-20 rounded-full"></div>
          </div>

          <HandDrawnCard dashed rotate="none" className="bg-[#FAFAF8]">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-16 h-16 rounded-full border-2 border-[#1A1A1A] bg-white flex items-center justify-center mb-4 hand-drawn-border">
                <Upload size={28} />
              </div>
              <h3 className="font-heading text-xl font-bold mb-2">
                Paste or upload text
              </h3>
              <p className="text-gray-600 text-sm">
                Got an article, email, or story you want to practice with? Paste
                it here.
              </p>
            </div>

            <HandDrawnInput
              multiline
              rows={6}
              placeholder="Paste your text here..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="mb-6 bg-white" />

            <div className="flex justify-end">
              <HandDrawnButton disabled={!customText.trim()}>
                Start Conversation
              </HandDrawnButton>
            </div>
          </HandDrawnCard>
        </div>
      </main>
    </div>);

}

export default TopicPage;
