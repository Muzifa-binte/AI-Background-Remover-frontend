import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AIAnalysisPage() {
  const navigate = useNavigate()

  // Redirect to home page and open chatbot widget in analysis mode
  useEffect(() => {
    navigate('/')
    // Open chatbot widget in analysis mode after a short delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('open-chatbot', { detail: { mode: 'analysis' } }))
    }, 100)
  }, [navigate])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-magenta border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-secondary">Redirecting to AI Chat Bot...</p>
      </div>
    </div>
  )
}
