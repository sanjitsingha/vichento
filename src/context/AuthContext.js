"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  setUser: () => {},
  refreshProfile: async () => {},
  signOut: async () => {},
})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) {
      setProfile(null)
      return
    }
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .maybeSingle()
    setProfile(data || null)
  }, [])

  useEffect(() => {
    let active = true

    // Get initial user
    supabase.auth
      .getUser()
      .then(({ data }) => {
        if (!active) return
        setUser(data?.user ?? null)
        loadProfile(data?.user ?? null)
      })
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false))

    // Listen to auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user || null
        setUser(nextUser)
        loadProfile(nextUser)
      }
    )

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = useCallback(() => loadProfile(user), [loadProfile, user])

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error("Sign out failed:", err)
    }
    try {
      localStorage.removeItem("likes")
      localStorage.removeItem("bookmarks")
    } catch {}
    setUser(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, setUser, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuthContext = () => useContext(AuthContext)
