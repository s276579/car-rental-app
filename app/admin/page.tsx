"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import type { Database } from "@/types/supabase"

type Car = Database["public"]["Tables"]["cars"]["Row"]
type Customer = Database["public"]["Tables"]["customers"]["Row"]
type Rental = Database["public"]["Tables"]["rentals"]["Row"] & {
  cars: Car
  customers: Customer
}
type Location = Database["public"]["Tables"]["locations"]["Row"]

export default function AdminPage() {
  return (
    <ProtectedRoute adminRequired>
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="cars">
          <TabsList className="mb-8">
            <TabsTrigger value="cars">Cars</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="rentals">Rentals</TabsTrigger>
          </TabsList>

          <TabsContent value="cars">
            <CarsTab />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersTab />
          </TabsContent>

          <TabsContent value="rentals">
            <RentalsTab />
          </TabsContent>
        </Tabs>

        <Toaster />
      </div>
    </ProtectedRoute>
  )
}

function CarsTab() {
  const [cars, setCars] = useState<Car[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentCar, setCurrentCar] = useState<Partial<Car>>({})

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)

      try {
        const [carsResponse, locationsResponse] = await Promise.all([
          supabase.from("cars").select("*").order("created_at", { ascending: false }),
          supabase.from("locations").select("*"),
        ])

        if (carsResponse.error) throw carsResponse.error
        if (locationsResponse.error) throw locationsResponse.error

        setCars(carsResponse.data)
        setLocations(locationsResponse.data)
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddCar = async () => {
    try {
      const { error } = await supabase.from("cars").insert({
        location_id: currentCar.location_id!,
        model: currentCar.model!,
        make: currentCar.make!,
        year: Number(currentCar.year),
        license_plate: currentCar.license_plate!,
        colour: currentCar.colour!,
        rental_rate: Number(currentCar.rental_rate),
        status: currentCar.status || "available",
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Car added successfully",
      })

      // Refresh cars list
      const { data, error: fetchError } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setCars(data)
      setShowAddModal(false)
      setCurrentCar({})
    } catch (error) {
      console.error("Error adding car:", error)
      toast({
        title: "Error",
        description: "Failed to add car",
        variant: "destructive",
      })
    }
  }

  const handleUpdateCar = async () => {
    try {
      const { error } = await supabase
        .from("cars")
        .update({
          location_id: currentCar.location_id,
          model: currentCar.model,
          make: currentCar.make,
          year: Number(currentCar.year),
          license_plate: currentCar.license_plate,
          colour: currentCar.colour,
          rental_rate: Number(currentCar.rental_rate),
          status: currentCar.status,
        })
        .eq("id", currentCar.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Car updated successfully",
      })

      // Refresh cars list
      const { data, error: fetchError } = await supabase
        .from("cars")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setCars(data)
      setShowEditModal(false)
    } catch (error) {
      console.error("Error updating car:", error)
      toast({
        title: "Error",
        description: "Failed to update car",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCar = async (id: string) => {
    if (!confirm("Are you sure you want to delete this car?")) return

    try {
      const { error } = await supabase.from("cars").delete().eq("id", id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Car deleted successfully",
      })

      setCars(cars.filter((car) => car.id !== id))
    } catch (error) {
      console.error("Error deleting car:", error)
      toast({
        title: "Error",
        description: "Failed to delete car",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setCurrentCar((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setCurrentCar((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Cars Management</CardTitle>
        <Button
          onClick={() => {
            setCurrentCar({})
            setShowAddModal(true)
          }}
        >
          Add New Car
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading cars...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Make</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>License Plate</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Rate/Day</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cars.map((car) => (
                <TableRow key={car.id}>
                  <TableCell>{car.make}</TableCell>
                  <TableCell>{car.model}</TableCell>
                  <TableCell>{car.year}</TableCell>
                  <TableCell>{car.license_plate}</TableCell>
                  <TableCell>{car.colour}</TableCell>
                  <TableCell>£{car.rental_rate}</TableCell>
                  <TableCell>{car.status}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentCar(car)
                          setShowEditModal(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteCar(car.id)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add Car Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Car</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="make">Make</Label>
                <Input id="make" name="make" value={currentCar.make || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" value={currentCar.model || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input id="year" name="year" type="number" value={currentCar.year || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license_plate">License Plate</Label>
                <Input
                  id="license_plate"
                  name="license_plate"
                  value={currentCar.license_plate || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="colour">Color</Label>
                <Input id="colour" name="colour" value={currentCar.colour || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rental_rate">Rental Rate/Day</Label>
                <Input
                  id="rental_rate"
                  name="rental_rate"
                  type="number"
                  value={currentCar.rental_rate || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={currentCar.status || "available"}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location_id">Location</Label>
                <Select
                  value={currentCar.location_id}
                  onValueChange={(value) => handleSelectChange("location_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCar}>Add Car</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Car Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Car</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-make">Make</Label>
                <Input id="edit-make" name="make" value={currentCar.make || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-model">Model</Label>
                <Input id="edit-model" name="model" value={currentCar.model || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-year">Year</Label>
                <Input id="edit-year" name="year" type="number" value={currentCar.year || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-license_plate">License Plate</Label>
                <Input
                  id="edit-license_plate"
                  name="license_plate"
                  value={currentCar.license_plate || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-colour">Color</Label>
                <Input id="edit-colour" name="colour" value={currentCar.colour || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-rental_rate">Rental Rate/Day</Label>
                <Input
                  id="edit-rental_rate"
                  name="rental_rate"
                  type="number"
                  value={currentCar.rental_rate || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={currentCar.status || "available"}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="rented">Rented</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-location_id">Location</Label>
                <Select
                  value={currentCar.location_id}
                  onValueChange={(value) => handleSelectChange("location_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCar}>Update Car</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function CustomersTab() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentCustomer, setCurrentCustomer] = useState<Partial<Customer>>({})
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true)

      try {
        const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false })

        if (error) throw error

        setCustomers(data)
      } catch (error) {
        console.error("Error fetching customers:", error)
        toast({
          title: "Error",
          description: "Failed to load customers",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchCustomers()
  }, [])

  const handleUpdateCustomer = async () => {
    try {
      const { error } = await supabase
        .from("customers")
        .update({
          first_name: currentCustomer.first_name,
          last_name: currentCustomer.last_name,
          licence_number: currentCustomer.licence_number,
          address_line1: currentCustomer.address_line1,
          address_line2: currentCustomer.address_line2,
          city: currentCustomer.city,
          county: currentCustomer.county,
          postcode: currentCustomer.postcode,
          date_of_birth: currentCustomer.date_of_birth,
          admin: currentCustomer.admin,
        })
        .eq("id", currentCustomer.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Customer updated successfully",
      })

      // Refresh customers list
      const { data, error: fetchError } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setCustomers(data)
      setShowEditModal(false)
    } catch (error) {
      console.error("Error updating customer:", error)
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentCustomer((prev) => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target
    setCurrentCustomer((prev) => ({ ...prev, [name]: checked }))
  }

  const handleDeleteCustomer = async (id: string) => {
    setIsDeleting(id)

    try {
      // Get all active rentals for this user
      const { data: activeRentals, error: rentalsError } = await supabase
        .from("rentals")
        .select("id, car_id")
        .eq("customer_id", id)
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
      const { error: customerError } = await supabase.from("customers").delete().eq("id", id)

      if (customerError) throw customerError

      toast({
        title: "Success",
        description: "Customer data deleted successfully. Note: Their authentication record still exists.",
      })

      setCustomers(customers.filter((customer) => customer.id !== id))
    } catch (error) {
      console.error("Error deleting customer:", error)
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
      setShowDeleteModal(null)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customers Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading customers...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>License Number</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Postcode</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    {customer.first_name} {customer.last_name}
                  </TableCell>
                  <TableCell>{customer.licence_number}</TableCell>
                  <TableCell>{customer.city}</TableCell>
                  <TableCell>{customer.postcode}</TableCell>
                  <TableCell>{customer.admin ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentCustomer(customer)
                          setShowEditModal(true)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDeleteModal(customer.id)}
                        disabled={isDeleting === customer.id}
                      >
                        {isDeleting === customer.id ? "Deleting..." : "Delete"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Customer Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  name="first_name"
                  value={currentCustomer.first_name || ""}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  name="last_name"
                  value={currentCustomer.last_name || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="licence_number">License Number</Label>
              <Input
                id="licence_number"
                name="licence_number"
                value={currentCustomer.licence_number || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={currentCustomer.date_of_birth || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line1">Address Line 1</Label>
              <Input
                id="address_line1"
                name="address_line1"
                value={currentCustomer.address_line1 || ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_line2">Address Line 2</Label>
              <Input
                id="address_line2"
                name="address_line2"
                value={currentCustomer.address_line2 || ""}
                onChange={handleChange}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" value={currentCustomer.city || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="county">County</Label>
                <Input id="county" name="county" value={currentCustomer.county || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="postcode">Postcode</Label>
              <Input id="postcode" name="postcode" value={currentCustomer.postcode || ""} onChange={handleChange} />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="admin"
                name="admin"
                checked={currentCustomer.admin || false}
                onChange={handleCheckboxChange}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="admin">Admin</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCustomer}>Update Customer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Customer Confirmation Modal */}
      <Dialog open={!!showDeleteModal} onOpenChange={(open) => !open && setShowDeleteModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete this customer? This action cannot be undone and all their data will be
              permanently removed.
            </p>
            <p className="mt-4">Any active rentals will be automatically cancelled as part of this process.</p>
            <p className="mt-4 text-amber-600 font-medium">
              Note: This will delete the customer's profile data, but their authentication record will remain. If they
              wish to register again with the same email, they will need to contact an administrator.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(null)} disabled={isDeleting !== null}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteModal && handleDeleteCustomer(showDeleteModal)}
              disabled={isDeleting !== null}
            >
              {isDeleting ? "Deleting..." : "Delete Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function RentalsTab() {
  const [rentals, setRentals] = useState<Rental[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentRental, setCurrentRental] = useState<Partial<Rental>>({})

  useEffect(() => {
    const fetchRentals = async () => {
      setIsLoading(true)

      try {
        const { data, error } = await supabase
          .from("rentals")
          .select(`
            *,
            cars (*),
            customers (*)
          `)
          .order("created_at", { ascending: false })

        if (error) throw error

        setRentals(data as Rental[])
      } catch (error) {
        console.error("Error fetching rentals:", error)
        toast({
          title: "Error",
          description: "Failed to load rentals",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchRentals()
  }, [])

  const handleUpdateRental = async () => {
    try {
      const previousStatus = rentals.find((r) => r.id === currentRental.id)?.status

      const { error } = await supabase
        .from("rentals")
        .update({
          start_date: currentRental.start_date,
          end_date: currentRental.end_date,
          status: currentRental.status,
        })
        .eq("id", currentRental.id)

      if (error) throw error

      // If rental status changed to 'completed' or 'cancelled', update car status to 'available'
      if (
        (previousStatus !== "completed" && currentRental.status === "completed") ||
        (previousStatus !== "cancelled" && currentRental.status === "cancelled")
      ) {
        const { error: carError } = await supabase
          .from("cars")
          .update({ status: "available" })
          .eq("id", currentRental.car_id)

        if (carError) throw carError
      }

      toast({
        title: "Success",
        description: "Rental updated successfully",
      })

      // Refresh rentals list
      const { data, error: fetchError } = await supabase
        .from("rentals")
        .select(`
          *,
          cars (*),
          customers (*)
        `)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      setRentals(data as Rental[])
      setShowEditModal(false)
    } catch (error) {
      console.error("Error updating rental:", error)
      toast({
        title: "Error",
        description: "Failed to update rental",
        variant: "destructive",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCurrentRental((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setCurrentRental((prev) => ({ ...prev, [name]: value }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rentals Management</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">Loading rentals...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Car</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rentals.map((rental) => (
                <TableRow key={rental.id}>
                  <TableCell>
                    {rental.cars.make} {rental.cars.model} ({rental.cars.license_plate})
                  </TableCell>
                  <TableCell>
                    {rental.customers.first_name} {rental.customers.last_name}
                  </TableCell>
                  <TableCell>{new Date(rental.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(rental.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{rental.status}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentRental(rental)
                        setShowEditModal(true)
                      }}
                    >
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Edit Rental Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Rental</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Car</Label>
              <div className="p-2 border rounded-md bg-muted">
                {currentRental.cars?.make} {currentRental.cars?.model} ({currentRental.cars?.license_plate})
              </div>
            </div>

            <div className="space-y-2">
              <Label>Customer</Label>
              <div className="p-2 border rounded-md bg-muted">
                {currentRental.customers?.first_name} {currentRental.customers?.last_name}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="datetime-local"
                value={currentRental.start_date ? new Date(currentRental.start_date).toISOString().slice(0, 16) : ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                name="end_date"
                type="datetime-local"
                value={currentRental.end_date ? new Date(currentRental.end_date).toISOString().slice(0, 16) : ""}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={currentRental.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRental}>Update Rental</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

