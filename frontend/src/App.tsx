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

import { Routes, Route, Navigate, Link } from "react-router-dom";
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
import HistoryPage from "./pages/HistoryPage";
import { AdminLayout } from "./components/AdminLayout";
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

const isDevelopment = process.env.NODE_ENV === 'development';
const defaultHost = isDevelopment ? `${window.location.hostname}:8000` : window.location.host;
const defaultUri = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${defaultHost}/`;

/** Redirect to /login if the user is not authenticated. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null; // or a spinner
  if (!user) return <Navigate to="/login" replace />;
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

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Authenticated app routes */}
      <Route path="/learn" element={
        <RequireAuth><LearnPage /></RequireAuth>
      } />
      <Route path="/learn/session/:courseId/:lessonId" element={
        <AuthenticatedSession><LessonSessionPage /></AuthenticatedSession>
      } />
      <Route path="/topics" element={
        <RequireAuth><TopicPage /></RequireAuth>
      } />
      <Route path="/topics/:id" element={
        <AuthenticatedSession><TopicSessionPage /></AuthenticatedSession>
      } />
      <Route path="/freestyle" element={
        <RequireAuth><FreestylePage /></RequireAuth>
      } />
      <Route path="/history" element={
        <RequireAuth><HistoryPage /></RequireAuth>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <RequireAdmin><AdminLayout /></RequireAdmin>
      }>
        <Route index element={<Navigate to="/admin/courses" replace />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="courses/:courseId/lessons" element={<AdminLessonsPage />} />
        <Route path="topics" element={<AdminTopicsPage />} />
        <Route path="prompts" element={<AdminPromptsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
      </Route>

      {isDevelopment && <Route path="/debug" element={<DebugPage />} />}
    </Routes>
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
