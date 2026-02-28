import React from 'react';
import { Navigate, Outlet, Link } from 'react-router-dom';
import { HandDrawnCard } from './HandDrawnCard';
import { HandDrawnButton } from './HandDrawnButton';
import { SquigglyLine } from './DoodleDecorations';
// Mock auth hook for prototype
function useAuth() {
  // In a real app, this would check actual user state
  return {
    user: {
      role: 'admin',
      name: 'Admin User'
    },
    isAuthenticated: true
  };
}
export function RequireAdmin({ children }: {children?: React.ReactNode;}) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
        <HandDrawnCard className="max-w-md w-full text-center">
          <h1 className="font-heading text-3xl font-bold text-[#DC2626] mb-4 relative inline-block">
            Access Denied
            <SquigglyLine className="absolute -bottom-2 left-0 w-full h-2 text-[#1A1A1A]" />
          </h1>
          <p className="text-gray-600 mb-8">
            You need administrator privileges to view this page.
          </p>
          <Link to="/learn">
            <HandDrawnButton variant="primary" className="w-full">
              Back to App
            </HandDrawnButton>
          </Link>
        </HandDrawnCard>
      </div>);

  }
  return children ? <>{children}</> : <Outlet />;
}