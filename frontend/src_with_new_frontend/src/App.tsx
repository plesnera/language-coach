import React, { Component } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { LearnPage } from './pages/LearnPage';
import { TopicPage } from './pages/TopicPage';
import { FreestylePage } from './pages/FreestylePage';
// Admin Components
import { RequireAdmin } from './components/RequireAdmin';
import { AdminLayout } from './components/AdminLayout';
import { AdminCoursesPage } from './pages/admin/AdminCoursesPage';
import { AdminLessonsPage } from './pages/admin/AdminLessonsPage';
import { AdminTopicsPage } from './pages/admin/AdminTopicsPage';
import { AdminPromptsPage } from './pages/admin/AdminPromptsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public / User Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/topics" element={<TopicPage />} />
        <Route path="/freestyle" element={<FreestylePage />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
          <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }>

          <Route index element={<Navigate to="courses" replace />} />
          <Route path="courses" element={<AdminCoursesPage />} />
          <Route
            path="courses/:courseId/lessons"
            element={<AdminLessonsPage />} />

          <Route path="topics" element={<AdminTopicsPage />} />
          <Route path="prompts" element={<AdminPromptsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
        </Route>
      </Routes>
    </BrowserRouter>);

}