import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider }        from './contexts/AuthContext'
import { useAuth }             from './hooks/useAuth'
import { ActiveImageProvider } from './contexts/ActiveImageContext'
import { ToastProvider }       from './contexts/ToastContext'

// ── Eagerly loaded (tiny, always needed) ─────────────────────────────────────
import Navbar         from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import PageLoader     from './components/PageLoader'

// ── Lazy-loaded pages (each becomes its own JS chunk) ────────────────────────
const LoginPage          = lazy(() => import('./pages/LoginPage'))
const RegisterPage       = lazy(() => import('./pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'))
const HomePage           = lazy(() => import('./pages/HomePage'))
const EnhancePage        = lazy(() => import('./pages/EnhancePage'))
const ReplaceBgPage      = lazy(() => import('./pages/ReplaceBgPage'))
const RecolorPage        = lazy(() => import('./pages/RecolorPage'))
const SmartCropPage      = lazy(() => import('./pages/SmartCropPage'))
const BatchPage          = lazy(() => import('./pages/BatchPage'))
const ShadowPage         = lazy(() => import('./pages/ShadowPage'))
const HistoryPage        = lazy(() => import('./pages/HistoryPage'))
const SettingsPage       = lazy(() => import('./pages/SettingsPage'))
const NotFoundPage       = lazy(() => import('./pages/NotFoundPage'))

// ── ChatbotWidget is the heaviest component — lazy-load it too ───────────────
const ChatbotWidget = lazy(() => import('./components/ChatbotWidget'))

function ChatbotWidgetWrapper() {
  const { user } = useAuth()
  if (!user) return null
  return (
    <Suspense fallback={null}>
      <ChatbotWidget />
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ActiveImageProvider>
            <div className="min-h-screen bg-page flex flex-col">
              <Navbar />
              {/* Single Suspense boundary for all route chunks */}
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/login"           element={<LoginPage />} />
                  <Route path="/register"        element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password"  element={<ResetPasswordPage />} />

                  {/* Protected routes */}
                  <Route path="/" element={
                    <ProtectedRoute><HomePage /></ProtectedRoute>
                  } />
                  <Route path="/enhance" element={
                    <ProtectedRoute><EnhancePage /></ProtectedRoute>
                  } />
                  <Route path="/replace-bg" element={
                    <ProtectedRoute><ReplaceBgPage /></ProtectedRoute>
                  } />
                  <Route path="/recolor" element={
                    <ProtectedRoute><RecolorPage /></ProtectedRoute>
                  } />
                  <Route path="/smart-crop" element={
                    <ProtectedRoute><SmartCropPage /></ProtectedRoute>
                  } />
                  <Route path="/batch" element={
                    <ProtectedRoute><BatchPage /></ProtectedRoute>
                  } />
                  <Route path="/shadow" element={
                    <ProtectedRoute><ShadowPage /></ProtectedRoute>
                  } />
                  <Route path="/history" element={
                    <ProtectedRoute><HistoryPage /></ProtectedRoute>
                  } />
                  <Route path="/settings" element={
                    <ProtectedRoute><SettingsPage /></ProtectedRoute>
                  } />

                  {/* Catch-all */}
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </Suspense>
              <ChatbotWidgetWrapper />
            </div>
          </ActiveImageProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
