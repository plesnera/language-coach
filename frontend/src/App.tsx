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

import { Routes, Route, Navigate } from "react-router-dom";
import DebugPage from "./pages/DebugPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import DashboardPage from "./pages/DashboardPage";
import LearnPage from "./pages/LearnPage";
import TopicsPage from "./pages/TopicsPage";
import TopicSessionPage from "./pages/TopicSessionPage";
import TalkPage from "./pages/TalkPage";
import HistoryPage from "./pages/HistoryPage";
import AdminLayout from "./components/admin/AdminLayout";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminLessonsPage from "./pages/admin/AdminLessonsPage";
import AdminTopicsPage from "./pages/admin/AdminTopicsPage";
import AdminPromptsPage from "./pages/admin/AdminPromptsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import { LiveAPIProvider } from "./contexts/LiveAPIContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import "./styles/AuthPage.scss";

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

/** Redirect to / if the user is not an admin. */
function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
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
      {/* Public auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Dashboard — no live session needed */}
      <Route path="/" element={
        <RequireAuth>
          <DashboardPage />
        </RequireAuth>
      } />

      {/* Learning mode routes — each gets its own LiveAPIProvider session */}
      <Route path="/learn" element={
        <AuthenticatedSession><LearnPage /></AuthenticatedSession>
      } />
      <Route path="/topics" element={
        <RequireAuth><TopicsPage /></RequireAuth>
      } />
      <Route path="/topics/:id" element={
        <AuthenticatedSession><TopicSessionPage /></AuthenticatedSession>
      } />
      <Route path="/talk" element={
        <AuthenticatedSession><TalkPage /></AuthenticatedSession>
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
