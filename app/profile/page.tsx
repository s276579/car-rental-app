"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { Database } from "@/types/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

type CustomerProfile = Database["public"]["Tables"]["customers"]["Row"]

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Partial<CustomerProfile>>({
    first_name: "",
    last_name: "",
    licence_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    county: "",
    postcode: "",
    date_of_birth: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase.from("customers").select("*").eq("id", user.id).single()

        if (error) throw error

        if (data) {
          setProfile({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            licence_number: data.licence_number || "",
            address_line1: data.address_line1 || "",
            address_line2: data.address_line2 || "",
            city: data.city || "",
            county: data.county || "",
            postcode: data.postcode || "",
            date_of_birth: data.date_of_birth || "",
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setProfile((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsSaving(true)

    try {
      const { error } = await supabase.from("customers").upsert({
        id: user.id,
        ...profile,
      })

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "There was a problem updating your profile.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    setIsDeleting(true)

    try {
      // Get all active rentals for this user
      const { data: activeRentals, error: rentalsError } = await supabase
        .from("rentals")
        .select("id, car_id")
        .eq("customer_id", user.id)
        .eq("status", "active")

      if (rentalsError) throw rentalsError

      // If there are active rentals, cancel them and update car status
      if (activeRentals && activeRentals.length > 0) {
        // Update all rentals to cancelled
        const { error: updateRentalsError } = await supabase
          .from("rentals")
          .update({ status: "cancelled" })
          .in(
            "id",
            activeRentals.map((rental) => rental.id),
          )

        if (updateRentalsError) throw updateRentalsError

        // Update all cars to available
        const { error: updateCarsError } = await supabase
          .from("cars")
          .update({ status: "available" })
          .in(
            "id",
            activeRentals.map((rental) => rental.car_id),
          )

        if (updateCarsError) throw updateCarsError
      }

      // Delete the customer record directly
      const { error: customerError } = await supabase.from("customers").delete().eq("id", user.id)

      if (customerError) throw customerError

      // Only show toast after successful deletion
      toast({
        title: "Account data deleted",
        description: "Your account data has been deleted. You will now be signed out.",
      })

      // Sign out the user
      await signOut()
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "There was a problem deleting your account.",
        variant: "destructive",
      })
      setShowDeleteModal(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="container py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          {isLoading ? (
            <CardContent>
              <div className="text-center py-4">Loading profile...</div>
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input id="first_name" name="first_name" value={profile.first_name || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input id="last_name" name="last_name" value={profile.last_name || ""} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="licence_number">License Number</Label>
                  <Input
                    id="licence_number"
                    name="licence_number"
                    value={profile.licence_number || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    name="date_of_birth"
                    type="date"
                    value={profile.date_of_birth || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line1">Address Line 1</Label>
                  <Input
                    id="address_line1"
                    name="address_line1"
                    value={profile.address_line1 || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line2">Address Line 2</Label>
                  <Input
                    id="address_line2"
                    name="address_line2"
                    value={profile.address_line2 || ""}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" value={profile.city || ""} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="county">County</Label>
                    <Input id="county" name="county" value={profile.county || ""} onChange={handleChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode</Label>
                  <Input id="postcode" name="postcode" value={profile.postcode || ""} onChange={handleChange} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="destructive" onClick={() => setShowDeleteModal(true)} type="button">
                  Delete Account
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
        <Toaster />
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Account</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be
                permanently removed.
              </p>
              <p className="mt-4">Any active rentals will be automatically cancelled as part of this process.</p>
              <p className="mt-4 text-amber-600 font-medium">
                Note: This will delete your profile data and sign you out, but your authentication record will remain.
                If you wish to register again with the same email, please contact an administrator.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete Account"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  )
}

