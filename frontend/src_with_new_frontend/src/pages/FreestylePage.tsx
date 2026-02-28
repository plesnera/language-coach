import React, { useState } from 'react';
import { AppNavbar } from '../components/AppNavbar';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnButton } from '../components/HandDrawnButton';
import {
  MicrophoneDoodle,
  ChatBubbleDoodle } from
'../components/DoodleDecorations';
import { Send } from 'lucide-react';
export function FreestylePage() {
  const [message, setMessage] = useState('');
  const starters = [
  'Tell me about your day',
  'What are your hobbies?',
  'Describe your hometown',
  'What did you eat today?',
  'Talk about your favorite movie'];

  const messages = [
  {
    id: 1,
    sender: 'coach',
    text: "¡Hola! I'm your language coach. What would you like to talk about today?",
    time: '10:00 AM'
  },
  {
    id: 2,
    sender: 'user',
    text: 'Hola. Me gustaría hablar sobre mi película favorita.',
    time: '10:01 AM'
  },
  {
    id: 3,
    sender: 'coach',
    text: '¡Excelente! ¿Cuál es tu película favorita y por qué te gusta tanto?',
    time: '10:01 AM'
  }];

  return (
    <div className="min-h-screen flex flex-col h-screen">
      <AppNavbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col min-h-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center hand-drawn-border border-2 border-[#1A1A1A]">
              <MicrophoneDoodle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold text-[#1A1A1A]">
                Freestyle
              </h1>
              <p className="text-gray-600 text-sm">
                Just talk about whatever's on your mind!
              </p>
            </div>
          </div>

          <select className="bg-white border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50 cursor-pointer">
            <option>🇪🇸 Spanish</option>
            <option>🇫🇷 French</option>
            <option>🇯🇵 Japanese</option>
          </select>
        </div>

        {/* Chat Area */}
        <HandDrawnCard className="flex-1 flex flex-col min-h-0 p-0 overflow-hidden bg-white/50">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg) =>
            <div
              key={msg.id}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>

                <div
                className={`max-w-[80%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                  {msg.sender === 'coach' &&
                <div className="w-8 h-8 rounded-full border-2 border-[#1A1A1A] bg-[#F59E0B] flex items-center justify-center shrink-0 mt-1">
                      <ChatBubbleDoodle className="w-4 h-4 text-white" />
                    </div>
                }

                  <div>
                    <div
                    className={`
                      p-4 border-2 border-[#1A1A1A] text-[15px] leading-relaxed
                      ${msg.sender === 'user' ? 'bg-[#1A1A1A] text-white rounded-[20px_20px_0px_20px]' : 'bg-white text-[#1A1A1A] rounded-[20px_20px_20px_0px] hand-drawn-shadow-sm'}
                    `}>

                      {msg.text}
                    </div>
                    <div
                    className={`text-xs text-gray-500 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>

                      {msg.time}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t-2 border-[#1A1A1A] bg-white">
            <div className="mb-4 overflow-x-auto pb-2 flex gap-2 hide-scrollbar">
              {starters.map((starter, idx) =>
              <button
                key={idx}
                onClick={() => setMessage(starter)}
                className="whitespace-nowrap px-4 py-1.5 text-sm border-2 border-[#1A1A1A] hand-drawn-border-pill hover:bg-gray-50 transition-colors">

                  {starter}
                </button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (message) setMessage('');
              }}
              className="flex gap-3">

              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-transparent border-2 border-[#1A1A1A] hand-drawn-border-alt px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50" />

              <HandDrawnButton
                type="submit"
                className="px-4 shrink-0"
                disabled={!message.trim()}>

                <Send size={20} />
              </HandDrawnButton>
            </form>
          </div>
        </HandDrawnCard>
      </main>
    </div>);

}