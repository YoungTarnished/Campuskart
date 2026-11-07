import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('campuskart_token')
    if (!token) {
      setLoading(false)
      return undefined
    }
    let active = true
    api('/api/auth/me')
      .then((res) => { if (active) setUser(res.data) })
      .catch(() => localStorage.removeItem('campuskart_token'))
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const onExpired = () => {
      localStorage.removeItem('campuskart_token')
      setUser(null)
    }
    window.addEventListener('auth:expired', onExpired)
    return () => window.removeEventListener('auth:expired', onExpired)
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    setSession(nextUser, token) {
      if (token) localStorage.setItem('campuskart_token', token)
      setUser(nextUser)
    },
    async logout() {
      try { await api('/api/auth/logout', { method: 'POST' }) } catch { /* session already gone */ }
      localStorage.removeItem('campuskart_token')
      setUser(null)
    },
    refresh: async () => {
      const res = await api('/api/auth/me')
      setUser(res.data)
      return res.data
    },
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
