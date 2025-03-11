"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { CarCard } from "@/components/cars/car-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Database } from "@/types/supabase"
import { Toaster } from "@/components/ui/toaster"

type Car = Database["public"]["Tables"]["cars"]["Row"]
type Rental = Database["public"]["Tables"]["rentals"]["Row"] & {
  cars: Car
}

export default function HomePage() {
  const { user } = useAuth()
  const [rentedCars, setRentedCars] = useState<Rental[]>([])
  const [availableCars, setAvailableCars] = useState<Car[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      setIsLoading(true)

      try {
        // Fetch user's rented cars
        const { data: rentals, error: rentalsError } = await supabase
          .from("rentals")
          .select(`
            *,
            cars (*)
          `)
          .eq("customer_id", user.id)
          .eq("status", "active")

        if (rentalsError) throw rentalsError

        setRentedCars(rentals as Rental[])

        // Fetch available cars
        const { data: cars, error: carsError } = await supabase.from("cars").select("*").eq("status", "available")

        if (carsError) throw carsError

        setAvailableCars(cars)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    // Set up real-time subscription for rentals
    const rentalSubscription = supabase
      .channel("rentals-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rentals",
          filter: `customer_id=eq.${user?.id}`,
        },
        () => {
          fetchData()
        },
      )
      .subscribe()

    // Set up real-time subscription for cars
    const carSubscription = supabase
      .channel("cars-channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "cars",
        },
        () => {
          fetchData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(rentalSubscription)
      supabase.removeChannel(carSubscription)
    }
  }, [user])

  const filteredCars = availableCars.filter(
    (car) =>
      car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.colour.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <ProtectedRoute>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-8">Your Dashboard</h1>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Your Current Rentals</h2>
          {isLoading ? (
            <div className="text-center py-8">Loading rentals...</div>
          ) : rentedCars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rentedCars.map((rental) => (
                <Card key={rental.id}>
                  <CardHeader>
                    <CardTitle>
                      {rental.cars.make} {rental.cars.model}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p>Color: {rental.cars.colour}</p>
                      <p>License Plate: {rental.cars.license_plate}</p>
                      <p>Start Date: {new Date(rental.start_date).toLocaleDateString()}</p>
                      <p>End Date: {new Date(rental.end_date).toLocaleDateString()}</p>
                      <p>Status: {rental.status}</p>
                      <p className="font-bold">Rate: £{rental.cars.rental_rate}/day</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted rounded-lg">You don't have any active rentals.</div>
          )}
        </section>

        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h2 className="text-2xl font-bold">Available Cars</h2>
            <div className="flex w-full md:w-auto gap-2">
              <Input
                placeholder="Search cars..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" onClick={() => setSearchTerm("")}>
                Clear
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8">Loading cars...</div>
          ) : filteredCars.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCars.map((car) => (
                <CarCard key={car.id} car={car} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-muted rounded-lg">No cars available matching your search.</div>
          )}
        </section>
        <Toaster />
      </div>
    </ProtectedRoute>
  )
}

