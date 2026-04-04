import React from 'react';
import { Link } from 'react-router-dom';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnButton } from '../components/HandDrawnButton';

function StaticPageLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#1A1A1A]">
      <nav className="sticky top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-sm border-b-2 border-[#1A1A1A] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="font-heading font-bold italic text-2xl hover:text-[#DC2626] transition-colors">
            language coach
          </Link>
          <Link to="/login">
            <HandDrawnButton variant="primary" className="py-2 px-4 text-sm">
              Log In
            </HandDrawnButton>
          </Link>
        </div>
      </nav>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="font-heading text-4xl font-bold mb-8">{title}</h1>
        <HandDrawnCard rotate="none">
          {children}
        </HandDrawnCard>
      </main>
    </div>
  );
}

export function AboutPage() {
  return (
    <StaticPageLayout title="About">
      <p className="text-gray-600 leading-relaxed mb-4">
        Language Coach is an AI-powered language learning platform that helps you
        practice speaking naturally through real conversations.
      </p>
      <p className="text-gray-600 leading-relaxed">
        Our mission is to make language learning feel like chatting with a friend
        — natural, engaging, and effective.
      </p>
    </StaticPageLayout>
  );
}

export function PrivacyPage() {
  return (
    <StaticPageLayout title="Privacy Policy">
      <p className="text-gray-600 leading-relaxed mb-4">
        Your privacy matters to us. This page will be updated with our full
        privacy policy.
      </p>
      <p className="text-gray-600 leading-relaxed">
        We are committed to protecting your personal data and being transparent
        about how we use it.
      </p>
    </StaticPageLayout>
  );
}

export function TermsPage() {
  return (
    <StaticPageLayout title="Terms of Service">
      <p className="text-gray-600 leading-relaxed mb-4">
        This page will be updated with our full terms of service.
      </p>
      <p className="text-gray-600 leading-relaxed">
        By using Language Coach, you agree to use the platform responsibly and in
        accordance with applicable laws.
      </p>
    </StaticPageLayout>
  );
}
