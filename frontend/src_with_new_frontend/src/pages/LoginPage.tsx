import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnInput } from '../components/HandDrawnInput';
import { HandDrawnButton } from '../components/HandDrawnButton';
import { BookDoodle, ChatBubbleDoodle } from '../components/DoodleDecorations';
export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - just navigate to learn page
    if (email && password) {
      navigate('/learn');
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <BookDoodle className="absolute top-20 left-10 w-32 h-32 text-gray-200 -rotate-12 hidden md:block" />
      <ChatBubbleDoodle className="absolute bottom-20 right-10 w-40 h-40 text-gray-200 rotate-12 hidden md:block" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold italic text-4xl text-[#1A1A1A] mb-2">
            language coach
          </h1>
        </div>

        <HandDrawnCard rotate="left" className="mb-8">
          <h2 className="font-heading text-3xl font-bold mb-6 text-center">
            Welcome back!
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <HandDrawnInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required />


            <div className="space-y-1">
              <HandDrawnInput
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required />

              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-[#DC2626] hover:underline underline-offset-4 decoration-wavy">

                  Forgot password?
                </Link>
              </div>
            </div>

            <div className="pt-4">
              <HandDrawnButton type="submit" className="w-full">
                Log In
              </HandDrawnButton>
            </div>
          </form>
        </HandDrawnCard>

        <p className="text-center text-[#1A1A1A] font-medium">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="text-[#DC2626] hover:underline underline-offset-4 decoration-wavy font-bold">

            Sign up
          </Link>
        </p>
      </div>
    </div>);

}