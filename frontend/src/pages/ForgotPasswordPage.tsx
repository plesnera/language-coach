import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { HandDrawnCard } from '../components/HandDrawnCard';
import { HandDrawnInput } from '../components/HandDrawnInput';
import { HandDrawnButton } from '../components/HandDrawnButton';
import { Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/">
            <h1 className="font-heading font-bold italic text-4xl text-[#1A1A1A] mb-2 hover:text-[#DC2626] transition-colors">
              language coach
            </h1>
          </Link>
        </div>

        <HandDrawnCard rotate="none" className="mb-8">
          {!isSubmitted ?
          <>
              <h1 className="font-heading text-3xl font-bold mb-2 text-center">
                Forgot password?
              </h1>
              <p className="text-center text-gray-600 mb-6">
                No worries! Enter your email and we'll send you a reset link.
              </p>

              {error && (
                <div className="mb-4 p-3 border-2 border-[#DC2626] bg-[#DC2626]/10 text-[#DC2626] text-sm font-medium hand-drawn-border-alt">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <HandDrawnInput
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required />

                <div className="pt-4">
                  <HandDrawnButton type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </HandDrawnButton>
                </div>
              </form>
            </> :

          <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto bg-[#DC2626]/10 text-[#DC2626] rounded-full flex items-center justify-center mb-4 hand-drawn-border">
                <Check size={32} strokeWidth={3} />
              </div>
              <h2 className="font-heading text-2xl font-bold mb-2">
                Check your email
              </h2>
              <p className="text-gray-600">
                We've sent a password reset link to <br />
                <span className="font-bold text-[#1A1A1A]">{email}</span>
              </p>
            </div>
          }
        </HandDrawnCard>

        <div className="text-center">
          <Link
            to="/login"
            className="text-[#1A1A1A] font-medium hover:text-[#DC2626] transition-colors flex items-center justify-center gap-2">

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4">

              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to login
          </Link>
        </div>
      </div>
    </div>);

}

export default ForgotPasswordPage;
