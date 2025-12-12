import React, { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getUserCredits } from '../services/seedreamService'
import './CreditBalance.css'

const CreditBalance = ({ refreshTrigger = 0, showDetailed = false }) => {
  const { user } = useAuth()
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCredits = async () => {
    if (!user?.id) return

    setLoading(true)
    setError(null)

    try {
      const creditsData = await getUserCredits(user.id)
      setCredits(creditsData)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
      setError('Fehler beim Laden der Credits')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredits()
  }, [user, refreshTrigger])

  if (loading) {
    return (
      <div className="credit-balance credit-balance-loading">
        <div className="credit-spinner"></div>
        <span>Lade Credits...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="credit-balance credit-balance-error">
        <span className="credit-error-icon">⚠️</span>
        <span>{error}</span>
      </div>
    )
  }

  if (!credits) {
    return (
      <div className="credit-balance credit-balance-unavailable">
        <span>Credits nicht verfügbar</span>
      </div>
    )
  }

  // Check for low credits (under $1.00)
  const isLowCredit = (amount) => amount < 1.00

  return (
    <div className={`credit-balance ${showDetailed ? 'credit-balance-detailed' : 'credit-balance-compact'}`}>
      {showDetailed ? (
        <div className="credit-detailed-view">
          <div className="credit-header">
            <h3>💳 Guthaben</h3>
            <button 
              className="credit-refresh-btn"
              onClick={fetchCredits}
              title="Credits aktualisieren"
            >
              🔄
            </button>
          </div>

          <div className="credit-services">
            <div className={`credit-service ${isLowCredit(credits.seedream_credits) ? 'credit-low' : ''}`}>
              <div className="credit-service-header">
                <span className="credit-service-name">🌱 Seedream</span>
                {isLowCredit(credits.seedream_credits) && <span className="credit-warning">⚠️</span>}
              </div>
              <div className="credit-amount">${credits.seedream_credits.toFixed(2)}</div>
              <div className="credit-info">~{Math.floor(credits.seedream_credits / 0.04)} Bilder</div>
            </div>

            <div className={`credit-service ${isLowCredit(credits.gemini_credits) ? 'credit-low' : ''}`}>
              <div className="credit-service-header">
                <span className="credit-service-name">🤖 Gemini</span>
                {isLowCredit(credits.gemini_credits) && <span className="credit-warning">⚠️</span>}
              </div>
              <div className="credit-amount">${credits.gemini_credits.toFixed(2)}</div>
              <div className="credit-info">Token-basiert</div>
            </div>

            <div className={`credit-service ${isLowCredit(credits.kling_credits) ? 'credit-low' : ''}`}>
              <div className="credit-service-header">
                <span className="credit-service-name">🎥 Kling</span>
                {isLowCredit(credits.kling_credits) && <span className="credit-warning">⚠️</span>}
              </div>
              <div className="credit-amount">${credits.kling_credits.toFixed(2)}</div>
              <div className="credit-info">~{Math.floor(credits.kling_credits / 0.10)} Videos</div>
            </div>

            <div className={`credit-service ${isLowCredit(credits.comfyui_credits) ? 'credit-low' : ''}`}>
              <div className="credit-service-header">
                <span className="credit-service-name">🎨 ComfyUI</span>
                {isLowCredit(credits.comfyui_credits) && <span className="credit-warning">⚠️</span>}
              </div>
              <div className="credit-amount">${credits.comfyui_credits.toFixed(2)}</div>
              <div className="credit-info">~{Math.floor(credits.comfyui_credits / 0.02)} Workflows</div>
            </div>
          </div>

          <div className="credit-total">
            <div className="credit-total-label">Gesamt:</div>
            <div className="credit-total-amount">
              ${(credits.seedream_credits + credits.gemini_credits + credits.kling_credits + credits.comfyui_credits).toFixed(2)}
            </div>
          </div>

          {credits.subscription_type && (
            <div className="credit-subscription">
              <span className="credit-sub-label">Abo:</span>
              <span className={`credit-sub-type credit-sub-${credits.subscription_type}`}>
                {credits.subscription_type === 'free' ? '🆓 Kostenlos' : 
                 credits.subscription_type === 'premium' ? '⭐ Premium' : '♾️ Unlimited'}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="credit-compact-view">
          <span className="credit-compact-icon">💳</span>
          <span className="credit-compact-amount">
            ${(credits.seedream_credits + credits.gemini_credits + credits.kling_credits + credits.comfyui_credits).toFixed(2)}
          </span>
          {(isLowCredit(credits.seedream_credits) || 
            isLowCredit(credits.gemini_credits) || 
            isLowCredit(credits.kling_credits) || 
            isLowCredit(credits.comfyui_credits)) && (
            <span className="credit-compact-warning" title="Niedriges Guthaben">⚠️</span>
          )}
        </div>
      )}
    </div>
  )
}

export default CreditBalance