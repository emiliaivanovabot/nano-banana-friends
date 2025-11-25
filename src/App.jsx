import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProtectedRoute, PublicRoute } from './auth/ProtectedRoute.jsx'
import HomePage from './pages/HomePage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import WanVideoPage from './pages/WanVideoPage.jsx'
import NonoBananaPage from './pages/NonoBananaPage.jsx'
import QwenPage from './pages/QwenPage.jsx'
import CommunityPromptsPage from './pages/CommunityPromptsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import GalleryPage from './pages/GalleryPage.jsx'
import LoginPage from './auth/LoginPage.jsx'
import OnboardingPage from './auth/OnboardingPage.jsx'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes - redirect authenticated users */}
          <Route path="/" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          
          {/* Main Dashboard - after successful login + complete profile */}
          <Route path="/dashboard" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <DashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/login" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          } />
          
          {/* Onboarding route - only for authenticated users who need setup */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } />
          
          {/* Protected routes - require authentication AND complete profile */}
          <Route path="/nono-banana" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <NonoBananaPage />
            </ProtectedRoute>
          } />
          <Route path="/wan-video" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <WanVideoPage />
            </ProtectedRoute>
          } />
          <Route path="/qwen" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <QwenPage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/gallery" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <GalleryPage />
            </ProtectedRoute>
          } />
          <Route path="/community-prompts" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <CommunityPromptsPage />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App// Environment fix Mon Nov 24 17:21:06 +03 2025
