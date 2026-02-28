import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnInput } from '../components/HandDrawnInput';
import { HandDrawnButton } from '../components/HandDrawnButton';
import {
  SpeechBubble,
  GlobeDoodle,
  PencilDoodle } from
'../components/DoodleDecorations';
import { useAuth } from '../contexts/AuthContext';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(email, password, name);
      navigate('/learn');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <GlobeDoodle className="absolute top-10 right-20 w-32 h-32 text-gray-200 rotate-12 hidden md:block" />
      <SpeechBubble className="absolute bottom-10 left-20 w-24 h-24 text-[#F59E0B] opacity-20 -rotate-12 hidden md:block" />
      <PencilDoodle className="absolute top-1/2 right-10 w-20 h-20 text-[#DC2626] opacity-20 rotate-45 hidden md:block" />

      <div className="w-full max-w-md relative z-10 py-8">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="font-heading font-bold italic text-4xl text-[#1A1A1A] mb-2 hover:text-[#DC2626] transition-colors">
              language coach
            </h1>
          </Link>
        </div>

        <HandDrawnCard rotate="right" className="mb-8">
          <h2 className="font-heading text-3xl font-bold mb-6 text-center">
            Create your account
          </h2>

          {error && (
            <div className="mb-4 p-3 border-2 border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] text-sm font-medium hand-drawn-border-alt">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            <HandDrawnInput
              label="Name"
              type="text"
              placeholder="What should we call you?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required />

            <HandDrawnInput
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required />

            <HandDrawnInput
              label="Password"
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required />

            <HandDrawnInput
              label="Confirm Password"
              type="password"
              placeholder="Type it one more time"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError('');
              }}
              error={error && error.includes('match') ? error : undefined}
              required />

            <div className="pt-4">
              <HandDrawnButton type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account…' : 'Sign Up'}
              </HandDrawnButton>
            </div>
          </form>
        </HandDrawnCard>

        <p className="text-center text-[#1A1A1A] font-medium">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-[#DC2626] hover:underline underline-offset-4 decoration-wavy font-bold">

            Log in
          </Link>
        </p>
      </div>
    </div>);

}

export default SignupPage;
