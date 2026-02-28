import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Language Coach</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Reset Password</h2>
        {error && <p className="auth-error">{error}</p>}
        {sent ? (
          <p>If that email is registered, a reset link has been sent.</p>
        ) : (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </>
        )}
        <p>
          <Link to="/login">Back to sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
