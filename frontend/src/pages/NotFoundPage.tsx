import React from 'react';
import { Link } from 'react-router-dom';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnButton } from '../components/HandDrawnButton';
import { SquigglyLine } from '../components/DoodleDecorations';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <HandDrawnCard className="max-w-md w-full text-center">
        <h1 className="font-heading text-3xl font-bold text-[#DC2626] mb-4 relative inline-block">
          404 - Page Not Found
          <SquigglyLine className="absolute -bottom-2 left-0 w-full h-2 text-[#1A1A1A]" />
        </h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <HandDrawnButton variant="primary" className="w-full">
            Back to Home
          </HandDrawnButton>
        </Link>
      </HandDrawnCard>
    </div>
  );
}

export default NotFoundPage;