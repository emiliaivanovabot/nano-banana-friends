import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Suspense, lazy, useEffect } from 'react'
import { AuthProvider } from './auth/AuthContext.jsx'
import { ProtectedRoute, PublicRoute } from './auth/ProtectedRoute.jsx'
import { initMonitoring, setMonitoringUser, clearMonitoringUser, trackUserJourney } from './lib/monitoring/index.js'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Critical pages - load immediately
import LoginPage from './auth/LoginPage.jsx'
import OnboardingPage from './auth/OnboardingPage.jsx'

// Non-critical pages - lazy load with code splitting
const HomePage = lazy(() => import('./pages/HomePage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const GenerationModesPage = lazy(() => import('./tools/nano-banana/modes/pages/GenerationModesPage.jsx'))
const WanVideoPage = lazy(() => import('./tools/wan/wan-2-5/pages/WanVideoPage.jsx'))
const WanVideoPublicPage = lazy(() => import('./tools/wan/wan-2-5/pages/WanVideoPublicPage.jsx'))
const NonoBananaPage = lazy(() => import('./tools/nano-banana/modes/pages/NonoBananaPage.jsx'))
const NonoBananaModelPage = lazy(() => import('./tools/nano-banana/classic/pages/NonoBananaModelPage.jsx'))
const NonoBananaCollabPage = lazy(() => import('./tools/nano-banana/collab/pages/NonoBananaCollabPage.jsx'))
const NonoBananaImage2ImagePage = lazy(() => import('./tools/nano-banana/image2image/pages/NonoBananaImage2ImagePage.jsx'))
const NonoBananaMultiPromptsPage = lazy(() => import('./tools/nano-banana/multi-prompts/pages/NonoBananaMultiPromptsPage.jsx'))
const PromptCreatorPage = lazy(() => import('./tools/nano-banana/prompt-creator/pages/PromptCreatorPage.jsx'))
const QwenPage = lazy(() => import('./tools/qwen/pages/QwenPage.jsx'))
const CommunityPromptsPage = lazy(() => import('./tools/community/pages/CommunityPromptsPage.jsx'))
const SettingsPage = lazy(() => import('./pages/SettingsPage.jsx'))
const GalleryPage = lazy(() => import('./tools/gallery/pages/GalleryPage.jsx'))
const InspirationPage = lazy(() => import('./tools/community/pages/InspirationPage.jsx'))
const KlingAvatarPage = lazy(() => import('./tools/kling/kling-avatar/pages/KlingAvatarPage.jsx'))
const SeedreamPage = lazy(() => import('./tools/seedream/image-generation/pages/SeedreamPage.jsx'))
const GrokPlaygroundPage = lazy(() => import('./tools/grok/pages/GrokPlaygroundPage.jsx'))
const InstagramReelPage = lazy(() => import('./tools/kie-ai/instagram-reel-v01/pages/InstagramReelPage.jsx'))

// Lazy load error boundary component
const MobileErrorBoundary = lazy(() => import('./components/MobileErrorBoundary.jsx'))

// Loading component for Suspense fallbacks
const PageLoader = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4 mx-auto"></div>
      <p className="text-white text-lg">Loading...</p>
    </div>
  </div>
)

function App() {
  // Initialize monitoring systems on app start
  useEffect(() => {
    console.log('🚀 Nano Banana Friends Starting Up');
    
    // Initialize monitoring infrastructure
    initMonitoring();
    
    // Track app initialization
    trackUserJourney('app_started', {
      timestamp: Date.now(),
      environment: import.meta.env.MODE
    });

    return () => {
      // Cleanup on app unmount
      console.log('👋 Nano Banana Friends Shutting Down');
    };
  }, []);

  return (
    <ErrorBoundary name="App">
      <AuthProvider>
        <Router>
          <Routes>
          {/* Public routes - redirect authenticated users */}
          <Route path="/" element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
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
          
          {/* Main Dashboard - after successful login + complete profile */}
          <Route path="/dashboard" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <DashboardPage />
              </Suspense>
            </ProtectedRoute>
          } />
          
          {/* Protected routes with Suspense for code splitting */}
          <Route path="/generation-modes" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <GenerationModesPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/nono-banana" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <NonoBananaPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/nono-banana-model" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <NonoBananaModelPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/nono-banana-collab" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <NonoBananaCollabPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/nono-banana-image2image" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <NonoBananaImage2ImagePage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/nono-banana-multi-prompts" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <NonoBananaMultiPromptsPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/prompt-creator" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <PromptCreatorPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/kling-avatar" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <KlingAvatarPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/seedream" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <SeedreamPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/wan-video" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <WanVideoPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/wan-video-public" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <WanVideoPublicPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/qwen" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <QwenPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <SettingsPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/gallery" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <MobileErrorBoundary>
                  <GalleryPage />
                </MobileErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/community-prompts" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <CommunityPromptsPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/inspiration" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <MobileErrorBoundary>
                  <InspirationPage />
                </MobileErrorBoundary>
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/grok-playground" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <GrokPlaygroundPage />
              </Suspense>
            </ProtectedRoute>
          } />
          <Route path="/instagram-reel" element={
            <ProtectedRoute requireCompleteProfile={true}>
              <Suspense fallback={<PageLoader />}>
                <InstagramReelPage />
              </Suspense>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  </ErrorBoundary>
  )
}

export default App// Environment fix Mon Nov 24 17:21:06 +03 2025
