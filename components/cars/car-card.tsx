"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import type { Database } from "@/types/supabase"
import { RentalModal } from "@/components/rentals/rental-modal"
import { toast } from "@/components/ui/use-toast"

type Car = Database["public"]["Tables"]["cars"]["Row"]

export function CarCard({ car }: { car: Car }) {
  const [showRentalModal, setShowRentalModal] = useState(false)
  const { user } = useAuth()
  const router = useRouter()

  const handleRentClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to rent a car",
      })
      router.push("/auth")
      return
    }

    setShowRentalModal(true)
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold">
              {car.make} {car.model}
            </h3>
            <div className="text-sm text-muted-foreground">
              <p>Year: {car.year}</p>
              <p>Color: {car.colour}</p>
              <p>License Plate: {car.license_plate}</p>
              <p>Status: {car.status}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-lg font-bold">£{car.rental_rate}/day</div>
          {car.status === "available" && <Button onClick={handleRentClick}>Rent Now</Button>}
        </CardFooter>
      </Card>

      <RentalModal car={car} isOpen={showRentalModal} onClose={() => setShowRentalModal(false)} />
    </>
  )
}

