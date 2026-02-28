import React from 'react';
import { AppNavbar } from '../components/AppNavbar';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnButton } from '../components/HandDrawnButton';
import {
  SquigglyLine,
  BookDoodle,
  GlobeDoodle } from
'../components/DoodleDecorations';
import { ChevronRight } from 'lucide-react';
export function LearnPage() {
  const languages = [
  {
    name: 'Spanish',
    flag: '🇪🇸',
    progress: 65,
    lessons: 12
  },
  {
    name: 'French',
    flag: '🇫🇷',
    progress: 30,
    lessons: 5
  },
  {
    name: 'Japanese',
    flag: '🇯🇵',
    progress: 10,
    lessons: 2
  }];

  const currentLessons = [
  {
    id: 1,
    title: 'Greetings & Introductions',
    desc: 'Learn how to say hello and introduce yourself.',
    difficulty: 1,
    completed: true
  },
  {
    id: 2,
    title: 'At the Market',
    desc: 'Essential vocabulary for shopping and numbers.',
    difficulty: 2,
    completed: false
  },
  {
    id: 3,
    title: 'Asking for Directions',
    desc: 'Navigate the city with confidence.',
    difficulty: 2,
    completed: false
  },
  {
    id: 4,
    title: 'Making Friends',
    desc: 'Casual conversation starters and hobbies.',
    difficulty: 3,
    completed: false
  }];

  return (
    <div className="min-h-screen flex flex-col">
      <AppNavbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 relative">
        {/* Decorative elements */}
        <BookDoodle className="absolute top-20 right-10 w-24 h-24 text-[#F59E0B] opacity-30 rotate-12 hidden lg:block" />
        <GlobeDoodle className="absolute bottom-40 left-10 w-32 h-32 text-[#DC2626] opacity-20 -rotate-12 hidden lg:block" />

        <div className="mb-16">
          <div className="inline-block relative mb-8">
            <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1A1A1A]">
              Your Languages
            </h1>
            <SquigglyLine className="absolute -bottom-3 left-0 w-full h-3 text-[#DC2626]" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {languages.map((lang, idx) =>
            <HandDrawnCard
              key={lang.name}
              rotate={idx % 2 === 0 ? 'left' : 'right'}
              className="flex flex-col">

                <div className="flex items-center gap-4 mb-6">
                  <span className="text-4xl">{lang.flag}</span>
                  <div>
                    <h3 className="font-heading text-2xl font-bold">
                      {lang.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {lang.lessons} lessons completed
                    </p>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>Progress</span>
                    <span>{lang.progress}%</span>
                  </div>
                  {/* Hand-drawn progress bar */}
                  <div className="h-4 w-full bg-gray-100 hand-drawn-border-alt border-2 border-[#1A1A1A] overflow-hidden">
                    <div
                    className="h-full bg-[#F59E0B] border-r-2 border-[#1A1A1A]"
                    style={{
                      width: `${lang.progress}%`
                    }} />

                  </div>
                </div>
              </HandDrawnCard>
            )}

            <HandDrawnCard
              dashed
              rotate="none"
              className="flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 min-h-[200px]">

              <div className="w-12 h-12 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center mb-4 text-2xl">
                +
              </div>
              <h3 className="font-heading text-xl font-bold">Add Language</h3>
            </HandDrawnCard>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-heading text-3xl font-bold text-[#1A1A1A]">
              Current Lessons
            </h2>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-[#1A1A1A]"></span>
              <span className="w-3 h-3 rounded-full bg-gray-300"></span>
              <span className="w-3 h-3 rounded-full bg-gray-300"></span>
            </div>
          </div>

          <div className="space-y-4">
            {currentLessons.map((lesson, idx) =>
            <HandDrawnCard
              key={lesson.id}
              rotate={
              idx % 3 === 0 ? 'left' : idx % 2 === 0 ? 'right' : 'none'
              }
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${lesson.completed ? 'opacity-75 bg-gray-50' : ''}`}>

                <div className="flex items-start gap-4">
                  <div
                  className={`w-10 h-10 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center font-bold shrink-0 ${lesson.completed ? 'bg-[#1A1A1A] text-white' : 'bg-white'}`}>

                    {lesson.completed ? '✓' : lesson.id}
                  </div>
                  <div>
                    <h3 className="font-heading text-xl font-bold mb-1">
                      {lesson.title}
                    </h3>
                    <p className="text-gray-600">{lesson.desc}</p>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3].map((dot) =>
                    <span
                      key={dot}
                      className={`w-2 h-2 rounded-full border border-[#1A1A1A] ${dot <= lesson.difficulty ? 'bg-[#DC2626]' : 'bg-transparent'}`} />

                    )}
                    </div>
                  </div>
                </div>

                <HandDrawnButton
                variant={lesson.completed ? 'outline' : 'primary'}
                className="sm:w-auto w-full shrink-0">

                  {lesson.completed ? 'Review' : 'Start'}
                  {!lesson.completed && <ChevronRight size={18} />}
                </HandDrawnButton>
              </HandDrawnCard>
            )}
          </div>
        </div>
      </main>
    </div>);

}