/**
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import DebugPage from "./pages/DebugPage";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { LandingPage } from "./pages/LandingPage";
import { LearnPage } from "./pages/LearnPage";
import { TopicPage } from "./pages/TopicPage";
import TopicSessionPage from "./pages/TopicSessionPage";
import LessonSessionPage from "./pages/LessonSessionPage";
import { FreestylePage } from "./pages/FreestylePage";
import FreestyleSessionPage from "./pages/FreestyleSessionPage";
import HistoryPage from "./pages/HistoryPage";
import { IntroFlowPage } from "./pages/IntroFlowPage";
import { AboutPage, PrivacyPage, TermsPage } from "./pages/StaticPages";
import GuestIntroSessionPage from "./pages/GuestIntroSessionPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { AdminLayout } from "./components/AdminLayout";
import { AdminMainPage } from "./pages/admin/AdminMainPage";
import { AdminLanguagePage } from "./pages/admin/AdminLanguagePage";
import { AdminCoursesPage } from "./pages/admin/AdminCoursesPage";
import { AdminLessonsPage } from "./pages/admin/AdminLessonsPage";
import { AdminTopicsPage } from "./pages/admin/AdminTopicsPage";
import { AdminPromptsPage } from "./pages/admin/AdminPromptsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { HandDrawnCard } from "./components/HandDrawnCard";
import { HandDrawnButton } from "./components/HandDrawnButton";
import { SquigglyLine } from "./components/DoodleDecorations";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { WS_BASE_URL } from "./config/endpoints";

const isDevelopment = process.env.NODE_ENV === 'development';
const defaultUri = WS_BASE_URL;
const guestUserStorageKey = "language-coach-guest-user-id";

function getGuestUserId(): string {
  if (typeof window === "undefined") {
    return "guest-user";
  }
  const existing = window.sessionStorage.getItem(guestUserStorageKey);
  if (existing) {
    return existing;
  }
  const generated = `guest-${crypto.randomUUID()}`;
  window.sessionStorage.setItem(guestUserStorageKey, generated);
  return generated;
}

/** Redirect to /login if the user is not authenticated. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  if (!user) {
    const nextPath = `${location.pathname}${location.search}`;
    return <Navigate to={`/intro?next=${encodeURIComponent(nextPath)}`} replace />;
  }
  return <>{children}</>;
}

/** Redirect to / if the user is not an admin. Uses doodle-themed access-denied UI. */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") {
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
      </div>
    );
  }
  return <>{children}</>;
}

/** Wraps children with RequireAuth + LiveAPIProvider, using the real user UID. */
function AuthenticatedSession({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <RequireAuth>
      <LiveAPIProvider url={defaultUri} userId={user?.uid}>
        {children}
      </LiveAPIProvider>
    </RequireAuth>
  );
}

/** Wraps a session with LiveAPIProvider without requiring authentication. */
function GuestSession({ children }: { children: React.ReactNode }) {
  return (
    <LiveAPIProvider url={defaultUri} userId={getGuestUserId()}>
      {children}
    </LiveAPIProvider>
  );
}

/** Uses authenticated identity when available, otherwise falls back to guest identity. */
function ProgressiveSession({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <LiveAPIProvider url={defaultUri} userId={user?.uid ?? getGuestUserId()}>
      {children}
    </LiveAPIProvider>
  );
}

function AppRoutes() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/intro" element={<IntroFlowPage />} />
        <Route path="/intro/session" element={
          <GuestSession><GuestIntroSessionPage /></GuestSession>
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Authenticated app routes */}
        <Route path="/learn" element={
          <ErrorBoundary><LearnPage /></ErrorBoundary>
        } />
        <Route path="/learn/session/:courseId/:lessonId" element={
          <ErrorBoundary>
            <AuthenticatedSession><LessonSessionPage /></AuthenticatedSession>
          </ErrorBoundary>
        } />
        <Route path="/topics" element={
          <ErrorBoundary><TopicPage /></ErrorBoundary>
        } />
        <Route path="/topics/:id" element={
          <ErrorBoundary>
            <AuthenticatedSession><TopicSessionPage /></AuthenticatedSession>
          </ErrorBoundary>
        } />
        <Route path="/freestyle" element={
          <ErrorBoundary><FreestylePage /></ErrorBoundary>
        } />
        <Route path="/freestyle/session" element={
          <ErrorBoundary>
            <ProgressiveSession><FreestyleSessionPage /></ProgressiveSession>
          </ErrorBoundary>
        } />
        <Route path="/history" element={
          <ErrorBoundary>
            <RequireAuth><HistoryPage /></RequireAuth>
          </ErrorBoundary>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <ErrorBoundary>
            <RequireAdmin><AdminLayout /></RequireAdmin>
          </ErrorBoundary>
        }>
          <Route index element={<AdminMainPage />} />
          <Route path="languages/:languageId" element={<AdminLanguagePage />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route path="courses/:courseId/lessons" element={<AdminLessonsPage />} />
          <Route path="topics" element={<AdminTopicsPage />} />
          <Route path="prompts" element={<AdminPromptsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>

        {isDevelopment && <Route path="/debug" element={<DebugPage />} />}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
