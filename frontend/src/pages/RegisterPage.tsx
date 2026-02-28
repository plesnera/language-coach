import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email, password, displayName);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <h1>Language Coach</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Create Account</h2>
        {error && <p className="auth-error">{error}</p>}
        <input
          type="text"
          placeholder="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Register"}
        </button>
        <p>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
