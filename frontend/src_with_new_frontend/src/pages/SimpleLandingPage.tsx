import React from 'react';
import { Link } from 'react-router-dom';
import { HandDrawnButton } from '../components/HandDrawnButton';

export function SimpleLandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A] font-sans">
      {/* Simple Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#1A1A1A]/20 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="font-heading font-bold italic text-xl group-hover:text-[#DC2626] transition-colors">
              language coach
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="font-medium hover:text-[#DC2626] transition-colors">
              Log In
            </Link>
            <Link to="/signup">
              <HandDrawnButton variant="primary" className="py-2 px-4 text-sm">
                Sign Up
              </HandDrawnButton>
            </Link>
          </div>
        </div>
      </nav>

      {/* Simplified Hero Section */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="text-center">
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Learn languages through conversation
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Practice speaking with your AI language coach. Choose structured lessons, 
            discuss topics you love, or just chat about your day.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link to="/signup" className="w-full sm:w-auto">
              <HandDrawnButton variant="primary" className="w-full sm:w-auto text-lg py-4 px-8">
                Start Learning Free
              </HandDrawnButton>
            </Link>
            <Link to="/learn" className="w-full sm:w-auto">
              <HandDrawnButton variant="outline" className="w-full sm:w-auto text-lg py-4 px-8">
                Try a Demo
              </HandDrawnButton>
            </Link>
          </div>

          {/* Simple Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                title: 'Structured Lessons',
                desc: 'Follow a curriculum from basics to advanced topics'
              },
              {
                title: 'Topic Conversations',
                desc: 'Discuss subjects you care about in your target language'
              },
              {
                title: 'Freestyle Chat',
                desc: 'Practice speaking naturally about anything'
              }
            ].map((feature, idx) => (
              <div key={idx} className="text-center">
                <h3 className="font-heading text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Simple Language List */}
          <div className="mb-16">
            <h2 className="font-heading text-2xl font-bold text-center mb-8">
              Languages Available
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {['🇪🇸 Spanish', '🇫🇷 French', '🇯🇵 Japanese', '🇩🇪 German', '🇮🇹 Italian', '🇧🇷 Portuguese'].map((lang, idx) => (
                <div key={idx} className="px-4 py-2 border border-[#1A1A1A] rounded-full">
                  {lang}
                </div>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold mb-6">
              Ready to start speaking?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Join learners having real conversations in new languages.
            </p>
            <Link to="/signup">
              <HandDrawnButton variant="primary" className="text-xl py-5 px-10">
                Create Free Account
              </HandDrawnButton>
            </Link>
          </div>
        </div>
      </main>

      {/* Simple Footer */}
      <footer className="bg-[#FAFAF8] py-8 px-4 sm:px-6 lg:px-8 border-t border-[#1A1A1A]/20 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <span className="font-heading font-bold italic text-xl text-[#1A1A1A]">
            language coach
          </span>
          <p className="text-gray-500 text-sm">
            © 2026 Language Coach. Learn through conversation.
          </p>
        </div>
      </footer>
    </div>
  );
}
