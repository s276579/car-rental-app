"use client"

import type React from "react"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function ProtectedRoute({
  children,
  adminRequired = false,
}: {
  children: React.ReactNode
  adminRequired?: boolean
}) {
  const { user, isLoading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth")
    }

    if (!isLoading && adminRequired && !isAdmin) {
      router.push("/home")
    }
  }, [user, isLoading, router, adminRequired, isAdmin])

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!user) {
    return null
  }

  if (adminRequired && !isAdmin) {
    return null
  }

  return <>{children}</>
}

