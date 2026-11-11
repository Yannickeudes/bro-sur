import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase.js'

const AuthContext = createContext({ user: null, profile: null, loading: false })
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) { setProfile(null); return }
    supabase.from('profiles').select('pseudonym, role').eq('id', session.user.id).single()
      .then(({ data }) => setProfile(data))
  }, [session, tick])

  const signOut = () => supabase.auth.signOut()
  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, profile, loading, signOut, reloadProfile: () => setTick((t) => t + 1) }}>
      {children}
    </AuthContext.Provider>
  )
}
