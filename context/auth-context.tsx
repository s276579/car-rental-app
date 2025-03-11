"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      setIsLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Check if user is admin
        const { data } = await supabase.from("customers").select("admin").eq("id", session.user.id).single()

        setIsAdmin(data?.admin ?? false)
      }

      setIsLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        // Check if user is admin
        const { data, error } = await supabase.from("customers").select("admin").eq("id", session.user.id).single()

        if (error) {
          // No customer record exists, sign out
          console.error("Customer record not found, signing out:", error)
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          setIsAdmin(false)
          router.push("/auth")
          return
        }

        setIsAdmin(data?.admin ?? false)
      } else {
        setIsAdmin(false)
      }

      setIsLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  // Update the signIn function to check if a customer record exists
  const signIn = async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) throw authError

    // Check if a corresponding customer record exists
    if (authData.user) {
      const { data: customerData, error: customerError } = await supabase
        .from("customers")
        .select("id")
        .eq("id", authData.user.id)
        .single()

      if (customerError || !customerData) {
        // No customer record exists, sign out and throw error
        await supabase.auth.signOut()
        throw new Error("Your account has been deleted. Please contact an administrator to restore your account.")
      }
    }

    router.push("/home")
  }

  const signUp = async (email: string, password: string) => {
    try {
      // First, check if the user already exists but might have deleted their account
      const { data: existingUser, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      // If sign-in succeeds, it means the auth record exists
      if (existingUser?.user) {
        // Check if customer record exists
        const { data: customerData, error: customerError } = await supabase
          .from("customers")
          .select("id")
          .eq("id", existingUser.user.id)
          .single()

        // If no customer record, this is a previously deleted account
        if (customerError || !customerData) {
          // Sign out and throw specific error
          await supabase.auth.signOut()
          throw new Error("User previously registered. Please contact an administrator to restore your account.")
        }

        // If we get here, both auth and customer records exist, so just log in
        router.push("/home")
        return
      }
    } catch (error) {
      // If the error is not a "Invalid login credentials" error, it might be our custom error
      if (error instanceof Error && error.message.includes("previously registered")) {
        throw error
      }
      // Otherwise, it's likely just that the user doesn't exist yet, which is fine for signup
    }

    // Proceed with normal signup if the user doesn't exist
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    router.push("/profile")
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

