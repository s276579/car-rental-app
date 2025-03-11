"use client"

import { supabase } from "@/lib/supabase"
import { CarCard } from "@/components/cars/car-card"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import { useAuth } from "@/context/auth-context"
import * as React from "react"

export default function HomePage() {
  const { user } = useAuth()

  // Redirect to /home if logged in, otherwise to /auth
  const getStartedHref = user ? "/home" : "/auth"

  return (
    <div className="container py-10">
      <section className="py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Welcome to CarRental</h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                Rent a car quickly and easily. We have a wide range of vehicles to suit your needs.
              </p>
            </div>
            <div className="space-x-4">
              <Button asChild size="lg">
                <Link href={getStartedHref}>Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <CarsList />
      <Toaster />
    </div>
  )
}

// Add a new component for the cars list to handle server-side data fetching
function CarsList() {
  const [cars, setCars] = React.useState([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchCars() {
      const { data } = await supabase
        .from("cars")
        .select("*")
        .eq("status", "available")
        .limit(6)
        .order("created_at", { ascending: false })

      setCars(data || [])
      setLoading(false)
    }

    fetchCars()
  }, [])

  if (loading) {
    return <div className="text-center py-8">Loading available cars...</div>
  }

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold mb-6">Available Cars</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} />
        ))}
      </div>
    </section>
  )
}

